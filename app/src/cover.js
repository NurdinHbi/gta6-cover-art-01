/* Vice City Nights — the poster painter. Pure canvas 2D, no network, no libraries.
 *
 * State shape (built by main.js):
 *   { title, subtitle, footer, layout: 'hero' | 'triptych' | 'single',
 *     grade: 'sunset' | 'neon' | 'midnight',
 *     panels: [{ photo: HTMLImageElement | null, zoom, offsetX, offsetY, flip }] }
 * A panel's photo is null until the user loads one; the painter then draws a
 * placeholder so the poster always looks finished.
 */

const GUTTER = 8;
const FRAME_INSET = 14;

function layoutRects(layout, w, h) {
  if (layout === 'triptych') {
    const cw = (w - GUTTER * 2) / 3;
    return [
      { x: 0, y: 0, w: cw, h },
      { x: cw + GUTTER, y: 0, w: cw, h },
      { x: (cw + GUTTER) * 2, y: 0, w: cw, h },
    ];
  }
  if (layout === 'single') {
    return [{ x: 0, y: 0, w, h }];
  }
  // hero: one large panel on top, two small ones below.
  const topH = Math.round(h * 0.62);
  const botH = h - topH - GUTTER;
  const botW = (w - GUTTER) / 2;
  return [
    { x: 0, y: 0, w, h: topH },
    { x: 0, y: topH + GUTTER, w: botW, h: botH },
    { x: botW + GUTTER, y: topH + GUTTER, w: botW, h: botH },
  ];
}

