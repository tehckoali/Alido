import { ActorKeyframe, CameraPreset, JointPose, PhaseMarker, TechniqueSpec, Vec3Tuple } from './types';

const BASE_STANCE: JointPose = {
  pelvisPos: [0, 0.89, 0],
  pelvisRot: [0, 0, 0],
  spine: [0.05, 0, 0],
  chest: [0.04, 0, 0],
  head: [0.02, 0, 0],
  leftShoulder: [-0.85, 0, 0.12],
  leftElbow: [-0.65, 0, 0],
  rightShoulder: [-0.95, 0, -0.10],
  rightElbow: [-0.75, 0, 0],
  leftHip: [-0.22, 0.06, 0.11],
  leftKnee: [0.42, 0, 0],
  leftAnkle: [-0.18, 0, 0],
  rightHip: [-0.18, -0.06, -0.11],
  rightKnee: [0.36, 0, 0],
  rightAnkle: [-0.16, 0, 0],
};

function makePose(
  pos: Vec3Tuple,
  rot: Vec3Tuple,
  overrides: Partial<Omit<JointPose, 'pelvisPos' | 'pelvisRot'>> = {},
): JointPose {
  return {
    ...BASE_STANCE,
    ...overrides,
    pelvisPos: pos,
    pelvisRot: rot,
  };
}

function buildPhases(
  cues: Record<'kumikata' | 'kuzushi' | 'tsukuri' | 'kake' | 'ukemi', { cue: string; tori: string; uke: string }>,
): PhaseMarker[] {
  return [
    {
      id: 'kumikata',
      label: 'Kumikata',
      japanese: '組手 · Grip',
      start: 0.0,
      end: 0.18,
      cue: cues.kumikata.cue,
      toriFocus: cues.kumikata.tori,
      ukeFocus: cues.kumikata.uke,
    },
    {
      id: 'kuzushi',
      label: 'Kuzushi',
      japanese: '崩し · Off-Balance',
      start: 0.18,
      end: 0.40,
      cue: cues.kuzushi.cue,
      toriFocus: cues.kuzushi.tori,
      ukeFocus: cues.kuzushi.uke,
    },
    {
      id: 'tsukuri',
      label: 'Tsukuri',
      japanese: '作り · Entry',
      start: 0.40,
      end: 0.64,
      cue: cues.tsukuri.cue,
      toriFocus: cues.tsukuri.tori,
      ukeFocus: cues.tsukuri.uke,
    },
    {
      id: 'kake',
      label: 'Kake',
      japanese: '掛け · Execution',
      start: 0.64,
      end: 0.85,
      cue: cues.kake.cue,
      toriFocus: cues.kake.tori,
      ukeFocus: cues.kake.uke,
    },
    {
      id: 'ukemi',
      label: 'Ukemi',
      japanese: '受身 · Breakfall',
      start: 0.85,
      end: 1.0,
      cue: cues.ukemi.cue,
      toriFocus: cues.ukemi.tori,
      ukeFocus: cues.ukemi.uke,
    },
  ];
}

// ============================================================================
// 1. O-GOSHI (Major Hip Throw) — Yoko-ukemi (Back-side landing, chest UP)
// ============================================================================
const oGoshiKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.44], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.44], [0, Math.PI, 0]),
  },
  {
    t: 0.18,
    tori: makePose([0.04, 0.87, -0.40], [0.04, 0.12, 0], {
      leftShoulder: [-1.02, 0.15, 0.18],
      leftElbow: [-0.85, 0, 0],
      rightShoulder: [-1.05, -0.1, -0.12],
      rightElbow: [-0.82, 0, 0],
    }),
    uke: makePose([0, 0.88, 0.42], [0.03, Math.PI, 0]),
  },
  {
    t: 0.35,
    tori: makePose([-0.08, 0.84, -0.22], [0.08, 0.55, 0], {
      spine: [0.08, 0.2, 0],
      leftShoulder: [-1.25, 0.35, 0.45],
      leftElbow: [-1.15, 0, 0],
      rightShoulder: [-1.1, -0.35, -0.25],
      rightElbow: [-0.85, 0, 0],
      leftHip: [-0.45, 0.1, 0.12],
      leftKnee: [0.72, 0, 0],
      rightHip: [-0.35, -0.1, -0.12],
      rightKnee: [0.58, 0, 0],
    }),
    uke: makePose([0, 0.91, 0.24], [0.18, Math.PI - 0.12, 0], {
      spine: [0.12, 0, 0],
      leftHip: [-0.10, 0, 0.08],
      leftKnee: [0.18, 0, 0],
      leftAnkle: [0.22, 0, 0],
      rightHip: [-0.10, 0, -0.08],
      rightKnee: [0.18, 0, 0],
      rightAnkle: [0.22, 0, 0],
      leftShoulder: [-1.05, 0, 0.22],
      rightShoulder: [-1.15, 0, -0.28],
    }),
  },
  {
    t: 0.55,
    tori: makePose([0.04, 0.72, -0.09], [0.18, Math.PI - 0.15, 0], {
      spine: [0.20, 0.10, 0],
      chest: [0.15, 0.08, 0],
      leftShoulder: [-1.10, 0.4, 0.35],
      leftElbow: [-1.20, 0, 0],
      rightShoulder: [-0.95, 0.55, -0.45],
      rightElbow: [-1.35, 0, 0],
      leftHip: [-0.78, 0.05, 0.16],
      leftKnee: [1.32, 0, 0],
      leftAnkle: [-0.52, 0, 0],
      rightHip: [-0.74, -0.05, -0.16],
      rightKnee: [1.28, 0, 0],
      rightAnkle: [-0.50, 0, 0],
    }),
    uke: makePose([0, 0.96, 0.18], [0.42, Math.PI, 0], {
      spine: [0.16, 0, 0],
      leftHip: [-0.15, 0, 0.10],
      leftKnee: [0.25, 0, 0],
      rightHip: [-0.15, 0, -0.10],
      rightKnee: [0.25, 0, 0],
      leftShoulder: [-0.8, 0, 0.3],
      rightShoulder: [-1.15, 0, -0.35],
    }),
  },
  {
    t: 0.70,
    tori: makePose([0.02, 0.82, -0.04], [0.42, Math.PI + 0.35, -0.12], {
      spine: [0.28, 0.25, 0],
      chest: [0.22, 0.18, 0],
      head: [0.15, 0.35, 0],
      leftShoulder: [-1.30, 0.3, 0.4],
      leftElbow: [-1.15, 0, 0],
      rightShoulder: [-1.05, 0.55, -0.4],
      rightElbow: [-1.35, 0, 0],
      leftHip: [-0.36, 0.08, 0.18],
      leftKnee: [0.58, 0, 0],
      rightHip: [-0.28, -0.08, -0.18],
      rightKnee: [0.48, 0, 0],
    }),
    uke: makePose([-0.08, 1.32, -0.18], [1.95, Math.PI + 0.35, -0.12], {
      spine: [0.1, 0, 0],
      leftHip: [-0.35, 0, 0.18],
      leftKnee: [0.48, 0, 0],
      rightHip: [-0.22, 0, -0.18],
      rightKnee: [0.35, 0, 0],
      leftShoulder: [-1.3, 0, 0.45],
      rightShoulder: [-0.9, 0, -0.35],
    }),
  },
  {
    t: 0.83,
    tori: makePose([0.02, 0.78, 0.02], [0.52, Math.PI + 0.65, -0.10], {
      spine: [0.32, 0.22, 0],
      leftShoulder: [-1.15, 0.2, 0.25],
      leftElbow: [-0.95, 0, 0],
      rightShoulder: [-0.75, 0.2, -0.25],
      rightElbow: [-0.80, 0, 0],
      leftHip: [-0.52, 0.1, 0.18],
      leftKnee: [0.92, 0, 0],
      rightHip: [-0.45, -0.1, -0.18],
      rightKnee: [0.80, 0, 0],
    }),
    uke: makePose([-0.24, 0.58, -0.68], [3.75, Math.PI + 0.62, -0.18], {
      head: [0.34, 0, 0],
      leftShoulder: [-0.35, 0, 0.85],
      leftElbow: [-0.15, 0, 0],
      rightShoulder: [-0.95, 0, -0.3],
      leftHip: [-0.45, 0, 0.18],
      leftKnee: [0.75, 0, 0],
      rightHip: [-0.20, 0, -0.15],
      rightKnee: [0.35, 0, 0],
    }),
  },
  // Ukemi impact: rx=4.71 (-sin(4.71) = +1.0 => CHEST FACES SKY, BACK ON TATAMI!)
  {
    t: 0.92,
    impact: 0.95,
    tori: makePose([0.02, 0.80, 0.08], [0.42, Math.PI + 0.72, -0.05], {
      spine: [0.24, 0.18, 0],
      leftShoulder: [-1.05, 0.15, 0.18],
      leftElbow: [-0.75, 0, 0],
      rightShoulder: [-0.55, 0.1, -0.18],
      rightElbow: [-0.65, 0, 0],
      leftHip: [-0.45, 0.1, 0.18],
      leftKnee: [0.80, 0, 0],
      rightHip: [-0.40, -0.1, -0.18],
      rightKnee: [0.70, 0, 0],
    }),
    uke: makePose([-0.32, 0.18, -0.84], [4.72, Math.PI + 0.68, -0.22], {
      spine: [0.06, 0, 0],
      head: [0.42, 0, 0], // chin tucked!
      leftShoulder: [-0.18, 0, 0.92], // left arm slaps tatami at 35 deg beside hip
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.75, 0, -0.28],
      rightElbow: [-0.55, 0, 0],
      leftHip: [-0.55, 0, 0.18],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([0.02, 0.82, 0.08], [0.32, Math.PI + 0.75, 0], {
      spine: [0.18, 0.12, 0],
      leftShoulder: [-0.95, 0.15, 0.15],
      leftElbow: [-0.7, 0, 0],
      rightShoulder: [-0.45, 0.1, -0.15],
      leftHip: [-0.38, 0.1, 0.16],
      leftKnee: [0.68, 0, 0],
      rightHip: [-0.34, -0.1, -0.16],
      rightKnee: [0.60, 0, 0],
    }),
    uke: makePose([-0.32, 0.18, -0.86], [4.72, Math.PI + 0.68, -0.22], {
      spine: [0.06, 0, 0],
      head: [0.42, 0, 0],
      leftShoulder: [-0.18, 0, 0.92],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.75, 0, -0.28],
      rightElbow: [-0.55, 0, 0],
      leftHip: [-0.55, 0, 0.18],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
];

// ============================================================================
// 2. IPPON SEOI-NAGE (One-Arm Shoulder Throw) — Lands cleanly on BACK
// ============================================================================
const ipponSeoiKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.44], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.44], [0, Math.PI, 0]),
  },
  {
    t: 0.18,
    tori: makePose([0, 0.87, -0.40], [0.04, 0.08, 0], {
      leftShoulder: [-1.05, 0.1, 0.15],
      leftElbow: [-0.85, 0, 0],
      rightShoulder: [-1.05, -0.1, -0.15],
      rightElbow: [-0.85, 0, 0],
    }),
    uke: makePose([0, 0.88, 0.42], [0.03, Math.PI, 0]),
  },
  {
    t: 0.36,
    tori: makePose([0.05, 0.85, -0.20], [0.05, 0.45, 0], {
      leftShoulder: [-1.45, 0.2, 0.28],
      leftElbow: [-1.10, 0, 0],
      rightShoulder: [-1.55, -0.2, -0.25],
      rightElbow: [-1.10, 0, 0],
      leftHip: [-0.40, 0.1, 0.12],
      leftKnee: [0.65, 0, 0],
      rightHip: [-0.32, -0.1, -0.12],
      rightKnee: [0.54, 0, 0],
    }),
    uke: makePose([0, 0.92, 0.20], [0.20, Math.PI - 0.1, 0], {
      leftAnkle: [0.25, 0, 0],
      rightAnkle: [0.25, 0, 0],
      rightShoulder: [-1.45, 0, -0.35],
      leftShoulder: [-0.95, 0, 0.2],
    }),
  },
  {
    t: 0.56,
    tori: makePose([0.02, 0.60, -0.12], [0.25, Math.PI, 0], {
      spine: [0.26, 0, 0],
      chest: [0.20, 0, 0],
      head: [0.08, 0.25, 0],
      rightShoulder: [-1.85, 0.2, -0.25],
      rightElbow: [-1.55, 0, 0],
      leftShoulder: [-1.25, 0.2, 0.30],
      leftElbow: [-1.35, 0, 0],
      leftHip: [-1.05, 0.05, 0.18],
      leftKnee: [1.68, 0, 0],
      leftAnkle: [-0.62, 0, 0],
      rightHip: [-1.02, -0.05, -0.18],
      rightKnee: [1.65, 0, 0],
      rightAnkle: [-0.60, 0, 0],
    }),
    uke: makePose([0, 0.98, 0.16], [0.48, Math.PI, 0], {
      spine: [0.22, 0, 0],
      rightShoulder: [-1.75, 0, -0.15],
      rightElbow: [-0.45, 0, 0],
      leftHip: [-0.25, 0, 0.12],
      leftKnee: [0.35, 0, 0],
      rightHip: [-0.25, 0, -0.12],
      rightKnee: [0.35, 0, 0],
    }),
  },
  {
    t: 0.72,
    tori: makePose([0.0, 0.74, -0.08], [0.68, Math.PI + 0.15, 0], {
      spine: [0.38, 0.12, 0],
      chest: [0.28, 0.12, 0],
      rightShoulder: [-1.65, 0.25, -0.2],
      rightElbow: [-1.45, 0, 0],
      leftShoulder: [-1.25, 0.25, 0.25],
      leftElbow: [-1.20, 0, 0],
      leftHip: [-0.45, 0.05, 0.18],
      leftKnee: [0.68, 0, 0],
      rightHip: [-0.42, -0.05, -0.18],
      rightKnee: [0.62, 0, 0],
    }),
    uke: makePose([0.04, 1.38, -0.30], [2.25, Math.PI + 0.15, -0.12], {
      spine: [0.15, 0, 0],
      leftHip: [-0.30, 0, 0.15],
      leftKnee: [0.45, 0, 0],
      rightHip: [-0.20, 0, -0.15],
      rightKnee: [0.35, 0, 0],
      leftShoulder: [-0.85, 0, 0.65],
    }),
  },
  {
    t: 0.84,
    tori: makePose([0, 0.72, 0.02], [0.76, Math.PI + 0.22, 0], {
      spine: [0.35, 0.15, 0],
      rightShoulder: [-1.35, 0.2, -0.2],
      rightElbow: [-1.15, 0, 0],
      leftShoulder: [-1.1, 0.2, 0.2],
      leftHip: [-0.62, 0.08, 0.18],
      leftKnee: [1.10, 0, 0],
      rightHip: [-0.58, -0.08, -0.18],
      rightKnee: [1.02, 0, 0],
    }),
    uke: makePose([-0.08, 0.62, -0.86], [3.85, Math.PI + 0.25, -0.16], {
      head: [0.36, 0, 0],
      leftShoulder: [-0.28, 0, 0.92],
      leftElbow: [-0.15, 0, 0],
      leftHip: [-0.50, 0, 0.18],
      leftKnee: [0.85, 0, 0],
    }),
  },
  // Ukemi impact: rx=4.72 => BACK ON MAT, CHEST UP!
  {
    t: 0.92,
    impact: 1.0,
    tori: makePose([0, 0.76, 0.08], [0.55, Math.PI + 0.25, 0], {
      spine: [0.25, 0.15, 0],
      rightShoulder: [-1.1, 0.15, -0.18],
      rightElbow: [-0.95, 0, 0],
      leftShoulder: [-0.95, 0.15, 0.18],
      leftHip: [-0.55, 0.08, 0.18],
      leftKnee: [0.92, 0, 0],
      rightHip: [-0.50, -0.08, -0.18],
      rightKnee: [0.85, 0, 0],
    }),
    uke: makePose([-0.14, 0.18, -1.04], [4.72, Math.PI + 0.25, -0.14], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.16, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.75, 0, -0.35],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([0, 0.80, 0.08], [0.40, Math.PI + 0.25, 0], {
      spine: [0.18, 0.1, 0],
      rightShoulder: [-0.95, 0.1, -0.15],
      leftShoulder: [-0.90, 0.1, 0.15],
      leftHip: [-0.42, 0.08, 0.16],
      leftKnee: [0.74, 0, 0],
      rightHip: [-0.38, -0.08, -0.16],
      rightKnee: [0.68, 0, 0],
    }),
    uke: makePose([-0.14, 0.18, -1.04], [4.72, Math.PI + 0.25, -0.14], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.16, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.75, 0, -0.35],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
];

