import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { DojoScene } from '../judo/DojoScene';
import { CameraPresetId, TechniqueSpec } from '../judo/types';

export interface DojoViewportHandle {
  setTechnique: (tech: TechniqueSpec, resetProgress?: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setLoop: (loop: boolean) => void;
  setProgress: (progress: number) => void;
  setShowGuides: (show: boolean) => void;
  setAutoOrbit: (enabled: boolean) => void;
  setCameraPreset: (preset: CameraPresetId) => void;
  getCanvas: () => HTMLCanvasElement | null;
  captureSnapshot: (quality?: number) => string | null;
}

interface DojoViewportProps {
  initialTechnique: TechniqueSpec;
  onProgressChange: (progress: number) => void;
  onPlaybackFinished?: () => void;
  className?: string;
  interactive?: boolean;
}

export const DojoViewport = forwardRef<DojoViewportHandle, DojoViewportProps>(
  function DojoViewport(
    { initialTechnique, onProgressChange, onPlaybackFinished, className = 'w-full h-full', interactive = true },
    ref,
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<DojoScene | null>(null);
    const progressCbRef = useRef(onProgressChange);
    progressCbRef.current = onProgressChange;
    const finishedCbRef = useRef(onPlaybackFinished);
    finishedCbRef.current = onPlaybackFinished;

    const [contextLost, setContextLost] = useState(false);

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const dojo = new DojoScene(container, {
        onProgressChange: (p) => progressCbRef.current(p),
        onPlaybackFinished: () => finishedCbRef.current?.(),
        onWebGLContextLost: (lost) => setContextLost(lost),
      });
      dojo.setTechnique(initialTechnique, true);
      sceneRef.current = dojo;

      return () => {
        dojo.dispose();
        sceneRef.current = null;
      };
      // Mount WebGL canvas once
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      setTechnique: (tech, reset = true) => sceneRef.current?.setTechnique(tech, reset),
      setPlaying: (playing) => sceneRef.current?.setPlaying(playing),
      setSpeed: (speed) => sceneRef.current?.setSpeed(speed),
      setLoop: (loop) => sceneRef.current?.setLoop(loop),
      setProgress: (p) => sceneRef.current?.setProgress(p),
      setShowGuides: (show) => sceneRef.current?.setShowGuides(show),
      setAutoOrbit: (enabled) => sceneRef.current?.setAutoOrbit(enabled),
      setCameraPreset: (preset) => sceneRef.current?.setCameraPreset(preset),
      getCanvas: () => sceneRef.current?.getCanvas() ?? null,
      captureSnapshot: (quality) => sceneRef.current?.captureSnapshot(quality) ?? null,
    }));

    return (
      <div className={`relative bg-[#16181d] ${className}`}>
        <div
          ref={mountRef}
          className={`w-full h-full ${
            interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
          }`}
          aria-label="Interactive 3D Judo Dojo Viewport"
        />

        {contextLost && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#12141a]/95 z-30 p-6">
            <div className="max-w-md text-center space-y-2">
              <p className="text-base font-semibold text-[#f4f1ea]">
                3D Graphics Context Paused
              </p>
              <p className="text-sm text-[#9ca3af]">
                Your browser temporarily reclaimed WebGL resources. Reload or restore the tab to resume the 3D dojo.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
);
