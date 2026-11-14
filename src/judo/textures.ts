import * as THREE from 'three';

export interface DojoTextureSet {
  whiteGiMap: THREE.CanvasTexture;
  whiteGiBump: THREE.CanvasTexture;
  blueGiMap: THREE.CanvasTexture;
  blueGiBump: THREE.CanvasTexture;
  skinFaceMap: THREE.CanvasTexture;
  skinDetailMap: THREE.CanvasTexture;
  hairMap: THREE.CanvasTexture;
  brandPatchMap: THREE.CanvasTexture;
  tatamiMap: THREE.CanvasTexture;
  tatamiBump: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  shojiMap: THREE.CanvasTexture;
  scrollMap: THREE.CanvasTexture;
  alidoSignMap: THREE.CanvasTexture;
  nafudaMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function configureTexture(
  tex: THREE.CanvasTexture,
  isColor: boolean,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
) {
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

/**
 * Heavyweight diamond-grain Sashiko cotton judogi weave + cloth crease bump map.
 */
function createSashikoTextures(
  baseHex: string,
  shadowHex: string,
  highlightHex: string,
  maxAniso: number,
): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 256;
  const [albedoCanvas, aCtx] = makeCanvas(size, size);
  const [bumpCanvas, bCtx] = makeCanvas(size, size);

  aCtx.fillStyle = baseHex;
  aCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const cell = 6;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const alt = ((x / cell) + (y / cell)) % 2 === 0;
      aCtx.fillStyle = alt ? highlightHex : shadowHex;
      aCtx.fillRect(x + 1, y + 1, cell - 2, cell / 2 - 1);
      aCtx.fillStyle = alt ? shadowHex : highlightHex;
      aCtx.fillRect(x + 2, y + cell / 2, cell - 3, cell / 2 - 1);

      bCtx.fillStyle = alt ? '#d0d0d0' : '#505050';
      bCtx.fillRect(x + 1, y + 1, cell - 2, cell / 2 - 1);
      bCtx.fillStyle = alt ? '#606060' : '#b8b8b8';
      bCtx.fillRect(x + 2, y + cell / 2, cell - 3, cell / 2 - 1);
    }
  }

  // Natural cloth fold crease waves in bump
  for (let i = 0; i < 12; i++) {
    const yBase = (i / 12) * size;
    const grad = bCtx.createLinearGradient(0, yBase, 0, yBase + 20);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0.14)');
    bCtx.fillStyle = grad;
    bCtx.fillRect(0, yBase, size, 20);
  }

  // Subtle stitched seam lines
  aCtx.strokeStyle = shadowHex;
  aCtx.globalAlpha = 0.24;
  aCtx.lineWidth = 1;
  for (let i = 0; i < size; i += 48) {
    aCtx.beginPath();
    aCtx.moveTo(i, 0);
    aCtx.lineTo(i, size);
    aCtx.stroke();
  }
  aCtx.globalAlpha = 1;

  const map = configureTexture(new THREE.CanvasTexture(albedoCanvas), true, maxAniso, 6, 6);
  const bump = configureTexture(new THREE.CanvasTexture(bumpCanvas), false, maxAniso, 6, 6);
  return [map, bump];
}

/**
 * High-detail 1024x1024 human face UV map inspired by the athletic judoka reference portrait:
 * warm tan complexion, natural cheekbone/jaw shading, expressive dark eyes, defined brows, nose & lips.
 */
