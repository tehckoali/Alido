import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Eye,
  Film,
  Orbit,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ControlDock } from './components/ControlDock';
import { DojoViewport, DojoViewportHandle } from './components/DojoViewport';
import { StudyClipsModal } from './components/StudyClipsModal';
import { dojoAudio } from './judo/audio';
import {
  deleteStudyClip,
  getSupportedVideoMimeType,
  listStudyClips,
  saveStudyClip,
  StudyClipRecord,
} from './judo/clipStorage';
import { CAMERA_PRESETS, getPhaseAtProgress, TECHNIQUES } from './judo/techniques';
import { CameraPresetId, PhaseMarker, TechniqueCategory, TechniqueSpec } from './judo/types';

type ScreenMode = 'welcome' | 'menu' | 'dojo';
type CategoryFilter = 'All' | TechniqueCategory;

const CATEGORY_FILTERS: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'Koshi-waza', label: 'Hip' },
  { value: 'Te-waza', label: 'Hand' },
  { value: 'Ashi-waza', label: 'Foot' },
  { value: 'Sutemi-waza', label: 'Sacrifice' },
];

interface CaptureSession {
  active: boolean;
  cancelled: boolean;
  technique: TechniqueSpec;
  captureSpeed: 0.25 | 0.5;
  prevSpeed: number;
  prevLoop: boolean;
  cameraLabel: string;
  guidesEnabled: boolean;
  startedAt: number;
  thumbnail: string;
  recorder: MediaRecorder | null;
  chunks: Blob[];
  stream: MediaStream | null;
  fallbackFrames: string[];
  lastFallbackSample: number;
}