// ============================================================================
// 3. O-SOTO-GARI (Major Outer Reap) — Ushiro-ukemi (Flat on BACK, chest UP)
// ============================================================================
const oSotoGariKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.44], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.44], [0, Math.PI, 0]),
  },
  {
    t: 0.18,
    tori: makePose([0.04, 0.87, -0.38], [0.04, -0.08, 0], {
      leftShoulder: [-1.05, 0.12, 0.16],
      rightShoulder: [-1.08, -0.12, -0.16],
    }),
    uke: makePose([0, 0.88, 0.40], [0.02, Math.PI, 0]),
  },
  {
    t: 0.38,
    tori: makePose([0.32, 0.85, -0.02], [0.06, -0.18, 0], {
      spine: [0.08, -0.10, 0],
      leftShoulder: [-1.15, 0.2, 0.18],
      leftElbow: [-0.95, 0, 0],
      rightShoulder: [-1.28, -0.15, -0.22],
      rightElbow: [-0.65, 0, 0],
      leftHip: [-0.38, 0.1, 0.15],
      leftKnee: [0.65, 0, 0],
      rightHip: [-0.25, -0.1, -0.12],
      rightKnee: [0.42, 0, 0],
    }),
    uke: makePose([-0.02, 0.87, 0.36], [-0.18, Math.PI + 0.12, -0.10], {
      spine: [-0.14, 0, 0],
      rightHip: [-0.08, 0, -0.1],
      rightKnee: [0.22, 0, 0],
      leftHip: [-0.28, 0, 0.12],
      leftKnee: [0.45, 0, 0],
      leftShoulder: [-1.1, 0, 0.25],
      rightShoulder: [-1.25, 0, -0.25],
    }),
  },
  {
    t: 0.56,
    tori: makePose([0.36, 0.86, 0.18], [-0.10, -0.14, 0.06], {
      spine: [-0.06, -0.08, 0],
      leftShoulder: [-1.05, 0.15, 0.22],
      leftElbow: [-0.95, 0, 0],
      rightShoulder: [-1.35, -0.1, -0.18],
      rightElbow: [-0.55, 0, 0],
      leftHip: [-0.24, 0.05, 0.08],
      leftKnee: [0.44, 0, 0],
      rightHip: [-1.18, -0.1, -0.10],
      rightKnee: [0.18, 0, 0],
      rightAnkle: [0.35, 0, 0],
    }),
    uke: makePose([-0.02, 0.85, 0.44], [-0.30, Math.PI + 0.16, -0.12], {
      spine: [-0.20, 0, 0],
      rightHip: [-0.15, 0, -0.1],
      rightKnee: [0.32, 0, 0],
      leftHip: [-0.35, 0, 0.15],
      leftKnee: [0.55, 0, 0],
    }),
  },
  {
    t: 0.72,
    tori: makePose([0.34, 0.84, 0.22], [0.44, -0.10, 0.05], {
      spine: [0.22, -0.08, 0],
      chest: [0.18, -0.06, 0],
      leftShoulder: [-1.15, 0.15, 0.2],
      leftElbow: [-0.85, 0, 0],
      rightShoulder: [-1.45, -0.1, -0.15],
      rightElbow: [-0.45, 0, 0],
      leftHip: [-0.55, 0.05, 0.10],
      leftKnee: [0.42, 0, 0],
      rightHip: [0.55, -0.05, -0.06],
      rightKnee: [0.12, 0, 0],
      rightAnkle: [0.42, 0, 0],
    }),
    uke: makePose([-0.04, 0.78, 0.58], [-0.95, Math.PI + 0.14, -0.06], {
      spine: [-0.18, 0, 0],
      head: [0.35, 0, 0],
      rightHip: [-0.85, 0, -0.14],
      rightKnee: [0.25, 0, 0],
      leftHip: [-0.45, 0, 0.15],
      leftKnee: [0.55, 0, 0],
      leftShoulder: [-0.75, 0, 0.75],
      rightShoulder: [-0.75, 0, -0.75],
    }),
  },
  {
    t: 0.84,
    tori: makePose([0.32, 0.80, 0.24], [0.52, -0.08, 0], {
      spine: [0.26, -0.08, 0],
      leftShoulder: [-1.20, 0.15, 0.2],
      rightShoulder: [-1.35, -0.1, -0.15],
      leftHip: [-0.65, 0.05, 0.12],
      leftKnee: [0.68, 0, 0],
      rightHip: [0.35, -0.05, -0.1],
      rightKnee: [0.28, 0, 0],
    }),
    uke: makePose([-0.06, 0.38, 0.78], [-1.42, Math.PI + 0.12, -0.04], {
      head: [0.42, 0, 0],
      leftShoulder: [-0.35, 0, 0.95],
      rightShoulder: [-0.35, 0, -0.95],
      leftHip: [-0.55, 0, 0.15],
      leftKnee: [0.70, 0, 0],
      rightHip: [-0.75, 0, -0.15],
      rightKnee: [0.55, 0, 0],
    }),
  },
  {
    t: 0.92,
    impact: 1.0,
    tori: makePose([0.20, 0.83, 0.26], [0.36, -0.06, 0], {
      spine: [0.18, -0.05, 0],
      leftShoulder: [-1.05, 0.1, 0.2],
      rightShoulder: [-1.05, -0.1, -0.15],
      leftHip: [-0.45, 0.05, 0.12],
      leftKnee: [0.55, 0, 0],
      rightHip: [-0.15, -0.05, -0.1],
      rightKnee: [0.32, 0, 0],
    }),
    uke: makePose([-0.02, 0.17, 0.84], [-1.56, Math.PI + 0.10, 0], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.15, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.15, 0, -0.95],
      rightElbow: [-0.08, 0, 0],
      leftHip: [-0.50, 0, 0.16],
      leftKnee: [0.75, 0, 0],
      rightHip: [-0.48, 0, -0.16],
      rightKnee: [0.72, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([0.20, 0.85, 0.24], [0.28, -0.04, 0], {
      spine: [0.14, 0, 0],
      leftShoulder: [-0.95, 0.1, 0.18],
      rightShoulder: [-0.95, -0.1, -0.15],
      leftHip: [-0.36, 0.05, 0.12],
      leftKnee: [0.48, 0, 0],
      rightHip: [-0.20, -0.05, -0.12],
      rightKnee: [0.38, 0, 0],
    }),
    uke: makePose([-0.02, 0.17, 0.84], [-1.56, Math.PI + 0.10, 0], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.15, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.15, 0, -0.95],
      rightElbow: [-0.08, 0, 0],
      leftHip: [-0.50, 0, 0.16],
      leftKnee: [0.75, 0, 0],
      rightHip: [-0.48, 0, -0.16],
      rightKnee: [0.72, 0, 0],
    }),
  },
];