function createHumanFaceTexture(maxAniso: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 1024;
  const [canvas, ctx] = makeCanvas(w, h);

  // Base warm athletic tan skin gradient
  const skinGrad = ctx.createLinearGradient(0, 0, 0, h);
  skinGrad.addColorStop(0.0, '#C79471');
  skinGrad.addColorStop(0.24, '#D9A785');
  skinGrad.addColorStop(0.52, '#DDA986');
  skinGrad.addColorStop(0.76, '#CF9976');
  skinGrad.addColorStop(1.0, '#B37E5D');
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle forehead light & T-zone warmth
  const foreheadGlow = ctx.createRadialGradient(w * 0.5, h * 0.36, 12, w * 0.5, h * 0.36, 140);
  foreheadGlow.addColorStop(0, 'rgba(245, 206, 176, 0.32)');
  foreheadGlow.addColorStop(1, 'rgba(245, 206, 176, 0)');
  ctx.fillStyle = foreheadGlow;
  ctx.fillRect(w * 0.32, h * 0.20, w * 0.36, h * 0.30);

  // Cheekbone warmth & subtle jawline contour
  const drawCheek = (cx: number, cy: number) => {
    const rg = ctx.createRadialGradient(cx, cy, 8, cx, cy, 68);
    rg.addColorStop(0, 'rgba(186, 102, 82, 0.20)');
    rg.addColorStop(1, 'rgba(186, 102, 82, 0)');
    ctx.fillStyle = rg;
    ctx.fillRect(cx - 75, cy - 75, 150, 150);
  };
  drawCheek(w * 0.425, h * 0.56);
  drawCheek(w * 0.575, h * 0.56);

  // Jawline shadow contour along lower face
  const jawGrad = ctx.createRadialGradient(w * 0.5, h * 0.78, 35, w * 0.5, h * 0.75, 175);
  jawGrad.addColorStop(0, 'rgba(110, 65, 45, 0)');
  jawGrad.addColorStop(0.75, 'rgba(110, 65, 45, 0.16)');
  jawGrad.addColorStop(1, 'rgba(110, 65, 45, 0)');
  ctx.fillStyle = jawGrad;
  ctx.fillRect(w * 0.25, h * 0.58, w * 0.50, h * 0.34);

  // Realistic Eyes + Defined Athletic Brows
  const drawEye = (ex: number, ey: number, dir: number) => {
    // Soft orbital socket shading
    const sock = ctx.createRadialGradient(ex, ey, 4, ex, ey, 38);
    sock.addColorStop(0, 'rgba(105, 62, 42, 0.32)');
    sock.addColorStop(1, 'rgba(105, 62, 42, 0)');
    ctx.fillStyle = sock;
    ctx.fillRect(ex - 42, ey - 42, 84, 84);

    // Upper eyelid crease
    ctx.strokeStyle = 'rgba(95, 56, 38, 0.55)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(ex, ey - 4, 21, 10, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Almond sclera
    ctx.fillStyle = '#EAE6DF';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 19, 8.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris (rich dark espresso)
    ctx.fillStyle = '#2B1D16';
    ctx.beginPath();
    ctx.arc(ex, ey, 8.2, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#0D0907';
    ctx.beginPath();
    ctx.arc(ex, ey, 4.1, 0, Math.PI * 2);
    ctx.fill();

    // Crisp catchlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex + 2.6, ey - 2.6, 2.1, 0, Math.PI * 2);
    ctx.fill();

    // Upper lash line
    ctx.strokeStyle = '#1B130F';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.ellipse(ex, ey - 0.8, 20, 8.6, 0, Math.PI * 1.04, Math.PI * 1.96);
    ctx.stroke();

    // Thick athletic dark eyebrow (like reference photo)
    ctx.strokeStyle = '#1E1714';
    ctx.lineWidth = 9.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - dir * 24, ey - 20);
    ctx.quadraticCurveTo(ex + dir * 2, ey - 27, ex + dir * 25, ey - 22);
    ctx.stroke();
  };

  drawEye(w * 0.445, h * 0.47, 1);
  drawEye(w * 0.555, h * 0.47, -1);

  // Nose bridge highlight & under-nose nostril shadow
  const noseShade = ctx.createRadialGradient(w * 0.5, h * 0.585, 4, w * 0.5, h * 0.585, 22);
  noseShade.addColorStop(0, 'rgba(115, 68, 46, 0.34)');
  noseShade.addColorStop(1, 'rgba(115, 68, 46, 0)');
  ctx.fillStyle = noseShade;
  ctx.fillRect(w * 0.47, h * 0.55, w * 0.06, h * 0.07);

  // Subtle nostrils
  ctx.fillStyle = 'rgba(72, 38, 26, 0.48)';
  ctx.beginPath();
  ctx.ellipse(w * 0.489, h * 0.588, 4.2, 2.6, 0.25, 0, Math.PI * 2);
  ctx.ellipse(w * 0.511, h * 0.588, 4.2, 2.6, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // Philtrum shadow
  ctx.fillStyle = 'rgba(125, 76, 54, 0.22)';
  ctx.fillRect(w * 0.495, h * 0.605, w * 0.010, h * 0.042);

  // Natural upper & lower lips
  ctx.fillStyle = '#B06E5B';
  ctx.beginPath();
  ctx.moveTo(w * 0.468, h * 0.672);
  ctx.quadraticCurveTo(w * 0.488, h * 0.658, w * 0.500, h * 0.665);
  ctx.quadraticCurveTo(w * 0.512, h * 0.658, w * 0.532, h * 0.672);
  ctx.quadraticCurveTo(w * 0.500, h * 0.692, w * 0.468, h * 0.672);
  ctx.fill();

  // Lip parting line
  ctx.strokeStyle = '#6E3C30';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.468, h * 0.672);
  ctx.quadraticCurveTo(w * 0.500, h * 0.676, w * 0.532, h * 0.672);
  ctx.stroke();

  // Soft chin shadow crease
  ctx.fillStyle = 'rgba(115, 72, 52, 0.18)';
  ctx.beginPath();
  ctx.ellipse(w * 0.50, h * 0.708, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Natural back/side tapered hairline fade (forehead stays clear around u = 0.5)
  const hairFade = ctx.createLinearGradient(0, 0, 0, h * 0.36);
  hairFade.addColorStop(0, 'rgba(26, 22, 20, 0.96)');
  hairFade.addColorStop(0.55, 'rgba(26, 22, 20, 0.45)');
  hairFade.addColorStop(1, 'rgba(26, 22, 20, 0)');
  ctx.fillStyle = hairFade;
  ctx.fillRect(0, 0, w, h * 0.21);
  ctx.fillRect(0, h * 0.21, w * 0.36, h * 0.16);
  ctx.fillRect(w * 0.64, h * 0.21, w * 0.36, h * 0.16);

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso);
}

