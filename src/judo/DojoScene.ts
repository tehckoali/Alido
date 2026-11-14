import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { dojoAudio } from './audio';
import { JudokaRig, LandmarkKey } from './JudokaRig';
import { CAMERA_PRESETS, sampleHandGrips, sampleTechniquePose, TECHNIQUES } from './techniques';
import { createDojoTextures, DojoTextureSet } from './textures';
import { CameraPresetId, JointPose, TechniqueSpec, Vec3Tuple } from './types';

export interface DojoSceneCallbacks {
  onProgressChange?: (progress: number) => void;
  onPlaybackFinished?: () => void;
  onWebGLContextLost?: (lost: boolean) => void;
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3();

const SMOOTH_JOINT_KEYS: Array<keyof JointPose> = [
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

function createEmptyPose(): JointPose {
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

function copyPose(src: JointPose, dst: JointPose) {
  for (const k of SMOOTH_JOINT_KEYS) {
    dst[k][0] = src[k][0];
    dst[k][1] = src[k][1];
    dst[k][2] = src[k][2];
  }
}

function dampTuple(target: Vec3Tuple, current: Vec3Tuple, lambda: number, dt: number) {
  current[0] = THREE.MathUtils.damp(current[0], target[0], lambda, dt);
  current[1] = THREE.MathUtils.damp(current[1], target[1], lambda, dt);
  current[2] = THREE.MathUtils.damp(current[2], target[2], lambda, dt);
}

function dampPose(target: JointPose, current: JointPose, lambda: number, dt: number) {
  for (const k of SMOOTH_JOINT_KEYS) {
    dampTuple(target[k], current[k], lambda, dt);
  }
}

const TAU = Math.PI * 2;

function wrapAnglesNearTarget(target: JointPose, current: JointPose) {
  for (const k of SMOOTH_JOINT_KEYS) {
    if (k === 'pelvisPos') continue;
    for (let i = 0; i < 3; i++) {
      let diff = current[k][i] - target[k][i];
      while (diff > Math.PI) {
        current[k][i] -= TAU;
        diff -= TAU;
      }
      while (diff < -Math.PI) {
        current[k][i] += TAU;
        diff += TAU;
      }
    }
  }
}

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class DojoScene {
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly textures: DojoTextureSet;
  private readonly tori: JudokaRig;
  private readonly uke: JudokaRig;
  private readonly isSoftwareGl: boolean;
  private readonly callbacks: DojoSceneCallbacks;

  // Teaching overlays
  private readonly guidesGroup = new THREE.Group();
  private readonly comRing: THREE.Mesh;
  private readonly comRingMat: THREE.MeshBasicMaterial;
  private readonly comPlumbLine: THREE.Line;
  private readonly comPlumbGeo: THREE.BufferGeometry;
  private readonly kuzushiArrow: THREE.ArrowHelper;
  private readonly leftGripMarker: THREE.Mesh;
  private readonly rightGripMarker: THREE.Mesh;

  // Playback & interaction state
  private currentTech: TechniqueSpec = TECHNIQUES[0];
  private progress = 0;
  private playing = true;
  private speed = 1.0;
  private loop = true;
  private showGuides = true;
  private autoOrbit = false;
  private lastImpactTrigger = -1;
  private lastSnapTrigger = -1;

  // Smooth camera transition state
  private camTransitionActive = false;
  private camTargetPos = new THREE.Vector3(3.2, 1.65, 0.35);
  private camTargetLook = new THREE.Vector3(0, 0.85, 0);

  // Loop & timing
  private readonly clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;
  private lastUiEmit = 0;
  private idlePhase = 0;
  private loopBlendTimer = 0;
  private smoothInitialized = false;
  private readonly smoothTori: JointPose = createEmptyPose();
  private readonly smoothUke: JointPose = createEmptyPose();
  private resizeObserver: ResizeObserver | null = null;
  private readonly disposables: Array<{ dispose: () => void }> = [];

  // Keyboard movement state
  private readonly keys: Record<string, boolean> = {};

  constructor(container: HTMLElement, callbacks: DojoSceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x16181d);
    this.scene.fog = new THREE.FogExp2(0x16181d, 0.032);

    // Studio Environment Reflection (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.disposables.push(envTex);
    pmrem.dispose();

    // Camera & 360 Orbit Controls
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    this.camera.position.set(3.2, 1.65, 0.35);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.85, 0);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 1.35;
    this.controls.maxDistance = 7.8;
    this.controls.minPolarAngle = 0.12;
    this.controls.maxPolarAngle = Math.PI * 0.482; // keep above tatami floor
    this.controls.panSpeed = 0.75;
    this.controls.rotateSpeed = 0.85;
    this.controls.update();

    // Cancel scripted camera transition if user interacts manually
    this.controls.addEventListener('start', () => {
      this.camTransitionActive = false;
    });

    // Textures & Lighting
    this.textures = createDojoTextures(this.renderer);
    this.setupLighting();
    this.buildDojoEnvironment();

    // Create Tori (Realistic Judoka in White Sashiko Kimono, Black Belt) & Uke (Royal Blue Kimono, Brown Belt)
    this.tori = new JudokaRig(
      {
        name: 'tori',
        giMap: this.textures.whiteGiMap,
        giBump: this.textures.whiteGiBump,
        faceMap: this.textures.skinFaceMap,
        skinDetailMap: this.textures.skinDetailMap,
        hairMap: this.textures.hairMap,
        brandPatchMap: this.textures.brandPatchMap,
        giTint: 0xf8f5ee,
        beltColor: 0x16171a,
        skinColor: 0xd9a785,
        hairColor: 0x1b1715,
        scale: 1.0,
      },
      this.textures.contactShadowMap,
    );
    this.uke = new JudokaRig(
      {
        name: 'uke',
        giMap: this.textures.blueGiMap,
        giBump: this.textures.blueGiBump,
        faceMap: this.textures.skinFaceMap,
        skinDetailMap: this.textures.skinDetailMap,
        hairMap: this.textures.hairMap,
        brandPatchMap: this.textures.brandPatchMap,
        giTint: 0xffffff,
        beltColor: 0x5c361d,
        skinColor: 0xcf9b78,
        hairColor: 0x241d19,
        scale: 0.99,
      },
      this.textures.contactShadowMap,
    );

    this.scene.add(this.tori.group);
    this.scene.add(this.uke.group);
    this.tori.attachContactShadows(this.scene);
    this.uke.attachContactShadows(this.scene);

    // Biomechanical Teaching Guides
    this.comRingMat = new THREE.MeshBasicMaterial({
      color: 0x45c486,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const ringGeo = new THREE.RingGeometry(0.18, 0.24, 36);
    ringGeo.rotateX(-Math.PI / 2);
    this.comRing = new THREE.Mesh(ringGeo, this.comRingMat);
    this.comRing.position.y = 0.008;
    this.comRing.renderOrder = 4;

    this.comPlumbGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(0, 0.01, 0),
    ]);
    const plumbMat = new THREE.LineBasicMaterial({
      color: 0xf0c15a,
      transparent: true,
      opacity: 0.78,
    });
    this.comPlumbLine = new THREE.Line(this.comPlumbGeo, plumbMat);

    this.kuzushiArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 1.25, 0.4),
      0.65,
      0xd94336,
      0.16,
      0.09,
    );