// ============================================================================
// 4. DE-ASHI-HARAI (Advancing Foot Sweep) — Lands on BACK-SIDE (-sin(-1.46) = +0.99 UP)
// ============================================================================
const deAshiHaraiKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.46], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.46], [0, Math.PI, 0]),
  },
  {
    t: 0.20,
    tori: makePose([-0.15, 0.87, -0.44], [0.04, 0.08, 0], {
      leftHip: [-0.25, 0.08, 0.20],
      leftKnee: [0.48, 0, 0],
      rightHip: [-0.22, -0.08, -0.22],
      rightKnee: [0.44, 0, 0],
    }),
    uke: makePose([-0.15, 0.88, 0.42], [0.02, Math.PI, 0], {
      leftHip: [-0.22, 0.05, 0.18],
      leftKnee: [0.42, 0, 0],
      rightHip: [-0.28, -0.05, -0.14],
      rightKnee: [0.48, 0, 0],
    }),
  },
  {
    t: 0.42,
    tori: makePose([-0.24, 0.86, -0.38], [0.05, 0.28, 0], {
      spine: [0.05, 0.18, 0],
      leftShoulder: [-0.82, 0.3, 0.35],
      leftElbow: [-0.85, 0, 0],
      rightShoulder: [-1.25, -0.15, -0.22],
      rightElbow: [-0.95, 0, 0],
      rightHip: [-0.22, -0.1, -0.10],
      rightKnee: [0.42, 0, 0],
      leftHip: [-0.36, 0.18, 0.28],
      leftKnee: [0.55, 0, 0],
      leftAnkle: [0.25, 0, -0.35],
    }),
    uke: makePose([-0.22, 0.87, 0.30], [-0.05, Math.PI - 0.12, -0.12], {
      rightHip: [-0.45, 0, -0.18],
      rightKnee: [0.40, 0, 0],
      leftHip: [-0.15, 0, 0.12],
      leftKnee: [0.35, 0, 0],
    }),
  },
  {
    t: 0.62,
    tori: makePose([-0.20, 0.86, -0.36], [0.06, 0.45, -0.05], {
      spine: [0.06, 0.25, 0],
      leftShoulder: [-0.65, 0.35, 0.45],
      leftElbow: [-0.95, 0, 0],
      rightShoulder: [-1.35, 0.1, -0.25],
      rightElbow: [-0.85, 0, 0],
      rightHip: [-0.24, -0.05, -0.10],
      rightKnee: [0.44, 0, 0],
      leftHip: [-0.52, -0.18, -0.38],
      leftKnee: [0.18, 0, 0],
      leftAnkle: [0.28, 0, -0.45],
    }),
    uke: makePose([-0.14, 0.78, 0.26], [-0.55, Math.PI - 0.35, -0.65], {
      spine: [-0.08, 0, 0],
      rightHip: [-0.32, 0, -0.55],
      rightKnee: [0.22, 0, 0],
      leftHip: [-0.25, 0, 0.22],
      leftKnee: [0.35, 0, 0],
      leftShoulder: [-0.75, 0, 0.85],
    }),
  },
  {
    t: 0.78,
    tori: makePose([-0.18, 0.87, -0.36], [0.08, 0.55, 0], {
      leftShoulder: [-0.75, 0.25, 0.35],
      leftElbow: [-0.85, 0, 0],
      rightShoulder: [-1.15, 0.1, -0.2],
      leftHip: [-0.30, 0.1, 0.18],
      leftKnee: [0.55, 0, 0],
      rightHip: [-0.24, -0.1, -0.14],
      rightKnee: [0.44, 0, 0],
    }),
    uke: makePose([-0.02, 0.38, 0.24], [-1.18, Math.PI - 0.55, -0.45], {
      head: [0.32, 0, 0],
      rightShoulder: [-0.35, 0, -1.0],
      rightElbow: [-0.15, 0, 0],
      leftShoulder: [-0.85, 0, 0.45],
      rightHip: [-0.35, 0, -0.25],
      rightKnee: [0.45, 0, 0],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.85, 0, 0],
    }),
  },
  // Landing on BACK-SIDE (rx = -1.48 => -sin(-1.48) = +0.996 UP, chest skyward!)
  {
    t: 0.90,
    impact: 0.90,
    tori: makePose([-0.18, 0.88, -0.36], [0.12, 0.58, 0], {
      leftShoulder: [-0.85, 0.2, 0.25],
      rightShoulder: [-0.85, 0, -0.18],
      leftHip: [-0.24, 0.08, 0.14],
      leftKnee: [0.44, 0, 0],
      rightHip: [-0.20, -0.08, -0.14],
      rightKnee: [0.38, 0, 0],
    }),
    uke: makePose([0.04, 0.18, 0.22], [-1.48, Math.PI - 0.65, -0.24], {
      head: [0.40, 0, 0],
      rightShoulder: [-0.18, 0, -1.02], // right arm slaps tatami beside hip
      rightElbow: [-0.08, 0, 0],
      leftShoulder: [-0.75, 0, 0.35],
      leftElbow: [-0.50, 0, 0],
      rightHip: [-0.28, 0, -0.15],
      rightKnee: [0.35, 0, 0],
      leftHip: [-0.55, 0, 0.22],
      leftKnee: [0.92, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([-0.18, 0.88, -0.36], [0.10, 0.58, 0], {
      leftShoulder: [-0.85, 0.2, 0.22],
      rightShoulder: [-0.80, 0, -0.18],
      leftHip: [-0.22, 0.08, 0.14],
      leftKnee: [0.40, 0, 0],
      rightHip: [-0.18, -0.08, -0.14],
      rightKnee: [0.36, 0, 0],
    }),
    uke: makePose([0.04, 0.18, 0.22], [-1.48, Math.PI - 0.65, -0.24], {
      head: [0.40, 0, 0],
      rightShoulder: [-0.18, 0, -1.02],
      rightElbow: [-0.08, 0, 0],
      leftShoulder: [-0.75, 0, 0.35],
      leftElbow: [-0.50, 0, 0],
      rightHip: [-0.28, 0, -0.15],
      rightKnee: [0.35, 0, 0],
      leftHip: [-0.55, 0, 0.22],
      leftKnee: [0.92, 0, 0],
    }),
  },
];

// ============================================================================
// 5. UCHI-MATA (Inner Thigh Throw) — Full rotation onto BACK
// ============================================================================
const uchiMataKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.44], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.44], [0, Math.PI, 0]),
  },
  {
    t: 0.18,
    tori: makePose([0, 0.87, -0.38], [0.05, 0.12, 0], {
      leftShoulder: [-1.1, 0.15, 0.18],
      rightShoulder: [-1.15, -0.15, -0.18],
    }),
    uke: makePose([0, 0.88, 0.40], [0.03, Math.PI, 0]),
  },
  {
    t: 0.38,
    tori: makePose([0.04, 0.83, -0.16], [0.10, 0.65, 0], {
      leftShoulder: [-1.35, 0.25, 0.35],
      leftElbow: [-1.05, 0, 0],
      rightShoulder: [-1.35, -0.15, -0.25],
      rightElbow: [-0.95, 0, 0],
      leftHip: [-0.45, 0.1, 0.16],
      leftKnee: [0.78, 0, 0],
      rightHip: [-0.35, -0.1, -0.16],
      rightKnee: [0.62, 0, 0],
    }),
    uke: makePose([0, 0.88, 0.24], [0.22, Math.PI - 0.12, 0], {
      leftHip: [-0.25, 0, 0.28],
      leftKnee: [0.42, 0, 0],
      rightHip: [-0.25, 0, -0.28],
      rightKnee: [0.42, 0, 0],
      leftAnkle: [0.18, 0, 0],
      rightAnkle: [0.18, 0, 0],
    }),
  },
  {
    t: 0.56,
    tori: makePose([0, 0.80, -0.10], [0.28, Math.PI - 0.15, 0], {
      spine: [0.20, 0.12, 0],
      leftShoulder: [-1.25, 0.3, 0.4],
      leftElbow: [-1.05, 0, 0],
      rightShoulder: [-1.35, -0.1, -0.3],
      rightElbow: [-0.85, 0, 0],
      leftHip: [-0.38, 0.05, 0.08],
      leftKnee: [0.66, 0, 0],
      rightHip: [0.15, -0.1, -0.18],
      rightKnee: [0.45, 0, 0],
    }),
    uke: makePose([0, 0.92, 0.20], [0.45, Math.PI, 0], {
      leftHip: [-0.28, 0, 0.32],
      leftKnee: [0.35, 0, 0],
      rightHip: [-0.28, 0, -0.32],
      rightKnee: [0.35, 0, 0],
    }),
  },
  {
    t: 0.72,
    tori: makePose([0, 0.82, -0.06], [1.05, Math.PI + 0.15, -0.10], {
      spine: [0.25, 0.18, 0],
      head: [-0.2, 0, 0],
      leftShoulder: [-1.20, 0.25, 0.45],
      leftElbow: [-0.95, 0, 0],
      rightShoulder: [-1.30, 0.15, -0.35],
      rightElbow: [-0.85, 0, 0],
      leftHip: [-0.98, 0.05, 0.06],
      leftKnee: [0.18, 0, 0],
      rightHip: [0.65, -0.05, -0.12],
      rightKnee: [0.06, 0, 0],
      rightAnkle: [0.40, 0, 0],
    }),
    uke: makePose([-0.06, 1.36, -0.24], [2.25, Math.PI + 0.22, -0.15], {
      leftHip: [-0.30, 0, 0.45],
      leftKnee: [0.30, 0, 0],
      rightHip: [-0.15, 0, -0.35],
      rightKnee: [0.35, 0, 0],
      leftShoulder: [-0.85, 0, 0.75],
    }),
  },
  {
    t: 0.84,
    tori: makePose([0, 0.78, 0.02], [0.95, Math.PI + 0.35, 0], {
      spine: [0.28, 0.15, 0],
      leftShoulder: [-1.05, 0.2, 0.3],
      rightShoulder: [-1.15, 0.1, -0.25],
      leftHip: [-0.92, 0.05, 0.08],
      leftKnee: [0.32, 0, 0],
      rightHip: [0.42, -0.05, -0.12],
      rightKnee: [0.18, 0, 0],
    }),
    uke: makePose([-0.14, 0.58, -0.82], [3.85, Math.PI + 0.38, -0.16], {
      head: [0.36, 0, 0],
      leftShoulder: [-0.28, 0, 0.95],
      leftElbow: [-0.15, 0, 0],
      leftHip: [-0.50, 0, 0.22],
      leftKnee: [0.85, 0, 0],
    }),
  },
  {
    t: 0.92,
    impact: 1.0,
    tori: makePose([0, 0.82, 0.06], [0.52, Math.PI + 0.38, 0], {
      spine: [0.20, 0.12, 0],
      leftShoulder: [-0.95, 0.15, 0.2],
      rightShoulder: [-0.95, 0.1, -0.2],
      leftHip: [-0.48, 0.05, 0.14],
      leftKnee: [0.58, 0, 0],
      rightHip: [0.05, -0.05, -0.14],
      rightKnee: [0.35, 0, 0],
    }),
    uke: makePose([-0.18, 0.18, -0.96], [4.72, Math.PI + 0.40, -0.16], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.18, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.78, 0, -0.28],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([0, 0.86, 0.04], [0.30, Math.PI + 0.38, 0], {
      spine: [0.14, 0.08, 0],
      leftShoulder: [-0.90, 0.15, 0.18],
      rightShoulder: [-0.88, 0.05, -0.18],
      leftHip: [-0.28, 0.08, 0.14],
      leftKnee: [0.46, 0, 0],
      rightHip: [-0.20, -0.08, -0.14],
      rightKnee: [0.38, 0, 0],
    }),
    uke: makePose([-0.18, 0.18, -0.96], [4.72, Math.PI + 0.40, -0.16], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.18, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.78, 0, -0.28],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
];

