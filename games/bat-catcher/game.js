/* Bat Catcher: forty seconds at dusk. Swing the net at bats, chain catches for a
   multiplier, and avoid the crows. Pointer, touch and keyboard all work. */
(function () {
  'use strict';
  var A = window.Arcade, W = A.W, H = A.H, DPR = A.DPR, TAU = A.TAU, C = A.C, F = A.F, rr = A.rr, clamp = A.clamp;
  var sound = A.sound;
  var cv = document.getElementById('board'), ctx = A.setupCanvas(cv);
  var elScore = document.getElementById('score'), elStats = document.getElementById('stats'), elLive = document.getElementById('live');

  var DURATION = 40, SWING_R = 44, SWING_T = 0.2, COOLDOWN = 0.26, TOP = 40;
  var state, T, left, score, streak, bestStreak, caught, golds, crowsHit, misses;
  var net, swing, cool, bats, spawnT, floaters, particles, over, fired, keys = {};
  var bg = A.makeLayer(), statItems = {};

  [['caught', 'Bats caught'], ['golds', 'Gold bats'], ['streak', 'Best chain'], ['crows', 'Crows hit']].forEach(function (r) {
    var li = document.createElement('li');
    li.appendChild(A.el('span', 'lat', r[1]));
    var v = A.el('span', 'pts', '0');
    li.appendChild(v); elStats.appendChild(li); statItems[r[0]] = v;
  });
  function renderStats() {
    statItems.caught.textContent = String(caught); statItems.golds.textContent = String(golds);
    statItems.streak.textContent = String(bestStreak); statItems.crows.textContent = String(crowsHit);
  }
  function mult() { return Math.min(5, 1 + Math.floor(streak / 3)); }

  function reset() {
    state = 'play'; T = 0; left = DURATION; score = 0; streak = 0; bestStreak = 0; caught = 0; golds = 0; crowsHit = 0; misses = 0;
    net = { x: 200, y: 420 }; swing = -1; cool = 0; bats = []; spawnT = 0.3; floaters = []; particles = []; over = 0; fired = false;
    elScore.textContent = '0'; renderStats();
    elLive.textContent = 'Go. Forty seconds.';
  }

  function spawn() {
    var r = Math.random(), kind = r < 0.14 ? 'crow' : r < 0.26 ? 'gold' : 'bat';
    var fromLeft = Math.random() < 0.5, prog = 1 - left / DURATION;
    var sp = (kind === 'crow' ? 70 : 90) + Math.random() * 70 + prog * 55 + (kind === 'gold' ? 40 : 0);
    var y = TOP + 50 + Math.random() * (H - TOP - 200);
    bats.push({
      kind: kind, x: fromLeft ? -30 : W + 30, y: y, y0: y, vx: (fromLeft ? 1 : -1) * sp, dir: fromLeft ? 1 : -1,
      ph: Math.random() * TAU, amp: 18 + Math.random() * 34, fq: 2.2 + Math.random() * 1.8, age: 0,
      r: kind === 'crow' ? 15 : 11, caught: false, ct: 0
    });
  }

  function burst(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, s = 50 + Math.random() * 130, life = 0.4 + Math.random() * 0.5;
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life, max: life, size: 1 + Math.random() * 2, color: color });
    }
  }
  function pop(x, y, txt, color, size) { floaters.push({ x: x, y: y, txt: txt, color: color, size: size || 20, life: 1.1 }); }

  function doSwing() {
    if (state !== 'play' || cool > 0) return;
    sound.ensure();
    swing = 0; cool = COOLDOWN; sound.swoosh();
    var gotBat = 0, pts = 0, hitCrow = false;
    bats.forEach(function (b) {
      if (b.caught) return;
      var dx = b.x - net.x, dy = b.y - net.y;
      if (dx * dx + dy * dy > (SWING_R + b.r) * (SWING_R + b.r)) return;
      b.caught = true; b.ct = T;
      if (b.kind === 'crow') {
        hitCrow = true; crowsHit++; pts -= 20; burst(b.x, b.y, 14, C.ember); pop(b.x, b.y, '-20', C.ember, 24);
      } else {
        gotBat++; caught++; if (b.kind === 'gold') golds++;
        var base = b.kind === 'gold' ? 30 : 10;
        streak++; bestStreak = Math.max(bestStreak, streak);
        var gain = base * mult(); pts += gain;
        burst(b.x, b.y, b.kind === 'gold' ? 22 : 10, b.kind === 'gold' ? C.marrow : C.orchid);
        pop(b.x, b.y, '+' + gain, b.kind === 'gold' ? C.marrow : C.bone, b.kind === 'gold' ? 26 : 20);
      }
    });
    if (hitCrow) { streak = 0; sound.clack(300, true); }
    else if (gotBat) sound.chime(streak >= 6 ? 2 : streak >= 3 ? 1 : 0);
    else { streak = 0; misses++; }
    score = Math.max(0, score + pts);
    elScore.textContent = String(score);
    renderStats();
  }

  function update(dt) {
    T += dt;
    if (state === 'play') {
      left -= dt; cool = Math.max(0, cool - dt);
      var kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ky = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
      if (kx || ky) { net.x = clamp(net.x + kx * 320 * dt, 20, W - 20); net.y = clamp(net.y + ky * 320 * dt, TOP + 20, H - 40); }
      if (swing >= 0) { swing += dt; if (swing > SWING_T) swing = -1; }
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); var prog = 1 - left / DURATION; spawnT = 0.75 - prog * 0.35 + Math.random() * 0.35; }
      if (left <= 0) { left = 0; state = 'over'; over = 0; elLive.textContent = 'Dawn. Final score ' + score + '.'; }
    } else if (state === 'over') {
      over += dt;
      if (over > 0.9 && !fired) { fired = true; A.finish({ game: 'bats', points: score, onReplay: reset }); }
    }
    for (var i = bats.length - 1; i >= 0; i--) {
      var b = bats[i];
      b.age += dt;
      if (b.caught) { if (T - b.ct > 0.35) bats.splice(i, 1); continue; }
      b.x += b.vx * dt; b.y = b.y0 + Math.sin(b.age * b.fq + b.ph) * b.amp;
      if (b.x < -50 || b.x > W + 50) bats.splice(i, 1);
    }
    for (var q = particles.length - 1; q >= 0; q--) {
      var p = particles[q];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; p.life -= dt;
      if (p.life <= 0) particles.splice(q, 1);
    }
    for (var k = floaters.length - 1; k >= 0; k--) {
      var f = floaters[k]; f.y -= 34 * dt; f.life -= dt;
      if (f.life <= 0) floaters.splice(k, 1);
    }
  }

  function buildBg() {
    var g = bg.g, i;
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0d0816'); sky.addColorStop(0.55, '#2a1636'); sky.addColorStop(0.85, '#6a2f3f'); sky.addColorStop(1, '#a8503a');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (i = 0; i < 60; i++) {
      var sx = (i * 97.3) % W, sy = (i * 61.7) % 380, sr = 0.5 + (i % 3) * 0.35;
      g.fillStyle = 'rgba(239,230,210,' + (0.25 + (i % 4) * 0.12) + ')'; g.beginPath(); g.arc(sx, sy + 40, sr, 0, TAU); g.fill();
    }
    var mg = g.createRadialGradient(290, 150, 8, 290, 150, 90);
    mg.addColorStop(0, 'rgba(255,240,200,0.5)'); mg.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = mg; g.fillRect(190, 50, 200, 200);
    g.fillStyle = '#f3e8c8'; g.beginPath(); g.arc(290, 150, 34, 0, TAU); g.fill();
    g.fillStyle = 'rgba(160,140,110,0.35)';
    [[278, 142, 7], [302, 160, 5], [292, 134, 3.5]].forEach(function (c) { g.beginPath(); g.arc(c[0], c[1], c[2], 0, TAU); g.fill(); });
    // Tree silhouettes and a hill
    g.fillStyle = '#0b0610';
    g.beginPath(); g.moveTo(0, H); g.lineTo(0, 600); g.quadraticCurveTo(110, 560, 210, 600); g.quadraticCurveTo(310, 640, W, 585); g.lineTo(W, H); g.closePath(); g.fill();
    g.strokeStyle = '#0b0610'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(52, 604); g.lineTo(58, 520); g.lineTo(40, 470); g.moveTo(58, 520); g.lineTo(84, 480); g.moveTo(58, 545); g.lineTo(30, 520); g.stroke();
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(40, 470); g.lineTo(28, 452); g.moveTo(40, 470); g.lineTo(50, 450); g.moveTo(84, 480); g.lineTo(98, 468); g.stroke();
    g.fillStyle = 'rgba(12,8,16,0.6)'; g.fillRect(0, 0, W, 34);
    g.fillStyle = C.line; g.fillRect(0, 34, W, 1);
    g.fillStyle = C.dim; g.font = '10px ' + F.display;
    if ('letterSpacing' in g) g.letterSpacing = '1.6px';
    g.textAlign = 'left'; g.fillText('TIME', 14, 13);
    g.textAlign = 'right'; g.fillText('CHAIN', W - 14, 13);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }

  function drawBat(b) {
    var flap = Math.sin(b.age * 16 + b.ph), fade = b.caught ? Math.max(0, 1 - (T - b.ct) * 3) : 1;
    var sc = b.r / 11;
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(sc * b.dir, sc); ctx.globalAlpha = fade;
    var body = b.kind === 'gold' ? C.marrow : b.kind === 'crow' ? '#2c2a36' : '#1a1024';
    if (b.kind === 'gold') { ctx.shadowColor = 'rgba(242,169,59,0.8)'; ctx.shadowBlur = 12; }
    ctx.fillStyle = body;
    var wy = flap * 8;
    if (b.kind === 'crow') {
      ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-10, -14 + wy, -22, -8 + wy); ctx.quadraticCurveTo(-12, -4, -4, 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, -2); ctx.quadraticCurveTo(-1, -16 + wy, -12, -14 + wy); ctx.quadraticCurveTo(-4, -6, 2, 3); ctx.fill();
      ctx.beginPath(); ctx.arc(11, -3, 4.2, 0, TAU); ctx.fill();
      ctx.fillStyle = C.marrow; ctx.beginPath(); ctx.moveTo(14.5, -4); ctx.lineTo(21, -2.5); ctx.lineTo(14.5, -1); ctx.fill();
      ctx.fillStyle = C.ember; ctx.beginPath(); ctx.arc(12, -4, 1, 0, TAU); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(0, 1, 3.6, 6, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -6, 3.8, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3, -8.5); ctx.lineTo(-4, -13); ctx.lineTo(-0.5, -9.5); ctx.moveTo(3, -8.5); ctx.lineTo(4, -13); ctx.lineTo(0.5, -9.5); ctx.fill();
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(s * 3, -3);
        ctx.quadraticCurveTo(s * 12, -12 - wy, s * 23, -6 - wy);
        ctx.quadraticCurveTo(s * 20, -3 - wy * 0.4, s * 17, 1);
        ctx.quadraticCurveTo(s * 14, -1, s * 11, 3);
        ctx.quadraticCurveTo(s * 7, 0, s * 3, 6); ctx.fill();
      });
      ctx.shadowBlur = 0; ctx.fillStyle = b.kind === 'gold' ? '#2a1c33' : C.ember;
      ctx.beginPath(); ctx.arc(-1.4, -6.5, 0.8, 0, TAU); ctx.arc(1.4, -6.5, 0.8, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(bg.c, 0, 0, W, H);
    bats.forEach(drawBat);
    for (var q = 0; q < particles.length; q++) {
      var p = particles[q]; ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Net: ring, handle, and the swing flash
    var sw = swing >= 0 ? swing / SWING_T : -1, ready = cool <= 0;
    ctx.save(); ctx.translate(net.x, net.y);
    ctx.strokeStyle = ready ? 'rgba(239,230,210,0.9)' : 'rgba(239,230,210,0.4)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(239,230,210,0.3)';
    ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.moveTo(0, -18); ctx.lineTo(0, 18); ctx.moveTo(-12.7, -12.7); ctx.lineTo(12.7, 12.7); ctx.moveTo(12.7, -12.7); ctx.lineTo(-12.7, 12.7); ctx.stroke();
    ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(13, 13); ctx.lineTo(34, 40); ctx.stroke();
    if (sw >= 0) {
      ctx.globalAlpha = 1 - sw; ctx.strokeStyle = C.marrow; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 18 + (SWING_R - 18) * Math.min(1, sw * 1.6), 0, TAU); ctx.stroke();
    } else if (ready) {
      ctx.globalAlpha = 0.25; ctx.setLineDash([3, 5]); ctx.strokeStyle = C.bone; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, SWING_R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore(); ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    floaters.forEach(function (f) {
      ctx.globalAlpha = Math.min(1, f.life * 1.8); ctx.fillStyle = f.color; ctx.font = f.size + 'px ' + F.display;
      ctx.fillText(f.txt, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    // HUD: time bar and chain
    ctx.textAlign = 'left'; ctx.fillStyle = C.bone; ctx.font = '500 15px ' + F.mono;
    ctx.fillText(Math.ceil(left) + 's', 14, 29);
    ctx.textAlign = 'right'; ctx.fillStyle = mult() > 1 ? C.marrow : C.bone;
    ctx.fillText('x' + mult() + ' · ' + streak, W - 14, 29);
    var frac = left / DURATION;
    ctx.fillStyle = frac < 0.25 ? C.ember : C.marrow; ctx.fillRect(0, 33, W * frac, 2);
    if (T < 4 && state === 'play') {
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(239,230,210,' + clamp(1 - (T - 2.5) / 1.5, 0, 1) + ')';
      ctx.font = 'italic 17px ' + F.body; ctx.fillText('Move the net, then tap to swing', W / 2, 640);
    }
  }

  var loop = A.createLoop(1 / 120, update, draw);

  function place(e) {
    var r = cv.getBoundingClientRect();
    net.x = clamp((e.clientX - r.left) * W / r.width, 20, W - 20);
    net.y = clamp((e.clientY - r.top) * H / r.height, TOP + 20, H - 40);
  }
  cv.addEventListener('pointermove', function (e) { if (state === 'play' && !A.modalOpen()) place(e); });
  cv.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    if (A.modalOpen() || state !== 'play') return;
    place(e); doSwing();
  });
  window.addEventListener('keydown', function (e) {
    if (A.modalOpen()) return;
    var ae = document.activeElement;
    if (ae && ae !== document.body && ae !== cv) return;
    if (e.key.indexOf('Arrow') === 0) { keys[e.key] = true; e.preventDefault(); }
    else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); doSwing(); }
  });
  window.addEventListener('keyup', function (e) { delete keys[e.key]; });
  window.addEventListener('blur', function () { keys = {}; });
  document.getElementById('tap').addEventListener('click', doSwing);
  document.getElementById('reset').addEventListener('click', reset);

  reset(); buildBg();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildBg);
  loop.start();
})();