function drawPhotoPanel(ctx, photo, rect, crop) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  if (!photo || !photo.naturalWidth) {
    drawPlaceholder(ctx, rect);
    ctx.restore();
    return;
  }

  const zoom = (crop && crop.zoom ? crop.zoom : 100) / 100;
  const ox = (crop && crop.offsetX ? crop.offsetX : 0) / 100;
  const oy = (crop && crop.offsetY ? crop.offsetY : 0) / 100;
  const flip = !!(crop && crop.flip);

  // Cover-fit source rect: the photo fills the panel, cropped to its aspect.
  const panelAspect = rect.w / rect.h;
  const photoAspect = photo.naturalWidth / photo.naturalHeight;
  let sw, sh;
  if (photoAspect > panelAspect) {
    sh = photo.naturalHeight;
    sw = sh * panelAspect;
  } else {
    sw = photo.naturalWidth;
    sh = sw / panelAspect;
  }
  // Zoom shrinks the source window (image looks bigger); pan slides it.
  sw /= zoom;
  sh /= zoom;
  const maxSx = photo.naturalWidth - sw;
  const maxSy = photo.naturalHeight - sh;
  const sx = Math.max(0, Math.min(maxSx, (photo.naturalWidth - sw) / 2 + ox * maxSx * 0.5));
  const sy = Math.max(0, Math.min(maxSy, (photo.naturalHeight - sh) / 2 + oy * maxSy * 0.5));

  if (flip) {
    ctx.translate(rect.x + rect.w, rect.y);
    ctx.scale(-1, 1);
    ctx.drawImage(photo, sx, sy, sw, sh, 0, 0, rect.w, rect.h);
  } else {
    ctx.drawImage(photo, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  }

  // Gentle bottom shade inside the panel so caption text stays readable.
  const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(8,4,24,0)');
  shade.addColorStop(1, 'rgba(8,4,24,0.38)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawPlaceholder(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, '#2b1a5e');
  g.addColorStop(0.55, '#57204d');
  g.addColorStop(1, '#0e2a4a');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // Diagonal sun rays, faint, for a poster feel even with no photo.
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#ffb347';
  for (let i = 0; i < 5; i++) {
    const x0 = rect.x + (rect.w / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x0, rect.y + rect.h);
    ctx.lineTo(x0 + rect.w * 0.12, rect.y + rect.h);
    ctx.lineTo(x0 + rect.w * 0.45, rect.y);
    ctx.lineTo(x0 + rect.w * 0.28, rect.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '700 ' + Math.max(18, Math.round(rect.w * 0.045)) + 'px "Vice Sans", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function drawSunsetGrade(ctx, w, h, grade) {
  ctx.save();
  if (grade === 'neon') {
    // Cyan wash from the top-left, magenta from the bottom-right.
    ctx.globalCompositeOperation = 'soft-light';
    let g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(34,230,255,0.85)');
    g.addColorStop(0.5, 'rgba(20,10,60,0)');
    g.addColorStop(1, 'rgba(255,46,136,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // Hot edge glow along the top and bottom, kept inside the frame so it
    // never reads as a stray stripe across the poster's outer edge.
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = w * 0.02;
    ctx.strokeStyle = 'rgba(34,230,255,0.9)';
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(FRAME_INSET, FRAME_INSET + 3);
    ctx.lineTo(w - FRAME_INSET, FRAME_INSET + 3);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,46,136,0.9)';
    ctx.beginPath();
    ctx.moveTo(FRAME_INSET, h - FRAME_INSET - 3);
    ctx.lineTo(w - FRAME_INSET, h - FRAME_INSET - 3);
    ctx.stroke();
  } else if (grade === 'midnight') {
    ctx.globalCompositeOperation = 'overlay';
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(40,60,200,0.55)');
    g.addColorStop(0.6, 'rgba(90,40,180,0.35)');
    g.addColorStop(1, 'rgba(8,6,32,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // Vignette: darken the corners so the centre pops.
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(5,3,18,0)');
    v.addColorStop(1, 'rgba(5,3,18,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  } else {
    // sunset: orange horizon glow rising into pink and purple.
    ctx.globalCompositeOperation = 'overlay';
    const g = ctx.createLinearGradient(0, h * 0.35, 0, h);
    g.addColorStop(0, 'rgba(255,122,26,0)');
    g.addColorStop(0.45, 'rgba(255,122,26,0.55)');
    g.addColorStop(0.75, 'rgba(255,46,136,0.55)');
    g.addColorStop(1, 'rgba(139,61,255,0.65)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    const top = ctx.createLinearGradient(0, 0, 0, h * 0.4);
    top.addColorStop(0, 'rgba(255,190,90,0.5)');
    top.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h * 0.4);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function drawNeonFrame(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, w * 0.0025);
  ctx.strokeRect(FRAME_INSET, FRAME_INSET, w - FRAME_INSET * 2, h - FRAME_INSET * 2);
  ctx.strokeStyle = 'rgba(255,46,136,0.55)';
  ctx.lineWidth = Math.max(1, w * 0.0012);
  ctx.strokeRect(FRAME_INSET + 7, FRAME_INSET + 7, w - (FRAME_INSET + 7) * 2, h - (FRAME_INSET + 7) * 2);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = weight + ' ' + px + 'px ' + family;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = weight + ' ' + px + 'px ' + family;
  }
  return px;
}

function letterboxCaption(ctx, w, h, title, subtitle, footer) {
  // Dark gradient band across the lower third; the title sits on it.
  const bandTop = h * 0.66;
  const band = ctx.createLinearGradient(0, bandTop, 0, h);
  band.addColorStop(0, 'rgba(8,4,24,0)');
  band.addColorStop(0.25, 'rgba(8,4,24,0.72)');
  band.addColorStop(1, 'rgba(8,4,24,0.92)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, w, h - bandTop);

  const pad = w * 0.055;
  const maxText = w - pad * 2;
  const family = '"Vice Sans", "Arial Black", sans-serif';
  const base = h * 0.105;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  // Slight slant for the GTA poster feel.
  ctx.translate(pad + maxText * 0.02, h - h * 0.155);
  ctx.transform(1, 0, -0.07, 1, 0, 0);

  const titlePx = fitFont(ctx, title, maxText, base, family, '700');
  ctx.font = '700 ' + titlePx + 'px ' + family;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10,4,28,0.9)';
  ctx.lineWidth = Math.max(3, titlePx * 0.09);
  ctx.strokeText(title, 0, 0);
  const titleGrad = ctx.createLinearGradient(0, -titlePx, 0, titlePx * 0.15);
  titleGrad.addColorStop(0, '#fff7e8');
  titleGrad.addColorStop(0.55, '#ffb347');
  titleGrad.addColorStop(1, '#ff2e88');
  ctx.fillStyle = titleGrad;
  ctx.shadowColor = 'rgba(255,46,136,0.65)';
  ctx.shadowBlur = titlePx * 0.22;
  ctx.shadowOffsetY = titlePx * 0.04;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  // Subtitle and footer, straight, under the title.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const subPx = Math.max(20, Math.round(h * 0.028));
  ctx.font = '700 ' + subPx + 'px ' + family;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText(subtitle, pad, h - h * 0.085);
  const footPx = Math.max(15, Math.round(h * 0.02));
  ctx.font = '700 ' + footPx + 'px ' + family;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.shadowBlur = 4;
  ctx.fillText(footer, pad, h - h * 0.038);
  ctx.restore();
}

function drawCaptionBlock(ctx, title, subtitle, footer, w, h) {
  const cleanTitle = (title || 'VICE CITY NIGHTS').toUpperCase();
  const cleanSub = subtitle || '';
  const cleanFoot = (footer || '').toUpperCase();
  letterboxCaption(ctx, w, h, cleanTitle, cleanSub, cleanFoot);
}

function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Dark gutters show through between panels.
  ctx.fillStyle = '#0d0b1e';
  ctx.fillRect(0, 0, w, h);

  const rects = layoutRects(state.layout, w, h);
  const count = state.layout === 'single' ? 1 : 3;
  for (let i = 0; i < count; i++) {
    const panel = state.panels[i] || { photo: null, zoom: 100, offsetX: 0, offsetY: 0, flip: false };
    drawPhotoPanel(ctx, panel.photo, rects[i], panel);
  }

  drawSunsetGrade(ctx, w, h, state.grade);
  drawNeonFrame(ctx, w, h);
  drawCaptionBlock(ctx, state.title, state.subtitle, state.footer, w, h);
  return canvas;
}
