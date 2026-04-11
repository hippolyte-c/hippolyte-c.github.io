/* ── Horloge menu bar ── */
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const el = document.getElementById('menubar-time');
  if (el) el.textContent = h + ':' + m;
}
updateClock();
setInterval(updateClock, 15000);

/* ── Gestion des fenêtres ── */
let topZ = 20;

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
  const icon = document.querySelector(`.dsk-icon[data-win="${id}"]`);
  if (icon) icon.classList.remove('active');
}

/* Clic sur icône de dossier */
document.querySelectorAll('.dsk-icon').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.win;
    const win = document.getElementById('win-' + id);
    const isOpen = win && win.classList.contains('open');

    if (isOpen) {
      /* Deuxième clic : mettre au premier plan */
      win.style.zIndex = ++topZ;
    } else {
      btn.classList.add('active');
      openWin(id);
    }
  });
});

/* Bouton rouge (fermer) */
document.querySelectorAll('.dot-red[data-close]').forEach(dot => {
  dot.addEventListener('click', e => {
    e.stopPropagation();
    closeWin(dot.dataset.close);
  });
});

/* Clic sur une fenêtre : la ramener au premier plan */
document.querySelectorAll('.mac-win').forEach(win => {
  win.addEventListener('mousedown', () => {
    win.style.zIndex = ++topZ;
  });
});

/* ── Drag & Drop des fenêtres ── */
document.querySelectorAll('.mac-win').forEach(win => {
  const bar = win.querySelector('.win-bar');
  if (!bar) return;

  let dragging = false;
  let ox = 0, oy = 0;

  bar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('dot')) return;
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    win.style.zIndex = ++topZ;
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    let x = e.clientX - ox;
    let y = e.clientY - oy;
    /* Garder la fenêtre dans les limites du bureau */
    const desktop = document.querySelector('.desktop');
    const maxX = desktop.clientWidth  - win.offsetWidth;
    const maxY = desktop.clientHeight - win.offsetHeight;
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    win.style.left = x + 'px';
    win.style.top  = y + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
  });
});
