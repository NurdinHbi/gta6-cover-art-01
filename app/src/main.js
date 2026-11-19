// Vice City Nights — editor wiring: tray, layout/grade/size choices, caption,
// panel pan + zoom, live preview, PNG export. Photos never leave the machine.
import { SIZES, LAYOUTS, GRADES, panelCount, renderCover, drawCover, panelAt, layoutPanels as selectionRects } from './cover.js';

const SAMPLES = [
  { src: 'samples/sunset-boulevard.jpg', name: 'Sunset Boulevard' },
  { src: 'samples/neon-pier.jpg', name: 'Neon Pier' },
];

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: '1080x1350',
  title: 'VICE CITY NIGHTS',
  subtitle: 'Two friends. One last score.',
  kicker: 'LEONIDA · 2026',
  photos: [],          // HTMLImageElement list, tray order
  photoNames: [],
  panels: [0, 1, 2, 3].map(() => ({ photo: null, zoom: 1, ox: 0, oy: 0 })),
  selected: 0,
};

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const sctx = stage.getContext('2d');
const statusEl = $('status');

function setStatus(msg) { statusEl.textContent = msg; }

/** Redraw the live preview at the current export aspect, capped for the screen. */
function renderPreview() {
  const [w, h] = SIZES[state.size];
  const maxSide = 675;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  stage.width = Math.round(w * scale);
  stage.height = Math.round(h * scale);
  const ctx = stage.getContext('2d');
  ctx.setTransform(stage.width / w, 0, 0, stage.height / h, 0, 0);
  drawCover(ctx, w, h, state);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawSelection();
  updatePanelLabel();
}

/** Outline the selected panel on the preview canvas. */
function drawSelection() {
  // Recompute the panel rects in preview space from the live canvas size.
  const [w, h] = SIZES[state.size];
  const sx = stage.width / w, sy = stage.height / h;
  const rects = selectionRects(w, h);
  const r = rects[state.selected];
  if (!r) return;
  sctx.save();
  sctx.strokeStyle = '#ff2e88';
  sctx.lineWidth = 3;
  sctx.setLineDash([10, 6]);
  sctx.strokeRect(r.x * sx + 1, r.y * sy + 1, r.w * sx - 2, r.h * sy - 2);
  sctx.restore();
}

function updatePanelLabel() {
  const n = panelCount(state.layout);
  $('panelLabel').textContent = `Panel ${state.selected + 1} of ${n} — ` +
    (state.panels[state.selected].photo != null
      ? (state.photoNames[state.panels[state.selected].photo] || 'photo')
      : 'empty — pick a photo below');
  $('zoom').value = String(state.panels[state.selected].zoom);
}

/** Rebuild the photo tray thumbnails. */
function renderTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  state.photos.forEach((img, i) => {
    const el = document.createElement('img');
    el.src = img.src;
    el.alt = state.photoNames[i] || `Photo ${i + 1}`;
    el.title = el.alt + ' — click to put in the selected panel';
    el.className = state.panels[state.selected].photo === i ? 'selected' : '';
    el.addEventListener('click', () => assignPhoto(i));
    tray.appendChild(el);
  });
}

/** Put tray photo `i` into the selected panel (and remember it there). */
function assignPhoto(i) {
  state.panels[state.selected].photo = i;
  state.panels[state.selected].zoom = 1;
  state.panels[state.selected].ox = 0;
  state.panels[state.selected].oy = 0;
  renderTray();
  renderPreview();
  setStatus(`${state.photoNames[i] || 'Photo'} is in panel ${state.selected + 1}.`);
}

/** Load an image from a URL or data URL; resolves with the element. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

async function addPhoto(src, name) {
  const img = await loadImage(src);
  state.photos.push(img);
  state.photoNames.push(name);
  // First photo fills every empty panel so the preview is alive at once.
  if (state.photos.length === 1) {
    state.panels.forEach((p) => { p.photo = 0; });
  }
  renderTray();
  renderPreview();
}

/** Choice-button groups: one active button per group, state key updated. */
function wireChoices(id, key, values, onChange) {
  const root = $(id);
  root.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-' + key + ']');
    if (!btn) return;
    const value = btn.dataset[key];
    if (!values.includes(value)) return;
    state[key === 'size' ? 'size' : key] = value;
    root.querySelectorAll('.choice').forEach((c) => c.classList.toggle('active', c === btn));
    onChange(value);
  });
}

