import * as THREE from 'three';
import { JointPose } from './types';

export interface JudokaAppearance {
  name: 'tori' | 'uke';
  giMap: THREE.Texture;
  giBump: THREE.Texture;
  faceMap: THREE.Texture;
  skinDetailMap: THREE.Texture;
  hairMap: THREE.Texture;
  brandPatchMap: THREE.Texture;
  giTint: number;
  beltColor: number;
  skinColor: number;
  hairColor: number;
  scale?: number;
}

export type LandmarkKey =
  | 'com'
  | 'head'
  | 'chest'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftHand'
  | 'rightHand'
  | 'leftCollarAnchor'
  | 'rightSleeveAnchor'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftFoot'
  | 'rightFoot';

interface FingerJoint {
  proximal: THREE.Group;
  distal: THREE.Group;
  baseSpreadZ: number;
}

interface HandRig {
  wrist: THREE.Group;
  fingers: FingerJoint[];
  thumbProx: THREE.Group;
  thumbDist: THREE.Group;
}

const _tempVec = new THREE.Vector3();
const _rootWorld = new THREE.Vector3();
const _endWorld = new THREE.Vector3();
const _uVec = new THREE.Vector3();
const _vVec = new THREE.Vector3();
const _deltaWorldQ = new THREE.Quaternion();
const _parentWorldQ = new THREE.Quaternion();
const _parentInvQ = new THREE.Quaternion();
const _jointWorldQ = new THREE.Quaternion();

/**
 * Tailored kimono sleeve/trouser fabric tube using LatheGeometry
 * centered at the top joint (y = 0) extending downward to y = -length.
 */
function createGiTubeGeometry(
  topRadius: number,
  midRadius: number,
  bottomRadius: number,
  length: number,
  segments = 24,
): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.001, 0.015),
    new THREE.Vector2(topRadius * 0.92, 0.004),
    new THREE.Vector2(topRadius, -0.02),
    new THREE.Vector2(midRadius * 1.03, -length * 0.36),
    new THREE.Vector2(midRadius * 0.98, -length * 0.65),
    new THREE.Vector2(bottomRadius * 1.05, -length * 0.88),
    new THREE.Vector2(bottomRadius, -length),
    new THREE.Vector2(bottomRadius * 0.84, -length + 0.008),
    new THREE.Vector2(0.001, -length + 0.01),
  ];

  const geo = new THREE.LatheGeometry(pts, segments);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Muscular athletic forearm geometry (brachioradialis taper to wrist).
 */
function createAthleticForearmGeometry(length = 0.255): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.001, 0.014),
    new THREE.Vector2(0.043, 0.0),
    new THREE.Vector2(0.048, -length * 0.22),
    new THREE.Vector2(0.042, -length * 0.50),
    new THREE.Vector2(0.032, -length * 0.80),
    new THREE.Vector2(0.027, -length),
    new THREE.Vector2(0.001, -length),
  ];
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.scale(1.06, 1.0, 0.90);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Athletic V-taper torso/chest matching the reference judoka silhouette.
 */
function createSculptedTorsoGeometry(): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.001, -0.02),
    new THREE.Vector2(0.144, 0.0),
    new THREE.Vector2(0.154, 0.065),
    new THREE.Vector2(0.170, 0.135),
    new THREE.Vector2(0.188, 0.212),
    new THREE.Vector2(0.172, 0.256),
    new THREE.Vector2(0.095, 0.282),
    new THREE.Vector2(0.001, 0.290),
  ];
  const geo = new THREE.LatheGeometry(pts, 28);
  geo.scale(1.13, 1.0, 0.71);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpted human head (defined jaw, cheekbones, cranium) rotated so u=0.5 faces +Z cleanly.
 */
function createSculptedHeadGeometry(): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.001, -0.008),
    new THREE.Vector2(0.052, 0.006),
    new THREE.Vector2(0.073, 0.038),
    new THREE.Vector2(0.087, 0.078),
    new THREE.Vector2(0.094, 0.125),
    new THREE.Vector2(0.090, 0.174),
    new THREE.Vector2(0.066, 0.214),
    new THREE.Vector2(0.001, 0.228),
  ];
  const geo = new THREE.LatheGeometry(pts, 32);
  geo.scale(0.90, 1.0, 1.06);
  geo.rotateY(Math.PI);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpted barefoot geometry anchored at ankle (0,0,0), sole at y = -0.078, forefoot along +Z.
 */
function createFootGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.038, -0.058);
  shape.quadraticCurveTo(-0.044, 0.01, -0.036, 0.085);
  shape.quadraticCurveTo(-0.046, 0.145, -0.034, 0.182);
  shape.quadraticCurveTo(-0.012, 0.204, 0.018, 0.194);
  shape.quadraticCurveTo(0.042, 0.168, 0.042, 0.115);
  shape.quadraticCurveTo(0.040, 0.04, 0.036, -0.055);
  shape.quadraticCurveTo(0.0, -0.068, -0.038, -0.058);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.040,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.01,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, -0.025, 0);
  geo.computeVertexNormals();
  return geo;
}

export class JudokaRig {
  public readonly group = new THREE.Group();
  public readonly appearance: JudokaAppearance;

  // Articulated joint groups
  public readonly pelvis = new THREE.Group();
  public readonly spine = new THREE.Group();
  public readonly chest = new THREE.Group();
  public readonly neck = new THREE.Group();
  public readonly head = new THREE.Group();

  public readonly leftShoulder = new THREE.Group();
  public readonly leftElbow = new THREE.Group();
  public readonly leftHand = new THREE.Group();

  public readonly rightShoulder = new THREE.Group();
  public readonly rightElbow = new THREE.Group();
  public readonly rightHand = new THREE.Group();

  public readonly leftHip = new THREE.Group();
  public readonly leftKnee = new THREE.Group();
  public readonly leftAnkle = new THREE.Group();

  public readonly rightHip = new THREE.Group();
  public readonly rightKnee = new THREE.Group();
  public readonly rightAnkle = new THREE.Group();

  // Grip target anchors on the opponent's kimono for realistic kumikata alignment
  private readonly leftCollarAnchor = new THREE.Object3D();
  private readonly rightSleeveAnchor = new THREE.Object3D();

  private readonly leftHandRig: HandRig;
  private readonly rightHandRig: HandRig;
  private readonly beltTailLeft: THREE.Mesh;
  private readonly beltTailRight: THREE.Mesh;
  private readonly contactShadows: THREE.Mesh[] = [];
  private readonly disposables: Array<{ dispose: () => void }> = [];

  constructor(appearance: JudokaAppearance, contactShadowMap: THREE.Texture) {
    this.appearance = appearance;
    const scale = appearance.scale ?? 1.0;
    this.group.scale.setScalar(scale);
    this.group.name = `judoka_${appearance.name}`;

    // Heavyweight Sashiko cotton with natural sheen (matching reference photo weave)
    const giMat = new THREE.MeshPhysicalMaterial({
      color: appearance.giTint,
      map: appearance.giMap,
      bumpMap: appearance.giBump,
      bumpScale: 0.011,
      roughness: 0.86,
      metalness: 0.01,
      sheen: 0.52,
      sheenRoughness: 0.72,
      sheenColor: new THREE.Color(appearance.name === 'tori' ? 0xffffff : 0x6c9ce6),
    });

    const lapelMat = new THREE.MeshPhysicalMaterial({
      color: appearance.giTint,
      map: appearance.giMap,
      bumpMap: appearance.giBump,
      bumpScale: 0.015,
      roughness: 0.80,
      metalness: 0.02,
      sheen: 0.58,
      sheenRoughness: 0.68,
    });

    const beltMat = new THREE.MeshStandardMaterial({
      color: appearance.beltColor,
      bumpMap: appearance.giBump,
      bumpScale: 0.008,
      roughness: 0.72,
      metalness: 0.04,
    });

    const patchMat = new THREE.MeshStandardMaterial({
      map: appearance.brandPatchMap,
      roughness: 0.65,
    });

    const skinMat = new THREE.MeshPhysicalMaterial({
      color: appearance.name === 'tori' ? 0xfff5ed : 0xf6e8dc,
      map: appearance.skinDetailMap,
      roughness: 0.46,
      metalness: 0.01,
      clearcoat: 0.08,
      clearcoatRoughness: 0.62,
    });

    const faceMat = new THREE.MeshPhysicalMaterial({
      color: appearance.name === 'tori' ? 0xfff9f4 : 0xf5eae0,
      map: appearance.faceMap,
      roughness: 0.45,
      metalness: 0.01,
      clearcoat: 0.08,
      clearcoatRoughness: 0.65,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: appearance.hairColor,
      map: appearance.hairMap,
      roughness: 0.72,
      metalness: 0.04,
    });

    const cuffInnerMat = new THREE.MeshStandardMaterial({
      color: 0x16181e,
      roughness: 0.95,
    });

    this.disposables.push(
      giMat,
      lapelMat,
      beltMat,
      patchMat,
      skinMat,
      faceMat,
      hairMat,
      cuffInnerMat,
    );

    // 1. PELVIS, UWAGI SKIRT, RED BRAND LABEL & OBI BELT
    this.pelvis.rotation.order = 'YXZ';
    this.pelvis.position.set(0, 0.89, 0);
    this.group.add(this.pelvis);

    const pelvisGeo = new THREE.CylinderGeometry(0.154, 0.168, 0.16, 24);
    pelvisGeo.scale(1.12, 1.0, 0.78);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, giMat);
    pelvisMesh.position.y = -0.01;
    this.pelvis.add(pelvisMesh);

