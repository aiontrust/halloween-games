/* Bones Plinko: a skeleton hangs from a rail and falls apart bone by bone.
   Each bone is a rigid capsule that tumbles off pegs into scoring bins. */
(function () {
  'use strict';
  var A = window.Arcade, W = A.W, H = A.H, DPR = A.DPR, PI = A.PI, TAU = A.TAU, C = A.C, F = A.F, rr = A.rr;
  var sound = A.sound;
  var cv = document.getElementById('board'), ctx = A.setupCanvas(cv);

  // Geometry
  var RAIL_Y = 44, D = 40;
  var PEG_R = 4.4, PEG0 = 258, ROWS = 11, DY = 29.5;
  var BIN_TOP = 588, FLOOR = 656, NB = 7, BW = W / NB;
  var BINS = [50, 30, 15, 5, 15, 30, 50];
  var G = 720;
  function binColor(v) { return v >= 50 ? C.marrow : v >= 30 ? C.ember : v >= 15 ? C.orchid : C.mute; }

  // Skeleton parts. Offsets are from the skull centre; D drops that point below the carriage.
  // The skeleton faces you, so its left side is on your right.
  var PDEF = [
    { id: 'manusL', latin: 'Manus sinistra', eng: 'left hand', kind: 'hand', h: 3.4, r: 4, lx: 24, ly: 87, a0: PI / 2, z: 8, ws: 1.5 },
    { id: 'manusR', latin: 'Manus dextra', eng: 'right hand', kind: 'hand', h: 3.4, r: 4, lx: -24, ly: 87, a0: PI / 2, z: 8, ws: 1.5 },
    { id: 'pesL', latin: 'Pes sinister', eng: 'left foot', kind: 'foot', h: 4.5, r: 3.6, lx: 12.5, ly: 136, a0: 0, z: 3, ws: 1.2 },
    { id: 'pesR', latin: 'Pes dexter', eng: 'right foot', kind: 'foot', h: 4.5, r: 3.6, lx: -12.5, ly: 136, a0: PI, z: 3, ws: 1.2 },
    { id: 'antL', latin: 'Antebrachium sinistrum', eng: 'left forearm', kind: 'long', h: 8.5, r: 3.3, lx: 24.5, ly: 68, a0: PI / 2, z: 7, ws: 1.3 },
    { id: 'antR', latin: 'Antebrachium dextrum', eng: 'right forearm', kind: 'long', h: 8.5, r: 3.3, lx: -24.5, ly: 68, a0: PI / 2, z: 7, ws: 1.3 },
    { id: 'tibL', latin: 'Tibia sinistra', eng: 'left shin', kind: 'long', h: 10.5, r: 3.5, lx: 9, ly: 117, a0: PI / 2, z: 2, ws: 1.0 },
    { id: 'tibR', latin: 'Tibia dextra', eng: 'right shin', kind: 'long', h: 10.5, r: 3.5, lx: -9, ly: 117, a0: PI / 2, z: 2, ws: 1.0 },
    { id: 'humL', latin: 'Humerus sinister', eng: 'left upper arm', kind: 'long', h: 9.5, r: 3.7, lx: 24, ly: 43, a0: PI / 2, z: 6, ws: 1.1 },
    { id: 'humR', latin: 'Humerus dexter', eng: 'right upper arm', kind: 'long', h: 9.5, r: 3.7, lx: -24, ly: 43, a0: PI / 2, z: 6, ws: 1.1 },
    { id: 'femL', latin: 'Femur sinistrum', eng: 'left thigh bone', kind: 'long', h: 11.5, r: 4, lx: 9, ly: 87, a0: PI / 2, z: 1, ws: 0.9 },
    { id: 'femR', latin: 'Femur dextrum', eng: 'right thigh bone', kind: 'long', h: 11.5, r: 4, lx: -9, ly: 87, a0: PI / 2, z: 1, ws: 0.9 },
    { id: 'mandible', latin: 'Mandibula', eng: 'jaw', kind: 'jaw', h: 8, r: 3, lx: 0, ly: 17.5, a0: 0, z: 10, ws: 1.6 },
    { id: 'spine', latin: 'Columna vertebralis', eng: 'spine', kind: 'spine', h: 19, r: 3.4, lx: 0, ly: 44, a0: PI / 2, z: 5, ws: 0.4 },
    { id: 'pelvis', latin: 'Pelvis', eng: 'pelvis', kind: 'pelvis', h: 9, r: 7, lx: 0, ly: 67, a0: 0, z: 4, ws: 0.5 },
    { id: 'thorax', latin: 'Thorax', eng: 'ribcage', kind: 'thorax', h: 5, r: 11, lx: 0, ly: 40, a0: 0, z: 9, ws: 0.4 },
    { id: 'skull', latin: 'Cranium', eng: 'skull', kind: 'skull', h: 0, r: 14.5, lx: 0, ly: 0, a0: 0, z: 11, ws: 0.6, mult: 2 }
  ];
  var ORDER = ['manusL', 'manusR', 'pesL', 'pesR', 'antL', 'antR', 'tibL', 'tibR', 'humL', 'humR', 'femL', 'femR', 'mandible', 'spine', 'pelvis', 'thorax', 'skull'];
  var PMAP = {};
  PDEF.forEach(function (p, i) { p.wf = 1.3 + (i % 5) * 0.47; p.wp = i * 1.7; p.attached = true; PMAP[p.id] = p; });
  var DRAW_ORDER = PDEF.slice().sort(function (a, b) { return a.z - b.z; });
  var N = ORDER.length;

  // Static colliders: pegs and the small circles that make up the bin dividers
  var pegs = [], divs = [];
  (function () {
    for (var i = 0; i < ROWS; i++) {
      var y = PEG0 + i * DY;
      if (i % 2 === 0) { for (var k = 0; k < 9; k++) pegs.push({ x: (k + 0.5) * W / 9, y: y, r: PEG_R, f: 0 }); }
      else { for (var j = 0; j <= 9; j++) pegs.push({ x: j * W / 9, y: y, r: PEG_R, f: 0 }); }
    }
    for (var d = 1; d < NB; d++) { for (var yy = BIN_TOP + 3; yy <= FLOOR; yy += 5) divs.push({ x: d * BW, y: yy, r: 3.2 }); }
  })();
  var STAT = pegs.concat(divs);

  // State
  var S = { phase: 0, omega: 1.2, sway: 0, swayV: 0, shake: 0, px: W / 2, pvx: 0, t: 0 };
  var bodies, particles, floaters, results;
  var binFlash = [0, 0, 0, 0, 0, 0, 0];
  var nextIdx, total, over, endTimer, cooldown;

  // DOM
  var elScore = document.getElementById('score');
  var elNextLatin = document.getElementById('nextLatin'), elNextEng = document.getElementById('nextEng');
  var elCount = document.getElementById('count'), elList = document.getElementById('list');
  var btnSnap = document.getElementById('snap'), btnReset = document.getElementById('reset');
  var elLive = document.getElementById('live');
  var items = [];
  ORDER.forEach(function (id, i) {
    var p = PMAP[id], li = document.createElement('li');
    li.appendChild(A.el('span', 'n', String(i + 1)));
    li.appendChild(A.el('span', 'lat', p.latin));
    li.appendChild(A.el('span', 'pts', '–'));
    elList.appendChild(li); items.push(li);
  });

  function refreshUI() {
    elScore.textContent = String(total);
    var nx = ORDER[nextIdx] ? PMAP[ORDER[nextIdx]] : null;
    elNextLatin.textContent = nx ? nx.latin : 'All bones loosed';
    elNextEng.textContent = nx ? nx.eng + (nx.mult > 1 ? ' · scores double' : '') : 'Waiting for the last ones to land';
    elCount.textContent = nextIdx + ' / ' + N;
    items.forEach(function (li, i) {
      li.className = i < nextIdx ? 'done' : (i === nextIdx ? 'next' : '');
      li.lastChild.textContent = results[i] != null ? String(results[i]) : '–';
    });
    btnSnap.disabled = nextIdx >= N || over;
  }
  function say(t) { elLive.textContent = t; }

  // Skeleton on the rail
  function stepSkel(dt) {
    var target = 1.2 + 0.03 * nextIdx;
    S.omega += (target - S.omega) * Math.min(1, dt * 1.5);
    S.phase += S.omega * dt;
    var Amp = 150, sn = Math.sin(S.phase), cn = Math.cos(S.phase);
    S.px = W / 2 + Amp * sn;
    S.pvx = Amp * S.omega * cn;
    var ax = -Amp * S.omega * S.omega * sn;
    var L = 130, w0 = 4, z = 0.1;
    var acc = -w0 * w0 * S.sway - 2 * z * w0 * S.swayV + ax / L;
    S.swayV += acc * dt;
    S.sway += S.swayV * dt;
    S.shake *= Math.exp(-2.2 * dt);
  }
  function partPose(p) {
    var cs = Math.cos(S.sway), sn = Math.sin(S.sway), ly = p.ly + D;
    var wob = Math.sin(S.t * p.wf + p.wp) * (0.025 + 0.10 * S.shake) * p.ws;
    return { x: S.px + p.lx * cs - ly * sn, y: RAIL_Y + p.lx * sn + ly * cs, a: S.sway + p.a0 + wob };
  }

  // Bodies
  function makeBody(p) {
    return { part: p, h: p.h, r: p.r, x: 0, y: 0, a: 0, vx: 0, vy: 0, w: 0, k2: p.h * p.h / 3 + p.r * p.r / 2 + 1,
      e: p.kind === 'skull' ? 0.46 : 0.52, scored: false, settled: false, still: 0, rest: 0, age: 0, order: nextIdx };
  }

  // Impulse at a contact point with friction. n points from the obstacle to the body.
  function resolve(b, px, py, nx, ny, pen, e, mu) {
    var rx = px - b.x, ry = py - b.y;
    b.x += nx * pen; b.y += ny * pen;
    var vx = b.vx - b.w * ry, vy = b.vy + b.w * rx;
    var vn = vx * nx + vy * ny;
    if (vn >= 0) return 0;
    if (-vn < 30) e = 0;
    var rn = rx * ny - ry * nx;
    var j = -(1 + e) * vn / (1 + rn * rn / b.k2);
    b.vx += j * nx; b.vy += j * ny; b.w += j * rn / b.k2;
    vx = b.vx - b.w * ry; vy = b.vy + b.w * rx;
    var tx = -ny, ty = nx, vt = vx * tx + vy * ty;
    var rt = rx * ty - ry * tx;
    var jt = -vt / (1 + rt * rt / b.k2), lim = mu * j;
    if (jt > lim) jt = lim; else if (jt < -lim) jt = -lim;
    b.vx += jt * tx; b.vy += jt * ty; b.w += jt * rt / b.k2;
    return -vn;
  }

  function stepBody(b, dt) {
    b.age += dt;
    b.vy += G * dt;
    var dr = Math.exp(-0.15 * dt);
    b.vx *= dr; b.vy *= dr; b.w *= Math.exp(-0.25 * dt);
    b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt;
    var c = Math.cos(b.a) * b.h, s = Math.sin(b.a) * b.h;
    var big = b.part.kind === 'skull' || b.part.kind === 'thorax' || b.part.kind === 'pelvis';

    for (var side = -1; side <= 1; side += 2) {
      if (b.h === 0 && side === 1) break;
      var ex = b.x + side * c, ey = b.y + side * s, imp = 0;
      if (ex - b.r < 0) imp = resolve(b, 0, ey, 1, 0, b.r - ex, 0.35, 0.2);
      else if (ex + b.r > W) imp = resolve(b, W, ey, -1, 0, ex + b.r - W, 0.35, 0.2);
      if (imp > 70) sound.clack(imp, big);
      ex = b.x + side * c; ey = b.y + side * s;
      if (ey + b.r > FLOOR) { imp = resolve(b, ex, FLOOR, 0, -1, ey + b.r - FLOOR, 0.25, 0.6); if (imp > 70) sound.clack(imp, big); }
    }

    var minY = b.y - Math.abs(s) - b.r - 8, maxY = b.y + Math.abs(s) + b.r + 8;
    var reach = Math.abs(c) + b.r + 8;
    for (var i = 0; i < STAT.length; i++) {
      var q = STAT[i];
      if (q.y < minY || q.y > maxY || Math.abs(q.x - b.x) > reach) continue;
      var ax = b.x - c, ay = b.y - s, t = 0;
      if (b.h > 0) {
        var dx = 2 * c, dy = 2 * s;
        t = ((q.x - ax) * dx + (q.y - ay) * dy) / (dx * dx + dy * dy);
        t = t < 0 ? 0 : t > 1 ? 1 : t;
      }
      var cx = ax + 2 * c * t, cy = ay + 2 * s * t;
      var nx = cx - q.x, ny = cy - q.y, d2 = nx * nx + ny * ny, R = b.r + q.r;
      if (d2 < R * R) {
        var d = Math.sqrt(d2);
        if (d < 1e-6) { nx = 0; ny = -1; d = 0; } else { nx /= d; ny /= d; }
        var hit = resolve(b, q.x + nx * q.r, q.y + ny * q.r, nx, ny, R - d, b.e, 0.3);
        if (hit > 40) {
          if (q.f !== undefined) q.f = 1;
          b.vx += (Math.random() - 0.5) * 8;
          sound.clack(hit, big);
        }
      }
    }

    var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (!b.scored) {
      if (b.y > BIN_TOP + 8) scoreBody(b);
      else if (b.age > 30) { b.y = BIN_TOP + 20; scoreBody(b); }
      else {
        b.still = sp < 10 ? b.still + dt : 0;
        if (b.still > 1) { b.vy = -170; b.vx = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 50); b.w = (Math.random() - 0.5) * 8; b.still = 0; }
      }
    } else {
      b.rest = (sp < 8 && Math.abs(b.w) < 0.6) ? b.rest + dt : 0;
      if (b.rest > 0.4) { b.settled = true; b.vx = 0; b.vy = 0; b.w = 0; }
    }
  }

  function burst(x, y, n, color, speed) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, s = speed * (0.4 + Math.random());
      var life = 0.45 + Math.random() * 0.4;
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: life, max: life, size: 1 + Math.random() * 2, color: color });
    }
  }

  function scoreBody(b) {
    b.scored = true;
    var k = Math.max(0, Math.min(NB - 1, Math.floor(b.x / BW)));
    var mult = b.part.mult || 1, pts = BINS[k] * mult;
    total += pts;
    results[b.order] = pts;
    binFlash[k] = 1;
    floaters.push({ x: (k + 0.5) * BW, y: BIN_TOP - 10, txt: '+' + pts, life: 1, color: binColor(BINS[k]), size: pts >= 50 ? 22 : 18 });
    burst((k + 0.5) * BW, BIN_TOP + 6, pts >= 30 ? 14 : 7, binColor(BINS[k]), 110);
    sound.chime(pts >= 50 ? 2 : pts >= 30 ? 1 : 0);
    say(b.part.latin + ' landed in the ' + BINS[k] + ' bin' + (mult > 1 ? ', doubled' : '') + '. Score ' + total + '.');
    refreshUI();
  }

  function release() {
    if (over || cooldown > 0 || nextIdx >= N) return;
    sound.ensure();
    var p = PMAP[ORDER[nextIdx]], pose = partPose(p);
    var b = makeBody(p);
    var rx = pose.x - S.px, ry = pose.y - RAIL_Y;
    b.x = pose.x; b.y = pose.y; b.a = pose.a;
    b.vx = S.pvx - S.swayV * ry;
    b.vy = S.swayV * rx - 25;
    b.w = S.swayV + (Math.random() - 0.5) * 2;
    bodies.push(b);
    p.attached = false;
    nextIdx++;
    S.shake = 1;
    S.swayV += (Math.random() - 0.5) * 0.5;
    cooldown = 0.25;
    burst(pose.x, pose.y, 7, C.bone, 70);
    sound.clack(260, true);
    refreshUI();
  }

  function finish() {
    over = true;
    refreshUI();
    say('Skeleton scattered. Final score ' + total + '.');
    A.finish({ game: 'plinko', points: total, onReplay: reset });
  }

  function reset() {
    bodies = []; particles = []; floaters = []; results = [];
    PDEF.forEach(function (p) { p.attached = true; });
    nextIdx = 0; total = 0; over = false; endTimer = 0; cooldown = 0;
    S.shake = 0; S.omega = 1.2;
    for (var i = 0; i < NB; i++) binFlash[i] = 0;
    for (var k = 0; k < pegs.length; k++) pegs[k].f = 0;
    refreshUI();
  }

  function update(dt) {
    S.t += dt;
    stepSkel(dt);
    if (cooldown > 0) cooldown -= dt;
    var allScored = true;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (!b.settled) stepBody(b, dt);
      if (!b.scored) allScored = false;
    }
    for (var k = 0; k < pegs.length; k++) { if (pegs[k].f > 0) pegs[k].f = Math.max(0, pegs[k].f - dt * 4); }
    for (var m = 0; m < NB; m++) { if (binFlash[m] > 0) binFlash[m] = Math.max(0, binFlash[m] - dt * 1.6); }
    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var q = particles[pi];
      q.vy += 520 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      if (q.life <= 0) particles.splice(pi, 1);
    }
    for (var fi = floaters.length - 1; fi >= 0; fi--) {
      var f = floaters[fi];
      f.y -= 26 * dt; f.life -= dt * 0.8;
      if (f.life <= 0) floaters.splice(fi, 1);
    }
    if (!over && nextIdx >= N && allScored) {
      endTimer += dt;
      if (endTimer > 1.1) finish();
    }
  }

  // Drawing helpers
  function ell(cx, cy, rx, ry, rot) { ctx.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot)); ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU); }
  function fillBone() { ctx.lineJoin = 'round'; ctx.lineWidth = 1.8; ctx.strokeStyle = C.edge; ctx.stroke(); ctx.fillStyle = C.bone; ctx.fill(); }
  function line2(w) { ctx.lineCap = 'round'; ctx.lineWidth = w + 1.7; ctx.strokeStyle = C.edge; ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = C.bone; ctx.stroke(); }

  var DRAW = {
    long: function (p) {
      var he = p.h + p.r * 0.26, lr = p.r * 0.74;
      ctx.beginPath();
      ctx.rect(-he, -p.r * 0.4, 2 * he, p.r * 0.8);
      [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sy) { ctx.moveTo(sx * he + lr, sy * p.r * 0.5); ctx.arc(sx * he, sy * p.r * 0.5, lr, 0, TAU); }); });
      fillBone();
      ctx.beginPath(); ctx.moveTo(-he, -p.r * 0.15); ctx.lineTo(he, -p.r * 0.15);
      ctx.lineWidth = 0.9; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke();
    },
    hand: function (p) {
      ctx.beginPath(); ell(-p.h * 0.7, 0, p.r * 0.95, p.r * 0.85, 0); fillBone();
      ctx.beginPath();
      [-3, -1, 1, 3].forEach(function (fy) { ctx.moveTo(0.5, fy * 0.35); ctx.lineTo(p.h + p.r * 0.95, fy * 0.9); });
      line2(1.5);
      ctx.beginPath(); ctx.moveTo(-2, -2.5); ctx.lineTo(1.5, -4.4); line2(1.4);
    },
    foot: function (p) {
      ctx.beginPath(); ell(-p.h * 0.55, 0, p.h * 0.9, p.r * 0.85, 0); fillBone();
      ctx.beginPath();
      [-1.8, -0.6, 0.6, 1.8].forEach(function (fy) { ctx.moveTo(0.5, fy * 0.6); ctx.lineTo(p.h + p.r * 0.95, fy); });
      line2(1.2);
    },
    jaw: function () {
      ctx.beginPath(); ctx.moveTo(-9, -2.5); ctx.quadraticCurveTo(-8.5, 3.5, 0, 3.8); ctx.quadraticCurveTo(8.5, 3.5, 9, -2.5);
      line2(2.6);
      ctx.fillStyle = C.bone;
      for (var x = -6; x <= 6; x += 2) { var y = 3.8 - 6.3 * (x / 9) * (x / 9); ctx.fillRect(x - 0.6, y - 3.6, 1.2, 1.7); }
    },
    spine: function (p) {
      var L = p.h + p.r, n = 8, step = 2 * L / n;
      ctx.beginPath();
      for (var i = 0; i < n; i++) { var cx = -L + step * (i + 0.5); rr(ctx, cx - step * 0.38, -p.r * 0.95, step * 0.76, p.r * 1.9, 1.2); }
      fillBone();
    },
    pelvis: function () {
      ctx.beginPath();
      ell(-8, -1.5, 8, 6, -0.3); ell(8, -1.5, 8, 6, 0.3);
      ctx.moveTo(-4.5, -5); ctx.lineTo(4.5, -5); ctx.lineTo(0, 6); ctx.closePath();
      fillBone();
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(-7.5, 2.2, 1.9, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(7.5, 2.2, 1.9, 0, TAU); ctx.fill();
    },
    thorax: function () {
      var ribY = [-6.5, -2, 2.5, 7], ribW = [12, 15.5, 16.5, 13.5];
      ctx.beginPath(); ctx.moveTo(-12, -9.5); ctx.quadraticCurveTo(0, -12.5, 12, -9.5); line2(1.8);
      [-1, 1].forEach(function (sx) {
        ctx.beginPath();
        for (var i = 0; i < 4; i++) { ctx.moveTo(sx * 1.2, ribY[i]); ctx.quadraticCurveTo(sx * ribW[i], ribY[i] - 4, sx * (ribW[i] - 0.5), ribY[i] + 3.2); }
        line2(1.9);
      });
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 9); line2(2.4);
    },
    skull: function (p) {
      var r = p.r;
      ctx.beginPath(); ell(0, -1, r, r * 0.92, 0); rr(ctx, -r * 0.5, r * 0.3, r, r * 0.68, 2); fillBone();
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.ellipse(-r * 0.36, r * 0.05, r * 0.23, r * 0.27, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.36, r * 0.05, r * 0.23, r * 0.27, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, r * 0.28); ctx.lineTo(-r * 0.1, r * 0.5); ctx.lineTo(r * 0.1, r * 0.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C.edge; ctx.lineWidth = 0.8; ctx.beginPath();
      for (var i = -2; i <= 2; i++) { ctx.moveTo(i * r * 0.17, r * 0.72); ctx.lineTo(i * r * 0.17, r * 0.97); }
      ctx.stroke();
    }
  };
  function drawPart(p, x, y, a, glow) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    if (glow) { ctx.shadowColor = C.marrow; ctx.shadowBlur = 12; }
    DRAW[p.kind](p);
    ctx.restore();
  }

  // Static layer, drawn once
  var bg = A.makeLayer();
  function buildBg() {
    var g = bg.g;
    var gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#2b1d35'); gr.addColorStop(1, '#1a1121');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var rg = g.createRadialGradient(W / 2, 110, 10, W / 2, 110, 300);
    rg.addColorStop(0, 'rgba(242,169,59,0.14)'); rg.addColorStop(1, 'rgba(242,169,59,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);

    g.fillStyle = 'rgba(12,8,16,0.6)'; g.fillRect(0, 0, W, 34);
    g.fillStyle = C.line; g.fillRect(0, 34, W, 1);
    g.fillStyle = C.dim; g.textBaseline = 'alphabetic';
    g.font = '10px ' + F.display;
    if ('letterSpacing' in g) g.letterSpacing = '1.6px';
    g.textAlign = 'left'; g.fillText('NEXT', 14, 13);
    g.textAlign = 'right'; g.fillText('BONES', W - 14, 13);
    if ('letterSpacing' in g) g.letterSpacing = '0px';

    g.strokeStyle = '#5a4a66'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(10, RAIL_Y); g.lineTo(W - 10, RAIL_Y); g.stroke();
    g.fillStyle = '#5a4a66'; g.fillRect(6, RAIL_Y - 7, 4, 14); g.fillRect(W - 10, RAIL_Y - 7, 4, 14);

    // ruler ticks, like a scale bar on a specimen plate
    g.strokeStyle = 'rgba(239,230,210,0.22)'; g.lineWidth = 1;
    for (var ty = PEG0 - 14, ti = 0; ty < BIN_TOP - 4; ty += 6, ti++) {
      var tl = ti % 5 === 0 ? 7 : 3.5;
      g.beginPath(); g.moveTo(0, ty); g.lineTo(tl, ty); g.moveTo(W, ty); g.lineTo(W - tl, ty); g.stroke();
    }

    g.fillStyle = 'rgba(10,6,14,0.5)'; g.fillRect(0, BIN_TOP, W, FLOOR - BIN_TOP);
    for (var k = 0; k < NB; k++) {
      var col = binColor(BINS[k]), bgr = g.createLinearGradient(0, BIN_TOP, 0, FLOOR);
      bgr.addColorStop(0, col + '00'); bgr.addColorStop(1, col + '55');
      g.fillStyle = bgr; g.fillRect(k * BW, BIN_TOP, BW, FLOOR - BIN_TOP);
    }
    for (var d = 1; d < NB; d++) {
      g.beginPath(); rr(g, d * BW - 2.8, BIN_TOP, 5.6, FLOOR - BIN_TOP, 2.8);
      g.fillStyle = '#8d83a0'; g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(d * BW - 1.6, BIN_TOP + 3, 1.1, FLOOR - BIN_TOP - 5);
    }
    pegs.forEach(function (p) {
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fillStyle = C.peg; g.fill();
      g.lineWidth = 1; g.strokeStyle = '#2a1c33'; g.stroke();
      g.beginPath(); g.arc(p.x - 1.2, p.y - 1.3, p.r * 0.34, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill();
    });
    g.fillStyle = '#120c18'; g.fillRect(0, FLOOR, W, H - FLOOR);
    g.fillStyle = C.line; g.fillRect(0, FLOOR, W, 1);
    g.font = '500 16px ' + F.mono; g.textAlign = 'center';
    for (var v = 0; v < NB; v++) { g.fillStyle = binColor(BINS[v]); g.fillText(String(BINS[v]), (v + 0.5) * BW, FLOOR + 26); }
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(bg.c, 0, 0, W, H);

    for (var k = 0; k < NB; k++) {
      if (binFlash[k] > 0) { ctx.fillStyle = binColor(BINS[k]); ctx.globalAlpha = binFlash[k] * 0.35; ctx.fillRect(k * BW, BIN_TOP, BW, FLOOR - BIN_TOP); ctx.globalAlpha = 1; }
    }
    for (var i = 0; i < pegs.length; i++) {
      var pg = pegs[i];
      if (pg.f > 0) {
        ctx.globalAlpha = pg.f * 0.8; ctx.fillStyle = C.marrow;
        ctx.beginPath(); ctx.arc(pg.x, pg.y, pg.r + 1 + pg.f * 2.5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(pg.x, pg.y, pg.r, 0, TAU); ctx.fillStyle = C.bone; ctx.fill();
      }
    }

    // carriage and string
    var cs = Math.cos(S.sway), sn = Math.sin(S.sway), sl = D - 14.5;
    var sx = S.px - sl * sn, sy = RAIL_Y + sl * cs;
    ctx.strokeStyle = C.dim; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(S.px, RAIL_Y); ctx.lineTo(sx, sy); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, TAU); ctx.stroke();
    ctx.beginPath(); rr(ctx, S.px - 10, RAIL_Y - 7, 20, 14, 3); ctx.fillStyle = C.marrow; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = C.ink; ctx.stroke();

    // aim guide for the next bone
    var np = ORDER[nextIdx] ? PMAP[ORDER[nextIdx]] : null;
    if (np && !over) {
      var gp = partPose(np);
      ctx.setLineDash([2, 5]); ctx.strokeStyle = 'rgba(242,169,59,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gp.x, gp.y + np.h + np.r + 4); ctx.lineTo(gp.x, PEG0 - 14); ctx.stroke();
      ctx.setLineDash([]);
    }

    for (var j = 0; j < DRAW_ORDER.length; j++) {
      var p = DRAW_ORDER[j];
      if (!p.attached) continue;
      var pose = partPose(p);
      drawPart(p, pose.x, pose.y, pose.a, p === np);
    }
    for (var b = 0; b < bodies.length; b++) { var bd = bodies[b]; drawPart(bd.part, bd.x, bd.y, bd.a, false); }

    for (var q = 0; q < particles.length; q++) {
      var pt = particles[q];
      ctx.globalAlpha = Math.max(0, pt.life / pt.max); ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (var f = 0; f < floaters.length; f++) {
      var fl = floaters[f];
      ctx.globalAlpha = Math.min(1, fl.life * 2); ctx.fillStyle = fl.color;
      ctx.font = '500 ' + fl.size + 'px ' + F.mono; ctx.fillText(fl.txt, fl.x, fl.y);
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'left'; ctx.fillStyle = C.bone; ctx.font = 'italic 16px ' + F.body;
    ctx.fillText(np ? np.latin : 'All bones loosed', 14, 29);
    ctx.textAlign = 'right'; ctx.font = '500 14px ' + F.mono;
    ctx.fillText(nextIdx + ' / ' + N, W - 14, 29);

    if (nextIdx === 0 && !over) {
      ctx.beginPath(); rr(ctx, W / 2 - 128, 396, 256, 34, 17); ctx.fillStyle = 'rgba(19,13,25,0.85)'; ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = C.bone; ctx.font = 'italic 15px ' + F.body;
      ctx.fillText('Tap the board to snap a bone loose', W / 2, 418);
    }
  }

  var loop = A.createLoop(1 / 120, update, draw);

  cv.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    release();
  });
  window.addEventListener('keydown', function (e) {
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    if (A.modalOpen()) return;
    var ae = document.activeElement;
    if (ae && ae !== document.body && ae !== cv) return;
    e.preventDefault();
    release();
  });
  btnSnap.addEventListener('click', release);
  btnReset.addEventListener('click', reset);

  reset();
  buildBg();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(buildBg); }
  loop.start();
})();
