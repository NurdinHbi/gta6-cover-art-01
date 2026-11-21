/* Vice City Nights — the editor controller. Owns state, binds the controls,
 * loads photos (file picker or bundled samples) and drives the preview and
 * the PNG export through the same drawPoster() path cover.js provides.
 */

const EXPORT_SIZES = {
  '1080x1080': { w: 1080, h: 1080 },
  '1080x1350': { w: 1080, h: 1350 },
  '1920x1080': { w: 1920, h: 1080 },
};

const state = {
  title: 'VICE CITY NIGHTS',
  subtitle: 'A Leonida Story',
  footer: 'VICE CITY · LEONIDA',
  layout: 'hero',
  grade: 'sunset',
  sizeKey: '1080x1080',
  photos: [],
  panels: [
    // Panel 0 is the wide hero panel: bias it toward the top of the photo so
    // a portrait photo keeps the subject's face in frame (playtest finding:
    // centred cover-fit cut the face off at the chin in the hero panel).
    { photo: null, zoom: 100, offsetX: 0, offsetY: -60, flip: false },
    { photo: null, zoom: 100, offsetX: 0, offsetY: 0, flip: false },
    { photo: null, zoom: 100, offsetX: 0, offsetY: 0, flip: false },
  ],
};

const canvas = document.getElementById('poster');
const $ = (id) => document.getElementById(id);

function activePanelIndex() {
  return Number($('panel-select').value || 0);
}

function renderPreview() {
  const size = EXPORT_SIZES[state.sizeKey];
  canvas.width = size.w;
  canvas.height = size.h;
  drawPoster(canvas, state);
}

function refreshPhotoStatus() {
  const n = state.photos.length;
  $('photo-status').textContent = n === 0
    ? 'No photo loaded yet — pick one, or try a sample.'
    : n + (n === 1 ? ' photo loaded.' : ' photos loaded.') + ' Each panel takes the next photo in turn.';
  $('export-btn').disabled = false;
}

function assignPhotosToPanels() {
  if (state.photos.length === 0) {
    state.panels.forEach((p) => { p.photo = null; });
    return;
  }
  state.panels.forEach((p, i) => {
    p.photo = state.photos[i % state.photos.length];
  });
}

function loadPhotoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) {
      reject(new Error('Not an image file'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.photos.push(img);
      assignPhotosToPanels();
      refreshPhotoStatus();
      renderPreview();
      resolve(img);
    };
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = url;
  });
}

function loadSample(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      state.photos.push(img);
      assignPhotosToPanels();
      refreshPhotoStatus();
      renderPreview();
      resolve(img);
    };
    img.onerror = () => reject(new Error('Sample photo failed to load: ' + name));
    img.src = 'samples/' + name + '.jpg';
  });
}

function applyLayout(name) {
  if (!EXPORT_SIZES || (name !== 'hero' && name !== 'triptych' && name !== 'single')) return;
  state.layout = name;
  document.querySelectorAll('#layout-picker .choice').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === name);
  });
  renderPreview();
}

function applyGrade(name) {
  if (name !== 'sunset' && name !== 'neon' && name !== 'midnight') return;
  state.grade = name;
  document.querySelectorAll('#grade-picker .choice').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === name);
  });
  renderPreview();
}

function applySize(key) {
  if (!EXPORT_SIZES[key]) return;
  state.sizeKey = key;
  document.querySelectorAll('#size-picker .choice').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === key);
  });
  renderPreview();
}

function syncCropControls() {
  const p = state.panels[activePanelIndex()];
  $('zoom-range').value = p.zoom;
  $('x-range').value = p.offsetX;
  $('y-range').value = p.offsetY;
  $('flip-check').checked = p.flip;
  $('zoom-value').textContent = p.zoom + '%';
  $('x-value').textContent = p.offsetX;
  $('y-value').textContent = p.offsetY;
}

function exportPNG() {
  const size = EXPORT_SIZES[state.sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawPoster(off, state);
  return new Promise((resolve, reject) => {
    off.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Export failed: the canvas produced no image'));
        return;
      }
      downloadBlob(blob, 'vice-city-nights-' + state.sizeKey + '.png');
      resolve({ blob, width: size.w, height: size.h });
    }, 'image/png');
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function bindControls() {
  $('photo-input').addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    Promise.all(files.map((f) => loadPhotoFile(f).catch(() => null))).then(() => {
      e.target.value = '';
    });
  });
  $('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));
  $('sample-pier').addEventListener('click', () => loadSample('pier'));

  $('title-input').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
  $('subtitle-input').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
  $('footer-input').addEventListener('input', (e) => { state.footer = e.target.value; renderPreview(); });

  document.querySelectorAll('#layout-picker .choice').forEach((b) => {
    b.addEventListener('click', () => applyLayout(b.dataset.layout));
  });
  document.querySelectorAll('#grade-picker .choice').forEach((b) => {
    b.addEventListener('click', () => applyGrade(b.dataset.grade));
  });
  document.querySelectorAll('#size-picker .choice').forEach((b) => {
    b.addEventListener('click', () => applySize(b.dataset.size));
  });

  $('panel-select').addEventListener('change', syncCropControls);
  $('zoom-range').addEventListener('input', (e) => {
    const p = state.panels[activePanelIndex()];
    p.zoom = Number(e.target.value);
    $('zoom-value').textContent = p.zoom + '%';
    renderPreview();
  });
  $('x-range').addEventListener('input', (e) => {
    const p = state.panels[activePanelIndex()];
    p.offsetX = Number(e.target.value);
    $('x-value').textContent = p.offsetX;
    renderPreview();
  });
  $('y-range').addEventListener('input', (e) => {
    const p = state.panels[activePanelIndex()];
    p.offsetY = Number(e.target.value);
    $('y-value').textContent = p.offsetY;
    renderPreview();
  });
  $('flip-check').addEventListener('change', (e) => {
    state.panels[activePanelIndex()].flip = e.target.checked;
    renderPreview();
  });
  $('reset-crop').addEventListener('click', () => {
    const p = state.panels[activePanelIndex()];
    p.zoom = 100;
    p.offsetX = 0;
    p.offsetY = 0;
    p.flip = false;
    syncCropControls();
    renderPreview();
  });

  $('export-btn').addEventListener('click', () => {
    exportPNG().catch((err) => {
      $('photo-status').textContent = 'Export failed: ' + err.message;
    });
  });
}

// Test/automation hook: the same functions the UI calls, reachable from a
// headless browser so the build can be playtested end to end.
window.__vcn = { state, renderPreview, exportPNG, loadSample, applyLayout, applyGrade, applySize, EXPORT_SIZES };

bindControls();
syncCropControls();
if (document.fonts && document.fonts.load) {
  document.fonts.load('700 100px "Vice Sans"').catch(() => {}).finally(renderPreview);
}
renderPreview();