wireChoices('layoutChoices', 'layout', LAYOUTS, (v) => {
  state.selected = 0;
  renderPreview();
  setStatus(`Layout: ${v}.`);
});
wireChoices('gradeChoices', 'grade', GRADES, (v) => {
  renderPreview();
  setStatus(`Grade: ${v}.`);
});
wireChoices('sizeChoices', 'size', Object.keys(SIZES), (v) => {
  renderPreview();
  setStatus(`Export size: ${v}.`);
});

// Caption inputs.
$('kicker').addEventListener('input', (e) => { state.kicker = e.target.value.toUpperCase(); renderPreview(); });
$('title').addEventListener('input', (e) => { state.title = e.target.value.toUpperCase(); renderPreview(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });

// Zoom slider + fit/fill.
$('zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = parseFloat(e.target.value);
  renderPreview();
});
$('fitBtn').addEventListener('click', () => {
  const p = state.panels[state.selected];
  p.zoom = 1; p.ox = 0; p.oy = 0;
  renderPreview();
  setStatus('Panel fitted.');
});
$('fillBtn').addEventListener('click', () => {
  const p = state.panels[state.selected];
  p.zoom = 1.35; p.ox = 0; p.oy = 0;
  renderPreview();
  setStatus('Panel filled — drag to reposition.');
});

// Upload: FileReader, never leaves the machine.
$('upload').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const f of files) {
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('Could not read file'));
      r.readAsDataURL(f);
    });
    try {
      await addPhoto(dataUrl, f.name);
      setStatus(`Loaded ${f.name}.`);
    } catch {
      setStatus(`Could not load ${f.name} — try another image.`);
    }
  }
  e.target.value = '';
});

// Fill every panel with the selected panel's photo.
$('fillAll').addEventListener('click', () => {
  const p = state.panels[state.selected].photo;
  if (p == null) { setStatus('Pick a photo first.'); return; }
  state.panels.forEach((slot) => { slot.photo = p; });
  renderPreview();
  setStatus('All panels filled with that photo.');
});

// Preview pointer: click selects a panel, drag pans its photo.
let drag = null;
function canvasPoint(ev) {
  const rect = stage.getBoundingClientRect();
  const [w, h] = SIZES[state.size];
  return {
    x: (ev.clientX - rect.left) / rect.width * w,
    y: (ev.clientY - rect.top) / rect.height * h,
  };
}
stage.addEventListener('pointerdown', (ev) => {
  const pt = canvasPoint(ev);
  const [w, h] = SIZES[state.size];
  const idx = panelAt(state, w, h, pt.x, pt.y);
  if (idx < 0) return;
  state.selected = idx;
  renderTray();
  renderPreview();
  drag = { x: pt.x, y: pt.y, ox: state.panels[idx].ox, oy: state.panels[idx].oy, moved: false };
  stage.setPointerCapture(ev.pointerId);
  stage.classList.add('dragging');
});
stage.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const pt = canvasPoint(ev);
  const [w, h] = SIZES[state.size];
  const p = state.panels[state.selected];
  const dx = (pt.x - drag.x) / w, dy = (pt.y - drag.y) / h;
  if (Math.abs(dx) + Math.abs(dy) > 0.004) drag.moved = true;
  p.ox = Math.max(-1, Math.min(1, drag.ox - dx * 2));
  p.oy = Math.max(-1, Math.min(1, drag.oy - dy * 2));
  renderPreview();
});
stage.addEventListener('pointerup', () => {
  drag = null;
  stage.classList.remove('dragging');
});

// Export PNG at the chosen size.
$('exportBtn').addEventListener('click', () => {
  const canvas = renderCover(state, state.size);
  canvas.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-nights-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Exported vice-city-nights-${state.size}.png (${blob.size.toLocaleString()} bytes).`);
  }, 'image/png');
});

// Debug / playtest handle: the app's own state and renderer.
window.ViceCityNights = { state, renderCover, drawCover, renderPreview, addPhoto };

// Boot: load the two bundled samples, then show the cover.
Promise.all(SAMPLES.map((s) => addPhoto(s.src, s.name))).then(() => {
  state.panels[0].photo = 0;
  if (panelCount(state.layout) > 1) {
    state.panels[1].photo = 1;
    state.panels[2].photo = 0;
    state.panels[3].photo = 1;
  }
  renderTray();
  renderPreview();
  setStatus('Ready — pick a layout, grade and caption, then Download PNG.');
});