// ============================================================================
// 6. TAI-OTOSHI (Body Drop) — Lands cleanly on BACK
// ============================================================================
const taiOtoshiKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.44], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.44], [0, Math.PI, 0]),
  },
  {
    t: 0.18,
    tori: makePose([0.04, 0.87, -0.38], [0.04, 0.15, 0], {
      leftShoulder: [-1.08, 0.15, 0.20],
      rightShoulder: [-1.08, -0.15, -0.15],
    }),
    uke: makePose([0, 0.88, 0.40], [0.04, Math.PI, 0]),
  },
  {
    t: 0.38,
    tori: makePose([0.08, 0.82, -0.12], [0.08, 0.85, 0], {
      spine: [0.08, 0.20, 0],
      leftShoulder: [-1.35, 0.25, 0.42],
      leftElbow: [-1.05, 0, 0],
      rightShoulder: [-1.42, -0.15, -0.28],
      rightElbow: [-0.85, 0, 0],
      leftHip: [-0.45, 0.1, 0.16],
      leftKnee: [0.78, 0, 0],
      rightHip: [-0.35, -0.1, -0.18],
      rightKnee: [0.60, 0, 0],
    }),
    uke: makePose([0, 0.90, 0.22], [0.26, Math.PI - 0.1, 0], {
      leftAnkle: [0.24, 0, 0],
      rightAnkle: [0.24, 0, 0],
      leftShoulder: [-0.95, 0, 0.25],
      rightShoulder: [-1.15, 0, -0.30],
    }),
  },
  {
    t: 0.58,
    tori: makePose([-0.18, 0.66, -0.14], [0.16, Math.PI - 0.35, 0], {
      spine: [0.18, 0.22, 0],
      leftShoulder: [-1.18, 0.35, 0.48],
      leftElbow: [-1.05, 0, 0],
      rightShoulder: [-1.45, 0.25, -0.30],
      rightElbow: [-0.92, 0, 0],
      leftHip: [-0.72, 0.15, 0.32],
      leftKnee: [1.32, 0, 0],
      leftAnkle: [-0.55, 0, 0],
      rightHip: [-0.62, -0.22, -0.58],
      rightKnee: [0.22, 0, 0],
      rightAnkle: [0.35, 0, 0],
    }),
    uke: makePose([0.02, 0.90, 0.18], [0.46, Math.PI - 0.08, 0], {
      rightHip: [-0.18, 0, -0.12],
      rightKnee: [0.25, 0, 0],
      leftHip: [-0.22, 0, 0.12],
      leftKnee: [0.30, 0, 0],
    }),
  },
  {
    t: 0.74,
    tori: makePose([-0.16, 0.56, -0.12], [0.36, Math.PI + 0.15, -0.08], {
      spine: [0.26, 0.25, 0],
      leftShoulder: [-0.88, 0.35, 0.45],
      leftElbow: [-0.95, 0, 0],
      rightShoulder: [-1.15, 0.25, -0.35],
      rightElbow: [-0.85, 0, 0],
      leftHip: [-0.88, 0.15, 0.36],
      leftKnee: [1.56, 0, 0],
      leftAnkle: [-0.62, 0, 0],
      rightHip: [-0.74, -0.22, -0.62],
      rightKnee: [0.24, 0, 0],
      rightAnkle: [0.42, 0, 0],
    }),
    uke: makePose([-0.04, 1.08, -0.36], [2.10, Math.PI + 0.18, -0.14], {
      spine: [0.15, 0, 0],
      rightHip: [-0.30, 0, -0.15],
      rightKnee: [0.45, 0, 0],
      leftHip: [-0.55, 0, 0.22],
      leftKnee: [0.55, 0, 0],
      leftShoulder: [-0.75, 0, 0.85],
    }),
  },
  {
    t: 0.85,
    tori: makePose([-0.12, 0.62, -0.04], [0.32, Math.PI + 0.25, 0], {
      spine: [0.22, 0.18, 0],
      leftShoulder: [-0.75, 0.25, 0.35],
      rightShoulder: [-0.95, 0.18, -0.28],
      leftHip: [-0.78, 0.12, 0.28],
      leftKnee: [1.38, 0, 0],
      rightHip: [-0.62, -0.18, -0.45],
      rightKnee: [0.42, 0, 0],
    }),
    uke: makePose([-0.20, 0.50, -0.84], [3.85, Math.PI + 0.35, -0.16], {
      head: [0.35, 0, 0],
      leftShoulder: [-0.28, 0, 0.98],
      leftElbow: [-0.15, 0, 0],
      leftHip: [-0.52, 0, 0.22],
      leftKnee: [0.88, 0, 0],
    }),
  },
  {
    t: 0.92,
    impact: 0.95,
    tori: makePose([-0.10, 0.70, 0.04], [0.24, Math.PI + 0.30, 0], {
      spine: [0.18, 0.15, 0],
      leftShoulder: [-0.85, 0.2, 0.25],
      rightShoulder: [-0.85, 0.15, -0.22],
      leftHip: [-0.62, 0.12, 0.22],
      leftKnee: [1.10, 0, 0],
      rightHip: [-0.48, -0.15, -0.32],
      rightKnee: [0.68, 0, 0],
    }),
    uke: makePose([-0.24, 0.18, -0.92], [4.72, Math.PI + 0.38, -0.18], {
      spine: [0.06, 0, 0],
      head: [0.42, 0, 0],
      leftShoulder: [-0.18, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.78, 0, -0.28],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([-0.08, 0.76, 0.04], [0.18, Math.PI + 0.30, 0], {
      spine: [0.14, 0.10, 0],
      leftShoulder: [-0.85, 0.15, 0.22],
      rightShoulder: [-0.82, 0.1, -0.20],
      leftHip: [-0.48, 0.1, 0.18],
      leftKnee: [0.85, 0, 0],
      rightHip: [-0.38, -0.12, -0.24],
      rightKnee: [0.62, 0, 0],
    }),
    uke: makePose([-0.24, 0.18, -0.92], [4.72, Math.PI + 0.38, -0.18], {
      spine: [0.06, 0, 0],
      head: [0.42, 0, 0],
      leftShoulder: [-0.18, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.78, 0, -0.28],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
];

// ============================================================================
// 7. HARAI-GOSHI (Sweeping Hip Throw) — Lands cleanly on BACK
// ============================================================================
const haraiGoshiKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.44], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.44], [0, Math.PI, 0]),
  },
  {
    t: 0.18,
    tori: makePose([0.04, 0.87, -0.38], [0.04, 0.12, 0], {
      leftShoulder: [-1.1, 0.15, 0.18],
      rightShoulder: [-1.15, -0.15, -0.15],
    }),
    uke: makePose([0, 0.88, 0.40], [0.03, Math.PI, 0]),
  },
  // Kuzushi: High collar-and-sleeve pull onto Uke's front-right corner
  {
    t: 0.36,
    tori: makePose([-0.04, 0.84, -0.18], [0.08, 0.62, 0], {
      spine: [0.10, 0.18, 0],
      leftShoulder: [-1.38, 0.28, 0.38],
      leftElbow: [-1.05, 0, 0],
      rightShoulder: [-1.42, -0.15, -0.28], // high collar pull
      rightElbow: [-0.88, 0, 0],
      leftHip: [-0.42, 0.1, 0.14],
      leftKnee: [0.68, 0, 0],
      rightHip: [-0.32, -0.1, -0.14],
      rightKnee: [0.54, 0, 0],
    }),
    uke: makePose([0, 0.91, 0.22], [0.22, Math.PI - 0.14, 0], {
      leftAnkle: [0.24, 0, 0],
      rightAnkle: [0.24, 0, 0],
    }),
  },
  // Tsukuri: Pivot onto left foot, load Uke onto hip, extend right leg forward across Uke's thigh
  {
    t: 0.56,
    tori: makePose([0.04, 0.78, -0.10], [0.22, Math.PI - 0.18, 0], {
      spine: [0.20, 0.12, 0],
      leftShoulder: [-1.20, 0.3, 0.35],
      leftElbow: [-1.10, 0, 0],
      rightShoulder: [-1.45, 0.22, -0.35],
      rightElbow: [-0.95, 0, 0],
      leftHip: [-0.48, 0.05, 0.10],
      leftKnee: [0.85, 0, 0],
      rightHip: [-0.65, -0.15, -0.22],
      rightKnee: [0.35, 0, 0],
    }),
    uke: makePose([0, 0.96, 0.18], [0.46, Math.PI, 0], {
      leftHip: [-0.20, 0, 0.12],
      rightHip: [-0.20, 0, -0.12],
    }),
  },
  // Kake: Powerful backward sweep of Tori's straight right leg + hip rotation
  {
    t: 0.72,
    tori: makePose([0.02, 0.84, -0.06], [0.72, Math.PI + 0.22, -0.12], {
      spine: [0.26, 0.22, 0],
      leftShoulder: [-1.25, 0.25, 0.38],
      rightShoulder: [-1.35, 0.25, -0.30],
      leftHip: [-0.72, 0.05, 0.08],
      leftKnee: [0.22, 0, 0],
      rightHip: [0.58, -0.08, -0.18],
      rightKnee: [0.08, 0, 0],
      rightAnkle: [0.38, 0, 0],
    }),
    uke: makePose([-0.06, 1.34, -0.22], [2.15, Math.PI + 0.28, -0.15], {
      leftHip: [-0.35, 0, 0.22],
      leftKnee: [0.40, 0, 0],
      rightHip: [-0.22, 0, -0.18],
      rightKnee: [0.35, 0, 0],
      leftShoulder: [-0.85, 0, 0.75],
    }),
  },
  {
    t: 0.84,
    tori: makePose([0.02, 0.82, 0.02], [0.65, Math.PI + 0.42, -0.06], {
      spine: [0.24, 0.18, 0],
      leftShoulder: [-1.05, 0.2, 0.25],
      rightShoulder: [-1.10, 0.15, -0.25],
      leftHip: [-0.62, 0.05, 0.10],
      leftKnee: [0.42, 0, 0],
      rightHip: [0.32, -0.08, -0.14],
      rightKnee: [0.20, 0, 0],
    }),
    uke: makePose([-0.18, 0.56, -0.78], [3.82, Math.PI + 0.48, -0.18], {
      head: [0.36, 0, 0],
      leftShoulder: [-0.25, 0, 0.95],
      leftElbow: [-0.15, 0, 0],
      leftHip: [-0.50, 0, 0.20],
      leftKnee: [0.85, 0, 0],
    }),
  },
  {
    t: 0.92,
    impact: 1.0,
    tori: makePose([0.02, 0.85, 0.06], [0.38, Math.PI + 0.45, 0], {
      spine: [0.18, 0.12, 0],
      leftShoulder: [-0.95, 0.15, 0.20],
      rightShoulder: [-0.95, 0.1, -0.20],
      leftHip: [-0.38, 0.08, 0.12],
      leftKnee: [0.48, 0, 0],
      rightHip: [-0.10, -0.08, -0.14],
      rightKnee: [0.32, 0, 0],
    }),
    uke: makePose([-0.24, 0.18, -0.94], [4.72, Math.PI + 0.50, -0.18], {
      spine: [0.06, 0, 0],
      head: [0.42, 0, 0],
      leftShoulder: [-0.18, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.78, 0, -0.28],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([0.02, 0.86, 0.06], [0.26, Math.PI + 0.45, 0], {
      spine: [0.14, 0.08, 0],
      leftShoulder: [-0.90, 0.15, 0.18],
      rightShoulder: [-0.88, 0.08, -0.18],
      leftHip: [-0.28, 0.08, 0.14],
      leftKnee: [0.44, 0, 0],
      rightHip: [-0.20, -0.08, -0.14],
      rightKnee: [0.36, 0, 0],
    }),
    uke: makePose([-0.24, 0.18, -0.94], [4.72, Math.PI + 0.50, -0.18], {
      spine: [0.06, 0, 0],
      head: [0.42, 0, 0],
      leftShoulder: [-0.18, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.78, 0, -0.28],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
];

// ============================================================================
// 8. O-UCHI-GARI (Major Inner Reap) — Ushiro-ukemi (Flat on BACK, chest UP)
// ============================================================================
const oUchiGariKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.44], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.44], [0, Math.PI, 0]),
  },
  {
    t: 0.18,
    tori: makePose([0, 0.87, -0.36], [0.05, 0, 0], {
      leftShoulder: [-1.08, 0.12, 0.16],
      rightShoulder: [-1.12, -0.12, -0.16],
    }),
    uke: makePose([0, 0.88, 0.40], [0.02, Math.PI, 0]),
  },
  // Kuzushi: Drive Uke straight back onto left heel while Tori closes hip distance
  {
    t: 0.38,
    tori: makePose([-0.04, 0.82, -0.06], [0.10, -0.08, 0], {
      spine: [0.10, 0, 0],
      leftShoulder: [-1.22, 0.18, 0.20],
      rightShoulder: [-1.32, -0.12, -0.18], // driving chest forward
      leftHip: [-0.45, 0.08, 0.12], // stepping deep between Uke's feet
      leftKnee: [0.80, 0, 0],
      rightHip: [-0.28, -0.08, -0.12],
      rightKnee: [0.52, 0, 0],
    }),
    uke: makePose([0, 0.86, 0.38], [-0.20, Math.PI - 0.08, 0], {
      spine: [-0.15, 0, 0],
      leftHip: [-0.12, 0, 0.18], // weight pinned onto Uke's left heel (-X world)
      leftKnee: [0.24, 0, 0],
      rightHip: [-0.26, 0, -0.18],
      rightKnee: [0.42, 0, 0],
    }),
  },
  // Tsukuri: Tori brings right leg inside between Uke's legs and hooks behind Uke's left calf/thigh
  {
    t: 0.56,
    tori: makePose([-0.06, 0.81, 0.06], [0.14, 0.06, 0], {
      spine: [0.12, 0.08, 0],
      leftShoulder: [-1.18, 0.15, 0.22],
      rightShoulder: [-1.38, -0.1, -0.18],
      leftHip: [-0.46, 0.05, 0.12], // supporting left leg
      leftKnee: [0.82, 0, 0],
      rightHip: [-0.52, 0.22, -0.34], // right leg reaches inside & hooks Uke's left inner calf (-X world)
      rightKnee: [0.68, 0, 0],
    }),
    uke: makePose([0, 0.84, 0.42], [-0.34, Math.PI - 0.10, 0], {
      spine: [-0.18, 0, 0],
      leftHip: [-0.22, 0, 0.25],
      leftKnee: [0.28, 0, 0],
      rightHip: [-0.30, 0, -0.22],
      rightKnee: [0.44, 0, 0],
    }),
  },
  // Kake: Sweeping Uke's left leg out in a circular arc while driving chest forward
  {
    t: 0.72,
    tori: makePose([-0.04, 0.78, 0.16], [0.45, 0.15, 0], {
      spine: [0.24, 0.12, 0],
      leftShoulder: [-1.25, 0.15, 0.22],
      rightShoulder: [-1.42, -0.08, -0.16],
      leftHip: [-0.58, 0.05, 0.14],
      leftKnee: [0.78, 0, 0],
      rightHip: [-0.35, 0.35, -0.58], // sweeping Uke's left leg outward & back!
      rightKnee: [0.42, 0, 0],
    }),
    uke: makePose([0.02, 0.72, 0.56], [-0.98, Math.PI - 0.12, 0], {
      head: [0.35, 0, 0],
      leftHip: [-0.75, 0, 0.48], // Uke's left leg swept upward/outward!
      leftKnee: [0.25, 0, 0],
      rightHip: [-0.35, 0, -0.18],
      rightKnee: [0.45, 0, 0],
      leftShoulder: [-0.75, 0, 0.75],
      rightShoulder: [-0.75, 0, -0.75],
    }),
  },
  {
    t: 0.84,
    tori: makePose([-0.02, 0.74, 0.20], [0.56, 0.15, 0], {
      spine: [0.28, 0.10, 0],
      leftShoulder: [-1.25, 0.15, 0.22],
      rightShoulder: [-1.35, -0.1, -0.16],
      leftHip: [-0.68, 0.05, 0.14],
      leftKnee: [0.85, 0, 0],
      rightHip: [-0.25, 0.25, -0.42],
      rightKnee: [0.38, 0, 0],
    }),
    uke: makePose([0.02, 0.36, 0.78], [-1.44, Math.PI - 0.10, 0], {
      head: [0.42, 0, 0],
      leftShoulder: [-0.30, 0, 0.95],
      rightShoulder: [-0.30, 0, -0.95],
      leftHip: [-0.60, 0, 0.35],
      leftKnee: [0.65, 0, 0],
      rightHip: [-0.50, 0, -0.18],
      rightKnee: [0.68, 0, 0],
    }),
  },
  // Ushiro-ukemi flat on BACK!
  {
    t: 0.92,
    impact: 1.0,
    tori: makePose([-0.02, 0.78, 0.18], [0.38, 0.10, 0], {
      spine: [0.20, 0.08, 0],
      leftShoulder: [-1.05, 0.1, 0.2],
      rightShoulder: [-1.05, -0.1, -0.16],
      leftHip: [-0.48, 0.05, 0.14],
      leftKnee: [0.65, 0, 0],
      rightHip: [-0.25, 0.1, -0.20],
      rightKnee: [0.48, 0, 0],
    }),
    uke: makePose([0.02, 0.17, 0.86], [-1.56, Math.PI - 0.08, 0], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.15, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.15, 0, -0.95],
      rightElbow: [-0.08, 0, 0],
      leftHip: [-0.50, 0, 0.22],
      leftKnee: [0.75, 0, 0],
      rightHip: [-0.48, 0, -0.16],
      rightKnee: [0.72, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([-0.02, 0.84, 0.16], [0.25, 0.08, 0], {
      spine: [0.14, 0.05, 0],
      leftShoulder: [-0.95, 0.1, 0.18],
      rightShoulder: [-0.95, -0.1, -0.15],
      leftHip: [-0.32, 0.06, 0.12],
      leftKnee: [0.48, 0, 0],
      rightHip: [-0.22, -0.06, -0.14],
      rightKnee: [0.40, 0, 0],
    }),
    uke: makePose([0.02, 0.17, 0.86], [-1.56, Math.PI - 0.08, 0], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.15, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.15, 0, -0.95],
      rightElbow: [-0.08, 0, 0],
      leftHip: [-0.50, 0, 0.22],
      leftKnee: [0.75, 0, 0],
      rightHip: [-0.48, 0, -0.16],
      rightKnee: [0.72, 0, 0],
    }),
  },
];