    const skirtGeo = new THREE.CylinderGeometry(0.158, 0.198, 0.22, 28);
    skirtGeo.scale(1.14, 1.0, 0.81);
    const skirtMesh = new THREE.Mesh(skirtGeo, giMat);
    skirtMesh.position.y = -0.075;
    this.pelvis.add(skirtMesh);

    // Woven red brand label near lower skirt corner (matching reference photo)
    const patchGeo = new THREE.PlaneGeometry(0.036, 0.042);
    const skirtPatch = new THREE.Mesh(patchGeo, patchMat);
    skirtPatch.position.set(-0.125, -0.14, 0.142);
    skirtPatch.rotation.set(0.12, -0.38, 0);
    this.pelvis.add(skirtPatch);

    // Obi Belt wrapped snugly around waist
    const beltGeo = new THREE.CylinderGeometry(0.165, 0.165, 0.046, 28);
    beltGeo.scale(1.13, 1.0, 0.79);
    const beltMesh = new THREE.Mesh(beltGeo, beltMat);
    beltMesh.position.y = 0.045;
    this.pelvis.add(beltMesh);

    const knotCoreGeo = new THREE.TorusGeometry(0.022, 0.016, 10, 16);
    knotCoreGeo.scale(1.25, 0.95, 0.85);
    const knotMesh = new THREE.Mesh(knotCoreGeo, beltMat);
    knotMesh.position.set(0, 0.045, 0.138);
    this.pelvis.add(knotMesh);

    // Hanging Belt Tails + red woven tip tag on right tail (matching reference photo)
    const tailGeo = new THREE.BoxGeometry(0.042, 0.24, 0.011);
    tailGeo.translate(0, -0.12, 0);
    this.beltTailLeft = new THREE.Mesh(tailGeo, beltMat);
    this.beltTailLeft.position.set(0.02, 0.035, 0.148);
    this.beltTailLeft.rotation.set(-0.20, 0.15, 0.30);
    this.pelvis.add(this.beltTailLeft);

    this.beltTailRight = new THREE.Mesh(tailGeo, beltMat);
    this.beltTailRight.position.set(-0.02, 0.035, 0.148);
    this.beltTailRight.rotation.set(-0.24, -0.16, -0.34);
    const beltTipPatch = new THREE.Mesh(new THREE.PlaneGeometry(0.034, 0.036), patchMat);
    beltTipPatch.position.set(0, -0.21, 0.0065);
    this.beltTailRight.add(beltTipPatch);
    this.pelvis.add(this.beltTailRight);

    this.disposables.push(
      pelvisGeo,
      skirtGeo,
      patchGeo,
      beltGeo,
      knotCoreGeo,
      tailGeo,
      beltTipPatch.geometry,
    );

    // 2. SPINE, CHEST, OVERLAPPING LAPELS & COLLAR GRIP ANCHOR
    this.spine.rotation.order = 'YXZ';
    this.spine.position.set(0, 0.06, 0);
    this.pelvis.add(this.spine);

    const waistGeo = new THREE.CylinderGeometry(0.156, 0.148, 0.16, 24);
    waistGeo.scale(1.11, 1.0, 0.74);
    const waistMesh = new THREE.Mesh(waistGeo, giMat);
    waistMesh.position.y = 0.08;
    this.spine.add(waistMesh);
    this.disposables.push(waistGeo);

    this.chest.rotation.order = 'YXZ';
    this.chest.position.set(0, 0.16, 0);
    this.spine.add(this.chest);

    const torsoGeo = createSculptedTorsoGeometry();
    const torsoMesh = new THREE.Mesh(torsoGeo, giMat);
    this.chest.add(torsoMesh);
    this.disposables.push(torsoGeo);