/**
 * Subtle organic skin pore & forearm texture for lifelike forearms, hands, neck, and feet.
 */
function createSkinDetailTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#D6A17E';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 600; i++) {
    const x = (i * 53) % size;
    const y = (i * 97) % size;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(150, 96, 68, 0.10)' : 'rgba(240, 198, 168, 0.10)';
    ctx.fillRect(x, y, 2, 2);
  }
  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso, 2, 2);
}

/**
 * Curly athletic hair texture with subtle frosted tips (matching reference image hairstyle).
 */
function createHairTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#181514';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 950; i++) {
    const x = (i * 37) % size;
    const y = (i * 61) % size;
    const frosted = i % 11 === 0;
    ctx.strokeStyle = frosted
      ? 'rgba(195, 185, 168, 0.42)'
      : i % 2 === 0
        ? 'rgba(55, 48, 44, 0.55)'
        : 'rgba(10, 8, 8, 0.65)';
    ctx.lineWidth = frosted ? 2.2 : 1.8;
    ctx.beginPath();
    ctx.arc(x, y, 4 + (i % 5), 0, Math.PI * 1.4);
    ctx.stroke();
  }

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso, 2, 2);
}

/**
 * Red woven brand label patch (sleeve, lower lapel skirt & belt tip, matching reference photo).
 */
function createBrandPatchTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 128;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#B82B24';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#F2EFE8';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, size - 16, size - 16);
  ctx.fillStyle = '#F2EFE8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 46px serif';
  ctx.fillText('柔', size / 2, size / 2 + 2);
  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso);
}

/**
 * Carved dark-cedar & brushed-gold "ALIDO" dojo signboard (Gaku) mounted at the top of the dojo.
 */
function createAlidoSignTexture(maxAniso: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 256;
  const [canvas, ctx] = makeCanvas(w, h);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#2B1B10');
  bg.addColorStop(0.5, '#1F130B');
  bg.addColorStop(1, '#160D07');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let y = 8; y < h; y += 10) {
    ctx.strokeStyle = y % 20 === 0 ? 'rgba(255, 210, 150, 0.04)' : 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#C9A258';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.strokeStyle = 'rgba(201, 162, 88, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, w - 52, h - 52);

  const drawCrest = (cx: number, cy: number) => {
    ctx.fillStyle = '#B8342A';
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E8C57B';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#F4EFE4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px serif';
    ctx.fillText('柔', cx, cy + 2);
  };
  drawCrest(118, h / 2);
  drawCrest(w - 118, h / 2);

  ctx.fillStyle = '#F5DFB0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 116px "Georgia", "Times New Roman", serif';
  ctx.fillText('ALIDO', w / 2, h / 2 - 14);

  ctx.fillStyle = '#C9A258';
  ctx.font = 'bold 26px "Georgia", serif';
  ctx.fillText('柔道道場 · JUDO DOJO', w / 2, h / 2 + 64);

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso);
}

/**
 * Traditional Japanese Nafudakake (wooden belt-rank & member name rack).
 */
