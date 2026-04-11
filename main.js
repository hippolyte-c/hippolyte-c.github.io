/* ── Horloge menu bar ── */
function updateClock() {
  const el = document.getElementById('menubar-time');
  if (!el) return;
  const now = new Date();
  el.textContent =
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
}
updateClock();
setInterval(updateClock, 15000);

/* ── Drag générique ── */
let topZ = 20;
let draggingEl = null;
let ox = 0, oy = 0;

function startDrag(el, e) {
  draggingEl = el;
  ox = e.clientX - el.offsetLeft;
  oy = e.clientY - el.offsetTop;
  el.style.zIndex = ++topZ;
  document.body.style.userSelect = 'none';
}

document.addEventListener('mousemove', e => {
  if (!draggingEl) return;
  const desktop = document.querySelector('.desktop');
  const maxX = desktop.clientWidth  - draggingEl.offsetWidth;
  const maxY = desktop.clientHeight - draggingEl.offsetHeight;
  draggingEl.style.left = Math.max(0, Math.min(e.clientX - ox, maxX)) + 'px';
  draggingEl.style.top  = Math.max(0, Math.min(e.clientY - oy, maxY)) + 'px';
});

document.addEventListener('mouseup', () => {
  draggingEl = null;
  document.body.style.userSelect = '';
});

/* ── Fenêtres projet ── */
function openWin(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  win.classList.add('open');
  win.style.zIndex = ++topZ;
}

function closeWin(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  win.classList.remove('open');
  document.querySelector(`.dsk-icon[data-win="${id}"]`)?.classList.remove('active');
}

/* Clic sur icône de dossier */
document.querySelectorAll('.dsk-icon').forEach(btn => {
  btn.addEventListener('click', () => {
    const id  = btn.dataset.win;
    const win = document.getElementById('win-' + id);
    if (win?.classList.contains('open')) {
      win.style.zIndex = ++topZ;
    } else {
      btn.classList.add('active');
      openWin(id);
    }
  });
});

/* Bouton rouge → fermer */
document.querySelectorAll('.dot-red[data-close]').forEach(dot => {
  dot.addEventListener('click', e => { e.stopPropagation(); closeWin(dot.dataset.close); });
});

/* Drag des fenêtres */
document.querySelectorAll('.mac-win').forEach(win => {
  const bar = win.querySelector('.win-bar');
  if (bar) {
    bar.addEventListener('mousedown', e => {
      if (e.target.classList.contains('dot')) return;
      startDrag(win, e);
      e.preventDefault();
    });
  }
  win.addEventListener('mousedown', () => win.style.zIndex = ++topZ);
});

/* ── Post-it déplaçable ── */
const postit = document.getElementById('postit');
if (postit) {
  postit.addEventListener('mousedown', e => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
    startDrag(postit, e);
    e.preventDefault();
  });
}