    const gripGeo = new THREE.SphereGeometry(0.048, 14, 14);
    const gripMat = new THREE.MeshBasicMaterial({
      color: 0xe6b85c,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    this.leftGripMarker = new THREE.Mesh(gripGeo, gripMat);
    this.rightGripMarker = new THREE.Mesh(gripGeo, gripMat);

    this.guidesGroup.add(
      this.comRing,
      this.comPlumbLine,
      this.kuzushiArrow,
      this.leftGripMarker,
      this.rightGripMarker,
    );
    this.scene.add(this.guidesGroup);
    this.disposables.push(ringGeo, this.comRingMat, this.comPlumbGeo, plumbMat, gripGeo, gripMat);

    // Apply initial frame
    this.applyCurrentPose();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Event Listeners
    this.bindEvents();
    this.clock.start();
    this.tick();
  }

  private setupLighting() {
    // Cool-tinted dojo sky / warm tatami bounce fill
    const hemi = new THREE.HemisphereLight(0xd9e4f5, 0x615d43, 0.78);
    this.scene.add(hemi);

    // Warm overhead dojo key light with tight shadow frustum
    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.65);
    keyLight.position.set(4.5, 7.5, 4.2);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 22.0;
    const d = 3.8;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool side fill light to reveal folds on the shadow side
    const fillLight = new THREE.DirectionalLight(0xbcd3f5, 0.55);
    fillLight.position.set(-5.0, 3.8, -2.5);
    this.scene.add(fillLight);

    // Crisp rear rim light separating White & Blue judogi from background
    const rimLight = new THREE.DirectionalLight(0xffe7c2, 0.72);
    rimLight.position.set(-1.8, 4.2, -5.8);
    this.scene.add(rimLight);
  }