function createNafudakakeTexture(maxAniso: number): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);

  ctx.fillStyle = '#382416';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#6E4B2E';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  const beltColors = ['#F2EFE6', '#E0B93C', '#D87428', '#3E824F', '#2B5EA8', '#6B4226', '#18191D'];
  const titles = ['白帯', '黄帯', '橙帯', '緑帯', '青帯', '茶帯', '黒帯'];
  const cols = 7;
  const tagW = (w - 64) / cols;

  for (let i = 0; i < cols; i++) {
    const x = 32 + i * tagW + 6;
    const tw = tagW - 12;
    ctx.fillStyle = '#DEC9A4';
    ctx.fillRect(x, 38, tw, 360);
    ctx.strokeStyle = '#4A311E';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 38, tw, 360);

    ctx.fillStyle = beltColors[i];
    ctx.fillRect(x + 2, 342, tw - 4, 46);

    ctx.fillStyle = '#1E1A16';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px serif';
    ctx.fillText(titles[i][0], x + tw / 2, 130);
    ctx.fillText(titles[i][1], x + tw / 2, 195);
    ctx.font = 'bold 20px serif';
    ctx.fillText('道', x + tw / 2, 265);
  }

  ctx.fillStyle = '#2A1A0E';
  ctx.fillRect(16, 430, w - 32, 36);

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso);
}

/**
 * Competition Judo Tatami Arena texture (14m x 14m total, 10m x 10m inner zone, 1m crimson danger zone).
 */
function createTatamiTextures(maxAniso: number): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 1024;
  const [canvas, ctx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  const pxPerMeter = size / 14;

  const drawMat = (gx: number, gy: number, w: number, h: number, color: string, horizontal: boolean) => {
    const x = gx * pxPerMeter;
    const y = gy * pxPerMeter;
    const pw = w * pxPerMeter;
    const ph = h * pxPerMeter;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, pw, ph);

    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    bCtx.fillStyle = '#888888';
    bCtx.fillRect(x, y, pw, ph);
    bCtx.strokeStyle = 'rgba(0,0,0,0.22)';
    bCtx.lineWidth = 1;

    const step = 4;
    if (horizontal) {
      for (let ry = y + 2; ry < y + ph; ry += step) {
        ctx.beginPath();
        ctx.moveTo(x, ry);
        ctx.lineTo(x + pw, ry);
        ctx.stroke();

        bCtx.beginPath();
        bCtx.moveTo(x, ry);
        bCtx.lineTo(x + pw, ry);
        bCtx.stroke();
      }
    } else {
      for (let rx = x + 2; rx < x + pw; rx += step) {
        ctx.beginPath();
        ctx.moveTo(rx, y);
        ctx.lineTo(rx, y + ph);
        ctx.stroke();

        bCtx.beginPath();
        bCtx.moveTo(rx, y);
        bCtx.lineTo(rx, y + ph);
        bCtx.stroke();
      }
    }

    ctx.strokeStyle = 'rgba(18, 22, 16, 0.42)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);

    bCtx.strokeStyle = '#202020';
    bCtx.lineWidth = 2.5;
    bCtx.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);
  };

  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 14; col++) {
      const inOuter = col < 2 || col >= 12 || row < 2 || row >= 12;
      const inDanger = !inOuter && (col === 2 || col === 11 || row === 2 || row === 11);

      const checker = (row + col) % 2 === 0;
      let matColor = '#939D73';
      if (inOuter) {
        matColor = checker ? '#7E8762' : '#77805C';
      } else if (inDanger) {
        matColor = checker ? '#A63A2E' : '#9B3529';
      } else {
        matColor = checker ? '#9BA579' : '#929C71';
      }

      drawMat(col, row, 1, 1, matColor, checker);
    }
  }

  const center = size / 2;
  ctx.fillStyle = 'rgba(244, 241, 234, 0.72)';
  ctx.fillRect(center - 16, center - 0.55 * pxPerMeter - 3, 32, 5);
  ctx.fillStyle = 'rgba(42, 108, 198, 0.78)';
  ctx.fillRect(center - 16, center + 0.55 * pxPerMeter - 2, 32, 5);

  const map = configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso);
  const bump = configureTexture(new THREE.CanvasTexture(bCanvas), false, maxAniso);
  return [map, bump];
}

function createWoodTextures(maxAniso: number): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  ctx.fillStyle = '#5C4028';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const plankHeight = 64;
  for (let p = 0; p < size / plankHeight; p++) {
    const y0 = p * plankHeight;
    const toneShift = ((p % 3) - 1) * 8;
    ctx.fillStyle = `rgb(${96 + toneShift}, ${66 + toneShift}, ${42 + Math.floor(toneShift * 0.6)})`;
    ctx.fillRect(0, y0, size, plankHeight - 2);

    for (let g = 0; g < 16; g++) {
      const gy = y0 + 3 + (g / 16) * (plankHeight - 6);
      ctx.strokeStyle = g % 2 === 0 ? 'rgba(38, 22, 10, 0.16)' : 'rgba(180, 130, 82, 0.12)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      for (let x = 0; x <= size; x += 32) {
        ctx.lineTo(x, gy + Math.sin(x * 0.02 + p * 2.1 + g) * 2.5);
      }
      ctx.stroke();
    }

    ctx.fillStyle = '#2A1A0E';
    ctx.fillRect(0, y0 + plankHeight - 2, size, 2);
    bCtx.fillStyle = '#383838';
    bCtx.fillRect(0, y0 + plankHeight - 2, size, 2);
  }

  const map = configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso, 4, 4);
  const bump = configureTexture(new THREE.CanvasTexture(bCanvas), false, maxAniso, 4, 4);
  return [map, bump];
}