// ============================================================================
// 9. MOROTE SEOI-NAGE (Two-Arm Shoulder Throw) — Lands cleanly on BACK
// ============================================================================
const moroteSeoiKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.44], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.44], [0, Math.PI, 0]),
  },
  {
    t: 0.18,
    tori: makePose([0, 0.87, -0.38], [0.04, 0.10, 0], {
      leftShoulder: [-1.08, 0.12, 0.16],
      rightShoulder: [-1.10, -0.12, -0.16],
    }),
    uke: makePose([0, 0.88, 0.40], [0.04, Math.PI, 0]),
  },
  // Kuzushi: High two-handed sleeve & lapel lift
  {
    t: 0.36,
    tori: makePose([0.04, 0.84, -0.18], [0.06, 0.48, 0], {
      leftShoulder: [-1.45, 0.22, 0.28],
      leftElbow: [-1.05, 0, 0],
      rightShoulder: [-1.50, -0.22, -0.24],
      rightElbow: [-1.15, 0, 0],
      leftHip: [-0.42, 0.1, 0.14],
      leftKnee: [0.72, 0, 0],
      rightHip: [-0.36, -0.1, -0.14],
      rightKnee: [0.60, 0, 0],
    }),
    uke: makePose([0, 0.92, 0.20], [0.22, Math.PI - 0.1, 0], {
      leftAnkle: [0.24, 0, 0],
      rightAnkle: [0.24, 0, 0],
    }),
  },
  // Tsukuri: Deep squat keeping BOTH hands on lapel & sleeve, right elbow tucked vertically under Uke's armpit
  {
    t: 0.56,
    tori: makePose([0.02, 0.58, -0.12], [0.26, Math.PI, 0], {
      spine: [0.24, 0, 0],
      chest: [0.18, 0, 0],
      leftShoulder: [-1.32, 0.25, 0.32],
      leftElbow: [-1.25, 0, 0],
      rightShoulder: [-1.62, 0.15, -0.22],
      rightElbow: [-1.68, 0, 0],
      leftHip: [-1.12, 0.05, 0.18],
      leftKnee: [1.78, 0, 0],
      leftAnkle: [-0.64, 0, 0],
      rightHip: [-1.08, -0.05, -0.18],
      rightKnee: [1.74, 0, 0],
      rightAnkle: [-0.62, 0, 0],
    }),
    uke: makePose([0, 0.98, 0.16], [0.50, Math.PI, 0], {
      spine: [0.22, 0, 0],
      leftHip: [-0.25, 0, 0.12],
      leftKnee: [0.35, 0, 0],
      rightHip: [-0.25, 0, -0.12],
      rightKnee: [0.35, 0, 0],
    }),
  },
  // Kake: Leg drive + two-handed forward rotation over shoulder
  {
    t: 0.72,
    tori: makePose([0, 0.74, -0.08], [0.70, Math.PI + 0.12, 0], {
      spine: [0.36, 0.10, 0],
      leftShoulder: [-1.28, 0.22, 0.28],
      leftElbow: [-1.15, 0, 0],
      rightShoulder: [-1.52, 0.18, -0.20],
      rightElbow: [-1.55, 0, 0],
      leftHip: [-0.48, 0.05, 0.18],
      leftKnee: [0.72, 0, 0],
      rightHip: [-0.45, -0.05, -0.18],
      rightKnee: [0.68, 0, 0],
    }),
    uke: makePose([0.02, 1.40, -0.32], [2.32, Math.PI + 0.14, -0.10], {
      spine: [0.15, 0, 0],
      leftHip: [-0.32, 0, 0.16],
      leftKnee: [0.46, 0, 0],
      rightHip: [-0.22, 0, -0.16],
      rightKnee: [0.36, 0, 0],
      leftShoulder: [-0.85, 0, 0.65],
    }),
  },
  {
    t: 0.84,
    tori: makePose([0, 0.70, 0.02], [0.78, Math.PI + 0.18, 0], {
      spine: [0.32, 0.12, 0],
      leftShoulder: [-1.05, 0.2, 0.22],
      rightShoulder: [-1.28, 0.15, -0.20],
      leftHip: [-0.64, 0.08, 0.18],
      leftKnee: [1.14, 0, 0],
      rightHip: [-0.60, -0.08, -0.18],
      rightKnee: [1.08, 0, 0],
    }),
    uke: makePose([-0.06, 0.62, -0.88], [3.88, Math.PI + 0.22, -0.14], {
      head: [0.38, 0, 0],
      leftShoulder: [-0.26, 0, 0.92],
      leftElbow: [-0.15, 0, 0],
      leftHip: [-0.50, 0, 0.18],
      leftKnee: [0.85, 0, 0],
    }),
  },
  // Ukemi flat on BACK!
  {
    t: 0.92,
    impact: 1.0,
    tori: makePose([0, 0.76, 0.08], [0.52, Math.PI + 0.20, 0], {
      spine: [0.22, 0.10, 0],
      leftShoulder: [-0.95, 0.15, 0.18],
      rightShoulder: [-1.05, 0.15, -0.18],
      leftHip: [-0.52, 0.08, 0.18],
      leftKnee: [0.90, 0, 0],
      rightHip: [-0.48, -0.08, -0.18],
      rightKnee: [0.84, 0, 0],
    }),
    uke: makePose([-0.10, 0.18, -1.06], [4.72, Math.PI + 0.22, -0.12], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.16, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.75, 0, -0.32],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([0, 0.80, 0.08], [0.36, Math.PI + 0.20, 0], {
      spine: [0.16, 0.08, 0],
      leftShoulder: [-0.90, 0.1, 0.16],
      rightShoulder: [-0.92, 0.1, -0.16],
      leftHip: [-0.40, 0.08, 0.16],
      leftKnee: [0.72, 0, 0],
      rightHip: [-0.36, -0.08, -0.16],
      rightKnee: [0.66, 0, 0],
    }),
    uke: makePose([-0.10, 0.18, -1.06], [4.72, Math.PI + 0.22, -0.12], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.16, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.75, 0, -0.32],
      leftHip: [-0.55, 0, 0.20],
      leftKnee: [0.95, 0, 0],
      rightHip: [-0.30, 0, -0.14],
      rightKnee: [0.42, 0, 0],
    }),
  },
];

// ============================================================================
// 10. TOMOE-NAGE (Circle Sacrifice Throw) — Overhead launch onto BACK!
// ============================================================================
const tomoeNageKeyframes: ActorKeyframe[] = [
  {
    t: 0.0,
    tori: makePose([0, 0.88, -0.44], [0, 0, 0]),
    uke: makePose([0, 0.88, 0.44], [0, Math.PI, 0]),
  },
  {
    t: 0.18,
    tori: makePose([0, 0.86, -0.38], [0.05, 0, 0], {
      leftShoulder: [-1.05, 0.1, 0.15],
      rightShoulder: [-1.05, -0.1, -0.15],
    }),
    uke: makePose([0, 0.88, 0.38], [0.06, Math.PI, 0]),
  },
  // Kuzushi: Tori steps forward then drops hips low while pulling Uke forward over toes
  {
    t: 0.36,
    tori: makePose([0, 0.56, -0.12], [-0.45, 0, 0], {
      spine: [0.18, 0, 0],
      head: [0.28, 0, 0],
      leftShoulder: [-1.15, 0.15, 0.18],
      leftElbow: [-0.85, 0, 0],
      rightShoulder: [-1.15, -0.15, -0.18],
      rightElbow: [-0.85, 0, 0],
      leftHip: [-1.05, 0.05, 0.12], // sliding left heel close to Uke
      leftKnee: [1.55, 0, 0],
      rightHip: [-1.35, 0, -0.05], // raising right foot to Uke's belt!
      rightKnee: [1.15, 0, 0],
      rightAnkle: [-0.35, 0, 0],
    }),
    uke: makePose([0, 0.88, 0.22], [0.35, Math.PI, 0], {
      spine: [0.16, 0, 0],
      leftAnkle: [0.22, 0, 0],
      rightAnkle: [0.22, 0, 0],
      leftShoulder: [-1.05, 0, 0.2],
      rightShoulder: [-1.05, 0, -0.2],
    }),
  },
  // Tsukuri: Tori rolls onto BACK (-1.52 rad), plants right foot in Uke's lower abdomen
  {
    t: 0.56,
    tori: makePose([0, 0.19, -0.04], [-1.52, 0, 0], {
      spine: [0.15, 0, 0],
      head: [0.38, 0, 0],
      leftShoulder: [-0.85, 0.1, 0.2],
      leftElbow: [-0.95, 0, 0],
      rightShoulder: [-0.85, -0.1, -0.2],
      rightElbow: [-0.95, 0, 0],
      leftHip: [-0.65, 0.05, 0.16],
      leftKnee: [1.15, 0, 0],
      rightHip: [-0.32, 0, 0],
      rightKnee: [1.05, 0, 0],
    }),
    uke: makePose([0, 1.02, 0.12], [1.05, Math.PI, 0], {
      spine: [0.20, 0, 0],
      leftShoulder: [-1.15, 0, 0.25],
      rightShoulder: [-1.15, 0, -0.25],
      leftHip: [-0.25, 0, 0.14],
      leftKnee: [0.35, 0, 0],
      rightHip: [-0.25, 0, -0.14],
      rightKnee: [0.35, 0, 0],
    }),
  },
  // Kake: Tori extends right leg upward, catapulting Uke cleanly overhead!
  {
    t: 0.72,
    tori: makePose([0, 0.19, -0.04], [-1.56, 0, 0], {
      spine: [0.12, 0, 0],
      head: [0.38, 0, 0],
      leftShoulder: [-0.45, 0, 0.35],
      leftElbow: [-0.85, 0, 0],
      rightShoulder: [-0.45, 0, -0.35],
      rightElbow: [-0.85, 0, 0],
      leftHip: [-0.55, 0.05, 0.18],
      leftKnee: [1.05, 0, 0],
      rightHip: [0.22, 0, 0],
      rightKnee: [0.06, 0, 0],
      rightAnkle: [-0.25, 0, 0],
    }),
    uke: makePose([0, 1.48, -0.56], [2.75, Math.PI, 0], {
      spine: [0.18, 0, 0],
      head: [0.35, 0, 0],
      leftHip: [-0.42, 0, 0.16],
      leftKnee: [0.55, 0, 0],
      rightHip: [-0.38, 0, -0.16],
      rightKnee: [0.50, 0, 0],
      leftShoulder: [-0.65, 0, 0.85],
      rightShoulder: [-0.65, 0, -0.85],
    }),
  },
  // Uke arcs down back-first well beyond Tori's head
  {
    t: 0.84,
    tori: makePose([0, 0.19, -0.02], [-1.52, 0, 0], {
      spine: [0.15, 0, 0],
      head: [0.38, 0, 0],
      leftShoulder: [-0.40, 0, 0.35],
      rightShoulder: [-0.40, 0, -0.35],
      leftHip: [-0.65, 0.05, 0.18],
      leftKnee: [1.15, 0, 0],
      rightHip: [-0.15, 0, -0.12],
      rightKnee: [0.45, 0, 0],
    }),
    uke: makePose([0, 0.64, -1.24], [4.05, Math.PI, 0], {
      head: [0.40, 0, 0],
      leftShoulder: [-0.25, 0, 0.92],
      rightShoulder: [-0.25, 0, -0.92],
      leftHip: [-0.52, 0, 0.18],
      leftKnee: [0.78, 0, 0],
      rightHip: [-0.52, 0, -0.18],
      rightKnee: [0.78, 0, 0],
    }),
  },
  // Ukemi impact: Uke flat on BACK well beyond Tori!
  {
    t: 0.92,
    impact: 1.0,
    tori: makePose([0, 0.22, 0.0], [-1.28, 0, 0], {
      spine: [0.22, 0, 0],
      head: [0.36, 0, 0],
      leftShoulder: [-0.75, 0, 0.25],
      rightShoulder: [-0.75, 0, -0.25],
      leftHip: [-0.75, 0.05, 0.18],
      leftKnee: [1.25, 0, 0],
      rightHip: [-0.35, 0, -0.14],
      rightKnee: [0.75, 0, 0],
    }),
    uke: makePose([0, 0.17, -1.52], [4.71, Math.PI, 0], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.15, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.15, 0, -0.95],
      rightElbow: [-0.08, 0, 0],
      leftHip: [-0.50, 0, 0.18],
      leftKnee: [0.75, 0, 0],
      rightHip: [-0.48, 0, -0.18],
      rightKnee: [0.72, 0, 0],
    }),
  },
  {
    t: 1.0,
    tori: makePose([0, 0.26, 0.02], [-1.08, 0, 0], {
      spine: [0.26, 0, 0],
      head: [0.32, 0, 0],
      leftShoulder: [-0.82, 0, 0.22],
      rightShoulder: [-0.82, 0, -0.22],
      leftHip: [-0.82, 0.05, 0.18],
      leftKnee: [1.35, 0, 0],
      rightHip: [-0.45, 0, -0.14],
      rightKnee: [0.85, 0, 0],
    }),
    uke: makePose([0, 0.17, -1.52], [4.71, Math.PI, 0], {
      spine: [0.06, 0, 0],
      head: [0.44, 0, 0],
      leftShoulder: [-0.15, 0, 0.95],
      leftElbow: [-0.08, 0, 0],
      rightShoulder: [-0.15, 0, -0.95],
      rightElbow: [-0.08, 0, 0],
      leftHip: [-0.50, 0, 0.18],
      leftKnee: [0.75, 0, 0],
      rightHip: [-0.48, 0, -0.18],
      rightKnee: [0.72, 0, 0],
    }),
  },
];

