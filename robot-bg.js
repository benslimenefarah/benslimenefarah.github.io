// Background: a mobile robot with a 2D LiDAR explores on its own and maps hidden obstacles.
// Hits accumulate into a slowly fading occupancy map; it leaves a thin rainbow fairy-dust trail behind.
(function () {
  const cv = document.getElementById('slam');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const map = document.createElement('canvas');
  const mctx = map.getContext('2d');
  const pctEl = document.getElementById('slam-pct');
  const statusEl = document.getElementById('slam-status');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const RANGE = 240, CELL = 32;
  let RAYS = 120;
  let running = true;
  let W, H, dpr, rects = [], segs = [], seen, cols, rows, seenCount = 0;
  let col = {};
  const bot = { x: 0, y: 0, th: 0 };
  let goal = null, splats = [], lastSplat = null;
  // path planning grid (A* on 20 px cells, obstacles inflated by the robot size)
  const G = 20, PAD = 16;
  let gc = 0, gr = 0, free = null, path = [], stuckAt = 0, stuckPos = null, retryAt = 0;

  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    col = { accent: v('--accent'), warn: v('--accent-2'), text: v('--text'), x: v('--x'), y: v('--y'), z: v('--z') };
  }

  const rnd = (a, b) => a + Math.random() * (b - a);

  function inside(x, y, pad = 0) {
    return rects.some((r) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad);
  }

  function build() {
    W = window.innerWidth; H = window.innerHeight;
    // lighter on phones: fewer rays and a lower canvas resolution
    const small = W < 700;
    RAYS = small ? 60 : 120;
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    for (const c of [cv, map]) { c.width = W * dpr; c.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // random room clutter: boxes and a few long walls
    rects = [];
    const n = Math.round((W * H) / 38000);
    for (let i = 0; i < n; i++) {
      let w, h;
      if (Math.random() < 0.25) {
        if (Math.random() < 0.5) { w = rnd(140, 320); h = 10; } else { w = 10; h = rnd(140, 300); }
      } else { w = rnd(30, 110); h = rnd(30, 110); }
      rects.push({ x: rnd(0, W - w), y: rnd(0, H - h), w, h });
    }
    // each segment carries the index of its obstacle (-1 for the screen border)
    segs = [[0, 0, W, 0, -1], [W, 0, W, H, -1], [W, H, 0, H, -1], [0, H, 0, 0, -1]];
    const CLASSES = ['box', 'crate', 'shelf', 'chair', 'bin'];
    rects.forEach((r, k) => {
      r.cls = r.w === 10 || r.h === 10 ? 'wall' : CLASSES[Math.floor(Math.random() * CLASSES.length)];
      r.conf = rnd(0.81, 0.99).toFixed(2);
      r.hits = 0; r.last = -1e9;
      segs.push([r.x, r.y, r.x + r.w, r.y, k], [r.x + r.w, r.y, r.x + r.w, r.y + r.h, k],
                [r.x + r.w, r.y + r.h, r.x, r.y + r.h, k], [r.x, r.y + r.h, r.x, r.y, k]);
    });
    cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
    seen = new Uint8Array(cols * rows); seenCount = 0;
    mctx.clearRect(0, 0, W, H);

    gc = Math.ceil(W / G); gr = Math.ceil(H / G);
    free = new Uint8Array(gc * gr);
    for (let j = 0; j < gr; j++) for (let i = 0; i < gc; i++) {
      const x = (i + 0.5) * G, y = (j + 0.5) * G;
      free[j * gc + i] = x > PAD && y > PAD && x < W - PAD && y < H - PAD && !inside(x, y, PAD + G / 2) ? 1 : 0;
    }
    const starts = [];
    for (let k = 0; k < free.length; k++) if (free[k]) starts.push(k);
    const k0 = starts.length ? starts[Math.floor(Math.random() * starts.length)] : 0;
    bot.x = (k0 % gc + 0.5) * G; bot.y = (Math.floor(k0 / gc) + 0.5) * G;
    splats = []; lastSplat = null; goal = null; path = []; stuckPos = null;
  }

  // nearest hit along a ray: distance, and which obstacle was hit
  let hitRect = -1;
  function cast(ox, oy, dx, dy) {
    let best = RANGE;
    hitRect = -1;
    for (const s of segs) {
      const ex = s[2] - s[0], ey = s[3] - s[1];
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const qx = s[0] - ox, qy = s[1] - oy;
      const t = (qx * ey - qy * ex) / den;
      const u = (qx * dy - qy * dx) / den;
      if (t > 0 && t < best && u >= 0 && u <= 1) { best = t; hitRect = s[4]; }
    }
    return best;
  }

  function markSeen(x, y) {
    const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
    if (i < 0 || j < 0 || i >= cols || j >= rows) return;
    const k = j * cols + i;
    if (!seen[k]) { seen[k] = 1; seenCount++; }
  }

  const cellOf = (x, y) => Math.min(gr - 1, Math.max(0, Math.floor(y / G))) * gc + Math.min(gc - 1, Math.max(0, Math.floor(x / G)));
  const centre = (k) => ({ x: (k % gc + 0.5) * G, y: (Math.floor(k / gc) + 0.5) * G });

  // nearest free cell (the robot can sit slightly inside the inflated zone)
  function nearestFree(k) {
    if (free[k]) return k;
    const ci = k % gc, cj = Math.floor(k / gc);
    for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const i = ci + di, j = cj + dj;
      if (i >= 0 && j >= 0 && i < gc && j < gr && free[j * gc + i]) return j * gc + i;
    }
    return -1;
  }

  // A* with an octile heuristic, 8-connected, no corner cutting
  function astar(s, g) {
    const N = gc * gr, gs = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    const gi = g % gc, gj = Math.floor(g / gc);
    const hf = (k) => { const dx = Math.abs(k % gc - gi), dy = Math.abs(Math.floor(k / gc) - gj); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    const heap = [];
    const push = (f, k) => {
      heap.push([f, k]);
      let i = heap.length - 1;
      while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
        }
      }
      return top;
    };
    gs[s] = 0; push(hf(s), s);
    while (heap.length) {
      const k = pop()[1];
      if (done[k]) continue;
      if (k === g) break;
      done[k] = 1;
      const i = k % gc, j = Math.floor(k / gc);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= gc || nj >= gr) continue;
        const n = nj * gc + ni;
        if (!free[n] || done[n]) continue;
        if (di && dj && (!free[j * gc + ni] || !free[nj * gc + i])) continue;
        const c = gs[k] + (di && dj ? 1.414 : 1);
        if (c < gs[n]) { gs[n] = c; from[n] = k; push(c + hf(n), n); }
      }
    }
    if (from[g] < 0 && g !== s) return null;
    const cells = [];
    for (let k = g; k !== -1; k = from[k]) cells.push(k);
    return cells.reverse().map(centre);
  }

  // straight segment that keeps clear of every obstacle
  function clear(ax, ay, bx, by) {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 6);
    for (let i = 1; i <= n; i++) { const t = i / n; if (inside(ax + (bx - ax) * t, ay + (by - ay) * t, 13)) return false; }
    return true;
  }

  // new exploration goal: a reachable free cell, preferably not scanned yet, then a smoothed A* path to it
  function newGoal() {
    const s = nearestFree(cellOf(bot.x, bot.y));
    if (s < 0) return;
    for (let tries = 0; tries < 40; tries++) {
      const g = Math.floor(Math.random() * free.length);
      if (!free[g]) continue;
      const c = centre(g);
      const k = Math.floor(c.y / CELL) * cols + Math.floor(c.x / CELL);
      if ((seen[k] && tries < 30) || Math.hypot(c.x - bot.x, c.y - bot.y) < 120) continue;
      const pts = astar(s, g);
      if (!pts) continue;
      // string pulling: jump to the farthest point still reachable in a clear straight line
      const out = [];
      let ax = bot.x, ay = bot.y, i = 0;
      while (i < pts.length) {
        let j = pts.length - 1;
        while (j > i && !clear(ax, ay, pts[j].x, pts[j].y)) j--;
        out.push(pts[j]); ax = pts[j].x; ay = pts[j].y; i = j + 1;
      }
      path = out; goal = c;
      return;
    }
  }

  // fairy dust: a thin, soft pastel trail of tiny glitter that drifts gently upward,
  // with a few small four-point star sparkles
  function makeSplat(x, y, hue, heading, now) {
    const parts = [];
    const n = W < 700 ? 22 : 36;
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? 1 : -1;
      const a = Math.random() < 0.8 ? heading + side * Math.PI / 2 + (Math.random() + Math.random() - 1) * 0.6 : rnd(0, Math.PI * 2);
      const star = Math.random() < 0.035;
      const sparkle = star || Math.random() < 0.25;
      const h = (hue + rnd(-20, 20) + 360) % 360;
      parts.push({
        ux: Math.cos(a), uy: Math.sin(a), d: 2 + 14 * Math.pow(Math.random(), 1.2),
        r: star ? rnd(2.5, 4) : rnd(0.4, 1.1), star,
        c: sparkle ? `hsl(${h}, 100%, 86%)` : `hsl(${h}, 95%, ${Math.round(rnd(66, 76))}%)`,
        tw: sparkle ? rnd(0, 6.28) : -1, sp: rnd(0.7, 1.3), rise: rnd(4, 14), sway: rnd(0, 6.28),
      });
    }
    return { x, y, hue, t: now, parts };
  }

  function step(now) {
    if (!running) return;
    while (path.length && Math.hypot(path[0].x - bot.x, path[0].y - bot.y) < 8) path.shift();
    if (!path.length && now > retryAt) { newGoal(); if (!path.length) retryAt = now + 400; }
    statusEl.textContent = 'slam_toolbox · exploring';

    // unicycle model: turn toward the next waypoint, drive forward (slower in tight turns)
    const wp = path[0] || goal || bot;
    const dx = wp.x - bot.x, dy = wp.y - bot.y, d = Math.hypot(dx, dy);
    let e = Math.atan2(dy, dx) - bot.th;
    e = Math.atan2(Math.sin(e), Math.cos(e));
    bot.th += Math.max(-0.14, Math.min(0.14, 0.25 * e));
    if (d > 2) {
      const v = Math.min(3, 0.08 * d + 0.8) * Math.max(0, Math.cos(e)) ** 2;
      const nx = bot.x + v * Math.cos(bot.th), ny = bot.y + v * Math.sin(bot.th);
      if (!inside(nx, ny, 9) && nx > 6 && ny > 6 && nx < W - 6 && ny < H - 6) { bot.x = nx; bot.y = ny; }
      else { bot.th += 0.3; path = []; } // blocked: turn away and replan
    }
    // watchdog: no real progress for ~1.5 s means stuck, so plan to a new goal
    if (!stuckPos || now - stuckAt > 1500) {
      if (stuckPos && Math.hypot(stuckPos.x - bot.x, stuckPos.y - bot.y) < 6) path = [];
      stuckPos = { x: bot.x, y: bot.y }; stuckAt = now;
    }
    // drop fairy dust every ~14 px travelled, with a hue that cycles through the rainbow
    if (!lastSplat || Math.hypot(lastSplat.x - bot.x, lastSplat.y - bot.y) > 14) {
      lastSplat = makeSplat(bot.x, bot.y, (now / 16) % 360, bot.th, now);
      splats.push(lastSplat);
      if (splats.length > 90) splats.shift();
    }

    // fade the map slowly so the scene keeps changing
    mctx.globalCompositeOperation = 'destination-out';
    mctx.fillStyle = 'rgba(0,0,0,0.006)';
    mctx.fillRect(0, 0, W, H);
    mctx.globalCompositeOperation = 'source-over';

    ctx.clearRect(0, 0, W, H);

    // 360° scan
    const hits = [];
    ctx.lineWidth = 1;
    ctx.strokeStyle = col.accent;
    ctx.globalAlpha = 0.06;
    ctx.beginPath();
    for (let i = 0; i < RAYS; i++) {
      const a = bot.th + (i / RAYS) * Math.PI * 2;
      const rx = Math.cos(a), ry = Math.sin(a);
      const r = cast(bot.x, bot.y, rx, ry);
      const hx = bot.x + rx * r, hy = bot.y + ry * r;
      ctx.moveTo(bot.x, bot.y); ctx.lineTo(hx, hy);
      for (let s = 0; s < r; s += CELL / 2) markSeen(bot.x + rx * s, bot.y + ry * s);
      if (r < RANGE) hits.push([hx, hy]);
      if (hitRect >= 0) { rects[hitRect].hits++; rects[hitRect].last = now; }
    }
    ctx.stroke();

    // detector: obstacles scanned enough times get a YOLO-style box and label, fading once out of view
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.lineWidth = 1.5;
    for (const r of rects) {
      if (r.hits < 25) continue;
      const age = now - r.last;
      if (age > 5000) continue;
      const a = 0.85 * (1 - age / 5000);
      const x = r.x - 4, y = r.y - 4, w = r.w + 8, h = r.h + 8;
      ctx.globalAlpha = a;
      ctx.strokeStyle = col.warn;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      const label = `${r.cls} ${r.conf}`;
      const tw = ctx.measureText(label).width + 8;
      ctx.fillStyle = col.warn;
      ctx.fillRect(x, y - 14, tw, 14);
      ctx.fillStyle = '#0b0f14';
      ctx.fillText(label, x + 4, y - 4);
    }
    ctx.globalAlpha = 1;

    mctx.fillStyle = col.accent;
    mctx.globalAlpha = 0.55;
    for (const h of hits) mctx.fillRect(h[0] - 1, h[1] - 1, 2.2, 2.2);
    mctx.globalAlpha = 1;

    ctx.globalAlpha = 0.5;
    ctx.drawImage(map, 0, 0, W, H);

    // current scan points, brighter
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = col.warn;
    for (const h of hits) ctx.fillRect(h[0] - 1.2, h[1] - 1.2, 2.4, 2.4);

    // fairy-dust trail: dust drifts out slowly and floats up, sparkles twinkle softly, all fades
    const LIFE = 7000;
    splats = splats.filter((sp) => now - sp.t < LIFE);
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    for (const sp of splats) {
      const age = now - sp.t, life = 1 - age / LIFE;
      const fade = life * life * (3 - 2 * life); // smooth fade-out
      const fly = 1 - Math.pow(1 - Math.min(1, age / 1600), 3); // slow ease-out
      // faint pastel glow along the path
      const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 7 + 5 * fly);
      g.addColorStop(0, `hsla(${sp.hue}, 95%, 72%, ${0.13 * fade})`);
      g.addColorStop(1, `hsla(${sp.hue}, 95%, 72%, 0)`);
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.fillRect(sp.x - 14, sp.y - 14, 28, 28);
      for (const p of sp.parts) {
        const dist = p.d * fly * p.sp;
        const t = age / 1000;
        const px = sp.x + p.ux * dist + Math.sin(t * 1.3 + p.sway) * 1.5 * fly;
        const py = sp.y + p.uy * dist - p.rise * t / 7; // floats up gently
        let a = 0.7 * fade * (0.4 + 0.6 * Math.min(1, dist / 8));
        if (p.tw >= 0) a *= 0.35 + 0.65 * Math.abs(Math.sin(now / 450 + p.tw));
        ctx.globalAlpha = a;
        if (p.star) {
          const r = p.r * (0.7 + 0.3 * Math.abs(Math.sin(now / 450 + p.tw)));
          ctx.strokeStyle = p.c; ctx.beginPath();
          ctx.moveTo(px - r, py); ctx.lineTo(px + r, py);
          ctx.moveTo(px, py - r); ctx.lineTo(px, py + r);
          ctx.stroke();
          ctx.fillStyle = p.c; ctx.fillRect(px - 0.6, py - 0.6, 1.2, 1.2);
        } else {
          ctx.fillStyle = p.c; ctx.fillRect(px - p.r / 2, py - p.r / 2, p.r, p.r);
        }
      }
    }
    ctx.globalAlpha = 1;

    // goal marker
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = col.warn;
    if (goal) { ctx.beginPath(); ctx.arc(goal.x, goal.y, 6, 0, Math.PI * 2); ctx.stroke(); }

    // robot body + base_link frame
    ctx.save();
    ctx.translate(bot.x, bot.y); ctx.rotate(bot.th);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = col.text;
    ctx.fillRect(-10, -7, 20, 14);
    ctx.lineWidth = 2;
    ctx.strokeStyle = col.x; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22, 0); ctx.stroke();
    ctx.strokeStyle = col.y; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -22); ctx.stroke();
    ctx.fillStyle = col.accent; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;

    pctEl.textContent = (100 * seenCount / (cols * rows)).toFixed(1);
    if (!still) requestAnimationFrame(step);
  }

  colors();
  build();
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', colors);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });

  // visitors can switch the background off; the choice is remembered in this browser
  const sw = document.querySelector('.hud-sw');
  function setRunning(on) {
    const was = running;
    running = on;
    document.body.classList.toggle('bg-off', !on);
    sw.textContent = on ? 'bg: on' : 'bg: off';
    try { localStorage.setItem('bg-off', on ? '0' : '1'); } catch (e) { /* storage unavailable */ }
    if (on && !was) requestAnimationFrame(step);
  }
  document.getElementById('slam-toggle').addEventListener('click', () => setRunning(!running));
  let saved = null;
  try { saved = localStorage.getItem('bg-off'); } catch (e) { /* storage unavailable */ }
  running = false;
  setRunning(saved !== '1');
})();
