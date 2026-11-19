// Vice City Nights — cover renderer. Pure canvas drawing, no network, no fonts
// shipped: lettering uses the system condensed stack only.
export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const LAYOUTS = ['hero', 'trio', 'grid', 'single'];
export const GRADES = ['sunset', 'neon', 'noir', 'pastel'];

/** Panel rectangles (pixels) for a layout at canvas size w x h. Gutter g. */
export function layoutPanels(layout, w, h) {
  const g = Math.max(4, Math.round(Math.min(w, h) * 0.012));
  const full = { x: 0, y: 0, w, h };
  if (layout === 'single') return [full];
  if (layout === 'grid') {
    const hw = (w - g) / 2, hh = (h - g) / 2;
    return [
      { x: 0, y: 0, w: hw, h: hh },
      { x: hw + g, y: 0, w: hw, h: hh },
      { x: 0, y: hh + g, w: hw, h: hh },
      { x: hw + g, y: hh + g, w: hw, h: hh },
    ];
  }
  if (layout === 'trio') {
    if (w >= h) {
      const cw = (w - 2 * g) / 3;
      return [0, 1, 2].map((i) => ({ x: i * (cw + g), y: 0, w: cw, h }));
    }
    const ch = (h - 2 * g) / 3;
    return [0, 1, 2].map((i) => ({ x: 0, y: i * (ch + g), w, h: ch }));
  }
  // hero: one big panel on top, a strip of three below it.
  const heroH = Math.round(h * 0.62);
  const stripH = h - heroH - g;
  const cw = (w - 2 * g) / 3;
  return [
    { x: 0, y: 0, w, h: heroH },
    { x: 0, y: heroH + g, w: cw, h: stripH },
    { x: cw + g, y: heroH + g, w: cw, h: stripH },
    { x: 2 * (cw + g), y: heroH + g, w: cw, h: stripH },
  ];
}

/** Panel slot count a layout shows. */
export function panelCount(layout) {
  return layoutPanels(layout, 100, 100).length;
}

/**
 * Source rectangle of an image for cover-fit into a panel of pw x ph,
 * zoomed by `zoom` (>= 1) and panned by ox/oy (fractions of the shown span).
 */
export function coverSourceRect(img, pw, ph, zoom, ox, oy) {
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
  const shownW = pw / scale, shownH = ph / scale;
  const maxOx = Math.max(0, (img.naturalWidth - shownW) / 2);
  const maxOy = Math.max(0, (img.naturalHeight - shownH) / 2);
  const cx = img.naturalWidth / 2 + ox * maxOx;
  const cy = img.naturalHeight / 2 + oy * maxOy;
  return { sx: cx - shownW / 2, sy: cy - shownH / 2, sw: shownW, sh: shownH };
}