// ============================================================================
// TECHNIQUE CATALOG (10 Authentic Throws)
// ============================================================================
export const TECHNIQUES: TechniqueSpec[] = [
  {
    id: 'o-goshi',
    name: 'O-goshi',
    english: 'Major Hip Throw',
    kanji: '大腰',
    category: 'Koshi-waza',
    beltLevel: 'Yellow Belt · 5th Kyu',
    durationSec: 4.2,
    summary:
      'Tori breaks Uke’s balance forward, turns 180° to fit the hip directly beneath Uke’s center of gravity while wrapping an arm around the waist, and throws Uke cleanly onto their back.',
    keyPrinciple: 'Drop your belt line below Uke’s belt line before rotating — lift with your legs, never your lower back.',
    commonMistake: 'Leaving space between the hips or standing upright during entry, forcing an arm-only pull.',
    kuzushiLabel: 'Forward & Upward Pull',
    kuzushiVector: [0.1, 0.45, -1.0],
    phases: buildPhases({
      kumikata: {
        cue: 'Establish a relaxed right-sided sleeve and lapel grip with elbows slightly bent.',
        tori: 'Left hand controls Uke’s right sleeve (hikite); right hand holds the left lapel.',
        uke: 'Natural posture (shizentai), weight balanced evenly over both arches.',
      },
      kuzushi: {
        cue: 'Pull Uke forward and slightly upward onto the balls of their feet to break posture.',
        tori: 'Release the lapel grip as you pull forward, opening space for your hip entry.',
        uke: 'Heels lift slightly as center of mass shifts ahead of the toes.',
      },
      tsukuri: {
        cue: 'Pivot 180° on the ball of the foot, dropping knees deep and wrapping the waist.',
        tori: 'Right arm hugs firmly around Uke’s belt line; hips seat slightly past Uke’s center.',
        uke: 'Torso drapes snugly onto Tori’s lower back with weight completely loaded.',
      },
      kake: {
        cue: 'Extend both knees explosively while twisting the shoulders and pulling the sleeve down.',
        tori: 'Look toward your throwing shoulder to complete the rotational arc.',
        uke: 'Rotates smoothly across Tori’s hip axis onto their back.',
      },
      ukemi: {
        cue: 'Tuck the chin and slap the tatami at 35° while landing cleanly on the back.',
        tori: 'Maintain control of the sleeve grip in balanced standing posture (zanshin).',
        uke: 'Back and shoulder blade contact the mat; left arm slaps tatami cleanly.',
      },
    }),
    keyframes: oGoshiKeyframes,
  },
  {
    id: 'ippon-seoi-nage',
    name: 'Ippon Seoi-nage',
    english: 'One-Arm Shoulder Throw',
    kanji: '一本背負投',
    category: 'Te-waza',
    beltLevel: 'Orange Belt · 4th Kyu',
    durationSec: 4.0,
    summary:
      'Tori pulls Uke high onto their toes, pivots beneath Uke’s right arm to clamp it tightly over the shoulder, and projects Uke forward onto their back.',
    keyPrinciple: 'Pin Uke’s armpit tight to your shoulder so there is zero gap — your forearm acts as a fulcrum.',
    commonMistake: 'Dropping too far away from Uke or pulling the elbow down before turning the hips.',
    kuzushiLabel: 'High Front-Corner Pull',
    kuzushiVector: [0.15, 0.65, -1.0],
    phases: buildPhases({
      kumikata: {
        cue: 'Take standard sleeve-and-lapel grip while keeping shoulders loose.',
        tori: 'Monitor Uke’s posture through light wrist tension.',
        uke: 'Maintains upright posture with balanced foot spacing.',
      },
      kuzushi: {
        cue: 'Drive Uke upward onto their toes by lifting both hands toward the ceiling.',
        tori: 'Step forward inside Uke’s stance to create an opening under the right arm.',
        uke: 'Posture rises involuntarily, exposing the underarm space.',
      },
      tsukuri: {
        cue: 'Pivot 180°, drop deeply into a low squat, and clamp Uke’s right arm over your shoulder.',
        tori: 'Keep your back straight and chest proud while locking Uke’s arm into the elbow crook.',
        uke: 'Chest presses tight against Tori’s upper back; feet lose traction.',
      },
      kake: {
        cue: 'Spring upward through the knees and fold the upper body forward toward the mat.',
        tori: 'Drive hips back slightly as shoulders rotate down, launching Uke over the shoulder.',
        uke: 'Arcs high over Tori’s back and rotates cleanly onto their back.',
      },
      ukemi: {
        cue: 'Follow the arc cleanly onto the back while Tori keeps the sleeve.',
        tori: 'Hold balanced base to prevent rolling after the throw.',
        uke: 'Chin tucked to chest; shoulder blade and back meet tatami as palm slaps.',
      },
    }),
    keyframes: ipponSeoiKeyframes,
  },
  {
    id: 'o-soto-gari',
    name: 'O-soto-gari',
    english: 'Major Outer Reap',
    kanji: '大外刈',
    category: 'Ashi-waza',
    beltLevel: 'Yellow Belt · 5th Kyu',
    durationSec: 3.9,
    summary:
      'Tori drives Uke’s weight onto their rear right heel, steps alongside with the left foot, and reaps Uke’s right leg backward onto their back.',
    keyPrinciple: 'Load 100% of Uke’s weight onto the target leg first — you cannot reap a leg that has no weight on it.',
    commonMistake: 'Reaching with the reaping leg before breaking Uke’s posture backward onto the heel.',
    kuzushiLabel: 'Rear-Right Corner Drive',
    kuzushiVector: [0.35, -0.1, 1.0],
    phases: buildPhases({
      kumikata: {
        cue: 'Establish firm sleeve and high lapel control for chest-to-chest connection.',
        tori: 'Keep the right forearm angled to drive through Uke’s collar.',
        uke: 'Stands upright facing Tori.',
      },
      kuzushi: {
        cue: 'Push and turn Uke backward toward their right rear corner until the heel bears all weight.',
        tori: 'Step your left foot outside Uke’s right foot, parallel and slightly ahead.',
        uke: 'Spine arches backward; left foot becomes light as weight locks onto the right heel.',
      },
      tsukuri: {
        cue: 'Bring chest close to Uke’s right shoulder and swing your reaping leg forward.',
        tori: 'Cock the right leg high in front with pointed toes before accelerating backward.',
        uke: 'Trapped on a single weighted leg with zero rear support.',
      },
      kake: {
        cue: 'Whip the reaping leg sharply backward behind Uke’s thigh while driving your chest forward.',
        tori: 'Thigh-to-thigh contact sweeps Uke’s leg upward as both hands drive down.',
        uke: 'Swept leg rises off the mat; torso tips backward.',
      },
      ukemi: {
        cue: 'Execute back breakfall (ushiro-ukemi) with both arms slapping the tatami.',
        tori: 'Maintain upright balance over your supporting left leg.',
        uke: 'Lands flat on back with chin tucked; both palms strike mat at 40°.',
      },
    }),
    keyframes: oSotoGariKeyframes,
  },
  {
    id: 'de-ashi-harai',
    name: 'De-ashi-harai',
    english: 'Advancing Foot Sweep',
    kanji: '出足払',
    category: 'Ashi-waza',
    beltLevel: 'Yellow Belt · 5th Kyu',
    durationSec: 3.6,
    summary:
      'As Uke steps laterally or forward, Tori catches the advancing foot just before weight settles on it, sweeping the ankle across so Uke lands on their back-side.',
    keyPrinciple: 'Timing is everything — sweep the instant Uke’s heel touches or right before weight lands.',
    commonMistake: 'Kicking the shin instead of sweeping smoothly with the sole of the foot.',
    kuzushiLabel: 'Lateral Steering Wheel',
    kuzushiVector: [0.85, -0.25, -0.35],
    phases: buildPhases({
      kumikata: {
        cue: 'Soft, sensitive grips allow you to feel every shift in Uke’s footwork.',
        tori: 'Move rhythmically side-to-side to induce Uke’s step.',
        uke: 'Steps laterally to match Tori’s movement.',
      },
      kuzushi: {
        cue: 'Lead Uke into a forward-lateral step while rotating the shoulders slightly.',
        tori: 'Turn the sleeve hand downward and lift the lapel hand as Uke’s foot glides.',
        uke: 'Right leg advances unweighted toward Tori.',
      },
      tsukuri: {
        cue: 'Turn your left ankle inward so the sole cups the outside of Uke’s right ankle.',
        tori: 'Keep your supporting right knee slightly bent for balance and reach.',
        uke: 'Advancing foot is suspended inches above the mat.',
      },
      kake: {
        cue: 'Sweep smoothly along the tatami surface while snapping the steering-wheel hands.',
        tori: 'Follow through across your centerline, lifting Uke’s foot sideways.',
        uke: 'Foot is swept out from underneath before weight can transfer.',
      },
      ukemi: {
        cue: 'Uke rolls onto the upper back and shoulder blade cleanly beside Tori.',
        tori: 'Stay upright and balanced without leaning backward.',
        uke: 'Right arm slaps tatami cleanly as back contacts mat.',
      },
    }),
    keyframes: deAshiHaraiKeyframes,
  },
  {
    id: 'uchi-mata',
    name: 'Uchi-mata',
    english: 'Inner Thigh Throw',
    kanji: '内股',
    category: 'Ashi-waza',
    beltLevel: 'Green Belt · 3rd Kyu',
    durationSec: 4.1,
    summary:
      'Tori pulls Uke forward into a wide stance, pivots onto one supporting foot between Uke’s legs, and sweeps Uke’s inner thigh skyward to throw Uke onto their back.',
    keyPrinciple: 'Your body works like a seesaw — as your head goes down toward the mat, your sweeping leg rises high.',
    commonMistake: 'Sweeping backward without dropping the chest, which stalls leg elevation.',
    kuzushiLabel: 'Circular Forward Pull',
    kuzushiVector: [0.35, 0.3, -1.0],
    phases: buildPhases({
      kumikata: {
        cue: 'Active sleeve-and-lapel grip with strong elbow mobility.',
        tori: 'Create circular movement to force Uke into a wide defensive stance.',
        uke: 'Steps wide to resist forward pull.',
      },
      kuzushi: {
        cue: 'Pull Uke forward in a circular arc so their weight shifts onto the front toes.',
        tori: 'Draw Uke’s upper body over your center while opening space between their legs.',
        uke: 'Leans forward with widened feet.',
      },
      tsukuri: {
        cue: 'Plant your left supporting foot centrally between Uke’s feet and align your hips.',
        tori: 'Right thigh chambers cleanly toward Uke’s inner left thigh.',
        uke: 'Trapped forward with heels light.',
      },
      kake: {
        cue: 'Tip your chest sharply toward the mat while driving your right leg high upward.',
        tori: 'Pull the sleeve hand across your hip to rotate Uke cleanly over.',
        uke: 'Lifted high off the tatami and turned onto their back.',
      },
      ukemi: {
        cue: 'Complete the rotation onto the back with a crisp breakfall.',
        tori: 'Recover stance cleanly after follow-through.',
        uke: 'Back lands squarely on tatami; left palm slaps mat cleanly.',
      },
    }),
    keyframes: uchiMataKeyframes,
  },
  {
    id: 'tai-otoshi',
    name: 'Tai-otoshi',
    english: 'Body Drop',
    kanji: '体落',
    category: 'Te-waza',
    beltLevel: 'Orange Belt · 4th Kyu',
    durationSec: 3.9,
    summary:
      'Tori pulls Uke forward onto their toes, drops into a wide low stance with the right leg extended across Uke’s ankle, and snaps both hands downward to roll Uke onto their back.',
    keyPrinciple: 'Tai-otoshi is a hand throw, not a leg sweep — pull Uke forward first, then drop your weight sharply.',
    commonMistake: 'Trying to lift Uke with the blocking calf instead of dropping the body and driving the hands.',
    kuzushiLabel: 'Forward-Right Snap',
    kuzushiVector: [0.45, 0.25, -1.0],
    phases: buildPhases({
      kumikata: {
        cue: 'Maintain active wrist tension on both lapel and sleeve.',
        tori: 'Keep elbows inside so your lapel forearm can drive across Uke’s chest.',
        uke: 'Balanced square stance.',
      },
      kuzushi: {
        cue: 'Pull Uke decisively toward their front-right corner until heels clear the mat.',
        tori: 'Step across to create space for your wide low entry.',
        uke: 'Pulled onto toes with upper body pitched forward.',
      },
      tsukuri: {
        cue: 'Pivot into a wide, low stance and extend your right leg across Uke’s right ankle.',
        tori: 'Turn your right knee slightly downward for safety; weight sits 60/40 toward the front foot.',
        uke: 'Forward momentum carries body directly over Tori’s extended shin.',
      },
      kake: {
        cue: 'Drop your hips sharply and snap both hands downward toward the tatami.',
        tori: 'Drive the lapel forearm forward and yank the sleeve straight down.',
        uke: 'Trips cleanly over Tori’s ankle and flips onto their back.',
      },
      ukemi: {
        cue: 'Uke lands cleanly on their back in front of Tori.',
        tori: 'Hold low balanced base with eyes on Uke.',
        uke: 'Tucks chin and slaps mat with extended left arm.',
      },
    }),
    keyframes: taiOtoshiKeyframes,
  },
  {
    id: 'harai-goshi',
    name: 'Harai-goshi',
    english: 'Sweeping Hip Throw',
    kanji: '払腰',
    category: 'Koshi-waza',
    beltLevel: 'Green Belt · 3rd Kyu',
    durationSec: 4.1,
    summary:
      'Tori pulls Uke forward onto their hip, keeps a tight high collar grip, and sweeps the right leg firmly backward across Uke’s thigh to launch them onto their back.',
    keyPrinciple: 'Load Uke onto your hip first, then sweep straight back through the thigh — not sideways.',
    commonMistake: 'Sweeping before Uke’s weight is pulled forward onto the supporting hip.',
    kuzushiLabel: 'High Forward Collar Pull',
    kuzushiVector: [0.25, 0.55, -1.0],
    phases: buildPhases({
      kumikata: {
        cue: 'High collar and sleeve grip for immediate upper-body control.',
        tori: 'Keep your right elbow high and close to Uke’s collarbone.',
        uke: 'Balanced shizentai posture.',
      },
      kuzushi: {
        cue: 'Pull Uke forward and up onto their right front corner.',
        tori: 'Step across with the left foot while driving the collar hand upward.',
        uke: 'Heels rise off the mat; chest leans forward.',
      },
      tsukuri: {
        cue: 'Pivot onto the left leg, load Uke’s waist on your hip, and chamber your right leg.',
        tori: 'Keep supporting knee bent and chest tightly sealed against Uke.',
        uke: 'Weight rests entirely across Tori’s right hip.',
      },
      kake: {
        cue: 'Sweep the right leg powerfully backward while twisting your shoulders down.',
        tori: 'Drive through the back of your thigh while pulling the sleeve across.',
        uke: 'Lifted and turned sharply over the hip.',
      },
      ukemi: {
        cue: 'Land squarely on the upper back with a crisp side-arm breakfall.',
        tori: 'Maintain sleeve control in stable standing posture.',
        uke: 'Back hits mat cleanly; left palm strikes tatami.',
      },
    }),
    keyframes: haraiGoshiKeyframes,
  },
  {
    id: 'o-uchi-gari',
    name: 'O-uchi-gari',
    english: 'Major Inner Reap',
    kanji: '大内刈',
    category: 'Ashi-waza',
    beltLevel: 'Yellow Belt · 5th Kyu',
    durationSec: 3.8,
    summary:
      'Tori steps inside Uke’s stance, drives Uke’s weight backward onto their left heel, and hooks the inner thigh in a wide circular sweep to drop Uke flat on their back.',
    keyPrinciple: 'Drive your chest forward as your foot sweeps in a large semicircle on the mat — keep your head up.',
    commonMistake: 'Looking down at Uke’s foot and bending at the waist, which kills forward drive.',
    kuzushiLabel: 'Rear-Left Heel Drive',
    kuzushiVector: [-0.3, -0.15, 1.0],
    phases: buildPhases({
      kumikata: {
        cue: 'Close chest-to-chest grip with active lapel pressure.',
        tori: 'Pull Uke forward slightly to set up the step-in.',
        uke: 'Widens stance slightly to steady balance.',
      },
      kuzushi: {
        cue: 'Drive Uke backward onto their left heel while stepping deep between their feet.',
        tori: 'Use your chest and both arms to pin Uke’s upper body backward.',
        uke: 'Weight locks onto the left heel; right foot goes light.',
      },
      tsukuri: {
        cue: 'Reach your right leg inside and hook the calf behind Uke’s left knee.',
        tori: 'Point your toes down so the Achilles tendon catches cleanly.',
        uke: 'Left leg is pinned in place with zero backward base.',
      },
      kake: {
        cue: 'Sweep Uke’s left leg outward in a wide circle while driving your chest forward.',
        tori: 'Keep spine tall and follow through cleanly between Uke’s legs.',
        uke: 'Swept leg flies out as torso falls straight back.',
      },
      ukemi: {
        cue: 'Execute clean back breakfall with both arms slapping the mat.',
        tori: 'Hold balanced base above Uke without falling forward.',
        uke: 'Lands flat on back with chin tucked tightly.',
      },
    }),
    keyframes: oUchiGariKeyframes,
  },
  {
    id: 'morote-seoi-nage',
    name: 'Morote Seoi-nage',
    english: 'Two-Arm Shoulder Throw',
    kanji: '双手背負投',
    category: 'Te-waza',
    beltLevel: 'Green Belt · 3rd Kyu',
    durationSec: 4.0,
    summary:
      'Keeping both the sleeve and lapel grip, Tori drops into a deep squat, wedges the lapel elbow vertically under Uke’s armpit, and throws Uke overhead onto their back.',
    keyPrinciple: 'Keep your lapel wrist straight and wedge the elbow straight up under Uke’s shoulder, not sideways.',
    commonMistake: 'Letting the lapel elbow flare out behind you, which strains the shoulder and loses lift.',
    kuzushiLabel: 'Vertical Two-Hand Lift',
    kuzushiVector: [0.1, 0.7, -1.0],
    phases: buildPhases({
      kumikata: {
        cue: 'Standard sleeve and mid-lapel grip with relaxed wrists.',
        tori: 'Prepare to fold the right forearm beneath Uke’s armpit.',
        uke: 'Upright stance facing Tori.',
      },
      kuzushi: {
        cue: 'Lift both hands strongly forward and up to elevate Uke onto their toes.',
        tori: 'Create vertical space beneath Uke’s chest.',
        uke: 'Stretched upward with heels off the mat.',
      },
      tsukuri: {
        cue: 'Pivot 180° into a deep squat while tucking the right elbow tightly under Uke’s armpit.',
        tori: 'Keep back upright and hips lower than Uke’s knees.',
        uke: 'Torso seals completely onto Tori’s upper back.',
      },
      kake: {
        cue: 'Drive upward through the legs and pull both hands down toward your opposite foot.',
        tori: 'Rotate shoulders forward while straightening knees.',
        uke: 'Launched overhead in a clean forward arc onto their back.',
      },
      ukemi: {
        cue: 'Uke lands squarely on their back with a sharp tatami slap.',
        tori: 'Maintain sleeve control in stable kneeling/standing recovery.',
        uke: 'Chin tucked; back meets mat cleanly.',
      },
    }),
    keyframes: moroteSeoiKeyframes,
  },
  {
    id: 'tomoe-nage',
    name: 'Tomoe-nage',
    english: 'Circle Sacrifice Throw',
    kanji: '巴投',
    category: 'Sutemi-waza',
    beltLevel: 'Blue Belt · 2nd Kyu',
    durationSec: 4.3,
    summary:
      'Tori slides beneath Uke’s center of gravity, rolls onto their own back, plants a foot into Uke’s lower abdomen, and catapults Uke overhead in a soaring arc onto their back.',
    keyPrinciple: 'Slide your hips all the way underneath Uke — if you sit down too far away, you cannot lift them.',
    commonMistake: 'Kicking Uke backward instead of pulling them forward over your head first.',
    kuzushiLabel: 'Deep Forward Pull-Under',
    kuzushiVector: [0.0, 0.25, -1.0],
    phases: buildPhases({
      kumikata: {
        cue: 'Firm double-lapel or high collar-and-sleeve grip to control Uke’s forward momentum.',
        tori: 'Keep elbows bent to pull Uke straight over your center.',
        uke: 'Steps forward to resist or close distance.',
      },
      kuzushi: {
        cue: 'Pull Uke decisively forward onto their toes as you slide your left foot right between theirs.',
        tori: 'Drop your hips low to the tatami right beneath Uke’s belt.',
        uke: 'Pitches forward over Tori’s dropping center.',
      },
      tsukuri: {
        cue: 'Roll smoothly onto your back and place the ball of your right foot against Uke’s lower abdomen.',
        tori: 'Keep your right knee bent and loaded like a coiled spring.',
        uke: 'Suspended directly above Tori’s chest with zero foot traction.',
      },
      kake: {
        cue: 'Extend your right leg skyward while pulling both arms past your head.',
        tori: 'Guide Uke straight overhead rather than kicking them away.',
        uke: 'Soars in a high circular arc over Tori.',
      },
      ukemi: {
        cue: 'Uke lands flat on their back beyond Tori in a full ushiro-ukemi.',
        tori: 'Tuck chin and keep grip ready to follow through into mount/control.',
        uke: 'Lands cleanly on back with both arms slapping the mat.',
      },
    }),
    keyframes: tomoeNageKeyframes,
  },
];

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'side',
    label: 'Side Study',
    position: [3.2, 1.65, 0.35],
    target: [0, 0.85, 0],
  },
  {
    id: 'front',
    label: 'Front Angle',
    position: [0.25, 1.55, 3.3],
    target: [0, 0.85, 0],
  },
  {
    id: 'overhead',
    label: 'Overhead',
    position: [0.05, 4.3, 0.8],
    target: [0, 0.4, 0],
  },
  {
    id: 'footwork',
    label: 'Footwork Low',
    position: [2.35, 0.42, 1.65],
    target: [0, 0.38, 0],
  },
  {
    id: 'tori',
    label: 'Behind Tori',
    position: [-1.45, 1.85, -2.55],
    target: [0, 0.85, 0.15],
  },
];

