/* ── Carte cyber (canvas) ── */
(function () {
  const canvas = document.getElementById('cybermap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* Projection équirectangulaire : lon/lat → x/y en % */
  function project(lon, lat, W, H) {
    return {
      x: ((lon + 180) / 360) * W,
      y: ((90 - lat)  / 180) * H,
    };
  }

  /* Villes avec coordonnées */
  const CITIES = [
    { name: 'Paris',       lon:  2.35, lat: 48.85 },
    { name: 'Londres',     lon: -0.12, lat: 51.50 },
    { name: 'Berlin',      lon: 13.40, lat: 52.52 },
    { name: 'Moscou',      lon: 37.62, lat: 55.75 },
    { name: 'Pékin',       lon: 116.4, lat: 39.90 },
    { name: 'Tokyo',       lon: 139.7, lat: 35.68 },
    { name: 'New York',    lon:-74.00, lat: 40.71 },
    { name: 'Washington',  lon:-77.04, lat: 38.90 },
    { name: 'São Paulo',   lon:-46.63, lat:-23.55 },
    { name: 'Lagos',       lon:  3.38, lat:  6.45 },
    { name: 'Téhéran',     lon: 51.42, lat: 35.69 },
    { name: 'Pyongyang',   lon:125.73, lat: 39.03 },
    { name: 'Tel Aviv',    lon: 34.78, lat: 32.08 },
    { name: 'Bangalore',   lon: 77.59, lat: 12.97 },
    { name: 'Sydney',      lon:151.21, lat:-33.87 },
    { name: 'Toronto',     lon:-79.38, lat: 43.65 },
  ];

  /* Couleurs par "type" d'attaque */
  const COLORS = [
    'rgba(239,68,68,',   /* rouge */
    'rgba(251,146,60,',  /* orange */
    'rgba(250,204,21,',  /* jaune */
    'rgba(52,211,153,',  /* vert */
    'rgba(56,189,248,',  /* cyan */
  ];

  /* Arc animé */
  class Arc {
    constructor(W, H) { this.reset(W, H); }

    reset(W, H) {
      const a = CITIES[Math.floor(Math.random() * CITIES.length)];
      let   b = CITIES[Math.floor(Math.random() * CITIES.length)];
      while (b === a) b = CITIES[Math.floor(Math.random() * CITIES.length)];

      this.p1    = project(a.lon, a.lat, W, H);
      this.p2    = project(b.lon, b.lat, W, H);
      this.prog  = 0;
      this.speed = 0.004 + Math.random() * 0.006;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.tail  = 0.22 + Math.random() * 0.18;
      this.done  = false;
      this.fade  = 1;

      /* Point de contrôle de la courbe de Bézier */
      const mx = (this.p1.x + this.p2.x) / 2;
      const my = (this.p1.y + this.p2.y) / 2;
      const dist = Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
      this.cp = { x: mx, y: my - dist * 0.35 };
    }

    /* Point sur la courbe quadratique à t ∈ [0,1] */
    bezier(t) {
      const mt = 1 - t;
      return {
        x: mt * mt * this.p1.x + 2 * mt * t * this.cp.x + t * t * this.p2.x,
        y: mt * mt * this.p1.y + 2 * mt * t * this.cp.y + t * t * this.p2.y,
      };
    }

    draw(ctx) {
      if (this.done) return;
      this.prog += this.speed;
      if (this.prog >= 1) { this.done = true; return; }

      const head  = this.prog;
      const tail  = Math.max(0, head - this.tail);
      const steps = 30;

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = tail + (head - tail) * (i / steps);
        const p = this.bezier(t);
        const a = i / steps; /* opacité croissante vers la tête */
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = this.color + '0.7)';
      ctx.lineWidth   = 1.2;
      ctx.stroke();

      /* Point lumineux à la tête */
      const tip = this.bezier(head);
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = this.color + '1)';
      ctx.fill();
    }
  }

  /* Points de villes */
  function drawCities(W, H) {
    CITIES.forEach(c => {
      const p = project(c.lon, c.lat, W, H);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100,180,255,0.5)';
      ctx.fill();
      /* Halo */
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,180,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  /* Contours des continents (simplified polygon paths, lon/lat) */
  const LAND = [
    /* Europe */
    [[-10,36],[30,36],[40,50],[30,60],[10,60],[-5,48],[-10,44],[-10,36]],
    /* Afrique */
    [[-18,15],[51,12],[52,11],[43,-12],[32,-35],[18,-35],[-18,28],[-18,15]],
    /* Asie */
    [[26,42],[80,10],[105,2],[135,34],[145,43],[135,55],[100,60],[60,55],[40,68],[26,70],[26,42]],
    /* Amérique du Nord */
    [[-170,72],[-52,47],[-65,44],[-80,25],[-90,15],[-85,10],[-105,18],[-118,32],[-124,48],[-140,60],[-170,72]],
    /* Amérique du Sud */
    [[-80,10],[-35,-5],[-35,-55],[-70,-55],[-76,-18],[-80,10]],
    /* Océanie */
    [[115,-25],[154,-25],[153,-28],[147,-38],[145,-37],[136,-35],[124,-34],[115,-25]],
  ];

  function drawLand(W, H) {
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.fillStyle   = 'rgba(255,255,255,0.025)';
    ctx.lineWidth   = 0.8;
    LAND.forEach(poly => {
      ctx.beginPath();
      poly.forEach(([lon, lat], i) => {
        const p = project(lon, lat, W, H);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  /* Grille lat/lon */
  function drawGrid(W, H) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 0.5;
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  /* Arcs */
  const MAX_ARCS = 12;
  let arcs = [];

  function resize() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  function loop() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    drawGrid(W, H);
    drawLand(W, H);
    drawCities(W, H);

    /* Renouveler les arcs terminés */
    arcs = arcs.filter(a => !a.done);
    while (arcs.length < MAX_ARCS) arcs.push(new Arc(W, H));

    arcs.forEach(a => a.draw(ctx));
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  loop();
})();

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
let hasMoved = false;

function startDrag(el, e) {
  draggingEl = el;
  ox = e.clientX - el.offsetLeft;
  oy = e.clientY - el.offsetTop;
  hasMoved = false;
  el.style.zIndex = ++topZ;
  document.body.style.userSelect = 'none';
}

document.addEventListener('mousemove', e => {
  if (!draggingEl) return;
  hasMoved = true;
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

/* Dossiers : drag + clic */
document.querySelectorAll('.dsk-icon').forEach(icon => {
  icon.addEventListener('mousedown', e => {
    startDrag(icon, e);
    e.preventDefault();
  });

  icon.addEventListener('click', () => {
    if (hasMoved) return; /* c'était un drag, pas un clic */
    const id  = icon.dataset.win;
    const win = document.getElementById('win-' + id);
    if (win?.classList.contains('open')) {
      win.style.zIndex = ++topZ;
    } else {
      icon.classList.add('active');
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