    // Overlapping Judogi Lapels (Left over Right)
    const lapelGeo = new THREE.CapsuleGeometry(0.023, 0.31, 6, 12);
    lapelGeo.scale(1.06, 1.0, 0.56);
    const leftLapel = new THREE.Mesh(lapelGeo, lapelMat);
    leftLapel.position.set(0.044, 0.132, 0.130);
    leftLapel.rotation.set(-0.15, 0.18, -0.35);
    this.chest.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, lapelMat);
    rightLapel.position.set(-0.044, 0.125, 0.122);
    rightLapel.rotation.set(-0.15, -0.18, 0.35);
    this.chest.add(rightLapel);

    // Rolled Collar (Eri)
    const collarGeo = new THREE.TorusGeometry(0.088, 0.022, 12, 24, Math.PI * 1.38);
    const collarMesh = new THREE.Mesh(collarGeo, lapelMat);
    collarMesh.position.set(0, 0.275, -0.008);
    collarMesh.rotation.set(Math.PI / 2 + 0.16, 0, Math.PI * 0.81);
    this.chest.add(collarMesh);

    // Bare upper chest / sternum skin visible inside V-neck (matching reference photo)
    const chestSkinGeo = new THREE.ConeGeometry(0.056, 0.12, 4);
    chestSkinGeo.scale(1.0, 1.0, 0.45);
    const chestSkinMesh = new THREE.Mesh(chestSkinGeo, skinMat);
    chestSkinMesh.position.set(0, 0.232, 0.102);
    chestSkinMesh.rotation.set(Math.PI, Math.PI / 4, 0);
    this.chest.add(chestSkinMesh);

    // Left lapel grip target anchor (for opponent's right hand tsurite)
    this.leftCollarAnchor.position.set(0.068, 0.20, 0.145);
    this.chest.add(this.leftCollarAnchor);

    this.disposables.push(lapelGeo, collarGeo, chestSkinGeo);

    // 3. NECK & LIFELIKE SCULPTED HEAD WITH TEXTURED CURLY HAIR
    this.neck.position.set(0, 0.27, 0);
    this.chest.add(this.neck);

    const neckGeo = new THREE.CylinderGeometry(0.051, 0.062, 0.115, 18);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.045;
    this.neck.add(neckMesh);

    this.head.rotation.order = 'YXZ';
    this.head.position.set(0, 0.095, 0.006);
    this.neck.add(this.head);

    const headGeo = createSculptedHeadGeometry();
    const headMesh = new THREE.Mesh(headGeo, faceMat);
    this.head.add(headMesh);

    // Layered Textured Curly Hair Crown (matching reference photo's short curly style)
    const hairCapGeo = new THREE.SphereGeometry(0.095, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hairCapGeo.scale(0.93, 1.05, 1.07);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.136, -0.012);
    hairCap.rotation.x = -0.22;
    this.head.add(hairCap);

    // Sculpted curly hair volume clusters along top & front fringe
    const curlGeo = new THREE.SphereGeometry(0.025, 10, 8);
    const curlPositions: Array<[number, number, number, number]> = [
      [0, 0.214, 0.062, 1.25],
      [-0.036, 0.208, 0.056, 1.15],
      [0.036, 0.208, 0.056, 1.15],
      [-0.064, 0.194, 0.034, 1.05],
      [0.064, 0.194, 0.034, 1.05],
      [-0.022, 0.224, 0.018, 1.3],
      [0.024, 0.224, 0.018, 1.3],
      [0, 0.220, -0.032, 1.28],
    ];
    curlPositions.forEach(([cx, cy, cz, cs]) => {
      const curl = new THREE.Mesh(curlGeo, hairMat);
      curl.position.set(cx, cy, cz);
      curl.scale.set(cs * 1.1, cs * 0.85, cs);
      this.head.add(curl);
    });

    // Sculpted Nose Bridge & Chin
    const noseGeo = new THREE.CapsuleGeometry(0.0085, 0.024, 4, 8);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, 0.104, 0.097);
    noseMesh.rotation.x = -0.26;
    this.head.add(noseMesh);

    const chinGeo = new THREE.SphereGeometry(0.026, 12, 10);
    chinGeo.scale(1.15, 0.85, 0.9);
    const chinMesh = new THREE.Mesh(chinGeo, skinMat);
    chinMesh.position.set(0, 0.038, 0.072);
    this.head.add(chinMesh);

    // Sculpted Ears
    const earGeo = new THREE.SphereGeometry(0.018, 12, 12);
    earGeo.scale(0.45, 1.32, 0.82);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(0.085, 0.114, -0.006);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(-0.085, 0.114, -0.006);
    this.head.add(leftEar, rightEar);

    this.disposables.push(neckGeo, headGeo, hairCapGeo, curlGeo, noseGeo, chinGeo, earGeo);

    // 4. ARMS: FULL SOLID UPPER ARM + CONTINUOUS CLOSED 3/4 SLEEVES + MUSCULAR FOREARMS + WRIST & FINGERS
    const upperSleeveGeo = createGiTubeGeometry(0.072, 0.073, 0.076, 0.285, 22);
    const upperArmCoreGeo = new THREE.CylinderGeometry(0.056, 0.047, 0.29, 18);
    const elbowSleeveCapGeo = new THREE.SphereGeometry(0.075, 20, 16);
    const forearmSleeveGeo = createGiTubeGeometry(0.074, 0.073, 0.071, 0.118, 22);
    const cuffHemGeo = new THREE.TorusGeometry(0.060, 0.011, 10, 24);
    cuffHemGeo.rotateX(Math.PI / 2);
    const cuffShadowCollarGeo = new THREE.CylinderGeometry(0.068, 0.050, 0.036, 20);
    const sleevePatchGeo = new THREE.PlaneGeometry(0.032, 0.038);
    // Muscular forearm extends seamlessly from deep inside the sleeve (-0.02) down to wrist (-0.258)
    const forearmGeo = createAthleticForearmGeometry(0.242);
    const shoulderCapGeo = new THREE.SphereGeometry(0.074, 18, 16);
    const wristCapGeo = new THREE.SphereGeometry(0.027, 14, 12);

    const palmGeo = new THREE.BoxGeometry(0.045, 0.068, 0.025);
    const proxFingerGeo = new THREE.CapsuleGeometry(0.0068, 0.022, 4, 8);
    proxFingerGeo.translate(0, -0.015, 0);
    const distFingerGeo = new THREE.CapsuleGeometry(0.0058, 0.018, 4, 8);
    distFingerGeo.translate(0, -0.013, 0);
    const proxThumbGeo = new THREE.CapsuleGeometry(0.0082, 0.018, 4, 8);
    proxThumbGeo.translate(0, -0.013, 0);
    const distThumbGeo = new THREE.CapsuleGeometry(0.0070, 0.014, 4, 8);
    distThumbGeo.translate(0, -0.010, 0);

    this.disposables.push(
      upperSleeveGeo,
      upperArmCoreGeo,
      elbowSleeveCapGeo,
      forearmSleeveGeo,
      cuffHemGeo,
      cuffShadowCollarGeo,
      sleevePatchGeo,
      forearmGeo,
      shoulderCapGeo,
      wristCapGeo,
      palmGeo,
      proxFingerGeo,
      distFingerGeo,
      proxThumbGeo,
      distThumbGeo,
    );

    const buildArm = (
      side: 1 | -1,
      shoulderGrp: THREE.Group,
      elbowGrp: THREE.Group,
      handGrp: THREE.Group,
    ): HandRig => {
      shoulderGrp.rotation.order = 'YXZ';
      shoulderGrp.position.set(side * 0.215, 0.205, 0);
      this.chest.add(shoulderGrp);

      const sCap = new THREE.Mesh(shoulderCapGeo, giMat);
      shoulderGrp.add(sCap);

      // Solid anatomical upper arm inside the sleeve (prevents any hollow interior)
      const upperArmCore = new THREE.Mesh(upperArmCoreGeo, skinMat);
      upperArmCore.position.y = -0.14;
      shoulderGrp.add(upperArmCore);

      const sleeve = new THREE.Mesh(upperSleeveGeo, giMat);
      shoulderGrp.add(sleeve);

      // Red woven shoulder patch on left outer sleeve (matching reference photo!)
      if (side === 1) {
        const sPatch = new THREE.Mesh(sleevePatchGeo, patchMat);
        sPatch.position.set(0.074, -0.12, 0);
        sPatch.rotation.y = Math.PI / 2;
        shoulderGrp.add(sPatch);
      } else {
        // Right sleeve cuff anchor where opponent's left hand grips (hikite)
        this.rightSleeveAnchor.position.set(-0.045, -0.32, 0.02);
        shoulderGrp.add(this.rightSleeveAnchor);
      }

      elbowGrp.rotation.order = 'YXZ';
      elbowGrp.position.set(0, -0.275, 0);
      shoulderGrp.add(elbowGrp);

      // Continuous kimono cloth cap & lower 3/4 sleeve covering the elbow seam cleanly
      const elbowSleeveCap = new THREE.Mesh(elbowSleeveCapGeo, giMat);
      elbowGrp.add(elbowSleeveCap);

      const forearmSleeve = new THREE.Mesh(forearmSleeveGeo, giMat);
      elbowGrp.add(forearmSleeve);

      const cuffHem = new THREE.Mesh(cuffHemGeo, giMat);
      cuffHem.position.y = -0.112;
      elbowGrp.add(cuffHem);

      const cuffShadow = new THREE.Mesh(cuffShadowCollarGeo, cuffInnerMat);
      cuffShadow.position.y = -0.098;
      elbowGrp.add(cuffShadow);

      const forearm = new THREE.Mesh(forearmGeo, skinMat);
      forearm.position.y = -0.016;
      elbowGrp.add(forearm);

      handGrp.rotation.order = 'YXZ';
      handGrp.position.set(0, -0.258, 0);
      elbowGrp.add(handGrp);

      const wristCap = new THREE.Mesh(wristCapGeo, skinMat);
      handGrp.add(wristCap);

      const wrist = new THREE.Group();
      wrist.rotation.order = 'YXZ';
      handGrp.add(wrist);

      const palm = new THREE.Mesh(palmGeo, skinMat);
      palm.position.set(0, -0.032, 0.004);
      wrist.add(palm);

      // 4 Articulated 2-joint Fingers
      const fingers: FingerJoint[] = [];
      for (let f = 0; f < 4; f++) {
        const prox = new THREE.Group();
        const fx = side * (f - 1.5) * 0.0102;
        const fz = 0.008;
        prox.position.set(fx, -0.064, fz);

        const proxMesh = new THREE.Mesh(proxFingerGeo, skinMat);
        const fScale = f === 1 ? 1.06 : f === 3 ? 0.84 : 0.96;
        proxMesh.scale.set(1, fScale, 1);
        prox.add(proxMesh);

        const dist = new THREE.Group();
        dist.position.set(0, -0.028 * fScale, 0);
        const distMesh = new THREE.Mesh(distFingerGeo, skinMat);
        distMesh.scale.set(1, fScale, 1);
        dist.add(distMesh);
        prox.add(dist);

        wrist.add(prox);
        fingers.push({
          proximal: prox,
          distal: dist,
          baseSpreadZ: side * (f - 1.5) * 0.11,
        });
      }

      // Articulated 2-joint Thumb
      const thumbProx = new THREE.Group();
      thumbProx.position.set(-side * 0.024, -0.022, 0.014);
      const thumbProxMesh = new THREE.Mesh(proxThumbGeo, skinMat);
      thumbProx.add(thumbProxMesh);

      const thumbDist = new THREE.Group();
      thumbDist.position.set(0, -0.024, 0);
      const thumbDistMesh = new THREE.Mesh(distThumbGeo, skinMat);
      thumbDist.add(thumbDistMesh);
      thumbProx.add(thumbDist);
      wrist.add(thumbProx);

      return { wrist, fingers, thumbProx, thumbDist };
    };

    this.leftHandRig = buildArm(1, this.leftShoulder, this.leftElbow, this.leftHand);
    this.rightHandRig = buildArm(-1, this.rightShoulder, this.rightElbow, this.rightHand);

    // 5. LOOSE PLEATED JUDOGI TROUSERS + REALISTIC ANKLES & 5-TOE BARE FEET
    const thighGeo = createGiTubeGeometry(0.097, 0.091, 0.086, 0.42, 20);
    const shinGeo = createGiTubeGeometry(0.080, 0.078, 0.079, 0.35, 20);
    const hipCapGeo = new THREE.SphereGeometry(0.095, 18, 16);
    const kneeCapGeo = new THREE.SphereGeometry(0.074, 16, 14);
    const ankleSkinGeo = new THREE.CylinderGeometry(0.043, 0.035, 0.09, 16);
    const footGeo = createFootGeometry();
    const toeGeo = new THREE.CapsuleGeometry(0.0075, 0.016, 4, 8);
    this.disposables.push(
      thighGeo,
      shinGeo,
      hipCapGeo,
      kneeCapGeo,
      ankleSkinGeo,
      footGeo,
      toeGeo,
    );

    const buildLeg = (
      side: 1 | -1,
      hipGrp: THREE.Group,
      kneeGrp: THREE.Group,
      ankleGrp: THREE.Group,
    ) => {
      hipGrp.rotation.order = 'YXZ';
      hipGrp.position.set(side * 0.108, -0.02, 0);
      this.pelvis.add(hipGrp);

      const hCap = new THREE.Mesh(hipCapGeo, giMat);
      hipGrp.add(hCap);

      const thigh = new THREE.Mesh(thighGeo, giMat);
      hipGrp.add(thigh);

      kneeGrp.rotation.order = 'YXZ';
      kneeGrp.position.set(0, -0.42, 0);
      hipGrp.add(kneeGrp);

      const kCap = new THREE.Mesh(kneeCapGeo, giMat);
      kneeGrp.add(kCap);

      const shin = new THREE.Mesh(shinGeo, giMat);
      kneeGrp.add(shin);

      const ankleSkin = new THREE.Mesh(ankleSkinGeo, skinMat);
      ankleSkin.position.y = -0.355;
      kneeGrp.add(ankleSkin);

      ankleGrp.rotation.order = 'YXZ';
      ankleGrp.position.set(0, -0.40, 0);
      kneeGrp.add(ankleGrp);

      const foot = new THREE.Mesh(footGeo, skinMat);
      ankleGrp.add(foot);

      for (let t = 0; t < 5; t++) {
        const toe = new THREE.Mesh(toeGeo, skinMat);
        const tx = -side * (t - 2) * 0.0145;
        const tz = 0.185 - Math.abs(t - 0.8) * 0.007;
        toe.position.set(tx, -0.068, tz);
        toe.rotation.x = Math.PI / 2;
        ankleGrp.add(toe);
      }
    };

    buildLeg(1, this.leftHip, this.leftKnee, this.leftAnkle);
    buildLeg(-1, this.rightHip, this.rightKnee, this.rightAnkle);

    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    // Dynamic soft contact shadow discs grounded on tatami
    const shadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    });
    const shadowGeo = new THREE.PlaneGeometry(0.55, 0.55);
    shadowGeo.rotateX(-Math.PI / 2);
    this.disposables.push(shadowMat, shadowGeo);

    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(shadowGeo, shadowMat);
      m.position.y = 0.004;
      m.renderOrder = 2;
      this.contactShadows.push(m);
    }
  }

  public attachContactShadows(scene: THREE.Scene) {
    this.contactShadows.forEach((m) => scene.add(m));
  }

  public applyPose(pose: JointPose) {
    this.pelvis.position.set(pose.pelvisPos[0], pose.pelvisPos[1], pose.pelvisPos[2]);
    this.pelvis.rotation.set(pose.pelvisRot[0], pose.pelvisRot[1], pose.pelvisRot[2]);

    this.spine.rotation.set(pose.spine[0], pose.spine[1], pose.spine[2]);
    this.chest.rotation.set(pose.chest[0], pose.chest[1], pose.chest[2]);
    this.head.rotation.set(pose.head[0], pose.head[1], pose.head[2]);

    this.leftShoulder.rotation.set(pose.leftShoulder[0], pose.leftShoulder[1], pose.leftShoulder[2]);
    this.leftElbow.rotation.set(pose.leftElbow[0], pose.leftElbow[1], pose.leftElbow[2]);

    this.rightShoulder.rotation.set(pose.rightShoulder[0], pose.rightShoulder[1], pose.rightShoulder[2]);
    this.rightElbow.rotation.set(pose.rightElbow[0], pose.rightElbow[1], pose.rightElbow[2]);

    this.leftHip.rotation.set(pose.leftHip[0], pose.leftHip[1], pose.leftHip[2]);
    this.leftKnee.rotation.set(pose.leftKnee[0], pose.leftKnee[1], pose.leftKnee[2]);
    this.leftAnkle.rotation.set(pose.leftAnkle[0], pose.leftAnkle[1], pose.leftAnkle[2]);

    this.rightHip.rotation.set(pose.rightHip[0], pose.rightHip[1], pose.rightHip[2]);
    this.rightKnee.rotation.set(pose.rightKnee[0], pose.rightKnee[1], pose.rightKnee[2]);
    this.rightAnkle.rotation.set(pose.rightAnkle[0], pose.rightAnkle[1], pose.rightAnkle[2]);

    const lean = pose.pelvisRot[0];
    this.beltTailLeft.rotation.x = -0.20 - lean * 0.4;
    this.beltTailRight.rotation.x = -0.24 - lean * 0.4;

    this.refreshMatrices();
  }

  /**
   * Animates realistic finger curl, finger splay, and wrist angles for real kumikata grips & breakfalls.
   */
  public setHandGrips(
    leftCurl: number,
    rightCurl: number,
    leftSpread = 0.25,
    rightSpread = 0.25,
    leftWristFlex = 0,
    rightWristFlex = 0,
  ) {
    const applyHand = (
      rig: HandRig,
      side: 1 | -1,
      curl: number,
      spread: number,
      wristFlex: number,
    ) => {
      const c = THREE.MathUtils.clamp(curl, 0, 1);
      const s = THREE.MathUtils.clamp(spread, 0, 1);
      rig.wrist.rotation.set(wristFlex, side * (0.25 - c * 0.20), 0);

      for (let i = 0; i < rig.fingers.length; i++) {
        const f = rig.fingers[i];
        const stagger = i * 0.04;
        const fc = THREE.MathUtils.clamp(c + stagger * c, 0, 1);
        // Curl inward toward palm (-X)
        f.proximal.rotation.x = -0.10 - fc * 1.18;
        f.proximal.rotation.z = f.baseSpreadZ * (1 - c * 0.78) * (0.5 + s * 1.15);
        f.distal.rotation.x = -0.08 - fc * 1.12;
      }

      // Opposing thumb wraps across palm when gripping, opens cleanly when slapping mat
      rig.thumbProx.rotation.set(-0.22 - c * 0.55, side * (0.35 + c * 0.45), side * (0.48 - c * 0.85));
      rig.thumbDist.rotation.set(-0.15 - c * 0.65, 0, -side * c * 0.35);
    };

    applyHand(this.leftHandRig, 1, leftCurl, leftSpread, leftWristFlex);
    applyHand(this.rightHandRig, -1, rightCurl, rightSpread, rightWristFlex);
  }

  public shiftPelvisWorld(dx: number, dy: number, dz: number) {
    const invScale = 1 / (this.appearance.scale ?? 1.0);
    this.pelvis.position.x += dx * invScale;
    this.pelvis.position.y += dy * invScale;
    this.pelvis.position.z += dz * invScale;
    this.refreshMatrices();
  }

  public refreshMatrices() {
    this.group.updateMatrixWorld(true);
    this.updateContactShadows();
  }

  private updateContactShadows() {
    this.pelvis.getWorldPosition(_tempVec);
    const bodyHeightFade = THREE.MathUtils.clamp(1.25 - _tempVec.y * 0.55, 0.25, 0.9);
    this.contactShadows[0].position.set(_tempVec.x, 0.004, _tempVec.z);
    this.contactShadows[0].scale.setScalar(1.35 * bodyHeightFade);

    this.leftAnkle.getWorldPosition(_tempVec);
    const lfFade = THREE.MathUtils.clamp(1.1 - _tempVec.y * 0.7, 0.15, 1);
    this.contactShadows[1].position.set(_tempVec.x, 0.005, _tempVec.z);
    this.contactShadows[1].scale.setScalar(0.65 * lfFade);

    this.rightAnkle.getWorldPosition(_tempVec);
    const rfFade = THREE.MathUtils.clamp(1.1 - _tempVec.y * 0.7, 0.15, 1);
    this.contactShadows[2].position.set(_tempVec.x, 0.005, _tempVec.z);
    this.contactShadows[2].scale.setScalar(0.65 * rfFade);
  }

  public getWorldPoint(key: LandmarkKey, target: THREE.Vector3): THREE.Vector3 {
    switch (key) {
      case 'com':
        this.pelvis.getWorldPosition(target);
        target.y += 0.04;
        return target;
      case 'chest':
        this.chest.getWorldPosition(target);
        target.y += 0.12;
        return target;
      case 'head':
        this.head.getWorldPosition(target);
        target.y += 0.11;
        return target;
      case 'leftShoulder':
        return this.leftShoulder.getWorldPosition(target);
      case 'rightShoulder':
        return this.rightShoulder.getWorldPosition(target);
      case 'leftElbow':
        return this.leftElbow.getWorldPosition(target);
      case 'rightElbow':
        return this.rightElbow.getWorldPosition(target);
      case 'leftHand':
        return this.leftHand.getWorldPosition(target);
      case 'rightHand':
        return this.rightHand.getWorldPosition(target);
      case 'leftCollarAnchor':
        return this.leftCollarAnchor.getWorldPosition(target);
      case 'rightSleeveAnchor':
        return this.rightSleeveAnchor.getWorldPosition(target);
      case 'leftKnee':
        return this.leftKnee.getWorldPosition(target);
      case 'rightKnee':
        return this.rightKnee.getWorldPosition(target);
      case 'leftFoot':
        return this.leftAnkle.getWorldPosition(target);
      case 'rightFoot':
        return this.rightAnkle.getWorldPosition(target);
    }
  }

  /**
   * Analytically rotates a root limb joint (shoulder or hip) in 3D world space
   * so its downstream elbow/hand or knee/foot glides outside obstacles without clipping.
   */
  public nudgeLimbWorld(
    jointKey: 'leftShoulder' | 'rightShoulder' | 'leftHip' | 'rightHip',
    endKey: LandmarkKey,
    worldDx: number,
    worldDy: number,
    worldDz: number,
  ) {
    const joint = this[jointKey];
    const parent = joint.parent;
    if (!parent) return;

    joint.getWorldPosition(_rootWorld);
    this.getWorldPoint(endKey, _endWorld);

    _uVec.subVectors(_endWorld, _rootWorld);
    const uLen = _uVec.length();
    if (uLen < 0.05) return;
    _uVec.divideScalar(uLen);

    _vVec.set(
      _endWorld.x + worldDx - _rootWorld.x,
      _endWorld.y + worldDy - _rootWorld.y,
      _endWorld.z + worldDz - _rootWorld.z,
    );
    const vLen = _vVec.length();
    if (vLen < 0.05) return;
    _vVec.divideScalar(vLen);

    _deltaWorldQ.setFromUnitVectors(_uVec, _vVec);
    parent.getWorldQuaternion(_parentWorldQ);
    _parentInvQ.copy(_parentWorldQ).invert();
    joint.getWorldQuaternion(_jointWorldQ);

    joint.quaternion
      .copy(_parentInvQ)
      .multiply(_deltaWorldQ)
      .multiply(_jointWorldQ);
    joint.updateMatrixWorld(true);
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.contactShadows.forEach((m) => m.parent?.remove(m));
  }
}