/** A flat placeholder photo (procedural gradient + sun) when a panel has none. */
function drawPlaceholder(ctx, r, hue) {
  const grad = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  grad.addColorStop(0, `hsl(${hue}, 70%, 42%)`);
  grad.addColorStop(0.6, `hsl(${hue + 40}, 80%, 55%)`);
  grad.addColorStop(1, `hsl(${hue + 70}, 75%, 30%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = 'rgba(255, 240, 200, 0.9)';
  ctx.beginPath();
  ctx.arc(r.x + r.w * 0.62, r.y + r.h * 0.42, Math.min(r.w, r.h) * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(10, 4, 20, 0.55)';
  ctx.fillRect(r.x, r.y + r.h * 0.66, r.w, r.h * 0.34);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `700 ${Math.max(13, Math.round(r.w * 0.045))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', r.x + r.w / 2, r.y + r.h * 0.82);
}

/** Colour-grade overlays, drawn over the whole cover. */
function applyGrade(ctx, grade, w, h) {
  const v = ctx.createLinearGradient(0, 0, 0, h);
  if (grade === 'sunset') {
    v.addColorStop(0, 'rgba(255, 46, 136, 0.20)');
    v.addColorStop(0.55, 'rgba(255, 120, 60, 0.05)');
    v.addColorStop(1, 'rgba(255, 170, 40, 0.26)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    v.addColorStop(0, 'rgba(255, 0, 170, 0.30)');
    v.addColorStop(0.5, 'rgba(120, 40, 220, 0.08)');
    v.addColorStop(1, 'rgba(0, 220, 255, 0.30)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(90, 20, 160, 0.18)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgb(128, 128, 128)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    const d = ctx.createLinearGradient(0, 0, w, h);
    d.addColorStop(0, 'rgba(70, 70, 90, 0.35)');
    d.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = d;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(0, 0, w, h);
  } else {
    // pastel dawn
    v.addColorStop(0, 'rgba(255, 170, 210, 0.30)');
    v.addColorStop(1, 'rgba(160, 230, 255, 0.30)');
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 245, 250, 0.10)';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = 'source-over';
  // Vignette: darker corners, brighter centre.
  const rad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  rad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  rad.addColorStop(1, 'rgba(0, 0, 0, 0.36)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, w, h);
}

/** Shrink a font until `text` fits `maxWidth`; returns the px size used. */
function fitFont(ctx, text, maxWidth, startPx, stack) {
  let px = startPx;
  ctx.font = `900 ${px}px ${stack}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `900 ${px}px ${stack}`;
  }
  return px;
}

const LETTER_STACK = '"Arial Narrow", Impact, "Franklin Gothic Medium", "Helvetica Neue", sans-serif';

/** Bold condensed caption block over a dark scrim at the foot of the cover. */
function drawCaption(ctx, w, h, state) {
  const bandH = Math.round(h * 0.30);
  const bandY = h - bandH;
  const scrim = ctx.createLinearGradient(0, bandY - bandH * 0.35, 0, h);
  scrim.addColorStop(0, 'rgba(8, 2, 18, 0)');
  scrim.addColorStop(0.55, 'rgba(8, 2, 18, 0.72)');
  scrim.addColorStop(1, 'rgba(8, 2, 18, 0.92)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - bandH * 0.35, w, bandH * 1.35);

  const pad = Math.round(w * 0.045);
  const maxW = w - pad * 2;
  const ref = Math.min(w, h); // caption type scales with the short side, so a
  // wide poster keeps the same vertical rhythm as a tall one.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Pink rule + kicker.
  const kickPx = fitFont(ctx, state.kicker, maxW, Math.round(ref * 0.032), LETTER_STACK);
  const kickY = bandY + Math.round(bandH * 0.28);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(pad, kickY - Math.round(kickPx * 0.9), Math.round(w * 0.10), Math.max(3, Math.round(ref * 0.006)));
  ctx.fillStyle = '#ffd166';
  ctx.font = `900 ${kickPx}px ${LETTER_STACK}`;
  try { ctx.letterSpacing = `${Math.max(2, Math.round(ref * 0.004))}px`; } catch { /* older canvas */ }
  ctx.fillText(state.kicker, pad, kickY);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }

  // Title: white fill, dark outline. Its baseline stacks below the kicker by
  // its own size, so the two lines can never overlap at any aspect ratio.
  const titlePx = fitFont(ctx, state.title, maxW, Math.round(ref * 0.105), LETTER_STACK);
  const titleY = kickY + Math.round(titlePx * 1.08);
  ctx.font = `900 ${titlePx}px ${LETTER_STACK}`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 2, 20, 0.85)';
  ctx.lineWidth = Math.max(2, Math.round(titlePx * 0.09));
  ctx.strokeText(state.title, pad, titleY);
  const titleGrad = ctx.createLinearGradient(0, titleY - titlePx, 0, titleY);
  titleGrad.addColorStop(0, '#ffffff');
  titleGrad.addColorStop(1, '#ffd9ec');
  ctx.fillStyle = titleGrad;
  ctx.fillText(state.title, pad, titleY);

  // Subtitle.
  if (state.subtitle) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    const subPx = fitFont(ctx, state.subtitle, maxW, Math.round(ref * 0.036), '"Segoe UI", system-ui, sans-serif');
    ctx.font = `600 ${subPx}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(state.subtitle, pad, titleY + Math.round(subPx * 1.7));
  }
}

/** Draw the whole cover into `ctx` at size w x h from `state`. */
export function drawCover(ctx, w, h, state) {
  ctx.save();
  ctx.fillStyle = '#0b0616';
  ctx.fillRect(0, 0, w, h);
  const panels = layoutPanels(state.layout, w, h);
  panels.forEach((r, i) => {
    const slot = state.panels[i] || { photo: null, zoom: 1, ox: 0, oy: 0 };
    const img = slot.photo != null ? state.photos[slot.photo] || null : null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    if (img) {
      const s = coverSourceRect(img, r.w, r.h, slot.zoom, slot.ox, slot.oy);
      ctx.drawImage(img, s.sx, s.sy, s.sw, s.sh, r.x, r.y, r.w, r.h);
    } else {
      drawPlaceholder(ctx, r, 300 + i * 35);
    }
    ctx.restore();
    // Panel frame: dark gutter edge + thin light inner line.
    ctx.strokeStyle = 'rgba(8, 2, 16, 0.9)';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.008));
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  });
  applyGrade(ctx, state.grade, w, h);
  drawCaption(ctx, w, h, state);
  ctx.restore();
}

/** Render a fresh canvas of the cover at the named export size. */
export function renderCover(state, sizeName) {
  const [w, h] = SIZES[sizeName] || SIZES['1080x1350'];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas.getContext('2d'), w, h, state);
  return canvas;
}

/** Which panel index contains canvas point (px, py), or -1. */
export function panelAt(state, w, h, px, py) {
  const panels = layoutPanels(state.layout, w, h);
  for (let i = panels.length - 1; i >= 0; i--) {
    const r = panels[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}
