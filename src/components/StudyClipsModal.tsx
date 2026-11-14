import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Film, Play, Pause, Trash2, Video, X } from 'lucide-react';
import { StudyClipRecord, triggerClipFileDownload } from '../judo/clipStorage';

interface StudyClipsModalProps {
  open: boolean;
  clips: StudyClipRecord[];
  selectedClipId: string | null;
  activeTechniqueName: string;
  onSelectClip: (id: string) => void;
  onDeleteClip: (id: string) => void;
  onStartCapture: (speed: 0.25 | 0.5) => void;
  onClose: () => void;
}

function formatTimestamp(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return '';
  }
}

export function StudyClipsModal({
  open,
  clips,
  selectedClipId,
  activeTechniqueName,
  onSelectClip,
  onDeleteClip,
  onStartCapture,
  onClose,
}: StudyClipsModalProps) {
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [fallbackPlaying, setFallbackPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const selectedClip = useMemo(() => {
    if (clips.length === 0) return null;
    return clips.find((c) => c.id === selectedClipId) ?? clips[0];
  }, [clips, selectedClipId]);

  const videoUrl = useMemo(() => {
    if (!selectedClip?.videoBlob) return null;
    return URL.createObjectURL(selectedClip.videoBlob);
  }, [selectedClip]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, videoUrl]);

  useEffect(() => {
    setFallbackIndex(0);
    setFallbackPlaying(true);
  }, [selectedClip?.id]);

  // Fallback frame-sequence playback if MediaRecorder wasn't available
  useEffect(() => {
    if (!open || !selectedClip?.fallbackFrames?.length || selectedClip.videoBlob || !fallbackPlaying) {
      return;
    }
    const frames = selectedClip.fallbackFrames;
    const intervalMs = Math.max(40, (selectedClip.durationSec * 1000) / frames.length / playbackRate);
    const id = window.setInterval(() => {
      setFallbackIndex((prev) => (prev + 1) % frames.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [open, selectedClip, fallbackPlaying, playbackRate]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Technique Study Clips Library"
    >
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col rounded-2xl bg-[#14171d] border border-white/12 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-white/10">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold text-[#f4f1ea]">Study Clips</h2>
            <span className="text-xs text-[#9ca3af] font-mono-tabular">
              {clips.length} {clips.length === 1 ? 'saved clip' : 'saved clips'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartCapture(0.5);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d94336] text-white text-xs font-semibold hover:bg-[#c53a2e] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336]"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Record {activeTechniqueName} (0.5x)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1d212a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336]"
              aria-label="Close study clips"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {clips.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-14 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#1d212a] border border-white/10 flex items-center justify-center text-[#e5a83b]">
              <Film className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-sm font-semibold text-[#f4f1ea]">
                No technique study clips captured yet
              </h3>
              <p className="text-xs text-[#9ca3af] leading-relaxed">
                Start a slow-motion capture session to record the 3D dojo from your chosen angle. You can orbit around Tori and Uke while recording, then review or export the video here.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartCapture(0.5);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f4f1ea] text-[#111318] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap shrink-0"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Capture 0.5x Study Clip</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartCapture(0.25);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1d212a] text-[#d4cfc4] text-xs font-medium hover:text-white hover:bg-[#252a35] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Capture 0.25x Frame Study</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[290px_1fr] min-h-0">
            {/* Clip List */}
            <aside className="border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto p-3 space-y-2 max-h-56 md:max-h-none">
              {clips.map((clip) => {
                const isSelected = selectedClip?.id === clip.id;
                return (
                  <div
                    key={clip.id}
                    className={`group flex items-center gap-3 p-2 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1f242e] border-[#d94336]/60'
                        : 'bg-[#171a21] border-transparent hover:border-white/10 hover:bg-[#1b1f27]'
                    }`}
                    onClick={() => onSelectClip(clip.id)}
                  >
                    <img
                      src={clip.thumbnailDataUrl}
                      alt={`${clip.techniqueName} study thumbnail`}
                      className="w-16 h-11 rounded-lg object-cover bg-[#0e1014] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-[#f4f1ea] truncate">
                          {clip.techniqueName}
                        </span>
                        <span className="text-[11px] text-[#9ca3af] shrink-0">
                          {clip.techniqueKanji}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9ca3af] truncate mt-0.5 font-mono-tabular">
                        {clip.speed}x · {clip.cameraLabel} · {clip.durationSec.toFixed(1)}s
                      </div>
                      <div className="text-[10px] text-[#78756e] mt-0.5">
                        {formatTimestamp(clip.createdAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClip(clip.id);
                      }}
                      className="p-1.5 rounded-lg text-[#78756e] hover:text-[#d94336] hover:bg-[#14171d] transition-colors shrink-0"
                      aria-label={`Delete ${clip.techniqueName} clip`}
                      title="Delete clip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </aside>

            {/* Clip Player & Export Stage */}
            {selectedClip && (
              <div className="flex flex-col p-4 gap-3 min-h-0 overflow-y-auto">
                <div className="relative flex-1 min-h-[260px] rounded-xl overflow-hidden bg-[#0b0d11] border border-white/10 flex items-center justify-center">
                  {videoUrl ? (
                    <video
                      ref={videoRef}
                      key={videoUrl}
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full max-h-[54vh] object-contain"
                    />
                  ) : selectedClip.fallbackFrames && selectedClip.fallbackFrames.length > 0 ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={selectedClip.fallbackFrames[fallbackIndex] ?? selectedClip.thumbnailDataUrl}
                        alt={`${selectedClip.techniqueName} study sequence`}
                        className="w-full h-full max-h-[50vh] object-contain"
                      />
                      <div className="flex items-center gap-3 px-4 py-2 bg-[#14171d] border-t border-white/10 w-full justify-between">
                        <button
                          type="button"
                          onClick={() => setFallbackPlaying((p) => !p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f4f1ea] text-[#111318] text-xs font-semibold"
                        >
                          {fallbackPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{fallbackPlaying ? 'Pause' : 'Play'}</span>
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={selectedClip.fallbackFrames.length - 1}
                          value={fallbackIndex}
                          onChange={(e) => {
                            setFallbackPlaying(false);
                            setFallbackIndex(parseInt(e.target.value, 10));
                          }}
                          className="alido-scrubber flex-1"
                        />
                        <span className="text-[11px] font-mono-tabular text-[#9ca3af]">
                          Frame {fallbackIndex + 1}/{selectedClip.fallbackFrames.length}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={selectedClip.thumbnailDataUrl}
                      alt={selectedClip.techniqueName}
                      className="w-full h-full max-h-[54vh] object-contain"
                    />
                  )}
                </div>

                {/* Metadata & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-semibold text-[#f4f1ea]">
                        {selectedClip.techniqueName}
                      </h3>
                      <span className="text-xs text-[#9ca3af]">{selectedClip.techniqueKanji}</span>
                    </div>
                    <p className="text-xs text-[#9ca3af] font-mono-tabular">
                      Captured at {selectedClip.speed}x · {selectedClip.cameraLabel} ·{' '}
                      {selectedClip.guidesEnabled ? 'Guides On' : 'Clean Mat'} ·{' '}
                      {selectedClip.durationSec.toFixed(1)}s
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#1d212a] rounded-lg p-0.5">
                      {[0.5, 1.0, 1.5].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setPlaybackRate(rate)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono-tabular font-medium transition-colors ${
                            playbackRate === rate
                              ? 'bg-[#2c3340] text-white'
                              : 'text-[#9ca3af] hover:text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>

                    {selectedClip.videoBlob && (
                      <button
                        type="button"
                        onClick={() => triggerClipFileDownload(selectedClip)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#f4f1ea] text-[#111318] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Video</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
