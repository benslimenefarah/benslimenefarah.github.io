/* Interactive previews for the project cards. Each canvas[data-viz] runs a small live simulation
   that reacts to the cursor. The real photos and videos are on each project page. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = { bg: '#0d1117', grid: 'rgba(120,160,200,.07)', text: '#e6edf3', muted: '#8b98a6', dim: '#4b5563',
    teal: '#2ee6c5', orange: '#ff9f43', x: '#ff5c5c', y: '#4ade80', z: '#60a5fa' };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const rnd = (a, b) => a + Math.random() * (b - a);

  function grid(ctx, w, h, s = 20) {
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = (w % s) / 2; x < w; x += s) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
    for (let y = (h % s) / 2; y < h; y += s) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); }
    ctx.stroke();
  }
  function label(ctx, txt, x, y, col = C.muted, align = 'left') {
    ctx.font = '500 10.5px "JetBrains Mono", monospace'; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.fillText(txt, x, y);
  }
  function axes(ctx, x, y, a, len = 16) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.x; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
    ctx.strokeStyle = C.y; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - Math.PI / 2) * len, y + Math.sin(a - Math.PI / 2) * len); ctx.stroke();
  }
  function target(ctx, x, y, col = C.orange, r = 7) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r - 5, y); ctx.lineTo(x + r + 5, y); ctx.moveTo(x, y - r - 5); ctx.lineTo(x, y + r + 5); ctx.stroke();
  }
  // idle cursor: a slow Lissajous path, used when nobody is hovering the card
  const idle = (st, sx = .32, sy = .28, f = 1) => ({ x: st.w * (.5 + sx * Math.sin(st.t * .45 * f)), y: st.h * (.5 + sy * Math.sin(st.t * .7 * f + 1)) });

  /* ======================= scenes ======================= */
  const scenes = {

    /* --- whole-body control: base drives only when the arm cannot reach --- */
    wbc(st) {
      const s = { bx: st.w * .3, by: st.h * .6, th: -0.4, q1: -0.6, q2: 1.2, trail: [] };
      return (ctx) => {
        const { w, h } = st, L = Math.min(w, h) * .2, L1 = L, L2 = L * .85;
        const tg = st.m || idle(st, .34, .3);
        // base: if the target is out of reach, drive toward it (whole-body motion)
        const dx = tg.x - s.bx, dy = tg.y - s.by, d = Math.hypot(dx, dy), reach = (L1 + L2) * .82;
        if (d > reach) {
          const want = Math.atan2(dy, dx), e = wrap(want - s.th);
          s.th += clamp(e, -.05, .05);
          const v = Math.min(2.2, (d - reach) * .05) * Math.max(0, Math.cos(e));
          s.bx = clamp(s.bx + Math.cos(s.th) * v, 30, w - 30); s.by = clamp(s.by + Math.sin(s.th) * v, 30, h - 30);
        }
        // arm: analytic 2-link IK in the base frame, smoothed
        const ex = tg.x - s.bx, ey = tg.y - s.by, r = clamp(Math.hypot(ex, ey), Math.abs(L1 - L2) + 1, L1 + L2 - 1);
        const c2 = clamp((r * r - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1), q2 = Math.acos(c2);
        const q1 = Math.atan2(ey, ex) - Math.atan2(L2 * Math.sin(q2), L1 + L2 * Math.cos(q2)) - s.th;
        s.q1 += wrap(q1 - s.q1) * .12; s.q2 += (q2 - s.q2) * .12;
        const a1 = s.th + s.q1, jx = s.bx + Math.cos(a1) * L1, jy = s.by + Math.sin(a1) * L1;
        const gx = jx + Math.cos(a1 + s.q2) * L2, gy = jy + Math.sin(a1 + s.q2) * L2;
        s.trail.push([gx, gy]); if (s.trail.length > 160) s.trail.shift();

        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); grid(ctx, w, h, 24);
        // reach circle
        ctx.strokeStyle = 'rgba(46,230,197,.12)'; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(s.bx, s.by, reach, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        // gripper trail
        ctx.lineWidth = 2;
        for (let i = 1; i < s.trail.length; i++) {
          ctx.strokeStyle = `rgba(46,230,197,${(i / s.trail.length) * .8})`;
          ctx.beginPath(); ctx.moveTo(...s.trail[i - 1]); ctx.lineTo(...s.trail[i]); ctx.stroke();
        }
        target(ctx, tg.x, tg.y);
        // base (Scout): body + 4 wheels
        ctx.save(); ctx.translate(s.bx, s.by); ctx.rotate(s.th);
        const bw = L * .9, bh = L * .62;
        ctx.fillStyle = '#1f2937'; ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5;
        ctx.fillRect(-bw / 2, -bh / 2, bw, bh); ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        ctx.fillStyle = '#374151';
        for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(x * bw * .32 - 7, y * (bh / 2 + 3) - 3, 14, 6);
        ctx.restore();
        axes(ctx, s.bx, s.by, s.th, 20);
        // arm
        ctx.lineCap = 'round'; ctx.strokeStyle = C.text; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(s.bx, s.by); ctx.lineTo(jx, jy); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.fillStyle = C.bg; ctx.strokeStyle = C.teal; ctx.lineWidth = 2;
        for (const [x, y] of [[s.bx, s.by], [jx, jy]]) { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
        // gripper
        const ga = a1 + s.q2;
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(ga); ctx.strokeStyle = C.teal; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(8, -7); ctx.moveTo(0, 7); ctx.lineTo(8, 7); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.stroke(); ctx.restore();
        const err = Math.hypot(tg.x - gx, tg.y - gy);
        label(ctx, 'policy: PPO · 8 velocities', 12, 20);
        label(ctx, `|e| = ${(err * 1.6).toFixed(0)} mm`, w - 12, 20, err < 6 ? C.teal : C.orange, 'right');
        label(ctx, d > reach ? 'base + arm' : 'arm only', 12, h - 12, d > reach ? C.orange : C.teal);
      };
    },

    /* --- RL navigation: LiDAR rays, obstacle avoidance toward the goal --- */
    nav(st) {
      let obs = [];
      const s = { x: 0, y: 0, th: 0, goal: null, ep: 1, path: [], flash: 0 };
      const layout = () => {
        const { w, h } = st; obs = [];
        for (let i = 0; i < 7; i++) obs.push({ x: rnd(.15, .85) * w, y: rnd(.18, .82) * h, r: rnd(.05, .085) * Math.min(w, h) });
        s.x = w * .1; s.y = h * .5; s.path = [];
      };
      const free = (x, y, m = 12) => x > m && y > m && x < st.w - m && y < st.h - m && obs.every((o) => Math.hypot(x - o.x, y - o.y) > o.r + m);
      const cast = (a) => {
        const dx = Math.cos(a), dy = Math.sin(a); let best = 400;
        for (let t = 4; t < best; t += 4) if (!free(s.x + dx * t, s.y + dy * t, 0)) { best = t; break; }
        return best;
      };
      st.onresize = layout;
      return (ctx) => {
        const { w, h } = st;
        if (!obs.length) layout();
        if (!s.goal || (!st.m && Math.hypot(s.goal.x - s.x, s.goal.y - s.y) < 12)) {
          if (s.goal) { s.ep++; s.flash = 1; }
          let g; do { g = { x: rnd(.08, .92) * w, y: rnd(.1, .9) * h }; } while (!free(g.x, g.y, 18));
          s.goal = g;
        }
        if (st.m) s.goal = { x: st.m.x, y: st.m.y };
        // 24-beam LiDAR, potential-field style policy
        const N = 24, rays = [];
        let vx = (s.goal.x - s.x), vy = (s.goal.y - s.y); const gd = Math.hypot(vx, vy) || 1; vx /= gd; vy /= gd;
        for (let i = 0; i < N; i++) {
          const a = s.th + (i / N) * TAU, d = cast(a); rays.push([a, d]);
          if (d < 60) { const k = (60 - d) / 60; vx -= Math.cos(a) * k * 1.1; vy -= Math.sin(a) * k * 1.1; }
        }
        const want = Math.atan2(vy, vx), e = wrap(want - s.th);
        s.th += clamp(e, -.09, .09);
        const v = gd < 6 ? 0 : 1.6 * Math.max(.15, Math.cos(e));
        const nx = s.x + Math.cos(s.th) * v, ny = s.y + Math.sin(s.th) * v;
        if (free(nx, ny, 9)) { s.x = nx; s.y = ny; } else s.th += .25;
        s.path.push([s.x, s.y]); if (s.path.length > 220) s.path.shift();

        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); grid(ctx, w, h, 24);
        for (const [a, d] of rays) {
          ctx.strokeStyle = d < 40 ? 'rgba(255,92,92,.45)' : 'rgba(46,230,197,.18)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d); ctx.stroke();
          if (d < 400) { ctx.fillStyle = C.teal; ctx.fillRect(s.x + Math.cos(a) * d - 1.5, s.y + Math.sin(a) * d - 1.5, 3, 3); }
        }
        for (const o of obs) { ctx.fillStyle = '#1b2430'; ctx.strokeStyle = '#2f3d4d'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(230,237,243,.25)'; ctx.setLineDash([3, 4]); ctx.beginPath();
        s.path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]);
        // goal flag
        ctx.strokeStyle = C.orange; ctx.fillStyle = C.orange; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(s.goal.x, s.goal.y); ctx.lineTo(s.goal.x, s.goal.y - 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.goal.x, s.goal.y - 18); ctx.lineTo(s.goal.x + 11, s.goal.y - 14); ctx.lineTo(s.goal.x, s.goal.y - 10); ctx.fill();
        // TurtleBot
        ctx.fillStyle = '#e6edf3'; ctx.beginPath(); ctx.arc(s.x, s.y, 8, 0, TAU); ctx.fill();
        ctx.strokeStyle = C.bg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(s.th) * 8, s.y + Math.sin(s.th) * 8); ctx.stroke();
        s.flash = Math.max(0, s.flash - .02);
        label(ctx, `episode ${s.ep}`, 12, 20);
        label(ctx, s.flash > 0 ? 'goal reached · r = +1' : 'DQN · 24 LiDAR beams', w - 12, 20, s.flash > 0 ? C.teal : C.muted, 'right');
      };
    },

    /* --- SLAM: rays accumulate into an occupancy map --- */
    slam(st) {
      let occ, walls = [];
      const s = { x: 0, y: 0, th: 0, trail: [] };
      const layout = () => {
        const { w, h } = st, d = st.dpr;
        occ = document.createElement('canvas'); occ.width = w * d; occ.height = h * d; occ.getContext('2d').scale(d, d);
        const m = .07 * Math.min(w, h);
        walls = [[m, m, w - m, m], [w - m, m, w - m, h - m], [w - m, h - m, m, h - m], [m, h - m, m, m],
          [w * .34, m, w * .34, h * .46], [w * .62, h * .56, w * .62, h - m], [w * .62, h * .3, w - m, h * .3], [m, h * .66, w * .2, h * .66]];
        s.x = w * .5; s.y = h * .5; s.trail = [];
      };
      const ray = (ox, oy, a) => {
        const dx = Math.cos(a), dy = Math.sin(a); let best = 1e9;
        for (const [x1, y1, x2, y2] of walls) {
          const ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
          if (Math.abs(den) < 1e-9) continue;
          const t = ((x1 - ox) * ey - (y1 - oy) * ex) / den, u = ((x1 - ox) * dy - (y1 - oy) * dx) / den;
          if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
        }
        return best;
      };
      st.onresize = layout;
      return (ctx) => {
        const { w, h } = st;
        if (!occ) layout();
        const tg = st.m || { x: w * (.5 + .3 * Math.sin(st.t * .35)), y: h * (.5 + .28 * Math.sin(st.t * .7)) };
        const dx = tg.x - s.x, dy = tg.y - s.y, d = Math.hypot(dx, dy);
        if (d > 4) {
          const want = Math.atan2(dy, dx); s.th += clamp(wrap(want - s.th), -.08, .08);
          const v = Math.min(1.8, d * .05);
          if (ray(s.x, s.y, s.th) > v + 10) { s.x += Math.cos(s.th) * v; s.y += Math.sin(s.th) * v; }
        }
        s.trail.push([s.x, s.y]); if (s.trail.length > 400) s.trail.shift();
        const o = occ.getContext('2d'); o.fillStyle = 'rgba(46,230,197,.9)';
        for (let i = 0; i < 90; i++) { const a = (i / 90) * TAU + st.t * 2, r = ray(s.x, s.y, a); if (r < 180) o.fillRect(s.x + Math.cos(a) * r - 1, s.y + Math.sin(a) * r - 1, 2.2, 2.2); }
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); grid(ctx, w, h, 16);
        ctx.drawImage(occ, 0, 0, w, h);
        ctx.strokeStyle = 'rgba(255,159,67,.28)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU + st.t * 2, r = Math.min(ray(s.x, s.y, a), 180); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r); }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(96,165,250,.6)'; ctx.lineWidth = 1.5; ctx.beginPath();
        s.trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        ctx.fillStyle = C.text; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.th); ctx.fillRect(-8, -6, 16, 12); ctx.restore();
        axes(ctx, s.x, s.y, s.th, 16);
        label(ctx, 'slam_toolbox · /map', 12, 20);
        label(ctx, st.m ? 'teleop' : 'exploring', w - 12, 20, C.teal, 'right');
      };
    },

    /* --- bin-picking: instance masks, PCA axes and grasp on hover --- */
    pick(st) {
      let shoes = [];
      const layout = () => {
        const { w, h } = st, S = Math.min(w, h);
        shoes = [];
        const spots = [[.26, .32], [.7, .3], [.3, .72], [.72, .7], [.5, .5]];
        spots.forEach(([fx, fy], i) => shoes.push({ x: fx * w, y: fy * h, a: rnd(0, TAU), L: S * rnd(.2, .24), conf: rnd(.88, .97), ph: i * 1.3, holes: [rnd(.05, .15), rnd(-.2, -.1)] }));
      };
      // shoe outline: toe ellipse + heel ellipse, in local coordinates (length along x)
      const shoePath = (ctx, sh) => {
        ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.a);
        ctx.beginPath(); ctx.ellipse(sh.L * .12, 0, sh.L * .42, sh.L * .2, 0, 0, TAU);
        ctx.ellipse(-sh.L * .3, 0, sh.L * .22, sh.L * .15, 0, 0, TAU); ctx.restore();
      };
      st.onresize = layout;
      return (ctx) => {
        const { w, h } = st;
        if (!shoes.length) layout();
        // which shoe is selected: nearest to the cursor, or cycling when idle
        let sel = Math.floor(st.t / 2.2) % shoes.length;
        if (st.m) { let bd = 1e9; shoes.forEach((sh, i) => { const d = Math.hypot(sh.x - st.m.x, sh.y - st.m.y); if (d < bd) { bd = d; sel = i; } }); }
        ctx.fillStyle = '#20252c'; ctx.fillRect(0, 0, w, h);
        // bin texture
        ctx.strokeStyle = 'rgba(255,255,255,.03)'; for (let y = 0; y < h; y += 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 3); ctx.stroke(); }
        ctx.strokeStyle = '#3a414b'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, w - 12, h - 12);
        shoes.forEach((sh, i) => {
          sh.a += Math.sin(st.t * .4 + sh.ph) * .0012;
          const on = i === sel;
          // shoe body
          shoePath(ctx, sh); ctx.fillStyle = ['#6b5b4b', '#4b5563', '#7c6f64', '#5b4b5b', '#57606a'][i % 5]; ctx.fill('nonzero');
          // mask overlay
          shoePath(ctx, sh); ctx.fillStyle = on ? 'rgba(46,230,197,.32)' : 'rgba(96,165,250,.18)'; ctx.fill('nonzero');
          ctx.strokeStyle = on ? C.teal : 'rgba(96,165,250,.6)'; ctx.lineWidth = on ? 2 : 1; shoePath(ctx, sh); ctx.stroke();
          // holes (lace eyelets)
          const ca = Math.cos(sh.a), sa = Math.sin(sh.a);
          const hp = sh.holes.map((k) => [sh.x + ca * sh.L * k, sh.y + sa * sh.L * k]);
          hp.forEach(([x, y]) => { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); if (on) { ctx.strokeStyle = C.orange; ctx.lineWidth = 1.5; ctx.strokeRect(x - 6, y - 6, 12, 12); } });
          // label
          const bx = sh.x - sh.L * .5, by = sh.y - sh.L * .45;
          ctx.font = '600 10px "JetBrains Mono", monospace'; const txt = `shoe ${sh.conf.toFixed(2)}`, tw = ctx.measureText(txt).width + 8;
          ctx.fillStyle = on ? C.teal : 'rgba(96,165,250,.85)'; ctx.fillRect(bx, by - 14, tw, 14);
          ctx.fillStyle = '#04110e'; ctx.textAlign = 'left'; ctx.fillText(txt, bx + 4, by - 4);
          if (on) {
            // PCA axes
            const L = sh.L * .55;
            ctx.lineWidth = 2; ctx.strokeStyle = C.x; ctx.beginPath(); ctx.moveTo(sh.x - ca * L, sh.y - sa * L); ctx.lineTo(sh.x + ca * L, sh.y + sa * L); ctx.stroke();
            ctx.strokeStyle = C.y; ctx.beginPath(); ctx.moveTo(sh.x + sa * L * .45, sh.y - ca * L * .45); ctx.lineTo(sh.x - sa * L * .45, sh.y + ca * L * .45); ctx.stroke();
            // gripper approaching the grasp point (first hole), oriented by PCA
            const [gx, gy] = hp[0], k = (Math.sin(st.t * 2.2) + 1) / 2, open = 9 + 6 * k;
            ctx.save(); ctx.translate(gx, gy); ctx.rotate(sh.a + Math.PI / 2);
            ctx.strokeStyle = C.text; ctx.lineWidth = 3; ctx.beginPath();
            ctx.moveTo(-open, -14); ctx.lineTo(-open, 4); ctx.moveTo(open, -14); ctx.lineTo(open, 4); ctx.moveTo(-open, -14); ctx.lineTo(open, -14); ctx.moveTo(0, -14); ctx.lineTo(0, -26); ctx.stroke();
            ctx.restore();
            label(ctx, `grasp  x=${(gx / w * .4).toFixed(3)}  y=${(gy / h * .3).toFixed(3)}  θ=${(wrap(sh.a) * 57.3).toFixed(0)}°`, 14, h - 14, C.text);
          }
        });
        label(ctx, 'YOLOv11s-seg · 5 instances', 14, 22, C.text);
        label(ctx, 'RealSense D435', w - 14, 22, C.muted, 'right');
      };
    },

    /* --- AR: chessboard + wireframe king seen from a camera you move --- */
    ar(st) {
      // king profile (radius, height) for a lathe wireframe
      const prof = [[.9, 0], [.9, .2], [.65, .35], [.45, .6], [.35, 1.6], [.55, 1.8], [.4, 2], [.5, 2.4], [.3, 2.6]];
      const s = { az: .6, el: .65 };
      return (ctx) => {
        const { w, h } = st;
        const taz = st.m ? (st.m.x / w - .5) * 2.6 + .6 : .6 + Math.sin(st.t * .3) * .9;
        const tel = st.m ? lerp(.35, 1.2, st.m.y / h) : .7 + Math.sin(st.t * .5) * .15;
        s.az = lerp(s.az, taz, .06); s.el = lerp(s.el, tel, .06);
        const R = 15, cam = [R * Math.cos(s.el) * Math.cos(s.az), R * Math.cos(s.el) * Math.sin(s.az), R * Math.sin(s.el)];
        const nrm = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); };
        const f = nrm(cam.map((c) => -c)), r = nrm([f[1], -f[0], 0]), u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
        const F = Math.min(w, h) * 1.25, cx = w / 2, cy = h * .56;
        const P = (x, y, z) => { const d = [x - cam[0], y - cam[1], z - cam[2]]; const zc = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
          return [cx + F * (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / zc, cy - F * (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / zc]; };
        // "camera image": dark table
        const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1f26'); g.addColorStop(1, '#2a2f36');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        // board (8x8, squares of size 1, centred)
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
          const x0 = i - 4, y0 = j - 4, pts = [P(x0, y0, 0), P(x0 + 1, y0, 0), P(x0 + 1, y0 + 1, 0), P(x0, y0 + 1, 0)];
          ctx.fillStyle = (i + j) % 2 ? '#e8e6e1' : '#2b2b2b'; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); ctx.fill();
        }
        // detected inner corners
        ctx.fillStyle = C.orange;
        for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const [x, y] = P(i, j, 0); ctx.fillRect(x - 1.5, y - 1.5, 3, 3); }
        // world axes at board corner
        const o = P(-4, -4, 0);
        [[C.x, P(-2, -4, 0)], [C.y, P(-4, -2, 0)], [C.z, P(-4, -4, 2)]].forEach(([c, p]) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...o); ctx.lineTo(...p); ctx.stroke(); });
        // wireframe king at (0.5, 0.5)
        const kx = .5, ky = .5, seg = 14;
        ctx.strokeStyle = C.teal; ctx.lineWidth = 1.2;
        for (const [rad, z] of prof) { ctx.beginPath(); for (let k = 0; k <= seg; k++) { const a = (k / seg) * TAU, p = P(kx + rad * Math.cos(a), ky + rad * Math.sin(a), z); k ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke(); }
        for (let k = 0; k < seg; k++) { const a = (k / seg) * TAU; ctx.beginPath(); prof.forEach(([rad, z], i) => { const p = P(kx + rad * Math.cos(a), ky + rad * Math.sin(a), z); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }); ctx.stroke(); }
        // cross on top
        ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(...P(kx, ky, 2.6)); ctx.lineTo(...P(kx, ky, 3.2)); ctx.moveTo(...P(kx - .25, ky, 2.95)); ctx.lineTo(...P(kx + .25, ky, 2.95)); ctx.stroke();
        ctx.fillStyle = 'rgba(13,17,23,.75)'; ctx.fillRect(0, 0, w, 30);
        label(ctx, 'solvePnP · 49 corners', 12, 20, C.text);
        label(ctx, `cam az ${(s.az * 57.3).toFixed(0)}°  el ${(s.el * 57.3).toFixed(0)}°`, w - 12, 20, C.teal, 'right');
      };
    },

    /* --- KUKA pose control: 3-link arm, damped least squares on (x, y, φ), error plot --- */
    kuka(st) {
      const q = [-1.9, .9, .7], hist = [];
      return (ctx) => {
        const { w, h } = st, L = Math.min(w * .9, h * 1.2) * .22, base = [w * .38, h * .9];
        const tg = st.m || idle(st, .2, .18), phi = -Math.PI / 2 + Math.sin(st.t * .6) * .6;
        const fk = (q) => { let x = base[0], y = base[1], a = 0; const pts = [[x, y]]; for (const qi of q) { a += qi; x += Math.cos(a) * L; y += Math.sin(a) * L; pts.push([x, y]); } return { pts, a }; };
        for (let it = 0; it < 2; it++) {
          const { pts, a } = fk(q), e = [tg.x - pts[3][0], tg.y - pts[3][1], wrap(phi - a) * L];
          // Jacobian of (x, y, L·φ)
          const J = [[0, 0, 0], [0, 0, 0], [L, L, L]];
          for (let i = 0; i < 3; i++) { J[0][i] = -(pts[3][1] - pts[i][1]); J[1][i] = pts[3][0] - pts[i][0]; }
          // dq = Jᵀ (J Jᵀ + λ² I)⁻¹ e   (3x3 solve)
          const A = [0, 1, 2].map((r) => [0, 1, 2].map((c) => J[r][0] * J[c][0] + J[r][1] * J[c][1] + J[r][2] * J[c][2] + (r === c ? 400 : 0)));
          const det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
          const inv = [[A[1][1] * A[2][2] - A[1][2] * A[2][1], A[0][2] * A[2][1] - A[0][1] * A[2][2], A[0][1] * A[1][2] - A[0][2] * A[1][1]],
            [A[1][2] * A[2][0] - A[1][0] * A[2][2], A[0][0] * A[2][2] - A[0][2] * A[2][0], A[0][2] * A[1][0] - A[0][0] * A[1][2]],
            [A[1][0] * A[2][1] - A[1][1] * A[2][0], A[0][1] * A[2][0] - A[0][0] * A[2][1], A[0][0] * A[1][1] - A[0][1] * A[1][0]]];
          const y = [0, 1, 2].map((r) => (inv[r][0] * e[0] + inv[r][1] * e[1] + inv[r][2] * e[2]) / det);
          for (let i = 0; i < 3; i++) q[i] += clamp(.08 * (J[0][i] * y[0] + J[1][i] * y[1] + J[2][i] * y[2]), -.05, .05);
        }
        const { pts, a } = fk(q), en = Math.hypot(tg.x - pts[3][0], tg.y - pts[3][1]) + Math.abs(wrap(phi - a)) * L;
        hist.push(en); if (hist.length > 140) hist.shift();
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); grid(ctx, w, h, 20);
        // target pose frame
        axes(ctx, tg.x, tg.y, phi, 22); ctx.strokeStyle = C.orange; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(tg.x, tg.y, 10, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        // base
        ctx.fillStyle = '#374151'; ctx.fillRect(base[0] - 18, base[1], 36, 10);
        // links (orange like the KUKA)
        ctx.lineCap = 'round'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 9;
        ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
        ctx.fillStyle = C.bg; ctx.strokeStyle = C.text; ctx.lineWidth = 2;
        pts.slice(0, 3).forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); ctx.stroke(); });
        axes(ctx, pts[3][0], pts[3][1], a, 18);
        // error plot
        const gw = w * .36, gh = h * .26, gx = w - gw - 12, gy = 34;
        ctx.fillStyle = 'rgba(18,26,35,.9)'; ctx.fillRect(gx, gy, gw, gh); ctx.strokeStyle = '#1f2b37'; ctx.strokeRect(gx + .5, gy + .5, gw, gh);
        const mx = Math.max(40, ...hist);
        ctx.strokeStyle = C.teal; ctx.lineWidth = 1.5; ctx.beginPath();
        hist.forEach((v, i) => { const x = gx + (i / 139) * gw, y = gy + gh - 4 - (v / mx) * (gh - 10); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
        label(ctx, '‖e‖ pose error', gx + 6, gy + 13);
        label(ctx, 'q̇ = Jᵀ(JJᵀ+λ²I)⁻¹ e', 12, 20, C.text);
      };
    },

    /* --- serial arm: 4-DOF CCD inverse kinematics with workspace --- */
    kin(st) {
      const q = [-1.2, .5, .5, .4];
      return (ctx) => {
        const { w, h } = st, L = Math.min(w, h) * .14, base = [w * .5, h * .82];
        const tg = st.m || idle(st, .28, .25, 1.2);
        const fk = () => { let x = base[0], y = base[1], a = 0; const p = [[x, y]]; for (const qi of q) { a += qi; x += Math.cos(a) * L; y += Math.sin(a) * L; p.push([x, y]); } return p; };
        // cyclic coordinate descent, a few sweeps per frame
        for (let it = 0; it < 3; it++) for (let j = q.length - 1; j >= 0; j--) {
          const p = fk(), [jx, jy] = p[j], [ex, ey] = p[q.length];
          const d = wrap(Math.atan2(tg.y - jy, tg.x - jx) - Math.atan2(ey - jy, ex - jx));
          q[j] += clamp(d, -.04, .04);
        }
        const p = fk();
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); grid(ctx, w, h, 20);
        ctx.fillStyle = 'rgba(96,165,250,.06)'; ctx.beginPath(); ctx.arc(base[0], base[1], L * 4, Math.PI, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(96,165,250,.3)'; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(base[0], base[1], L * 4, Math.PI, TAU); ctx.stroke(); ctx.setLineDash([]);
        target(ctx, tg.x, tg.y);
        ctx.fillStyle = '#374151'; ctx.fillRect(base[0] - 20, base[1], 40, 10);
        ctx.lineCap = 'round'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 8;
        ctx.beginPath(); p.forEach((pt, i) => (i ? ctx.lineTo(...pt) : ctx.moveTo(...pt))); ctx.stroke();
        p.slice(0, 4).forEach(([x, y], i) => {
          ctx.fillStyle = C.bg; ctx.strokeStyle = C.z; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); ctx.stroke();
          // screw axis symbol (out of plane)
          ctx.fillStyle = C.z; ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
        });
        const [ex, ey] = p[4]; ctx.fillStyle = C.teal; ctx.beginPath(); ctx.arc(ex, ey, 4, 0, TAU); ctx.fill();
        q.forEach((v, i) => label(ctx, `q${i + 1} ${(wrap(v) * 57.3).toFixed(0).padStart(4)}°`, 12, 20 + i * 14, C.text));
        label(ctx, 'e^[S₁]q₁ … e^[S₄]q₄ M', w - 12, 20, C.muted, 'right');
      };
    },

    /* --- four-bar linkage: crank-rocker with its coupler curve --- */
    fourbar(st) {
      const a = 1, b = 3.2, c = 2.6, d = 3; // Grashof crank-rocker
      const s = { th: 0, trail: [] };
      const solve = (th) => {
        const B = [a * Math.cos(th), a * Math.sin(th)], D = [d, 0];
        const dx = D[0] - B[0], dy = D[1] - B[1], dist = Math.hypot(dx, dy);
        const k = (b * b - c * c + dist * dist) / (2 * dist), hh = Math.sqrt(Math.max(0, b * b - k * k));
        const Cc = [B[0] + (k * dx - hh * dy) / dist, B[1] + (k * dy + hh * dx) / dist];
        const ux = (Cc[0] - B[0]) / b, uy = (Cc[1] - B[1]) / b;
        const Pp = [B[0] + ux * b * .5 - uy * 1.3, B[1] + uy * b * .5 + ux * 1.3]; // coupler point
        return { B, C: Cc, P: Pp };
      };
      const curve = []; for (let i = 0; i <= 120; i++) curve.push(solve((i / 120) * TAU).P);
      return (ctx) => {
        const { w, h } = st, S = Math.min(w / 6, h / 5.6), ox = w * .5 - 1.5 * S, oy = h * .66;
        const X = ([x, y]) => [ox + x * S, oy - y * S];
        if (st.m) { const want = Math.atan2(-(st.m.y - oy), st.m.x - ox); s.th += wrap(want - s.th) * .15; } else s.th += .025;
        const { B, C: Cc, P: Pp } = solve(s.th);
        s.trail.push(X(Pp)); if (s.trail.length > 90) s.trail.shift();
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); grid(ctx, w, h, 20);
        ctx.strokeStyle = 'rgba(255,159,67,.35)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2; ctx.beginPath();
        curve.forEach((p, i) => (i ? ctx.lineTo(...X(p)) : ctx.moveTo(...X(p)))); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5; ctx.beginPath(); s.trail.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
        // ground
        const A0 = X([0, 0]), D0 = X([d, 0]);
        ctx.strokeStyle = C.dim; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A0[0] - 14, A0[1] + 12); ctx.lineTo(D0[0] + 14, D0[1] + 12); ctx.stroke();
        for (let x = A0[0] - 14; x < D0[0] + 14; x += 7) { ctx.beginPath(); ctx.moveTo(x, A0[1] + 12); ctx.lineTo(x - 5, A0[1] + 18); ctx.stroke(); }
        // links
        ctx.lineCap = 'round';
        const link = (p, q2, col, wd = 6) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q2); ctx.stroke(); };
        link(A0, X(B), C.teal); link(D0, X(Cc), C.z);
        ctx.fillStyle = 'rgba(230,237,243,.12)'; ctx.strokeStyle = C.text; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(...X(B)); ctx.lineTo(...X(Cc)); ctx.lineTo(...X(Pp)); ctx.closePath(); ctx.fill(); ctx.stroke();
        for (const p of [A0, D0, X(B), X(Cc)]) { ctx.fillStyle = C.bg; ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(...p, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(...X(Pp), 4, 0, TAU); ctx.fill();
        label(ctx, `θ crank ${((s.th % TAU + TAU) % TAU * 57.3).toFixed(0)}°`, 12, 20, C.text);
        label(ctx, 'Grashof · crank-rocker', w - 12, 20, C.muted, 'right');
        label(ctx, 'DOF = 3(4−1) − 2·4 = 1', 12, h - 12, C.muted);
      };
    },

    /* --- rigid-motion geometry: line A turns about line B, point Q turns about the moving A (Plücker / Rodrigues) --- */
    plucker(st) {
      const s = { az: .7, el: .35, trail: [] };
      // Rodrigues rotation of vector v about unit axis u by angle a
      const rot = (u, a, v) => {
        const c = Math.cos(a), sn = Math.sin(a), d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
        const cx = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        return [0, 1, 2].map((i) => v[i] * c + cx[i] * sn + u[i] * d * (1 - c));
      };
      return (ctx) => {
        const { w, h } = st, S = Math.min(w, h) * .2;
        const wantAz = st.m ? (st.m.x / w - .5) * 3 : .7 + Math.sin(st.t * .15) * .5;
        const wantEl = st.m ? clamp((st.m.y / h - .5) * 1.4 + .3, -.2, 1.1) : .35;
        s.az = lerp(s.az, wantAz, .08); s.el = lerp(s.el, wantEl, .08);
        const ca = Math.cos(s.az), sa = Math.sin(s.az), ce = Math.cos(s.el), se = Math.sin(s.el);
        const P = ([x, y, z]) => { const xr = x * ca - y * sa, yr = x * sa + y * ca; return [w * .5 + xr * S, h * .55 - (z * ce - yr * se) * S]; };
        const th = st.t * .5;                              // angle of A about B
        const pA = rot([0, 0, 1], th, [0, 1, 0]), uA = rot([0, 0, 1], th, [1, 0, 0]);
        const Q = pA.map((v, i) => v + rot(uA, 2 * th, [0, 0, .5])[i]);  // Q turns twice as fast about A
        s.trail.push(Q); if (s.trail.length > 260) s.trail.shift();
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); grid(ctx, w, h, 20);
        // ground grid in perspective-free projection
        ctx.strokeStyle = 'rgba(120,160,200,.12)'; ctx.lineWidth = 1;
        for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(...P([k, -2, -1.4])); ctx.lineTo(...P([k, 2, -1.4])); ctx.moveTo(...P([-2, k, -1.4])); ctx.lineTo(...P([2, k, -1.4])); ctx.stroke(); }
        const seg = (a, b, col, wd) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(...P(a)); ctx.lineTo(...P(b)); ctx.stroke(); };
        ctx.lineCap = 'round';
        seg([0, 0, -1.6], [0, 0, 1.7], C.z, 3);            // line B
        label(ctx, 'B', ...P([.08, 0, 1.75]), C.z);
        // trace of Q
        ctx.strokeStyle = 'rgba(255,159,67,.75)'; ctx.lineWidth = 1.5; ctx.beginPath();
        s.trail.forEach((p, i) => (i ? ctx.lineTo(...P(p)) : ctx.moveTo(...P(p)))); ctx.stroke();
        // line A
        seg(pA.map((v, i) => v - 1.3 * uA[i]), pA.map((v, i) => v + 1.3 * uA[i]), C.x, 3);
        label(ctx, 'A', ...P(pA.map((v, i) => v + 1.4 * uA[i])), C.x);
        // closest point of A to B and the moment
        ctx.setLineDash([3, 4]); seg([0, 0, 0], pA, C.dim, 1.2); ctx.setLineDash([]);
        ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(...P(Q), 5, 0, TAU); ctx.fill();
        label(ctx, 'L = (u, m),  m = p × u', 12, 20, C.text);
        label(ctx, 'R = I + sinθ[u]ₓ + (1−cosθ)[u]ₓ²', 12, h - 12, C.muted);
        label(ctx, `θ ${((th % TAU) * 57.3).toFixed(0)}°`, w - 12, 20, C.teal, 'right');
      };
    },

    /* --- RANSAC: 2-point samples, consensus band, adaptive N, total least-squares refit --- */
    ransac(st) {
      const s = {};
      const reset = () => {
        const a = rnd(-.5, .5), n = [-Math.sin(a), Math.cos(a)], pts = [];
        for (let i = 0; i < 16; i++) { const x = -1 + (2 * i) / 15; pts.push({ x: x * Math.cos(a) + rnd(-.04, .04), y: x * Math.sin(a) + rnd(-.04, .04), out: false }); }
        for (let i = 0; i < 4; i++) { const x = rnd(-1, 1), off = (Math.random() < .5 ? -1 : 1) * rnd(.3, .7); pts.push({ x: x * Math.cos(a) + n[0] * off, y: x * Math.sin(a) + n[1] * off, out: true }); }
        Object.assign(s, { pts, k: 0, N: 17, eps: .5, best: [], cand: null, final: null, clock: 0, hold: 0 });
      };
      reset();
      const lineOf = (p, q) => { let a = p.y - q.y, b = q.x - p.x; const nn = Math.hypot(a, b) || 1; a /= nn; b /= nn; return [a, b, -(a * p.x + b * p.y)]; };
      const t = .1;
      const tls = (set) => {
        const mx = set.reduce((v, p) => v + p.x, 0) / set.length, my = set.reduce((v, p) => v + p.y, 0) / set.length;
        let sxx = 0, syy = 0, sxy = 0; for (const p of set) { sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; sxy += (p.x - mx) * (p.y - my); }
        const ang = .5 * Math.atan2(2 * sxy, sxx - syy), a = -Math.sin(ang), b = Math.cos(ang);  // normal = smallest-variance direction
        return [a, b, -(a * mx + b * my)];
      };
      return (ctx) => {
        const { w, h } = st, S = Math.min(w / 2.6, h / 2.2), ox = w * .5, oy = h * .54;
        const X = (p) => [ox + p.x * S, oy - p.y * S];
        const cur = st.m ? Object.assign(s.cur || (s.cur = { out: true, cursor: true }), { x: (st.m.x - ox) / S, y: -(st.m.y - oy) / S }) : null;
        const all = cur ? s.pts.concat([cur]) : s.pts;
        s.clock += .016;
        if (s.final) { s.hold += .016; if (s.hold > 2.2) reset(); }
        else if (s.clock > .45) {
          s.clock = 0; s.k++;
          let i = Math.floor(Math.random() * all.length), j; do { j = Math.floor(Math.random() * all.length); } while (j === i);
          const L = lineOf(all[i], all[j]), cons = all.filter((p) => Math.abs(L[0] * p.x + L[1] * p.y + L[2]) < t);
          s.cand = { L, pair: [all[i], all[j]], cons };
          if (cons.length > s.best.length) { s.best = cons; const e = 1 - cons.length / all.length; if (e < s.eps) { s.eps = e; s.N = e <= 0 ? 0 : Math.ceil(Math.log(.01) / Math.log(1 - (1 - e) ** 2)); } }
          if (s.k >= s.N) s.final = tls(s.best);
        }
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); grid(ctx, w, h, 20);
        const drawLine = (L, col, wd, band) => {
          const [a, b, c] = L, ends = [];
          // intersect with a large box
          for (const x of [-3, 3]) if (Math.abs(b) > 1e-6) ends.push({ x, y: -(a * x + c) / b });
          if (ends.length < 2) { ends.length = 0; for (const y of [-3, 3]) ends.push({ x: -(b * y + c) / a, y }); }
          if (band) {
            ctx.fillStyle = 'rgba(46,230,197,.08)'; ctx.beginPath();
            const off = [a * t, b * t];
            ctx.moveTo(...X({ x: ends[0].x + off[0], y: ends[0].y + off[1] })); ctx.lineTo(...X({ x: ends[1].x + off[0], y: ends[1].y + off[1] }));
            ctx.lineTo(...X({ x: ends[1].x - off[0], y: ends[1].y - off[1] })); ctx.lineTo(...X({ x: ends[0].x - off[0], y: ends[0].y - off[1] })); ctx.closePath(); ctx.fill();
          }
          ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(...X(ends[0])); ctx.lineTo(...X(ends[1])); ctx.stroke();
        };
        if (s.final) drawLine(s.final, C.teal, 2.5, true);
        else if (s.cand) drawLine(s.cand.L, 'rgba(230,237,243,.55)', 1.2, true);
        const inSet = s.final ? s.best : s.cand ? s.cand.cons : [];
        for (const p of all) {
          const [x, y] = X(p), isIn = inSet.includes(p);
          ctx.fillStyle = isIn ? C.y : p.out ? C.x : C.muted;
          ctx.beginPath(); ctx.arc(x, y, p.cursor ? 5.5 : 3.6, 0, TAU); ctx.fill();
          if (p.cursor) { ctx.strokeStyle = C.x; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.stroke(); }
        }
        if (s.cand && !s.final) for (const p of s.cand.pair) { const [x, y] = X(p); ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.stroke(); }
        label(ctx, s.final ? 'TLS refit on best consensus' : `trial ${s.k} / N = ${s.N}`, 12, 20, C.text);
        label(ctx, `ε = ${s.eps.toFixed(2)}   |S| = ${s.best.length}`, w - 12, 20, C.teal, 'right');
        label(ctx, 'N = log(1−p) / log(1−(1−ε)²)', 12, h - 12, C.muted);
      };
    },
  };

  /* ======================= runtime ======================= */
  const list = [];
  document.querySelectorAll('canvas.viz').forEach((cv) => {
    const make = scenes[cv.dataset.viz]; if (!make) return;
    const st = { cv, ctx: cv.getContext('2d'), w: 1, h: 1, dpr: 1, t: rnd(0, 20), m: null, vis: false, onresize: null };
    const size = () => {
      const r = cv.getBoundingClientRect(); st.dpr = Math.min(2, devicePixelRatio || 1);
      st.w = Math.max(1, cv.clientWidth); st.h = Math.max(1, cv.clientHeight);
      cv.width = st.w * st.dpr; cv.height = st.h * st.dpr;
      if (st.onresize) st.onresize();
      return r;
    };
    size();
    st.draw = make(st);
    new ResizeObserver(size).observe(cv);
    new IntersectionObserver((es) => { st.vis = es[0].isIntersecting; }).observe(cv);
    const stage = cv.closest('.stage') || cv;
    stage.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect();
      st.m = { x: (e.clientX - r.left) * (st.w / r.width), y: (e.clientY - r.top) * (st.h / r.height) };
    });
    stage.addEventListener('pointerleave', () => { st.m = null; });
    list.push(st);
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    for (const st of list) {
      if (!st.vis) continue;
      st.t += dt;
      st.ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      st.draw(st.ctx);
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  if (reduce) { list.forEach((st) => { st.vis = true; st.ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0); for (let i = 0; i < 60; i++) { st.t += .05; st.draw(st.ctx); } }); }
  else requestAnimationFrame(frame);
})();