function smoothTangent(
  p0: number,
  p1: number,
  p2: number,
  dtPrev: number,
  dtNext: number,
): number {
  const v0 = (p1 - p0) / dtPrev;
  const v1 = (p2 - p1) / dtNext;
  // Weighted average across uneven keyframe intervals for constant-momentum flow
  const w0 = dtNext / (dtPrev + dtNext);
  const w1 = dtPrev / (dtPrev + dtNext);
  return (v0 * w0 + v1 * w1) * 0.92;
}

function catmullNonUniform(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  dt0: number,
  dt1: number,
  dt2: number,
  t: number,
): number {
  // Preserve exact hold frames (e.g. settled on mat at 0.92..1.00)
  if (Math.abs(p2 - p1) < 1e-5) {
    return p1;
  }

  const m1 = smoothTangent(p0, p1, p2, dt0, dt1) * dt1;
  const m2 = smoothTangent(p1, p2, p3, dt1, dt2) * dt1;
  const t2 = t * t;
  const t3 = t2 * t;
  const val =
    (2 * t3 - 3 * t2 + 1) * p1 +
    (t3 - 2 * t2 + t) * m1 +
    (-2 * t3 + 3 * t2) * p2 +
    (t3 - t2) * m2;

  // Gentle overshoot guard so body doesn't dip excessively past extreme stops
  const lo = Math.min(p1, p2);
  const hi = Math.max(p1, p2);
  const margin = (hi - lo) * 0.14;
  return Math.max(lo - margin, Math.min(hi + margin, val));
}