export default function App() {
  const viewportRef = useRef<DojoViewportHandle | null>(null);
  const captureRef = useRef<CaptureSession | null>(null);

  const [screen, setScreen] = useState<ScreenMode>('welcome');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');

  const [activeTech, setActiveTech] = useState<TechniqueSpec>(TECHNIQUES[0]);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.65);
  const [loop, setLoop] = useState(true);
  const [showGuides, setShowGuides] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [activeCamera, setActiveCamera] = useState<CameraPresetId>('side');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  // Study clips state
  const [clips, setClips] = useState<StudyClipRecord[]>([]);
  const [clipsModalOpen, setClipsModalOpen] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);

  const filteredTechniques = useMemo(() => {
    if (categoryFilter === 'All') return TECHNIQUES;
    return TECHNIQUES.filter((t) => t.category === categoryFilter);
  }, [categoryFilter]);

  const currentPhase = useMemo(
    () => getPhaseAtProgress(activeTech, progress),
    [activeTech, progress],
  );

  // Initial sync for Welcome background showcase + load saved clips
  useEffect(() => {
    viewportRef.current?.setSpeed(0.65);
    viewportRef.current?.setAutoOrbit(true);
    viewportRef.current?.setShowGuides(false);
    listStudyClips().then((loaded) => setClips(loaded));
  }, []);

  const enterMenuScreen = useCallback(() => {
    setScreen('menu');
    setPlaying(true);
    setSpeed(0.65);
    setLoop(true);
    setShowGuides(false);
    setAutoOrbit(true);
    setActiveCamera('side');
    viewportRef.current?.setPlaying(true);
    viewportRef.current?.setSpeed(0.65);
    viewportRef.current?.setLoop(true);
    viewportRef.current?.setShowGuides(false);
    viewportRef.current?.setAutoOrbit(true);
    viewportRef.current?.setCameraPreset('side');
  }, []);

  const enterDojoScreen = useCallback((tech?: TechniqueSpec) => {
    const targetTech = tech ?? activeTech;
    if (tech && tech.id !== activeTech.id) {
      setActiveTech(tech);
    }
    setScreen('dojo');
    setProgress(0);
    setPlaying(true);
    setSpeed(0.5);
    setLoop(true);
    setShowGuides(true);
    setAutoOrbit(false);
    setActiveCamera('side');
    viewportRef.current?.setTechnique(targetTech, true);
    viewportRef.current?.setPlaying(true);
    viewportRef.current?.setSpeed(0.5);
    viewportRef.current?.setLoop(true);
    viewportRef.current?.setShowGuides(true);
    viewportRef.current?.setAutoOrbit(false);
    viewportRef.current?.setCameraPreset('side');
  }, [activeTech]);

  const restoreAfterCapture = useCallback((session: CaptureSession) => {
    setSpeed(session.prevSpeed);
    setLoop(session.prevLoop);
    setIsRecording(false);
    viewportRef.current?.setSpeed(session.prevSpeed);
    viewportRef.current?.setLoop(session.prevLoop);
    session.stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const finalizeCaptureSession = useCallback(
    async (cancelled = false) => {
      const session = captureRef.current;
      if (!session || !session.active) return;
      session.active = false;
      session.cancelled = cancelled;
      captureRef.current = null;

      if (cancelled) {
        if (session.recorder && session.recorder.state !== 'inactive') {
          try {
            session.recorder.stop();
          } catch {
            // ignore
          }
        }
        restoreAfterCapture(session);
        setPlaying(false);
        viewportRef.current?.setPlaying(false);
        return;
      }

      let videoBlob: Blob | undefined;
      const mimeType = session.recorder?.mimeType || 'video/webm';

      if (session.recorder && session.recorder.state !== 'inactive') {
        videoBlob = await new Promise<Blob | undefined>((resolve) => {
          const rec = session.recorder!;
          rec.onstop = () => {
            if (session.chunks.length > 0) {
              resolve(new Blob(session.chunks, { type: mimeType }));
            } else {
              resolve(undefined);
            }
          };
          try {
            rec.stop();
          } catch {
            resolve(undefined);
          }
        });
      }

      const finalThumb =
        session.thumbnail || viewportRef.current?.captureSnapshot(0.85) || '';
      const elapsedSec = Math.max(
        0.5,
        (performance.now() - session.startedAt) / 1000,
      );

      const newClip: StudyClipRecord = {
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        techniqueId: session.technique.id,
        techniqueName: session.technique.name,
        techniqueKanji: session.technique.kanji,
        speed: session.captureSpeed,
        cameraLabel: session.cameraLabel,
        guidesEnabled: session.guidesEnabled,
        durationSec: elapsedSec,
        createdAt: Date.now(),
        thumbnailDataUrl: finalThumb,
        mimeType,
        videoBlob: videoBlob && videoBlob.size > 0 ? videoBlob : undefined,
        fallbackFrames:
          (!videoBlob || videoBlob.size === 0) && session.fallbackFrames.length > 0
            ? session.fallbackFrames
            : undefined,
      };

      try {
        await saveStudyClip(newClip);
        setClips((prev) => [newClip, ...prev]);
        setSelectedClipId(newClip.id);
        setCaptureNotice(null);
        setClipsModalOpen(true);
      } catch {
        setCaptureNotice('Unable to save study clip in this browser storage context.');
      }

      restoreAfterCapture(session);
      setPlaying(false);
      viewportRef.current?.setPlaying(false);
    },
    [restoreAfterCapture],
  );

  const handleStartCapture = useCallback(
    (requestedSpeed?: 0.25 | 0.5) => {
      if (captureRef.current?.active) return;

      const canvas = viewportRef.current?.getCanvas();
      if (!canvas) return;

      const captureSpeed: 0.25 | 0.5 =
        requestedSpeed ?? (speed === 0.25 ? 0.25 : 0.5);
      const cameraLabel =
        CAMERA_PRESETS.find((c) => c.id === activeCamera)?.label ?? 'Free Orbit';

      const session: CaptureSession = {
        active: true,
        cancelled: false,
        technique: activeTech,
        captureSpeed,
        prevSpeed: speed,
        prevLoop: loop,
        cameraLabel,
        guidesEnabled: showGuides,
        startedAt: performance.now(),
        thumbnail: '',
        recorder: null,
        chunks: [],
        stream: null,
        fallbackFrames: [],
        lastFallbackSample: -1,
      };

      setProgress(0);
      setSpeed(captureSpeed);
      setLoop(false);
      setPlaying(true);
      setIsRecording(true);
      setCaptureNotice(null);

      viewportRef.current?.setProgress(0);
      viewportRef.current?.setSpeed(captureSpeed);
      viewportRef.current?.setLoop(false);
      viewportRef.current?.setPlaying(true);

      const initialSnap = viewportRef.current?.captureSnapshot(0.75);
      if (initialSnap) {
        session.fallbackFrames.push(initialSnap);
      }

      const mimeType = getSupportedVideoMimeType();
      if (typeof canvas.captureStream === 'function' && typeof MediaRecorder !== 'undefined') {
        try {
          const stream = canvas.captureStream(30);
          const recorder = mimeType
            ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_500_000 })
            : new MediaRecorder(stream);

          recorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              session.chunks.push(ev.data);
            }
          };
          recorder.start(150);
          session.stream = stream;
          session.recorder = recorder;
        } catch {
          // Fallback frame capture handles environments without MediaRecorder
        }
      }

      captureRef.current = session;
    },
    [activeCamera, activeTech, loop, showGuides, speed],
  );

  const handleProgressChange = useCallback((nextProgress: number) => {
    setProgress(nextProgress);

    const session = captureRef.current;
    if (session?.active) {
      if (!session.thumbnail && nextProgress >= 0.7) {
        const snap = viewportRef.current?.captureSnapshot(0.85);
        if (snap) session.thumbnail = snap;
      }

      if (!session.recorder && nextProgress - session.lastFallbackSample >= 0.08) {
        session.lastFallbackSample = nextProgress;
        const snap = viewportRef.current?.captureSnapshot(0.72);
        if (snap) session.fallbackFrames.push(snap);
      }
    }
  }, []);

  const handlePlaybackFinished = useCallback(() => {
    if (captureRef.current?.active) {
      window.setTimeout(() => {
        finalizeCaptureSession(false);
      }, 260);
    } else {
      setPlaying(false);
    }
  }, [finalizeCaptureSession]);

  const handleDeleteClip = useCallback(
    async (id: string) => {
      await deleteStudyClip(id);
      setClips((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (selectedClipId === id) {
          setSelectedClipId(next[0]?.id ?? null);
        }
        return next;
      });
    },
    [selectedClipId],
  );

  const handleSelectTechnique = useCallback((tech: TechniqueSpec) => {
    if (captureRef.current?.active) return;
    setActiveTech(tech);
    setProgress(0);
    setPlaying(true);
    viewportRef.current?.setTechnique(tech, true);
    viewportRef.current?.setPlaying(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (captureRef.current?.active) return;
    setPlaying((prev) => {
      const next = !prev;
      if (next && progress >= 0.995) {
        setProgress(0);
        viewportRef.current?.setProgress(0);
      }
      viewportRef.current?.setPlaying(next);
      return next;
    });
  }, [progress]);

  const handleScrub = useCallback((nextProgress: number) => {
    if (captureRef.current?.active) return;
    const clamped = Math.max(0, Math.min(1, nextProgress));
    setProgress(clamped);
    setPlaying(false);
    viewportRef.current?.setPlaying(false);
    viewportRef.current?.setProgress(clamped);
  }, []);

  const handleStepFrame = useCallback(
    (delta: number) => {
      handleScrub(progress + delta);
    },
    [handleScrub, progress],
  );

  const handleJumpPhase = useCallback((phase: PhaseMarker) => {
    if (captureRef.current?.active) return;
    const target = phase.start + 0.02;
    setProgress(target);
    viewportRef.current?.setProgress(target);
  }, []);

  const handleChangeSpeed = useCallback((nextSpeed: number) => {
    if (captureRef.current?.active) return;
    setSpeed(nextSpeed);
    viewportRef.current?.setSpeed(nextSpeed);
  }, []);

  const handleToggleLoop = useCallback(() => {
    if (captureRef.current?.active) return;
    setLoop((prev) => {
      const next = !prev;
      viewportRef.current?.setLoop(next);
      return next;
    });
  }, []);

  const handleToggleGuides = useCallback(() => {
    setShowGuides((prev) => {
      const next = !prev;
      viewportRef.current?.setShowGuides(next);
      return next;
    });
  }, []);

  const handleToggleAutoOrbit = useCallback(() => {
    setAutoOrbit((prev) => {
      const next = !prev;
      viewportRef.current?.setAutoOrbit(next);
      return next;
    });
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      dojoAudio.setEnabled(next);
      return next;
    });
  }, []);

  const handleSelectCamera = useCallback((presetId: CameraPresetId) => {
    setActiveCamera(presetId);
    setAutoOrbit(false);
    viewportRef.current?.setAutoOrbit(false);
    viewportRef.current?.setCameraPreset(presetId);
  }, []);

  useEffect(() => {
    return () => {
      const session = captureRef.current;
      if (session) {
        session.stream?.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        if (captureRef.current?.active) {
          finalizeCaptureSession(true);
          return;
        }
        if (clipsModalOpen) {
          setClipsModalOpen(false);
          return;
        }
      }

      if (screen === 'welcome') {
        if (e.key === 'Enter') {
          e.preventDefault();
          enterMenuScreen();
        }
        return;
      }

      if (screen === 'menu') {
        if (e.key === 'Enter' && !clipsModalOpen) {
          e.preventDefault();
          enterDojoScreen();
          return;
        }
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepFrame(-0.04);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepFrame(0.04);
      } else if ((e.key === 'h' || e.key === 'H') && screen === 'dojo') {
        setDockCollapsed((prev) => !prev);
      } else if ((e.key === 'g' || e.key === 'G') && screen === 'dojo') {
        handleToggleGuides();
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (TECHNIQUES[idx]) handleSelectTechnique(TECHNIQUES[idx]);
      } else if (e.key === '0') {
        if (TECHNIQUES[9]) handleSelectTechnique(TECHNIQUES[9]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    clipsModalOpen,
    enterDojoScreen,
    enterMenuScreen,
    finalizeCaptureSession,
    handleSelectTechnique,
    handleStepFrame,
    handleToggleGuides,
    handleTogglePlay,
    screen,
  ]);

  // Single WebGL Canvas Container bounds across the 3 screens
  const viewportBoxClass =
    screen === 'menu'
      ? 'fixed inset-x-0 top-0 h-[44vh] lg:inset-y-0 lg:left-[430px] xl:left-[470px] lg:right-0 lg:h-full z-0'
      : 'fixed inset-0 z-0';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0e1116]">
      {/* Persistent Single-Context 3D Judo Dojo */}
      <div className={viewportBoxClass}>
        <DojoViewport
          ref={viewportRef}
          initialTechnique={activeTech}
          onProgressChange={handleProgressChange}
          onPlaybackFinished={handlePlaybackFinished}
          interactive={screen !== 'welcome'}
        />
      </div>

      {/* ======================== SCREEN 1: OPENING WELCOME ======================== */}
      {screen === 'welcome' && (
        <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-gradient-to-r from-[#0b0e13]/92 via-[#0b0e13]/72 to-[#0b0e13]/25">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-[#d94336]" />
              <span className="text-sm font-bold tracking-[0.22em] uppercase text-[#f4f1ea]">
                Alido
              </span>
              <span className="text-white/25" aria-hidden="true">
                ·
              </span>
              <span className="text-xs tracking-[0.16em] uppercase text-[#9ca3af]">
                柔道 3D Studio
              </span>
            </div>

            {clips.length > 0 && (
              <button
                type="button"
                onClick={() => setClipsModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14171d] border border-white/15 text-xs font-medium text-[#f4f1ea] hover:bg-[#1e232d] transition-colors whitespace-nowrap shrink-0"
              >
                <Film className="w-3.5 h-3.5 text-[#d94336]" />
                <span>Saved Clips · {clips.length}</span>
              </button>
            )}
          </div>

          {/* Center-Left Editorial Hero */}
          <div className="max-w-xl space-y-6 my-auto py-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.24em] uppercase text-[#e5a83b]">
                Kodokan Nage-waza · Interactive 3D Biomechanics
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f4f1ea] leading-[1.06]">
                Welcome to Alido
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[#cfc9be] leading-relaxed max-w-lg">
              Study realistic judo throws inside a live 3D dojo. Inspect finger-level
              kumikata grips, off-balancing kuzushi, hip and sweep entries, and clean
              back ukemi landings from every angle.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={enterMenuScreen}
                className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl bg-[#d94336] hover:bg-[#c53a2e] text-white text-sm font-semibold tracking-wide shadow-2xl transition-all hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f1ea] whitespace-nowrap shrink-0"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <span className="text-xs text-[#9ca3af] whitespace-nowrap">
                10 Throws · 360° Free Camera · Slow-Motion Study Clips
              </span>
            </div>
          </div>

          {/* Footer Spec Strip */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#9ca3af]">
            <span>Tori (White) vs Uke (Blue)</span>
            <span aria-hidden="true">·</span>
            <span>Real-time Grip &amp; Finger Articulation</span>
            <span aria-hidden="true">·</span>
            <span>5 Teaching Angles</span>
          </div>
        </div>
      )}

      {/* ======================== SCREEN 2: THROWS MENU + LIVE 3D SHOWCASE ======================== */}
      {screen === 'menu' && (
        <>
          {/* Left Throws Selection Sidebar / Bottom Drawer on Mobile */}
          <aside className="fixed inset-x-0 bottom-0 h-[56vh] lg:inset-y-0 lg:left-0 lg:w-[430px] xl:w-[470px] lg:h-full z-20 bg-[#101318] border-t lg:border-t-0 lg:border-r border-white/10 flex flex-col">
            {/* Sidebar Header */}
            <div className="px-5 pt-4 pb-3 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setScreen('welcome');
                    setAutoOrbit(true);
                    setShowGuides(false);
                    viewportRef.current?.setAutoOrbit(true);
                    viewportRef.current?.setShowGuides(false);
                  }}
                  className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1a1f28] transition-colors shrink-0"
                  title="Back to Welcome"
                  aria-label="Back to Welcome"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-wide text-[#f4f1ea] uppercase">
                      Alido
                    </span>
                    <span className="text-white/25">·</span>
                    <span className="text-xs font-medium text-[#e5a83b]">
                      Throws Showcase
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9ca3af] truncate">
                    Select any throw to preview it live in 3D, then enter the dojo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setClipsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#191d26] border border-white/10 text-xs font-medium text-[#f4f1ea] hover:bg-[#222733] transition-colors whitespace-nowrap shrink-0"
              >
                <Film className="w-3.5 h-3.5 text-[#d94336]" />
                <span>Clips{clips.length > 0 ? ` · ${clips.length}` : ''}</span>
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="px-5 py-2.5 border-b border-white/8 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {CATEGORY_FILTERS.map((cat) => {
                const selected = categoryFilter === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoryFilter(cat.value)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selected
                        ? 'bg-[#d94336] text-white'
                        : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1e26]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Throws List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {filteredTechniques.map((tech) => {
                const idx = TECHNIQUES.findIndex((t) => t.id === tech.id);
                const isSelected = tech.id === activeTech.id;
                return (
                  <div
                    key={tech.id}
                    className={`group rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#181d26] border-[#d94336]/75 shadow-lg'
                        : 'bg-[#13171e] border-white/8 hover:border-white/20 hover:bg-[#161b23]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectTechnique(tech)}
                      onDoubleClick={() => enterDojoScreen(tech)}
                      className="w-full text-left px-3.5 py-3 flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] rounded-xl"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`font-mono-tabular text-xs font-semibold mt-0.5 shrink-0 ${
                            isSelected ? 'text-[#d94336]' : 'text-[#6b7280]'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#f4f1ea]">
                              {tech.name}
                            </span>
                            <span className="text-xs text-[#9ca3af]">{tech.kanji}</span>
                          </div>
                          <p className="text-xs text-[#cfc9be] truncate">{tech.english}</p>
                          <p className="text-[11px] text-[#8d94a0]">
                            {tech.category} · {tech.beltLevel}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            enterDojoScreen(tech);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              enterDojoScreen(tech);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#d94336] hover:bg-[#c53a2e] text-white text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors"
                        >
                          <span>Enter Dojo</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Live 3D Showcase HUD Controls */}
          <div className="fixed top-3.5 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-[#14171d] border border-white/12 shadow-lg">
            <button
              type="button"
              onClick={handleToggleAutoOrbit}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                autoOrbit ? 'bg-[#262b36] text-[#f4f1ea]' : 'text-[#9ca3af] hover:text-white'
              }`}
              title="Toggle 360° showcase orbit"
            >
              <Orbit className="w-3.5 h-3.5" />
              <span>360°</span>
            </button>
            <button
              type="button"
              onClick={handleToggleSound}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                soundOn ? 'bg-[#262b36] text-[#45c486]' : 'text-[#9ca3af] hover:text-white'
              }`}
              title="Toggle dojo mat audio"
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Audio</span>
            </button>
          </div>

          {/* Bottom Showcase Summary + Primary Enter Dojo CTA */}
          <div className="fixed bottom-[57vh] lg:bottom-5 left-4 right-4 lg:left-[454px] xl:left-[494px] lg:right-6 z-20 pointer-events-none flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="pointer-events-auto max-w-lg rounded-xl bg-[#14171d]/95 border border-white/12 p-3.5 shadow-2xl space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-[#f4f1ea]">{activeTech.name}</span>
                  <span className="text-xs text-[#9ca3af]">{activeTech.kanji}</span>
                </div>
                <span className="font-mono-tabular text-[11px] font-semibold text-[#e5a83b]">
                  {currentPhase.label} · {Math.round(progress * 100)}%
                </span>
              </div>
              <p className="text-xs text-[#cfc9be] leading-relaxed line-clamp-2">
                {activeTech.keyPrinciple}
              </p>
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden pt-0">
                <div
                  className="h-full bg-[#d94336] transition-[width] duration-75"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>

            <div className="pointer-events-auto flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#14171d] border border-white/12 text-[#f4f1ea] hover:bg-[#222733] shadow-xl transition-colors shrink-0"
                title={playing ? 'Pause showcase' : 'Play showcase'}
                aria-label={playing ? 'Pause showcase' : 'Play showcase'}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => enterDojoScreen(activeTech)}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#d94336] hover:bg-[#c53a2e] text-white text-xs sm:text-sm font-semibold shadow-2xl transition-colors whitespace-nowrap shrink-0"
              >
                <span>Open in 3D Dojo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ======================== SCREEN 3: FULL 3D DOJO PLACE ======================== */}
      {screen === 'dojo' && (
        <>
          {/* Minimal Top Navigation Bar */}
          <header className="fixed top-0 inset-x-0 z-20 flex items-center justify-between gap-4 px-5 py-3 pointer-events-none">
            {/* Zone 1: Back to Throws Menu + Brand + Active Technique */}
            <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#14171d] border border-white/12 shadow-lg">
              <button
                type="button"
                onClick={enterMenuScreen}
                disabled={isRecording}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-[#cfc9be] hover:text-white hover:bg-[#222733] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                title="Back to Throws Menu"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Throws</span>
              </button>
              <span className="text-white/20" aria-hidden="true">
                ·
              </span>
              <span className="text-sm font-bold tracking-tight text-[#f4f1ea] whitespace-nowrap shrink-0 hidden sm:inline">
                Alido
              </span>
              <span className="text-white/20 hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <div className="flex items-baseline gap-2 whitespace-nowrap shrink-0">
                <span className="text-xs font-semibold text-[#f4f1ea]">{activeTech.name}</span>
                <span className="text-xs text-[#9ca3af] hidden md:inline">{activeTech.kanji}</span>
              </div>
            </div>

            {/* Zone 2: Camera Angle Presets */}
            <nav
              aria-label="Camera angles"
              className="pointer-events-auto hidden md:flex items-center gap-1 p-1 rounded-xl bg-[#14171d] border border-white/12 shadow-lg"
            >
              {CAMERA_PRESETS.map((preset) => {
                const isSelected = activeCamera === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectCamera(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] ${
                      isSelected
                        ? 'bg-[#262b36] text-[#f4f1ea]'
                        : 'text-[#9ca3af] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => {
                const idx = CAMERA_PRESETS.findIndex((p) => p.id === activeCamera);
                const next = CAMERA_PRESETS[(idx + 1) % CAMERA_PRESETS.length];
                handleSelectCamera(next.id);
              }}
              className="pointer-events-auto md:hidden px-3 py-1.5 rounded-xl bg-[#14171d] border border-white/12 text-xs font-medium text-[#f4f1ea] shadow-lg whitespace-nowrap shrink-0"
            >
              {CAMERA_PRESETS.find((p) => p.id === activeCamera)?.label ?? 'Angle'}
            </button>

            {/* Zone 3: Scene Guides, Auto-Orbit, Audio & Study Clips Library */}
            <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-[#14171d] border border-white/12 shadow-lg shrink-0">
              <button
                type="button"
                onClick={handleToggleGuides}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] ${
                  showGuides ? 'bg-[#262b36] text-[#e5a83b]' : 'text-[#9ca3af] hover:text-white'
                }`}
                aria-pressed={showGuides}
                title="Toggle balance & grip guides (G)"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guides</span>
              </button>

              <button
                type="button"
                onClick={handleToggleAutoOrbit}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] ${
                  autoOrbit ? 'bg-[#262b36] text-[#f4f1ea]' : 'text-[#9ca3af] hover:text-white'
                }`}
                aria-pressed={autoOrbit}
                title="Auto-rotate 360° camera"
              >
                <Orbit className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">360°</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] ${
                  soundOn ? 'bg-[#262b36] text-[#45c486]' : 'text-[#9ca3af] hover:text-white'
                }`}
                aria-pressed={soundOn}
                title="Toggle dojo mat audio"
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden lg:inline">Audio</span>
              </button>

              <button
                type="button"
                onClick={() => setClipsModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] ${
                  clips.length > 0
                    ? 'bg-[#262b36] text-[#f4f1ea] hover:bg-[#2e3442]'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
                title="Review saved technique study clips"
              >
                <Film className="w-3.5 h-3.5 text-[#d94336]" />
                <span>
                  Clips{clips.length > 0 ? ` · ${clips.length}` : ''}
                </span>
              </button>
            </div>
          </header>

          {/* Subtle Navigation Hint */}
          {!dockCollapsed && !isRecording && (
            <div className="fixed top-16 left-5 z-10 pointer-events-none hidden lg:flex items-center gap-2 text-[11px] text-[#9ca3af]">
              <Compass className="w-3 h-3 text-[#9ca3af]" />
              <span>Drag to orbit 360° · Right-drag to pan · Scroll to zoom · WASD to move</span>
            </div>
          )}

          {/* Unobtrusive Slow-Motion Recording Bar */}
          {isRecording && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-xl bg-[#14171d] border border-[#d94336]/60 shadow-2xl">
              <Square className="w-3 h-3 text-[#d94336] fill-current shrink-0" />
              <div className="text-xs text-[#f4f1ea] font-medium whitespace-nowrap">
                Capturing Study Clip · {activeTech.name} ·{' '}
                <span className="font-mono-tabular text-[#e5a83b]">
                  {speed}x · {Math.round(progress * 100)}%
                </span>
              </div>
              <div className="w-20 h-1.5 rounded-full bg-white/12 overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-[#d94336]"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => finalizeCaptureSession(false)}
                className="px-2.5 py-1 rounded-lg bg-[#d94336] text-white text-[11px] font-semibold hover:bg-[#c53a2e] transition-colors whitespace-nowrap shrink-0"
              >
                Finish
              </button>
              <button
                type="button"
                onClick={() => finalizeCaptureSession(true)}
                className="p-1 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1d212a] transition-colors shrink-0"
                aria-label="Cancel recording"
                title="Cancel recording"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {captureNotice && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-[#14171d] border border-white/12 text-xs text-[#f4f1ea]">
              {captureNotice}
            </div>
          )}

          {/* Collapsible Bottom Control Dock */}
          <ControlDock
            techniques={TECHNIQUES}
            activeTechnique={activeTech}
            progress={progress}
            playing={playing}
            speed={speed}
            loop={loop}
            collapsed={dockCollapsed}
            notesOpen={notesOpen}
            isRecording={isRecording}
            onSelectTechnique={handleSelectTechnique}
            onTogglePlay={handleTogglePlay}
            onScrub={handleScrub}
            onStepFrame={handleStepFrame}
            onJumpPhase={handleJumpPhase}
            onChangeSpeed={handleChangeSpeed}
            onToggleLoop={handleToggleLoop}
            onToggleCollapsed={() => setDockCollapsed((prev) => !prev)}
            onToggleNotes={() => setNotesOpen((prev) => !prev)}
            onStartExportClip={() => handleStartCapture()}
            onStopExportClip={() => finalizeCaptureSession(false)}
          />
        </>
      )}

      {/* Saved Technique Study Clips Review & Download Modal (accessible from all screens) */}
      <StudyClipsModal
        open={clipsModalOpen}
        clips={clips}
        selectedClipId={selectedClipId}
        activeTechniqueName={activeTech.name}
        onSelectClip={setSelectedClipId}
        onDeleteClip={handleDeleteClip}
        onStartCapture={(chosenSpeed) => {
          if (screen !== 'dojo') {
            enterDojoScreen(activeTech);
            window.setTimeout(() => handleStartCapture(chosenSpeed), 120);
          } else {
            handleStartCapture(chosenSpeed);
          }
        }}
        onClose={() => setClipsModalOpen(false)}
      />
    </div>
  );
}
