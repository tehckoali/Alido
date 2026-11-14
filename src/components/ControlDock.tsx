import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Square,
  StepBack,
  StepForward,
  Video,
} from 'lucide-react';
import { getPhaseAtProgress } from '../judo/techniques';
import { PhaseMarker, TechniqueSpec } from '../judo/types';

interface ControlDockProps {
  techniques: TechniqueSpec[];
  activeTechnique: TechniqueSpec;
  progress: number;
  playing: boolean;
  speed: number;
  loop: boolean;
  collapsed: boolean;
  notesOpen: boolean;
  isRecording: boolean;
  onSelectTechnique: (tech: TechniqueSpec) => void;
  onTogglePlay: () => void;
  onScrub: (nextProgress: number) => void;
  onStepFrame: (delta: number) => void;
  onJumpPhase: (phase: PhaseMarker) => void;
  onChangeSpeed: (speed: number) => void;
  onToggleLoop: () => void;
  onToggleCollapsed: () => void;
  onToggleNotes: () => void;
  onStartExportClip: () => void;
  onStopExportClip: () => void;
}

const SPEEDS = [0.25, 0.5, 1.0, 1.5];

export function ControlDock({
  techniques,
  activeTechnique,
  progress,
  playing,
  speed,
  loop,
  collapsed,
  notesOpen,
  isRecording,
  onSelectTechnique,
  onTogglePlay,
  onScrub,
  onStepFrame,
  onJumpPhase,
  onChangeSpeed,
  onToggleLoop,
  onToggleCollapsed,
  onToggleNotes,
  onStartExportClip,
  onStopExportClip,
}: ControlDockProps) {
  const activePhase = getPhaseAtProgress(activeTechnique, progress);
  const currentSeconds = (progress * activeTechnique.durationSec).toFixed(2);
  const totalSeconds = activeTechnique.durationSec.toFixed(2);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(1080px,96vw)] pointer-events-none">
      {/* Collapse / Expand Handle */}
      <div className="flex justify-center mb-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-[#14171d] border border-b-0 border-white/12 text-xs font-medium text-[#d4cfc4] hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336]"
          aria-expanded={!collapsed}
          title="Toggle controls (H)"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{collapsed ? 'Show Controls (H)' : 'Hide Controls (H)'}</span>
        </button>
      </div>

      {/* Main Dock Container */}
      <div
        className={`pointer-events-auto transition-all duration-200 ease-out origin-bottom ${
          collapsed ? 'translate-y-[120%] opacity-0 pointer-events-none h-0 overflow-hidden' : 'translate-y-0 opacity-100'
        }`}
      >
        {/* Expandable Coaching Breakdown Drawer */}
        {notesOpen && (
          <div className="mb-2 rounded-xl bg-[#14171d] border border-white/12 p-4 shadow-2xl">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2.5 border-b border-white/8">
              <div className="flex items-baseline gap-2.5">
                <h2 className="text-sm font-semibold text-[#f4f1ea]">
                  {activeTechnique.name} · {activeTechnique.english}
                </h2>
                <span className="text-xs text-[#9ca3af]">{activeTechnique.kanji}</span>
              </div>
              <div className="text-xs text-[#9ca3af]">
                {activeTechnique.category} · {activeTechnique.beltLevel}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 text-xs leading-relaxed">
              <div>
                <p className="font-semibold text-[#e5a83b] mb-1">
                  Active Phase: {activePhase.label} ({activePhase.japanese})
                </p>
                <p className="text-[#d4cfc4]">{activePhase.cue}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[#f4f1ea]">
                  <span className="font-semibold text-white">Tori (White): </span>
                  <span className="text-[#c8c3b8]">{activePhase.toriFocus}</span>
                </p>
                <p className="text-[#f4f1ea]">
                  <span className="font-semibold text-[#6ca4f5]">Uke (Blue): </span>
                  <span className="text-[#c8c3b8]">{activePhase.ukeFocus}</span>
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[#d4cfc4]">
                  <span className="font-semibold text-[#45c486]">Key Principle: </span>
                  {activeTechnique.keyPrinciple}
                </p>
                <p className="text-[#d4cfc4]">
                  <span className="font-semibold text-[#d94336]">Avoid: </span>
                  {activeTechnique.commonMistake}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Unified Bottom Bar */}
        <div className="rounded-xl bg-[#14171d] border border-white/12 px-4 py-3 shadow-2xl space-y-3">
          {/* Row 1: Technique Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap pb-0.5">
            {techniques.map((tech, idx) => {
              const isActive = tech.id === activeTechnique.id;
              const shortcutKey = idx === 9 ? '0' : String(idx + 1);
              return (
                <button
                  key={tech.id}
                  type="button"
                  disabled={isRecording}
                  onClick={() => onSelectTechnique(tech)}
                  title={`${tech.name} (${tech.category}) · Key ${shortcutKey}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] disabled:opacity-50 ${
                    isActive
                      ? 'bg-[#d94336] text-white'
                      : 'bg-[#1d212a] text-[#b9b4aa] hover:text-white hover:bg-[#252a35]'
                  }`}
                >
                  <span className="font-mono-tabular opacity-70 mr-1.5">{idx + 1}.</span>
                  {tech.name}
                </button>
              );
            })}
          </div>

          {/* Row 2: Phase Stepper & Scrubbing Timeline */}
          <div className="space-y-1.5">
            {/* Phase Segment Buttons */}
            <div className="grid grid-cols-5 gap-1">
              {activeTechnique.phases.map((phase) => {
                const isCurrent = activePhase.id === phase.id;
                const isPassed = progress > phase.end;
                return (
                  <button
                    key={phase.id}
                    type="button"
                    disabled={isRecording}
                    onClick={() => onJumpPhase(phase)}
                    className={`px-2 py-1 rounded text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] disabled:cursor-default ${
                      isCurrent
                        ? 'bg-[#262b36] text-[#f4f1ea]'
                        : isPassed
                          ? 'bg-[#1b1f27] text-[#a39f95] hover:text-white'
                          : 'bg-[#171a21] text-[#78756e] hover:text-[#c8c3b8]'
                    }`}
                  >
                    <div className="text-[11px] font-semibold truncate">{phase.label}</div>
                    <div className="h-1 mt-1 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 ${
                          isCurrent ? 'bg-[#d94336]' : isPassed ? 'bg-[#e5a83b]/70' : 'bg-transparent'
                        }`}
                        style={{
                          width: isCurrent
                            ? `${Math.min(100, Math.max(8, ((progress - phase.start) / (phase.end - phase.start)) * 100))}%`
                            : isPassed
                              ? '100%'
                              : '0%',
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Draggable Scrubber Slider */}
            <div className="relative flex items-center gap-3">
              <span className="font-mono-tabular text-[11px] text-[#b9b4aa] w-11 shrink-0">
                {currentSeconds}s
              </span>
              <div className="relative flex-1 h-5 flex items-center">
                <div className="w-full h-1.5 rounded-full bg-white/12 overflow-hidden">
                  <div
                    className="h-full bg-[#d94336]"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.002}
                  value={progress}
                  disabled={isRecording}
                  onChange={(e) => onScrub(parseFloat(e.target.value))}
                  aria-label="Scrub Judo technique timeline"
                  className="alido-scrubber absolute inset-0 w-full h-full disabled:cursor-not-allowed"
                />
              </div>
              <span className="font-mono-tabular text-[11px] text-[#78756e] w-11 text-right shrink-0">
                {totalSeconds}s
              </span>
            </div>
          </div>

          {/* Row 3: Playback Transport, Speed, Loop, Export Clip & Coaching Notes */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
            {/* Transport Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isRecording}
                onClick={() => onScrub(0)}
                className="p-2 rounded-lg bg-[#1d212a] text-[#d4cfc4] hover:text-white hover:bg-[#252a35] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] disabled:opacity-45"
                title="Restart technique"
                aria-label="Restart technique"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isRecording}
                onClick={() => onStepFrame(-0.04)}
                className="p-2 rounded-lg bg-[#1d212a] text-[#d4cfc4] hover:text-white hover:bg-[#252a35] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] disabled:opacity-45"
                title="Step backward (Left Arrow)"
                aria-label="Step backward"
              >
                <StepBack className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isRecording}
                onClick={onTogglePlay}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f4f1ea] text-[#111318] font-semibold text-xs hover:bg-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] disabled:opacity-50"
                title="Play / Pause (Space)"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{playing ? 'Pause' : 'Play'}</span>
              </button>
              <button
                type="button"
                disabled={isRecording}
                onClick={() => onStepFrame(0.04)}
                className="p-2 rounded-lg bg-[#1d212a] text-[#d4cfc4] hover:text-white hover:bg-[#252a35] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] disabled:opacity-45"
                title="Step forward (Right Arrow)"
                aria-label="Step forward"
              >
                <StepForward className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isRecording}
                onClick={() => onScrub(1)}
                className="p-2 rounded-lg bg-[#1d212a] text-[#d4cfc4] hover:text-white hover:bg-[#252a35] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] disabled:opacity-45"
                title="Jump to finish"
                aria-label="Jump to finish"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Active Phase Inline Cue */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-[#c8c3b8] max-w-xs truncate">
              <span className="font-semibold text-[#e5a83b] shrink-0">{activePhase.label}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{activePhase.cue}</span>
            </div>

            {/* Speed, Loop, Export Clip & Notes */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-[#1d212a] rounded-lg p-0.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isRecording}
                    onClick={() => onChangeSpeed(s)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono-tabular font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] disabled:opacity-50 ${
                      speed === s ? 'bg-[#2c3340] text-white' : 'text-[#9ca3af] hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={isRecording}
                onClick={onToggleLoop}
                className={`p-2 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] disabled:opacity-45 ${
                  loop
                    ? 'bg-[#262b36] border-white/15 text-[#f4f1ea]'
                    : 'bg-[#1d212a] border-transparent text-[#78756e] hover:text-white'
                }`}
                title="Loop technique"
                aria-pressed={loop}
                aria-label="Loop technique"
              >
                <Repeat className="w-4 h-4" />
              </button>

              {isRecording ? (
                <button
                  type="button"
                  onClick={onStopExportClip}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#d94336] text-white hover:bg-[#c53a2e] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336]"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop & Save</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartExportClip}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#1d212a] border border-white/10 text-[#f4f1ea] hover:bg-[#252a35] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336]"
                  title="Trigger slow-motion playback and capture a study clip"
                >
                  <Video className="w-3.5 h-3.5 text-[#d94336]" />
                  <span>Export Clip</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleNotes}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94336] ${
                  notesOpen
                    ? 'bg-[#262b36] border-[#e5a83b]/45 text-[#f4f1ea]'
                    : 'bg-[#1d212a] border-transparent text-[#d4cfc4] hover:text-white'
                }`}
                aria-expanded={notesOpen}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Coach Notes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