function createShojiTexture(maxAniso: number): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#E9DFCB');
  grad.addColorStop(0.6, '#DDD1BA');
  grad.addColorStop(1, '#C5B69C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255, 250, 240, 0.18)';
  for (let i = 0; i < 600; i++) {
    const x = (i * 73) % w;
    const y = (i * 139) % h;
    ctx.fillRect(x, y, 6, 1);
  }

  ctx.fillStyle = '#4B3321';
  const cols = 4;
  const rows = 8;
  for (let c = 0; c <= cols; c++) {
    const x = (c / cols) * w - 4;
    ctx.fillRect(x, 0, 8, h);
  }
  for (let r = 0; r <= rows; r++) {
    const y = (r / rows) * h - 3;
    ctx.fillRect(0, y, w, 6);
  }
  ctx.strokeStyle = '#382415';
  ctx.lineWidth = 20;
  ctx.strokeRect(0, 0, w, h);

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso, 2, 1);
}

function createDojoScrollTexture(maxAniso: number): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);

  ctx.fillStyle = '#2B313B';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#B89552';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 54, w - 44, h - 108);

  ctx.fillStyle = '#EFE7D6';
  ctx.fillRect(26, 58, w - 52, h - 116);

  ctx.fillStyle = '#18181A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 92px serif';
  ctx.fillText('柔', w / 2, 185);
  ctx.fillText('道', w / 2, 305);

  ctx.fillStyle = '#B8342A';
  ctx.fillRect(w / 2 + 34, 355, 28, 28);
  ctx.fillStyle = '#EFE7D6';
  ctx.font = 'bold 14px serif';
  ctx.fillText('礼', w / 2 + 48, 370);

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso);
}

function createContactShadowTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 128;
  const [canvas, ctx] = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(10, 12, 10, 0.55)');
  g.addColorStop(0.55, 'rgba(10, 12, 10, 0.22)');
  g.addColorStop(1, 'rgba(10, 12, 10, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAniso);
}

export function createDojoTextures(renderer: THREE.WebGLRenderer): DojoTextureSet {
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

  const [whiteGiMap, whiteGiBump] = createSashikoTextures('#ECEAE4', '#D6D2C9', '#FBFBF9', maxAniso);
  const [blueGiMap, blueGiBump] = createSashikoTextures('#1F4E96', '#15386E', '#2B64BC', maxAniso);
  const skinFaceMap = createHumanFaceTexture(maxAniso);
  const skinDetailMap = createSkinDetailTexture(maxAniso);
  const hairMap = createHairTexture(maxAniso);
  const brandPatchMap = createBrandPatchTexture(maxAniso);
  const [tatamiMap, tatamiBump] = createTatamiTextures(maxAniso);
  const [woodMap, woodBump] = createWoodTextures(maxAniso);
  const shojiMap = createShojiTexture(maxAniso);
  const scrollMap = createDojoScrollTexture(maxAniso);
  const alidoSignMap = createAlidoSignTexture(maxAniso);
  const nafudaMap = createNafudakakeTexture(maxAniso);
  const contactShadowMap = createContactShadowTexture(maxAniso);

  return {
    whiteGiMap,
    whiteGiBump,
    blueGiMap,
    blueGiBump,
    skinFaceMap,
    skinDetailMap,
    hairMap,
    brandPatchMap,
    tatamiMap,
    tatamiBump,
    woodMap,
    woodBump,
    shojiMap,
    scrollMap,
    alidoSignMap,
    nafudaMap,
    contactShadowMap,
    dispose: () => {
      whiteGiMap.dispose();
      whiteGiBump.dispose();
      blueGiMap.dispose();
      blueGiBump.dispose();
      skinFaceMap.dispose();
      skinDetailMap.dispose();
      hairMap.dispose();
      brandPatchMap.dispose();
      tatamiMap.dispose();
      tatamiBump.dispose();
      woodMap.dispose();
      woodBump.dispose();
      shojiMap.dispose();
      scrollMap.dispose();
      alidoSignMap.dispose();
      nafudaMap.dispose();
      contactShadowMap.dispose();
    },
  };
}
