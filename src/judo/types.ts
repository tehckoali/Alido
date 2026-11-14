export type Vec3Tuple = [number, number, number];

export interface JointPose {
  /** Pelvis center position in world meters (ground is y = 0, standing pelvis ~0.92m) */
  pelvisPos: Vec3Tuple;
  /** Pelvis world rotation [rx, ry, rz] in radians (order YXZ for upright turns + tilts) */
  pelvisRot: Vec3Tuple;
  /** Lower-to-mid spine tilt/twist [rx, ry, rz] */
  spine: Vec3Tuple;
  /** Upper chest tilt/twist [rx, ry, rz] */
  chest: Vec3Tuple;
  /** Neck & head tilt/turn [rx, ry, rz] */
  head: Vec3Tuple;
  /** Left shoulder [rx, ry, rz] */
  leftShoulder: Vec3Tuple;
  /** Left elbow [rx, ry, rz] (rx negative = flex forward/up) */
  leftElbow: Vec3Tuple;
  /** Right shoulder [rx, ry, rz] */
  rightShoulder: Vec3Tuple;
  /** Right elbow [rx, ry, rz] */
  rightElbow: Vec3Tuple;
  /** Left hip [rx, ry, rz] (rx negative = flex leg forward) */
  leftHip: Vec3Tuple;
  /** Left knee [rx, ry, rz] (rx positive = flex knee backward) */
  leftKnee: Vec3Tuple;
  /** Left ankle [rx, ry, rz] */
  leftAnkle: Vec3Tuple;
  /** Right hip [rx, ry, rz] */
  rightHip: Vec3Tuple;
  /** Right knee [rx, ry, rz] */
  rightKnee: Vec3Tuple;
  /** Right ankle [rx, ry, rz] */
  rightAnkle: Vec3Tuple;
}

export interface ActorKeyframe {
  /** Normalized progress along technique timeline [0..1] */
  t: number;
  tori: JointPose;
  uke: JointPose;
  /** Optional mat-impact intensity [0..1] for ukemi audio & dust pulse */
  impact?: number;
}

export type PhaseId = 'kumikata' | 'kuzushi' | 'tsukuri' | 'kake' | 'ukemi';

export interface PhaseMarker {
  id: PhaseId;
  label: string;
  japanese: string;
  start: number;
  end: number;
  cue: string;
  toriFocus: string;
  ukeFocus: string;
}

export type TechniqueCategory = 'Koshi-waza' | 'Te-waza' | 'Ashi-waza' | 'Sutemi-waza';

export interface TechniqueSpec {
  id: string;
  name: string;
  english: string;
  kanji: string;
  category: TechniqueCategory;
  beltLevel: string;
  durationSec: number;
  summary: string;
  keyPrinciple: string;
  commonMistake: string;
  kuzushiLabel: string;
  /** Primary kuzushi pull vector in world space for overlay indicator */
  kuzushiVector: Vec3Tuple;
  phases: PhaseMarker[];
  keyframes: ActorKeyframe[];
}

export type CameraPresetId = 'side' | 'front' | 'overhead' | 'footwork' | 'tori';

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  position: Vec3Tuple;
  target: Vec3Tuple;
}