function interpTupleSmooth(
  a0: Vec3Tuple,
  a1: Vec3Tuple,
  a2: Vec3Tuple,
  a3: Vec3Tuple,
  dt0: number,
  dt1: number,
  dt2: number,
  t: number,
  out: Vec3Tuple,
) {
  out[0] = catmullNonUniform(a0[0], a1[0], a2[0], a3[0], dt0, dt1, dt2, t);
  out[1] = catmullNonUniform(a0[1], a1[1], a2[1], a3[1], dt0, dt1, dt2, t);
  out[2] = catmullNonUniform(a0[2], a1[2], a2[2], a3[2], dt0, dt1, dt2, t);
}

const JOINT_KEYS: Array<keyof JointPose> = [
  'pelvisPos',
  'pelvisRot',
  'spine',
  'chest',
  'head',
  'leftShoulder',
  'leftElbow',
  'rightShoulder',
  'rightElbow',
  'leftHip',
  'leftKnee',
  'leftAnkle',
  'rightHip',
  'rightKnee',
  'rightAnkle',
];

function createMutablePose(): JointPose {
  return {
    pelvisPos: [0, 0, 0],
    pelvisRot: [0, 0, 0],
    spine: [0, 0, 0],
    chest: [0, 0, 0],
    head: [0, 0, 0],
    leftShoulder: [0, 0, 0],
    leftElbow: [0, 0, 0],
    rightShoulder: [0, 0, 0],
    rightElbow: [0, 0, 0],
    leftHip: [0, 0, 0],
    leftKnee: [0, 0, 0],
    leftAnkle: [0, 0, 0],
    rightHip: [0, 0, 0],
    rightKnee: [0, 0, 0],
    rightAnkle: [0, 0, 0],
  };
}

const _toriOut = createMutablePose();
const _ukeOut = createMutablePose();
const _toriTap = createMutablePose();
const _ukeTap = createMutablePose();

function sampleRawPoseAt(
  tech: TechniqueSpec,
  progress: number,
  outTori: JointPose,
  outUke: JointPose,
) {
  const frames = tech.keyframes;
  const clamped = Math.max(0, Math.min(1, progress));

  let idx = 0;
  for (let i = 0; i < frames.length - 1; i++) {
    if (clamped >= frames[i].t && clamped <= frames[i + 1].t) {
      idx = i;
      break;
    }
  }

  const i0 = Math.max(0, idx - 1);
  const i1 = idx;
  const i2 = Math.min(frames.length - 1, idx + 1);
  const i3 = Math.min(frames.length - 1, idx + 2);

  const f0 = frames[i0];
  const f1 = frames[i1];
  const f2 = frames[i2];
  const f3 = frames[i3];

  const dt1 = Math.max(0.0001, f2.t - f1.t);
  const dt0 = i0 === i1 ? dt1 : Math.max(0.0001, f1.t - f0.t);
  const dt2 = i2 === i3 ? dt1 : Math.max(0.0001, f3.t - f2.t);
  const localT = Math.max(0, Math.min(1, (clamped - f1.t) / dt1));

  for (const key of JOINT_KEYS) {
    interpTupleSmooth(f0.tori[key], f1.tori[key], f2.tori[key], f3.tori[key], dt0, dt1, dt2, localT, outTori[key]);
    interpTupleSmooth(f0.uke[key], f1.uke[key], f2.uke[key], f3.uke[key], dt0, dt1, dt2, localT, outUke[key]);
  }
}

const SMOOTH_OFFSETS = [-0.026, -0.013, 0, 0.013, 0.026];
const SMOOTH_WEIGHTS = [0.11, 0.21, 0.36, 0.21, 0.11];

export function sampleTechniquePose(
  tech: TechniqueSpec,
  progress: number,
): { tori: JointPose; uke: JointPose } {
  const clamped = Math.max(0, Math.min(1, progress));

  // Taper Gaussian smoothing radius smoothly to 0 at timeline endpoints (0 and 1)
  const edgeFade =
    Math.min(1, clamped / 0.05) * Math.min(1, (1 - clamped) / 0.05);
  const radiusScale = edgeFade;

  if (radiusScale < 0.05) {
    sampleRawPoseAt(tech, clamped, _toriOut, _ukeOut);
  } else {
    for (const key of JOINT_KEYS) {
      _toriOut[key][0] = 0;
      _toriOut[key][1] = 0;
      _toriOut[key][2] = 0;
      _ukeOut[key][0] = 0;
      _ukeOut[key][1] = 0;
      _ukeOut[key][2] = 0;
    }

    for (let s = 0; s < SMOOTH_OFFSETS.length; s++) {
      const w = SMOOTH_WEIGHTS[s];
      const tapT = clamped + SMOOTH_OFFSETS[s] * radiusScale;
      sampleRawPoseAt(tech, tapT, _toriTap, _ukeTap);
      for (const key of JOINT_KEYS) {
        _toriOut[key][0] += _toriTap[key][0] * w;
        _toriOut[key][1] += _toriTap[key][1] * w;
        _toriOut[key][2] += _toriTap[key][2] * w;
        _ukeOut[key][0] += _ukeTap[key][0] * w;
        _ukeOut[key][1] += _ukeTap[key][1] * w;
        _ukeOut[key][2] += _ukeTap[key][2] * w;
      }
    }
  }

  _toriOut.pelvisPos[1] = Math.max(0.17, _toriOut.pelvisPos[1]);
  _ukeOut.pelvisPos[1] = Math.max(0.17, _ukeOut.pelvisPos[1]);

  return { tori: _toriOut, uke: _ukeOut };
}

export interface HandGripSample {
  toriLeftCurl: number;
  toriRightCurl: number;
  toriLeftSpread: number;
  toriRightSpread: number;
  toriLeftWrist: number;
  toriRightWrist: number;
  ukeLeftCurl: number;
  ukeRightCurl: number;
  ukeLeftSpread: number;
  ukeRightSpread: number;
  ukeLeftWrist: number;
  ukeRightWrist: number;
}

const _gripOut: HandGripSample = {
  toriLeftCurl: 0.9,
  toriRightCurl: 0.9,
  toriLeftSpread: 0.1,
  toriRightSpread: 0.1,
  toriLeftWrist: 0,
  toriRightWrist: 0,
  ukeLeftCurl: 0.85,
  ukeRightCurl: 0.85,
  ukeLeftSpread: 0.15,
  ukeRightSpread: 0.15,
  ukeLeftWrist: 0,
  ukeRightWrist: 0,
};

function smoothRange(t: number, a: number, b: number): number {
  const u = Math.max(0, Math.min(1, (t - a) / Math.max(0.0001, b - a)));
  return u * u * (3 - 2 * u);
}

/**
 * Computes realistic finger curl, splay, and wrist angles throughout each phase:
 * - Kumikata (0.00 - 0.14): fingers reach open then close tightly onto lapel/sleeve
 * - Kuzushi & Tsukuri (0.15 - 0.62): locked grips + active wrist twist/lift (seoi re-grip included)
 * - Kake (0.62 - 0.80): peak hikite pull; Uke's hand releases & splays for breakfall
 * - Ukemi & Zanshin (0.80 - 1.00): Uke slaps tatami flat-palmed while Tori holds sleeve control
 */
export function sampleHandGrips(techId: string, progress: number): HandGripSample {
  const p = Math.max(0, Math.min(1, progress));

  // Base kumikata lock-in at opening
  const gripEngage = smoothRange(p, 0.01, 0.11);
  // Uke releases and spreads fingers to perform open-palm ukemi mat slap
  const ukeRelease = smoothRange(p, 0.60, 0.78);
  // Tori softens collar grip slightly in final zanshin follow-through while retaining sleeve
  const zanshinEase = smoothRange(p, 0.82, 0.95);

  let toriLeftCurl = 0.25 + 0.69 * gripEngage - 0.08 * zanshinEase;
  let toriRightCurl = 0.22 + 0.70 * gripEngage - 0.45 * zanshinEase;
  let toriLeftWrist = -0.18 * smoothRange(p, 0.16, 0.65) + 0.24 * smoothRange(p, 0.65, 0.88);
  let toriRightWrist = -0.22 * smoothRange(p, 0.18, 0.62) + 0.12 * zanshinEase;

  // Technique-specific grip nuances (shoulder re-grip, belt wrap, double collar)
  if (techId === 'ippon-seoi-nage') {
    // Tori releases right lapel hand around t=0.28..0.46 to hook under Uke's upper arm, then clamps tight
    const releaseWave = Math.sin(smoothRange(p, 0.24, 0.50) * Math.PI);
    toriRightCurl = Math.max(0.28, toriRightCurl - 0.52 * releaseWave);
    toriRightWrist -= 0.28 * smoothRange(p, 0.44, 0.72);
  } else if (techId === 'o-goshi') {
    // Tori's right hand opens briefly to swim under Uke's armpit and grip the belt/back
    const swimWave = Math.sin(smoothRange(p, 0.22, 0.48) * Math.PI);
    toriRightCurl = Math.max(0.32, toriRightCurl - 0.46 * swimWave);
  } else if (techId === 'tomoe-nage') {
    // High double-lapel tension through sacrifice drop
    toriRightCurl = Math.min(0.96, toriRightCurl + 0.22 * zanshinEase);
    toriLeftWrist -= 0.22 * smoothRange(p, 0.45, 0.75);
  } else if (techId === 'tai-otoshi' || techId === 'morote-seoi-nage') {
    // Snapping tsurite wrist drive
    toriRightWrist -= 0.30 * smoothRange(p, 0.35, 0.68);
  }

  // Uke's left hand is the classic ukemi slap arm (stays open & flat for mat impact)
  // Uke's right hand grips Tori's lapel until kake, then flares open for balance
  const ukeLeftCurl = 0.22 + 0.62 * gripEngage - 0.80 * ukeRelease;
  const ukeRightCurl = 0.24 + 0.64 * gripEngage - 0.68 * smoothRange(p, 0.66, 0.86);

  _gripOut.toriLeftCurl = Math.max(0, Math.min(1, toriLeftCurl));
  _gripOut.toriRightCurl = Math.max(0, Math.min(1, toriRightCurl));
  _gripOut.toriLeftSpread = Math.max(0.05, 0.38 - 0.30 * gripEngage + 0.08 * zanshinEase);
  _gripOut.toriRightSpread = Math.max(0.05, 0.40 - 0.30 * gripEngage + 0.32 * zanshinEase);
  _gripOut.toriLeftWrist = toriLeftWrist;
  _gripOut.toriRightWrist = toriRightWrist;

  _gripOut.ukeLeftCurl = Math.max(0, Math.min(1, ukeLeftCurl));
  _gripOut.ukeRightCurl = Math.max(0, Math.min(1, ukeRightCurl));
  _gripOut.ukeLeftSpread = Math.max(0.08, 0.36 - 0.24 * gripEngage + 0.78 * ukeRelease);
  _gripOut.ukeRightSpread = Math.max(0.08, 0.36 - 0.24 * gripEngage + 0.56 * smoothRange(p, 0.66, 0.88));
  _gripOut.ukeLeftWrist = -0.20 * ukeRelease;
  _gripOut.ukeRightWrist = -0.14 * smoothRange(p, 0.66, 0.88);

  return _gripOut;
}

export function getPhaseAtProgress(tech: TechniqueSpec, progress: number): PhaseMarker {
  for (const p of tech.phases) {
    if (progress >= p.start && progress <= p.end) {
      return p;
    }
  }
  return tech.phases[tech.phases.length - 1];
}