  private buildDojoEnvironment() {
    // 1. Competition Tatami Mat (14m x 14m, top surface flush at y = 0)
    const tatamiGeo = new THREE.BoxGeometry(14, 0.05, 14);
    const tatamiMat = new THREE.MeshStandardMaterial({
      map: this.textures.tatamiMap,
      bumpMap: this.textures.tatamiBump,
      bumpScale: 0.008,
      roughness: 0.78,
      metalness: 0.02,
    });
    const tatamiMesh = new THREE.Mesh(tatamiGeo, tatamiMat);
    tatamiMesh.position.y = -0.025;
    tatamiMesh.receiveShadow = true;
    this.scene.add(tatamiMesh);

    // 2. Hinoki Hardwood Dojo Perimeter Floor (flush 4.5cm below tatami top)
    const deckGeo = new THREE.PlaneGeometry(22, 22);
    deckGeo.rotateX(-Math.PI / 2);
    const deckMat = new THREE.MeshStandardMaterial({
      map: this.textures.woodMap,
      bumpMap: this.textures.woodBump,
      bumpScale: 0.006,
      roughness: 0.54,
      metalness: 0.04,
    });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.y = -0.045;
    deckMesh.receiveShadow = true;
    this.scene.add(deckMesh);

    // 3. Raised Hinoki Wood Tatami Border Curb
    const curbMat = new THREE.MeshStandardMaterial({
      map: this.textures.woodMap,
      roughness: 0.50,
      metalness: 0.04,
    });
    const curbN = new THREE.Mesh(new THREE.BoxGeometry(14.32, 0.06, 0.16), curbMat);
    curbN.position.set(0, -0.02, -7.08);
    const curbS = curbN.clone();
    curbS.position.set(0, -0.02, 7.08);
    const curbE = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 14.0), curbMat);
    curbE.position.set(7.08, -0.02, 0);
    const curbW = curbE.clone();
    curbW.position.set(-7.08, -0.02, 0);
    this.scene.add(curbN, curbS, curbE, curbW);

    // 4. Enclosed 4-Wall Japanese Dojo Architecture (Wainscoting + Shoji Screens + Upper Cedar Frieze)
    const cedarMat = new THREE.MeshStandardMaterial({
      color: 0x3b2617,
      roughness: 0.62,
      metalness: 0.05,
    });
    const wainscotMat = new THREE.MeshStandardMaterial({
      map: this.textures.woodMap,
      bumpMap: this.textures.woodBump,
      bumpScale: 0.004,
      color: 0xc2a282,
      roughness: 0.58,
    });
    const shojiMat = new THREE.MeshStandardMaterial({
      map: this.textures.shojiMap,
      emissive: new THREE.Color(0x473c2c),
      emissiveIntensity: 0.42,
      roughness: 0.85,
    });

    const wainscotGeo = new THREE.PlaneGeometry(19, 1.15);
    const shojiGeo = new THREE.PlaneGeometry(19, 2.65);
    const friezeGeo = new THREE.PlaneGeometry(19, 1.35);
    const railGeo = new THREE.BoxGeometry(19, 0.10, 0.14);

    const wallSpecs: Array<{ pos: [number, number]; rotY: number }> = [
      { pos: [0, -9.45], rotY: 0 },
      { pos: [0, 9.45], rotY: Math.PI },
      { pos: [-9.45, 0], rotY: Math.PI / 2 },
      { pos: [9.45, 0], rotY: -Math.PI / 2 },
    ];

    wallSpecs.forEach(({ pos, rotY }) => {
      const wallGrp = new THREE.Group();
      wallGrp.position.set(pos[0], 0, pos[1]);
      wallGrp.rotation.y = rotY;

      const wainscot = new THREE.Mesh(wainscotGeo, wainscotMat);
      wainscot.position.y = 0.55;
      wallGrp.add(wainscot);

      const midRail = new THREE.Mesh(railGeo, cedarMat);
      midRail.position.set(0, 1.13, 0.04);
      wallGrp.add(midRail);

      const shoji = new THREE.Mesh(shojiGeo, shojiMat);
      shoji.position.y = 2.45;
      wallGrp.add(shoji);

      const topRail = new THREE.Mesh(railGeo, cedarMat);
      topRail.position.set(0, 3.76, 0.04);
      wallGrp.add(topRail);

      const frieze = new THREE.Mesh(friezeGeo, cedarMat);
      frieze.position.y = 4.44;
      wallGrp.add(frieze);

      this.scene.add(wallGrp);
    });

    // 5. Traditional Timber Ceiling & Exposed Rafters (y = 5.10m, safely above Overhead camera y = 4.3m)
    const ceilingGeo = new THREE.PlaneGeometry(19.2, 19.2);
    ceilingGeo.rotateX(Math.PI / 2);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x261910,
      roughness: 0.78,
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.position.y = 5.15;
    this.scene.add(ceilingMesh);

    const beamGeo = new THREE.BoxGeometry(19.0, 0.22, 0.24);
    for (let bz = -6.3; bz <= 6.31; bz += 3.15) {
      const beam = new THREE.Mesh(beamGeo, cedarMat);
      beam.position.set(0, 5.02, bz);
      this.scene.add(beam);
    }

    // 6. Structural Cedar Dojo Pillars (InstancedMesh)
    const pillarGeo = new THREE.BoxGeometry(0.28, 5.2, 0.28);
    const pillarPositions: Array<[number, number]> = [
      [-9.36, -9.36],
      [-4.7, -9.36],
      [4.7, -9.36],
      [9.36, -9.36],
      [-9.36, 9.36],
      [-4.7, 9.36],
      [4.7, 9.36],
      [9.36, 9.36],
      [-9.36, -4.7],
      [-9.36, 0],
      [-9.36, 4.7],
      [9.36, -4.7],
      [9.36, 0],
      [9.36, 4.7],
    ];
    const pillars = new THREE.InstancedMesh(pillarGeo, cedarMat, pillarPositions.length);
    const dummy = new THREE.Object3D();
    pillarPositions.forEach(([px, pz], idx) => {
      dummy.position.set(px, 2.6, pz);
      dummy.updateMatrix();
      pillars.setMatrixAt(idx, dummy.matrix);
    });
    pillars.instanceMatrix.needsUpdate = true;
    pillars.computeBoundingSphere();
    this.scene.add(pillars);

    // 7. Physical 3D "ALIDO" Dojo Signboards Mounted High at the Top of the Dojo Walls
    const signFrameGeo = new THREE.BoxGeometry(3.55, 0.94, 0.10);
    const signFaceGeo = new THREE.PlaneGeometry(3.36, 0.82);
    const signFaceMat = new THREE.MeshStandardMaterial({
      map: this.textures.alidoSignMap,
      emissiveMap: this.textures.alidoSignMap,
      emissive: new THREE.Color(0xffe6b3),
      emissiveIntensity: 0.28,
      roughness: 0.45,
      metalness: 0.12,
    });

    const addTopAlidoSign = (x: number, y: number, z: number, rotY: number) => {
      const signGrp = new THREE.Group();
      signGrp.position.set(x, y, z);
      signGrp.rotation.y = rotY;
      const frame = new THREE.Mesh(signFrameGeo, cedarMat);
      const face = new THREE.Mesh(signFaceGeo, signFaceMat);
      face.position.z = 0.055;
      signGrp.add(frame, face);
      this.scene.add(signGrp);
    };

    // Mounted at top of Shomen (North above scroll), West (framed in Side Study), East & South walls
    addTopAlidoSign(0, 3.92, -9.32, 0);
    addTopAlidoSign(-9.32, 3.04, 0, Math.PI / 2);
    addTopAlidoSign(9.32, 3.04, 0, -Math.PI / 2);
    addTopAlidoSign(0, 3.92, 9.32, Math.PI);

    // 8. Shomen Focal Wall: Kamiza Altar Shelf, Calligraphy Scroll (柔道), Nafudakake & Weapons Rack
    const scrollGeo = new THREE.PlaneGeometry(1.05, 2.2);
    const scrollMat = new THREE.MeshStandardMaterial({
      map: this.textures.scrollMap,
      roughness: 0.85,
    });
    const scrollMesh = new THREE.Mesh(scrollGeo, scrollMat);
    scrollMesh.position.set(0, 2.42, -9.36);
    this.scene.add(scrollMesh);

    const kamizaGeo = new THREE.BoxGeometry(2.4, 0.48, 0.55);
    const kamizaMesh = new THREE.Mesh(kamizaGeo, cedarMat);
    kamizaMesh.position.set(0, 0.20, -9.12);
    this.scene.add(kamizaMesh);

    // Nafudakake (Wooden Belt-Rank Board on left of Shomen)
    const nafudaGeo = new THREE.PlaneGeometry(1.45, 1.45);
    const nafudaMat = new THREE.MeshStandardMaterial({
      map: this.textures.nafudaMap,
      roughness: 0.72,
    });
    const nafudaMesh = new THREE.Mesh(nafudaGeo, nafudaMat);
    nafudaMesh.position.set(-2.55, 2.25, -9.36);
    this.scene.add(nafudaMesh);

    // Traditional Bokken/Jo Wooden Rack on right of Shomen
    const rackPostGeo = new THREE.BoxGeometry(0.08, 0.95, 0.09);
    const weaponGeo = new THREE.CylinderGeometry(0.017, 0.020, 1.35, 10);
    weaponGeo.rotateZ(Math.PI / 2);
    const weaponMat = new THREE.MeshStandardMaterial({ color: 0x8b5c34, roughness: 0.45 });
    const rackGrp = new THREE.Group();
    rackGrp.position.set(2.55, 2.15, -9.32);
    const postL = new THREE.Mesh(rackPostGeo, cedarMat);
    postL.position.x = -0.45;
    const postR = new THREE.Mesh(rackPostGeo, cedarMat);
    postR.position.x = 0.45;
    rackGrp.add(postL, postR);
    [-0.24, 0, 0.24].forEach((wy) => {
      const staff = new THREE.Mesh(weaponGeo, weaponMat);
      staff.position.set(0, wy, 0.06);
      rackGrp.add(staff);
    });
    this.scene.add(rackGrp);

    // 9. Four Corner Glowing Andon Paper Floor Lanterns + Hinoki Seiza Benches
    const lanternBaseGeo = new THREE.BoxGeometry(0.42, 0.14, 0.42);
    const lanternShadeGeo = new THREE.BoxGeometry(0.32, 0.72, 0.32);
    const lanternShadeMat = new THREE.MeshStandardMaterial({
      color: 0xf7ecd4,
      emissive: new THREE.Color(0xffb85c),
      emissiveIntensity: 0.65,
      roughness: 0.9,
    });
    const lanternCapGeo = new THREE.BoxGeometry(0.40, 0.08, 0.40);

    const corners: Array<[number, number]> = [
      [-8.35, -8.35],
      [8.35, -8.35],
      [-8.35, 8.35],
      [8.35, 8.35],
    ];
    corners.forEach(([cx, cz]) => {
      const lGrp = new THREE.Group();
      lGrp.position.set(cx, 0, cz);
      const base = new THREE.Mesh(lanternBaseGeo, cedarMat);
      base.position.y = 0.03;
      const shade = new THREE.Mesh(lanternShadeGeo, lanternShadeMat);
      shade.position.y = 0.46;
      const cap = new THREE.Mesh(lanternCapGeo, cedarMat);
      cap.position.y = 0.85;
      lGrp.add(base, shade, cap);
      this.scene.add(lGrp);
    });

    // Subtle warm North lantern point lights to illuminate Shomen & top ALIDO sign
    const lanternLightL = new THREE.PointLight(0xffb86c, 2.4, 9.0, 1.5);
    lanternLightL.position.set(-7.8, 1.4, -7.8);
    const lanternLightR = new THREE.PointLight(0xffb86c, 2.4, 9.0, 1.5);
    lanternLightR.position.set(7.8, 1.4, -7.8);
    this.scene.add(lanternLightL, lanternLightR);

    // Hinoki Seiza Benches along West & East dojo perimeter
    const benchTopGeo = new THREE.BoxGeometry(0.46, 0.06, 3.2);
    const benchLegGeo = new THREE.BoxGeometry(0.40, 0.34, 0.10);
    const buildBench = (bx: number, bz: number) => {
      const bGrp = new THREE.Group();
      bGrp.position.set(bx, 0, bz);
      const top = new THREE.Mesh(benchTopGeo, curbMat);
      top.position.y = 0.34;
      const leg1 = new THREE.Mesh(benchLegGeo, cedarMat);
      leg1.position.set(0, 0.14, -1.25);
      const leg2 = new THREE.Mesh(benchLegGeo, cedarMat);
      leg2.position.set(0, 0.14, 1.25);
      bGrp.add(top, leg1, leg2);
      this.scene.add(bGrp);
    };
    buildBench(-8.35, -2.5);
    buildBench(-8.35, 2.5);
    buildBench(8.35, -2.5);
    buildBench(8.35, 2.5);

    this.disposables.push(
      tatamiGeo,
      tatamiMat,
      deckGeo,
      deckMat,
      curbMat,
      curbN.geometry,
      curbE.geometry,
      cedarMat,
      wainscotMat,
      shojiMat,
      wainscotGeo,
      shojiGeo,
      friezeGeo,
      railGeo,
      ceilingGeo,
      ceilingMat,
      beamGeo,
      pillarGeo,
      signFrameGeo,
      signFaceGeo,
      signFaceMat,
      scrollGeo,
      scrollMat,
      kamizaGeo,
      nafudaGeo,
      nafudaMat,
      rackPostGeo,
      weaponGeo,
      weaponMat,
      lanternBaseGeo,
      lanternShadeGeo,
      lanternShadeMat,
      lanternCapGeo,
      benchTopGeo,
      benchLegGeo,
    );
  }

  /**
   * Full-body anti-clipping solver: prevents Tori and Uke's torsos, heads, shoulders,
   * arms, hands, knees, and feet from penetrating each other, themselves, or the tatami mat.
   */
  private resolveJudokaCollisions() {
    const enforceBodyPair = (
      aKey: LandmarkKey,
      bKey: LandmarkKey,
      minDist: number,
      upBias: number,
    ) => {
      this.tori.getWorldPoint(aKey, _v1);
      this.uke.getWorldPoint(bKey, _v2);
      const dx = _v2.x - _v1.x;
      const dy = _v2.y - _v1.y;
      const dz = _v2.z - _v1.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        let nx: number;
        let ny: number;
        let nz: number;
        if (dist < 0.002) {
          nx = 0;
          ny = 0.85;
          nz = 0.52;
        } else {
          nx = dx / dist;
          ny = dy / dist;
          nz = dz / dist;
        }
        const upFactor = THREE.MathUtils.smoothstep(_v2.y - _v1.y, -0.14, 0.08) * upBias;
        if (ny < upFactor) {
          ny = upFactor;
          const len = Math.hypot(nx, ny, nz) || 1;
          nx /= len;
          ny /= len;
          nz /= len;
        }
        const pen = minDist - dist;
        this.uke.shiftPelvisWorld(nx * pen, ny * pen, nz * pen);
      }
    };

    const enforceLimbClearance = (
      limbRig: JudokaRig,
      jointKey: 'leftShoulder' | 'rightShoulder' | 'leftHip' | 'rightHip',
      endKey: LandmarkKey,
      obstacleRig: JudokaRig,
      obstacleKey: LandmarkKey,
      minDist: number,
    ) => {
      obstacleRig.getWorldPoint(obstacleKey, _v1);
      limbRig.getWorldPoint(endKey, _v2);
      const dx = _v2.x - _v1.x;
      const dy = _v2.y - _v1.y;
      const dz = _v2.z - _v1.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        let nx: number;
        let ny: number;
        let nz: number;
        if (dist < 0.002) {
          nx = jointKey.startsWith('left') ? 0.65 : -0.65;
          ny = 0.35;
          nz = 0.67;
        } else {
          nx = dx / dist;
          ny = dy / dist;
          nz = dz / dist;
        }
        const pen = (minDist - dist) * 0.92;
        limbRig.nudgeLimbWorld(jointKey, endKey, nx * pen, ny * pen, nz * pen);
      }
    };

    // Pass 1 & 2: Whole-body & Shoulder separation between Tori and Uke
    for (let pass = 0; pass < 2; pass++) {
      enforceBodyPair('com', 'com', 0.305, 0.35);
      enforceBodyPair('chest', 'chest', 0.310, 0.35);
      enforceBodyPair('chest', 'com', 0.295, 0.45);
      enforceBodyPair('com', 'chest', 0.295, 0.30);
      enforceBodyPair('head', 'head', 0.235, 0.30);
      enforceBodyPair('head', 'chest', 0.275, 0.40);
      enforceBodyPair('chest', 'head', 0.275, 0.35);
      enforceBodyPair('head', 'com', 0.265, 0.40);
      enforceBodyPair('com', 'head', 0.265, 0.35);

      // Shoulders vs Opponent Torso & Head
      enforceBodyPair('leftShoulder', 'chest', 0.240, 0.35);
      enforceBodyPair('rightShoulder', 'chest', 0.240, 0.35);
      enforceBodyPair('chest', 'leftShoulder', 0.240, 0.35);
      enforceBodyPair('chest', 'rightShoulder', 0.240, 0.35);
      enforceBodyPair('leftShoulder', 'head', 0.195, 0.35);
      enforceBodyPair('rightShoulder', 'head', 0.195, 0.35);
      enforceBodyPair('head', 'leftShoulder', 0.195, 0.35);
      enforceBodyPair('head', 'rightShoulder', 0.195, 0.35);
      enforceBodyPair('leftShoulder', 'com', 0.225, 0.35);
      enforceBodyPair('rightShoulder', 'com', 0.225, 0.35);
    }

    // Ground clamp for core bodies & feet before solving arms/legs
    const enforceGroundBody = (rig: JudokaRig) => {
      let minDeficit = 0;
      rig.getWorldPoint('head', _v4);
      if (_v4.y < 0.118) minDeficit = Math.max(minDeficit, 0.118 - _v4.y);
      rig.getWorldPoint('chest', _v4);
      if (_v4.y < 0.148) minDeficit = Math.max(minDeficit, 0.148 - _v4.y);
      rig.getWorldPoint('com', _v4);
      if (_v4.y < 0.168) minDeficit = Math.max(minDeficit, 0.168 - _v4.y);
      rig.getWorldPoint('leftShoulder', _v4);
      if (_v4.y < 0.084) minDeficit = Math.max(minDeficit, 0.084 - _v4.y);
      rig.getWorldPoint('rightShoulder', _v4);
      if (_v4.y < 0.084) minDeficit = Math.max(minDeficit, 0.084 - _v4.y);
      rig.getWorldPoint('leftKnee', _v4);
      if (_v4.y < 0.082) minDeficit = Math.max(minDeficit, 0.082 - _v4.y);
      rig.getWorldPoint('rightKnee', _v4);
      if (_v4.y < 0.082) minDeficit = Math.max(minDeficit, 0.082 - _v4.y);
      rig.getWorldPoint('leftFoot', _v4);
      if (_v4.y < 0.078) minDeficit = Math.max(minDeficit, 0.078 - _v4.y);
      rig.getWorldPoint('rightFoot', _v4);
      if (_v4.y < 0.078) minDeficit = Math.max(minDeficit, 0.078 - _v4.y);

      if (minDeficit > 0) {
        rig.shiftPelvisWorld(0, minDeficit, 0);
      }
    };

    enforceGroundBody(this.tori);
    enforceGroundBody(this.uke);

    // Pass 3 & 4: Full-Limb Collision Prevention (arms, hands, knees, feet vs opponent & self + tatami floor)
    const pairs: Array<[JudokaRig, JudokaRig]> = [
      [this.tori, this.uke],
      [this.uke, this.tori],
    ];

    for (let pass = 0; pass < 2; pass++) {
      for (const [actor, other] of pairs) {
        // Arms (elbows & hands) against opponent torso, head, shoulders, and arms
        for (const side of ['left', 'right'] as const) {
          const shoulderKey = side === 'left' ? 'leftShoulder' : 'rightShoulder';
          const elbowKey = side === 'left' ? 'leftElbow' : 'rightElbow';
          const handKey = side === 'left' ? 'leftHand' : 'rightHand';

          enforceLimbClearance(actor, shoulderKey, elbowKey, other, 'chest', 0.238);
          enforceLimbClearance(actor, shoulderKey, elbowKey, other, 'com', 0.228);
          enforceLimbClearance(actor, shoulderKey, elbowKey, other, 'head', 0.190);
          enforceLimbClearance(actor, shoulderKey, elbowKey, other, 'leftShoulder', 0.150);
          enforceLimbClearance(actor, shoulderKey, elbowKey, other, 'rightShoulder', 0.150);
          enforceLimbClearance(actor, shoulderKey, elbowKey, other, 'leftElbow', 0.145);
          enforceLimbClearance(actor, shoulderKey, elbowKey, other, 'rightElbow', 0.145);

          enforceLimbClearance(actor, shoulderKey, handKey, other, 'chest', 0.212);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'com', 0.205);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'head', 0.168);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'leftShoulder', 0.128);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'rightShoulder', 0.128);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'leftElbow', 0.122);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'rightElbow', 0.122);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'leftHand', 0.095);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'rightHand', 0.095);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'leftKnee', 0.135);
          enforceLimbClearance(actor, shoulderKey, handKey, other, 'rightKnee', 0.135);
          enforceLimbClearance(actor, shoulderKey, elbowKey, other, 'leftKnee', 0.150);
          enforceLimbClearance(actor, shoulderKey, elbowKey, other, 'rightKnee', 0.150);

          // Mid-forearm segment clearance against opponent chest & pelvis
          actor.getWorldPoint(elbowKey, _v2);
          actor.getWorldPoint(handKey, _v3);
          _v3.lerp(_v2, 0.5);
          other.getWorldPoint('chest', _v1);
          const fDx = _v3.x - _v1.x;
          const fDy = _v3.y - _v1.y;
          const fDz = _v3.z - _v1.z;
          const fDistSq = fDx * fDx + fDy * fDy + fDz * fDz;
          if (fDistSq < 0.215 * 0.215 && fDistSq > 1e-6) {
            const fDist = Math.sqrt(fDistSq);
            const fPen = (0.215 - fDist) * 0.9;
            actor.nudgeLimbWorld(shoulderKey, handKey, (fDx / fDist) * fPen, (fDy / fDist) * fPen, (fDz / fDist) * fPen);
          }

          // Self-collision: own arms stay outside own torso, head & knees
          enforceLimbClearance(actor, shoulderKey, elbowKey, actor, 'chest', 0.215);
          enforceLimbClearance(actor, shoulderKey, elbowKey, actor, 'com', 0.205);
          enforceLimbClearance(actor, shoulderKey, handKey, actor, 'chest', 0.195);
          enforceLimbClearance(actor, shoulderKey, handKey, actor, 'com', 0.188);
          enforceLimbClearance(actor, shoulderKey, handKey, actor, 'head', 0.155);
          enforceLimbClearance(actor, shoulderKey, handKey, actor, 'leftKnee', 0.130);
          enforceLimbClearance(actor, shoulderKey, handKey, actor, 'rightKnee', 0.130);

          // Tatami floor clearance for elbows & slapping hands
          actor.getWorldPoint(elbowKey, _v3);
          if (_v3.y < 0.076) {
            actor.nudgeLimbWorld(shoulderKey, elbowKey, 0, 0.076 - _v3.y, 0);
          }
          actor.getWorldPoint(handKey, _v3);
          if (_v3.y < 0.044) {
            actor.nudgeLimbWorld(shoulderKey, handKey, 0, 0.044 - _v3.y, 0);
          }
        }

        // Legs (knees & feet) against opponent pelvis, torso, knees, and feet
        for (const side of ['left', 'right'] as const) {
          const hipKey = side === 'left' ? 'leftHip' : 'rightHip';
          const kneeKey = side === 'left' ? 'leftKnee' : 'rightKnee';
          const footKey = side === 'left' ? 'leftFoot' : 'rightFoot';
          const oppOwnKnee = side === 'left' ? 'rightKnee' : 'leftKnee';
          const oppOwnFoot = side === 'left' ? 'rightFoot' : 'leftFoot';

          enforceLimbClearance(actor, hipKey, kneeKey, other, 'com', 0.235);
          enforceLimbClearance(actor, hipKey, kneeKey, other, 'chest', 0.235);
          enforceLimbClearance(actor, hipKey, kneeKey, other, 'leftKnee', 0.165);
          enforceLimbClearance(actor, hipKey, kneeKey, other, 'rightKnee', 0.165);
          enforceLimbClearance(actor, hipKey, kneeKey, other, 'leftFoot', 0.145);
          enforceLimbClearance(actor, hipKey, kneeKey, other, 'rightFoot', 0.145);

          enforceLimbClearance(actor, hipKey, footKey, other, 'com', 0.218);
          enforceLimbClearance(actor, hipKey, footKey, other, 'chest', 0.218);
          enforceLimbClearance(actor, hipKey, footKey, other, 'leftKnee', 0.148);
          enforceLimbClearance(actor, hipKey, footKey, other, 'rightKnee', 0.148);
          enforceLimbClearance(actor, hipKey, footKey, other, 'leftFoot', 0.135);
          enforceLimbClearance(actor, hipKey, footKey, other, 'rightFoot', 0.135);

          // Self leg separation (keep left & right legs from merging)
          enforceLimbClearance(actor, hipKey, kneeKey, actor, oppOwnKnee, 0.155);
          enforceLimbClearance(actor, hipKey, footKey, actor, oppOwnFoot, 0.125);

          // Tatami floor clearance for knees & feet
          actor.getWorldPoint(kneeKey, _v3);
          if (_v3.y < 0.082) {
            actor.nudgeLimbWorld(hipKey, kneeKey, 0, 0.082 - _v3.y, 0);
          }
          actor.getWorldPoint(footKey, _v3);
          if (_v3.y < 0.078) {
            actor.nudgeLimbWorld(hipKey, footKey, 0, 0.078 - _v3.y, 0);
          }
        }
      }
    }

    this.tori.refreshMatrices();
    this.uke.refreshMatrices();
  }

  private applyCurrentPose(instant = true, dt = 0.016, wrappedLoop = false) {
    const { tori, uke } = sampleTechniquePose(this.currentTech, this.progress);

    if (instant || !this.smoothInitialized || dt <= 0) {
      copyPose(tori, this.smoothTori);
      copyPose(uke, this.smoothUke);
      this.smoothInitialized = true;
    } else {
      if (wrappedLoop) {
        wrapAnglesNearTarget(tori, this.smoothTori);
        wrapAnglesNearTarget(uke, this.smoothUke);
      }
      // Smoothly ramp lambda from gentle loop-recovery up to crisp tracking
      const recoveryT = this.loopBlendTimer > 0 ? 1 - this.loopBlendTimer / 0.45 : 1;
      const baseLambda = 26 * Math.max(0.65, this.speed);
      const lambda = THREE.MathUtils.lerp(11, baseLambda, recoveryT * recoveryT);
      dampPose(tori, this.smoothTori, lambda, dt);
      dampPose(uke, this.smoothUke, lambda, dt);
    }

    this.tori.applyPose(this.smoothTori);
    this.uke.applyPose(this.smoothUke);

    const grips = sampleHandGrips(this.currentTech.id, this.progress);
    const micro = this.playing ? Math.sin(this.idlePhase * 3.2) * 0.03 : 0;
    this.tori.setHandGrips(
      grips.toriLeftCurl,
      grips.toriRightCurl,
      grips.toriLeftSpread,
      grips.toriRightSpread,
      grips.toriLeftWrist + micro,
      grips.toriRightWrist - micro,
    );
    this.uke.setHandGrips(
      grips.ukeLeftCurl,
      grips.ukeRightCurl,
      grips.ukeLeftSpread,
      grips.ukeRightSpread,
      grips.ukeLeftWrist,
      grips.ukeRightWrist,
    );

    this.resolveJudokaCollisions();
    this.updateTeachingGuides();
  }

  private updateTeachingGuides() {
    this.guidesGroup.visible = this.showGuides;
    if (!this.showGuides) return;

    // 1. Uke Center-of-Mass Plumb-line & Stability Ring
    this.uke.getWorldPoint('com', _v1);
    const posAttr = this.comPlumbGeo.attributes.position as THREE.BufferAttribute;
    posAttr.setXYZ(0, _v1.x, _v1.y, _v1.z);
    posAttr.setXYZ(1, _v1.x, 0.01, _v1.z);
    posAttr.needsUpdate = true;

    this.comRing.position.set(_v1.x, 0.008, _v1.z);

    // Compute how far Uke's COM has shifted outside Uke's foot support midpoint
    this.uke.getWorldPoint('leftFoot', _v2);
    this.uke.getWorldPoint('rightFoot', _v3);
    const midX = (_v2.x + _v3.x) * 0.5;
    const midZ = (_v2.z + _v3.z) * 0.5;
    const offset = Math.hypot(_v1.x - midX, _v1.z - midZ);
    const isFalling = _v1.y < 0.72 || offset > 0.24;
    const isOffBalance = offset > 0.12 || (this.progress > 0.2 && this.progress < 0.88);

    if (isFalling) {
      this.comRingMat.color.setHex(0xd94336); // Crimson: base of support lost!
    } else if (isOffBalance) {
      this.comRingMat.color.setHex(0xe5a83b); // Amber: kuzushi engaged
    } else {
      this.comRingMat.color.setHex(0x45c486); // Emerald: balanced
    }

    // 2. Kuzushi Vector Arrow (active during Kuzushi -> Kake phases)
    const showArrow = this.progress >= 0.15 && this.progress <= 0.84;
    this.kuzushiArrow.visible = showArrow;
    if (showArrow) {
      this.kuzushiArrow.position.set(_v1.x, _v1.y + 0.28, _v1.z);
      const kv = this.currentTech.kuzushiVector;
      _v2.set(kv[0], kv[1], kv[2]).normalize();
      this.kuzushiArrow.setDirection(_v2);
      const len = 0.45 + Math.sin(Math.min(1, (this.progress - 0.15) / 0.65) * Math.PI) * 0.35;
      this.kuzushiArrow.setLength(len, 0.15, 0.08);
    }

    // 3. Tori Hand Grip Markers (Hikite & Tsurite)
    this.tori.getWorldPoint('leftHand', _v2);
    this.leftGripMarker.position.copy(_v2);
    this.tori.getWorldPoint('rightHand', _v3);
    this.rightGripMarker.position.copy(_v3);
  }

  // Public Control API
  public setTechnique(tech: TechniqueSpec, resetProgress = true) {
    this.currentTech = tech;
    this.lastImpactTrigger = -1;
    this.lastSnapTrigger = -1;
    this.loopBlendTimer = 0;
    if (resetProgress) {
      this.progress = 0;
    }
    this.applyCurrentPose(true);
  }

  public setPlaying(playing: boolean) {
    this.playing = playing;
  }

  public setSpeed(speed: number) {
    this.speed = speed;
  }

  public setLoop(loop: boolean) {
    this.loop = loop;
  }

  public setProgress(p: number) {
    this.progress = Math.max(0, Math.min(1, p));
    this.lastImpactTrigger = -1;
    this.lastSnapTrigger = -1;
    this.loopBlendTimer = 0;
    this.applyCurrentPose(true);
  }

  public setShowGuides(show: boolean) {
    this.showGuides = show;
    this.updateTeachingGuides();
  }

  public setAutoOrbit(enabled: boolean) {
    this.autoOrbit = enabled;
    this.controls.autoRotate = enabled && !this.isSoftwareGl;
    this.controls.autoRotateSpeed = 1.4;
  }

  public setCameraPreset(presetId: CameraPresetId) {
    const preset = CAMERA_PRESETS.find((c) => c.id === presetId);
    if (!preset) return;
    this.camTargetPos.set(preset.position[0], preset.position[1], preset.position[2]);
    this.camTargetLook.set(preset.target[0], preset.target[1], preset.target[2]);
    this.camTransitionActive = true;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public captureSnapshot(quality = 0.85): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/jpeg', quality);
  }

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onWebGLContextLost?.(true);
  };

  private handleContextRestored = () => {
    this.callbacks.onWebGLContextLost?.(false);
  };

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }
  }

  private updateCameraKeyboard(dt: number) {
    const rotSpeed = 1.6 * dt;
    const zoomSpeed = 2.6 * dt;

    let orbitTheta = 0;
    let orbitPhi = 0;
    let zoomDelta = 0;

    if (this.keys['KeyA']) orbitTheta -= rotSpeed;
    if (this.keys['KeyD']) orbitTheta += rotSpeed;
    if (this.keys['KeyW']) zoomDelta -= zoomSpeed;
    if (this.keys['KeyS']) zoomDelta += zoomSpeed;
    if (this.keys['KeyQ']) orbitPhi -= rotSpeed * 0.7;
    if (this.keys['KeyE']) orbitPhi += rotSpeed * 0.7;

    if (orbitTheta !== 0 || orbitPhi !== 0 || zoomDelta !== 0) {
      this.camTransitionActive = false;
      _v1.copy(this.camera.position).sub(this.controls.target);
      const spherical = new THREE.Spherical().setFromVector3(_v1);
      spherical.theta += orbitTheta;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + orbitPhi, 0.14, Math.PI * 0.48);
      spherical.radius = THREE.MathUtils.clamp(spherical.radius + zoomDelta, 1.35, 7.8);
      _v1.setFromSpherical(spherical);
      this.camera.position.copy(this.controls.target).add(_v1);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private tick = () => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.1);
    this.idlePhase += dt;
    if (this.loopBlendTimer > 0) {
      this.loopBlendTimer = Math.max(0, this.loopBlendTimer - dt);
    }

    // Advance technique playback
    if (this.playing) {
      const prev = this.progress;
      const step = (dt * this.speed) / this.currentTech.durationSec;
      let next = prev + step;

      // Audio triggers on kake snap & ukemi impact
      if (prev < 0.66 && next >= 0.66 && this.lastSnapTrigger !== 1) {
        this.lastSnapTrigger = 1;
        dojoAudio.playGiSnap();
      }
      if (prev < 0.90 && next >= 0.90 && this.lastImpactTrigger !== 1) {
        this.lastImpactTrigger = 1;
        dojoAudio.playUkemiImpact(0.95);
      }

      let finishedNow = false;
      let wrappedLoop = false;
      if (next >= 1.0) {
        if (this.loop) {
          next = next % 1.0;
          this.lastImpactTrigger = -1;
          this.lastSnapTrigger = -1;
          this.loopBlendTimer = 0.45;
          wrappedLoop = true;
        } else {
          next = 1.0;
          this.playing = false;
          finishedNow = true;
        }
      }

      this.progress = next;
      this.applyCurrentPose(false, dt, wrappedLoop);

      const now = performance.now();
      if (now - this.lastUiEmit > 32 || !this.playing) {
        this.lastUiEmit = now;
        this.callbacks.onProgressChange?.(this.progress);
      }

      if (finishedNow) {
        this.callbacks.onPlaybackFinished?.();
      }
    }

    // Smooth camera preset transition (damped)
    if (this.camTransitionActive) {
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.camTargetPos.x, 7, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.camTargetPos.y, 7, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.camTargetPos.z, 7, dt);

      this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this.camTargetLook.x, 7, dt);
      this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this.camTargetLook.y, 7, dt);
      this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this.camTargetLook.z, 7, dt);

      if (
        this.camera.position.distanceTo(this.camTargetPos) < 0.015 &&
        this.controls.target.distanceTo(this.camTargetLook) < 0.015
      ) {
        this.camera.position.copy(this.camTargetPos);
        this.controls.target.copy(this.camTargetLook);
        this.camTransitionActive = false;
      }
    }

    this.updateCameraKeyboard(dt);
    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.controls.dispose();
    this.tori.dispose();
    this.uke.dispose();
    this.textures.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
