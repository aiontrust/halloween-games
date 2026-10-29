/* Pumpkin Bowling: top-down lane, ten ghost pins, a pumpkin ball.
   Three taps per roll: position, angle, power. Circle physics for ball and pins. */
(function () {
  'use strict';
  var A = window.Arcade, W = A.W, H = A.H, DPR = A.DPR, TAU = A.TAU, C = A.C, F = A.F, rr = A.rr;
  var sound = A.sound;
  var cv = document.getElementById('board'), ctx = A.setupCanvas(cv);
  var elScore = document.getElementById('score'), elFrames = document.getElementById('frames');
  var elLive = document.getElementById('live');

  var LX0 = 70, LX1 = 330, GUT0 = 34, GUT1 = 366, PIT = 112, FOUL = 584, BALL_Y = 620, LANE_END = 650;
  var BR = 14, PR = 10, FRAMES = 5;
  var PKEY = 'halloween-games:bowling-players';
  var MAXP = 3, players = 1, cur = 0, totals = [0, 0, 0], logs = [[], [], []];
  var PCOL = [C.pumpkin, C.orchid, '#8fbf5a'], PFILL = [C.pumpkin, '#9a5fc0', '#6e9a3a'], PLINE = ['rgba(120,40,5,0.6)', 'rgba(50,15,80,0.6)', 'rgba(25,55,10,0.6)'];
  try { var sv = parseInt(localStorage.getItem(PKEY), 10); if (sv >= 1 && sv <= MAXP) players = sv; } catch (e) { /* storage is optional */ }
  var phase, pt, aimX, aimA, power, ball, pins, frame, rollNo, n1, settleT, sweepT, rollT, advance, overT, fired;
  var T = 0, floaters = [], particles = [], frameItems = [];
  var bg = A.makeLayer();

  function pname(i) { return players > 1 ? 'Player ' + (i + 1) : ''; }
  function renderLog() {
    elFrames.textContent = '';
    var cols = '1.7rem' + ' minmax(0, 1fr)'.repeat(players), compact = players > 2, pl;
    if (players > 1) {
      var hd = document.createElement('li'); hd.className = 'head'; hd.style.gridTemplateColumns = cols;
      hd.appendChild(A.el('span', 'n', ''));
      for (pl = 0; pl < players; pl++) hd.appendChild(A.el('span', 'pts', 'P' + (pl + 1)));
      elFrames.appendChild(hd);
    }
    for (var i = 0; i < FRAMES; i++) {
      var li = document.createElement('li');
      li.appendChild(A.el('span', 'n', String(i + 1)));
      if (players > 1) {
        var all = true;
        for (pl = 0; pl < players; pl++) if (!logs[pl][i]) all = false;
        li.className = all ? 'done' : ''; li.style.gridTemplateColumns = cols;
        for (pl = 0; pl < players; pl++) {
          var e = logs[pl][i], isCur = phase !== 'over' && cur === pl && logs[pl].length === i, txt;
          if (!e) txt = isCur ? 'up' : '\u2013';
          else if (compact) txt = (/^Strike/.test(e.t) ? 'X ' : /^Spare/.test(e.t) ? '/ ' : '') + e.p;
          else txt = e.t.replace(/ pins$/, '').replace(/^Spare.*/, 'Spare') + ' \u00b7 ' + e.p;
          li.appendChild(A.el('span', 'pts' + (isCur ? ' cur' : ''), txt));
        }
      } else {
        var e1 = logs[0][i];
        li.className = i < logs[0].length ? 'done' : (i === logs[0].length && phase !== 'over' ? 'next' : '');
        li.appendChild(A.el('span', 'lat', e1 ? e1.t : ''));
        li.appendChild(A.el('span', 'pts', e1 ? String(e1.p) : '\u2013'));
      }
      elFrames.appendChild(li);
    }
  }
  function showScore() { elScore.textContent = totals.slice(0, players).join(' \u2013 '); elScore.style.fontSize = players > 2 ? '1.1rem' : ''; }
  function say(t) { elLive.textContent = t; }

  function newPin(x, y) { return { x: x, y: y, hx: x, hy: y, vx: 0, vy: 0, r: PR, down: false, gone: false, goneT: 0 }; }
  function rack() {
    pins = [];
    [[150, [-51, -17, 17, 51]], [179, [-34, 0, 34]], [208, [-17, 17]], [237, [0]]].forEach(function (row) {
      row[1].forEach(function (dx) { pins.push(newPin(200 + dx, row[0])); });
    });
  }

  function reset() {
    phase = 'pos'; pt = 0; aimX = 200; aimA = 0; power = 0; ball = null;
    frame = 1; rollNo = 1; n1 = 0; cur = 0; totals = [0, 0, 0]; logs = [[], [], []]; settleT = 0; sweepT = 0; rollT = 0; advance = false; overT = 0; fired = false;
    floaters = []; particles = [];
    if (players > 1) floaters.push({ x: 200, y: 330, txt: 'PLAYER 1', life: 1.6, color: PCOL[0], size: 30 });
    rack();
    showScore();
    renderLog();
  }

  function startRoll() {
    var sp = 380 + 720 * power;
    ball = { x: aimX, y: BALL_Y, vx: Math.sin(aimA) * sp, vy: -Math.cos(aimA) * sp, r: BR, rot: 0, inG: false, gx: 0, done: false, doneT: 0 };
    phase = 'roll'; rollT = 0; settleT = 0;
    sound.swoosh();
  }

  function tap() {
    if (A.modalOpen()) return;
    sound.ensure();
    if (phase === 'pos') { phase = 'angle'; pt = 0; sound.tone(520, 0.04, 0.08, 'sine'); }
    else if (phase === 'angle') { phase = 'power'; pt = 0; sound.tone(640, 0.04, 0.08, 'sine'); }
    else if (phase === 'power') { startRoll(); }
  }

  // Circle against circle, impulse along the contact normal. Returns the closing speed.
  function collide(a, b, ma, mb, e) {
    var dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, R = a.r + b.r;
    if (d2 >= R * R || d2 === 0) return 0;
    var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = R - d, tm = ma + mb;
    a.x -= nx * pen * mb / tm; a.y -= ny * pen * mb / tm;
    b.x += nx * pen * ma / tm; b.y += ny * pen * ma / tm;
    var rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rv >= 0) return 0;
    var j = -(1 + e) * rv / (1 / ma + 1 / mb);
    a.vx -= j * nx / ma; a.vy -= j * ny / ma; b.vx += j * nx / mb; b.vy += j * ny / mb;
    return -rv;
  }

  function physics(dt) {
    var i, j, p;
    if (ball && !ball.done) {
      var sp = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (sp > 0) { var ns = Math.max(0, sp - 30 * dt); ball.vx *= ns / sp; ball.vy *= ns / sp; sp = ns; }
      ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.rot += sp * dt / BR;
      if (!ball.inG && (ball.x < LX0 + 4 || ball.x > LX1 - 4)) {
        ball.inG = true; ball.gx = ball.x < 200 ? (GUT0 + LX0) / 2 : (LX1 + GUT1) / 2; ball.vx = 0;
      }
      if (ball.inG) ball.x += (ball.gx - ball.x) * Math.min(1, dt * 10);
      if (ball.y < PIT - 30 || sp < 25) { ball.done = true; ball.doneT = T; }
    }
    for (i = 0; i < pins.length; i++) {
      p = pins[i];
      if (p.gone) continue;
      var s = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (s > 0) { var n2 = Math.max(0, s * Math.exp(-1.6 * dt) - 90 * dt); p.vx *= n2 / s; p.vy *= n2 / s; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < LX0 + 2 || p.x > LX1 - 2 || p.y < PIT) { p.gone = true; p.goneT = T; }
    }
    if (ball && !ball.done && !ball.inG) {
      for (i = 0; i < pins.length; i++) {
        if (pins[i].gone) continue;
        var imp = collide(ball, pins[i], 8, 1, 0.55);
        if (imp > 30) sound.clack(imp * 1.2, true);
      }
    }
    for (i = 0; i < pins.length; i++) {
      if (pins[i].gone) continue;
      for (j = i + 1; j < pins.length; j++) {
        if (pins[j].gone) continue;
        var im2 = collide(pins[i], pins[j], 1, 1, 0.6);
        if (im2 > 40) sound.clack(im2, false);
      }
    }
  }

  function allStill() {
    for (var i = 0; i < pins.length; i++) {
      var p = pins[i];
      if (!p.gone && Math.sqrt(p.vx * p.vx + p.vy * p.vy) > 10) return false;
    }
    return true;
  }

  function burst(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, s = 60 + Math.random() * 120, life = 0.5 + Math.random() * 0.5;
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life, max: life, size: 1 + Math.random() * 2, color: color });
    }
  }

  function evaluate() {
    var down = 0, standing = 0;
    pins.forEach(function (p) {
      if (p.gone) { p.down = true; down++; }
      else if (Math.sqrt((p.x - p.hx) * (p.x - p.hx) + (p.y - p.hy) * (p.y - p.hy)) > 12) { p.down = true; down++; }
      else standing++;
    });
    var gutter = ball && ball.inG, msg, bonus = 0, entry = null;
    totals[cur] += down * 10;
    if (rollNo === 1) {
      if (standing === 0) { bonus = 40; msg = 'Strike'; advance = true; entry = { t: 'Strike', p: 100 + bonus }; }
      else { n1 = down; msg = down === 0 ? (gutter ? 'Gutter' : 'Miss') : down + ' down'; rollNo = 2; advance = false; }
    } else {
      var n = n1 + down;
      if (standing === 0) { bonus = 20; msg = 'Spare'; entry = { t: 'Spare (' + n1 + '+' + down + ')', p: 100 + bonus }; }
      else { msg = n1 + down + ' down'; entry = { t: n + ' pins', p: n * 10 }; }
      advance = true;
    }
    totals[cur] += bonus;
    if (entry) logs[cur].push(entry);
    showScore();
    var big = bonus > 0;
    floaters.push({ x: 200, y: 330, txt: msg.toUpperCase(), life: 1.4, color: big ? C.marrow : C.bone, size: big ? 30 : 22 });
    if (down > 0) { burst(200, 190, big ? 26 : 12, big ? C.marrow : '#cfe0ff'); sound.chime(big ? 2 : 0); }
    say((pname(cur) ? pname(cur) + ': ' : '') + msg + '. Score ' + totals[cur] + '.');
    phase = 'sweep'; sweepT = 0;
    renderLog();
  }

  function endSweep() {
    pins = pins.filter(function (p) { return !p.down; });
    pins.forEach(function (p) { p.hx = p.x; p.hy = p.y; p.vx = 0; p.vy = 0; });
    ball = null;
    if (advance) {
      rollNo = 1; n1 = 0;
      if (logs.slice(0, players).every(function (l) { return l.length >= FRAMES; })) { phase = 'over'; overT = 0; renderLog(); return; }
      if (players > 1) {
        cur = (cur + 1) % players;
        floaters.push({ x: 200, y: 330, txt: 'PLAYER ' + (cur + 1), life: 1.6, color: PCOL[cur], size: 30 });
        say('Player ' + (cur + 1) + ', your turn.');
      }
      rack();
    }
    phase = 'pos'; pt = 0; renderLog();
  }

  function finish() {
    fired = true;
    if (players === 1) {
      say('Game over. Final score ' + totals[0] + '.');
      A.finish({ game: 'bowling', points: totals[0], onReplay: reset });
      return;
    }
    var sc = totals.slice(0, players), top = Math.max.apply(null, sc), win = [];
    sc.forEach(function (v, i) { if (v === top) win.push(i + 1); });
    var verdict = win.length === 1 ? 'Player ' + win[0] + ' wins with ' + top + '.'
      : win.length === players ? 'Everyone ties at ' + top + '.'
      : 'Players ' + win.slice(0, -1).join(', ') + ' and ' + win[win.length - 1] + ' tie at ' + top + '.';
    say('Game over. ' + verdict);
    (function show(i) {
      var last = i === players - 1;
      A.finish({
        game: 'bowling', points: sc[i], label: 'Player ' + (i + 1), note: verdict,
        nextLabel: last ? undefined : 'Player ' + (i + 2) + '\u2019s score',
        onNext: last ? undefined : function () { show(i + 1); },
        onReplay: last ? reset : undefined
      });
    })(0);
  }

  function update(dt) {
    T += dt;
    if (phase === 'pos') { pt += dt; aimX = 200 + 98 * Math.sin(pt * 2.3); }
    else if (phase === 'angle') { pt += dt; aimA = 0.36 * Math.sin(pt * 2.7); }
    else if (phase === 'power') { pt += dt; var ph = (pt * 1.15) % 2; power = ph < 1 ? ph : 2 - ph; }
    else if (phase === 'roll') {
      rollT += dt;
      physics(dt);
      if (ball && ball.done && allStill()) settleT += dt; else settleT = 0;
      if (settleT > 0.5 || rollT > 14) evaluate();
    } else if (phase === 'sweep') {
      sweepT += dt;
      if (sweepT >= 0.9) endSweep();
    } else if (phase === 'over') {
      overT += dt;
      if (overT > 0.8 && !fired) finish();
    }
    for (var i = particles.length - 1; i >= 0; i--) {
      var q = particles[i];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.98; q.vy *= 0.98; q.life -= dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (var k = floaters.length - 1; k >= 0; k--) {
      var f = floaters[k];
      f.y -= 18 * dt; f.life -= dt * 0.8;
      if (f.life <= 0) floaters.splice(k, 1);
    }
  }

  // Static layer: lane, gutters, pit, HUD band
  function buildBg() {
    var g = bg.g, x;
    g.fillStyle = '#1a1121'; g.fillRect(0, 0, W, H);
    var rg = g.createRadialGradient(W / 2, 180, 10, W / 2, 180, 360);
    rg.addColorStop(0, 'rgba(239,125,34,0.18)'); rg.addColorStop(1, 'rgba(239,125,34,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);

    g.fillStyle = '#07040a'; g.fillRect(LX0, 40, LX1 - LX0, PIT - 40);
    var pg = g.createLinearGradient(0, 40, 0, PIT);
    pg.addColorStop(0, 'rgba(120,60,200,0)'); pg.addColorStop(1, 'rgba(120,60,200,0.35)');
    g.fillStyle = pg; g.fillRect(LX0, 40, LX1 - LX0, PIT - 40);

    [[GUT0, LX0], [LX1, GUT1]].forEach(function (r) {
      var gg = g.createLinearGradient(r[0], 0, r[1], 0);
      gg.addColorStop(0, '#0b0710'); gg.addColorStop(0.5, '#1d1428'); gg.addColorStop(1, '#0b0710');
      g.fillStyle = gg; g.fillRect(r[0], PIT - 12, r[1] - r[0], LANE_END - PIT + 12);
    });

    var lg = g.createLinearGradient(0, PIT, 0, LANE_END);
    lg.addColorStop(0, '#3a2418'); lg.addColorStop(1, '#5f3d2a');
    g.fillStyle = lg; g.fillRect(LX0, PIT, LX1 - LX0, LANE_END - PIT);
    g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 1;
    for (x = LX0 + 13; x < LX1; x += 13) { g.beginPath(); g.moveTo(x, PIT); g.lineTo(x, LANE_END); g.stroke(); }
    g.fillStyle = 'rgba(239,230,210,0.32)';
    for (var k = 0; k < 5; k++) {
      var ax = 200 + (k - 2) * 36, ay = 420 + Math.abs(k - 2) * 14;
      g.beginPath(); g.moveTo(ax, ay - 16); g.lineTo(ax - 5, ay); g.lineTo(ax + 5, ay); g.closePath(); g.fill();
    }
    for (var d = 0; d < 7; d++) { g.beginPath(); g.arc(200 + (d - 3) * 32, 505, 2.4, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(10,6,14,0.35)'; g.fillRect(LX0, FOUL + 3, LX1 - LX0, LANE_END - FOUL - 3);
    g.fillStyle = C.bone; g.fillRect(LX0, FOUL, LX1 - LX0, 3);
    g.fillStyle = 'rgba(239,230,210,0.5)'; g.fillRect(LX0 - 1, PIT, 2, LANE_END - PIT); g.fillRect(LX1 - 1, PIT, 2, LANE_END - PIT);

    g.fillStyle = '#120c18'; g.fillRect(0, LANE_END, W, H - LANE_END);
    g.fillStyle = C.line; g.fillRect(0, LANE_END, W, 1);

    g.fillStyle = 'rgba(12,8,16,0.6)'; g.fillRect(0, 0, W, 34);
    g.fillStyle = C.line; g.fillRect(0, 34, W, 1);
    g.fillStyle = C.dim; g.font = '10px ' + F.display;
    if ('letterSpacing' in g) g.letterSpacing = '1.6px';
    g.textAlign = 'left'; g.fillText('FRAME', 14, 13);
    g.textAlign = 'right'; g.fillText('BALL', W - 14, 13);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }

  function drawGhost(x, y, scale, alpha, moving) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(180,200,255,0.55)'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#e9eef9';
    ctx.beginPath(); ctx.arc(0, 0, 8.4, 0, TAU);
    for (var i = 0; i < 7; i++) {
      var a = i / 7 * TAU, cx = Math.cos(a) * 7.6, cy = Math.sin(a) * 7.6;
      ctx.moveTo(cx + 3.3, cy); ctx.arc(cx, cy, 3.3, 0, TAU);
    }
    ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#2a1c33';
    ctx.beginPath(); ctx.ellipse(-3, -1.8, 1.5, 2.2, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, -1.8, 1.5, 2.2, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 3.2, moving ? 2.2 : 1.2, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawPumpkin(x, y, rot, r, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(2.5, 3.5, r, r * 0.95, 0, 0, TAU); ctx.fill();
    ctx.rotate(rot);
    var pi = players > 1 ? cur : 0;
    ctx.fillStyle = PFILL[pi]; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = PLINE[pi]; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    for (var k = 0; k < 6; k++) {
      var a = k * TAU / 6;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 3.4, Math.sin(a) * 3.4);
      ctx.quadraticCurveTo(Math.cos(a + 0.45) * r * 0.7, Math.sin(a + 0.45) * r * 0.7, Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96);
      ctx.stroke();
    }
    ctx.fillStyle = C.leaf; ctx.beginPath(); rr(ctx, -2.6, -2.6, 5.2, 5.2, 1.6); ctx.fill();
    ctx.rotate(-rot);
    ctx.fillStyle = 'rgba(255,225,160,0.38)'; ctx.beginPath(); ctx.arc(-r * 0.36, -r * 0.36, r * 0.26, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(bg.c, 0, 0, W, H);

    var aiming = phase === 'pos' || phase === 'angle' || phase === 'power';
    if (aiming) {
      var a = phase === 'pos' ? 0 : aimA;
      ctx.setLineDash([2, 6]); ctx.strokeStyle = 'rgba(242,169,59,0.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(aimX, BALL_Y - BR - 2);
      ctx.lineTo(aimX + Math.sin(a) * 230, BALL_Y - BR - 2 - Math.cos(a) * 230); ctx.stroke();
      ctx.setLineDash([]);
      drawPumpkin(aimX, BALL_Y, 0, BR, 1);
    }

    for (var i = 0; i < pins.length; i++) {
      var p = pins[i];
      if (p.gone) {
        var s = 1 - (T - p.goneT) * 2.5;
        if (s > 0) drawGhost(p.x, p.y, s, s, true);
      } else if (p.down) {
        var al = Math.max(0, 1 - sweepT / 0.9);
        drawGhost(p.x, p.y, 1, al * 0.8, true);
      } else {
        var moving = (p.vx * p.vx + p.vy * p.vy) > 100;
        drawGhost(p.x, p.y, 1, 1, moving);
      }
    }
    if (ball) {
      var fade = ball.done ? Math.max(0, 1 - (T - ball.doneT) * 2.5) : 1;
      if (fade > 0) drawPumpkin(ball.x, ball.y, ball.rot, BR, fade);
    }

    for (var q = 0; q < particles.length; q++) {
      var pt2 = particles[q];
      ctx.globalAlpha = Math.max(0, pt2.life / pt2.max); ctx.fillStyle = pt2.color;
      ctx.beginPath(); ctx.arc(pt2.x, pt2.y, pt2.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (var f = 0; f < floaters.length; f++) {
      var fl = floaters[f];
      ctx.globalAlpha = Math.min(1, fl.life * 1.6); ctx.fillStyle = fl.color;
      ctx.font = fl.size + 'px ' + F.display; ctx.fillText(fl.txt, fl.x, fl.y);
    }
    ctx.globalAlpha = 1;

    // power meter and hints
    var mx = LX0, mw = LX1 - LX0, my = 656;
    ctx.beginPath(); rr(ctx, mx, my, mw, 12, 6); ctx.fillStyle = '#1d1428'; ctx.fill();
    if (phase === 'power') {
      var gr = ctx.createLinearGradient(mx, 0, mx + mw, 0);
      gr.addColorStop(0, C.leaf); gr.addColorStop(0.6, C.marrow); gr.addColorStop(1, C.ember);
      ctx.beginPath(); rr(ctx, mx, my, Math.max(8, mw * power), 12, 6); ctx.fillStyle = gr; ctx.fill();
    }
    ctx.lineWidth = 1; ctx.strokeStyle = C.line; ctx.beginPath(); rr(ctx, mx, my, mw, 12, 6); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = C.dim; ctx.font = 'italic 15px ' + F.body;
    var hint = phase === 'pos' ? 'Tap to stop the pumpkin' : phase === 'angle' ? 'Tap to lock the aim' : phase === 'power' ? 'Tap to set the power' : '';
    if (hint) ctx.fillText(hint, W / 2, 688);

    // HUD
    ctx.textAlign = 'left'; ctx.fillStyle = C.bone; ctx.font = '500 15px ' + F.mono;
    var shownFrame = Math.min(FRAMES, logs[cur].length + (phase === 'over' ? 0 : 1));
    if (players > 1) { ctx.fillStyle = PCOL[cur]; ctx.fillText('P' + (cur + 1) + ' \u00b7 ' + shownFrame + ' / ' + FRAMES, 14, 29); ctx.fillStyle = C.bone; }
    else ctx.fillText(shownFrame + ' / ' + FRAMES, 14, 29);
    ctx.textAlign = 'right';
    ctx.fillText(rollNo + ' / 2 · ' + pins.filter(function (p) { return !p.down && !p.gone; }).length + ' standing', W - 14, 29);
  }

  var loop = A.createLoop(1 / 240, update, draw);

  cv.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    tap();
  });
  window.addEventListener('keydown', function (e) {
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    if (A.modalOpen()) return;
    var ae = document.activeElement;
    if (ae && ae !== document.body && ae !== cv) return;
    e.preventDefault();
    tap();
  });
  document.getElementById('tap').addEventListener('click', tap);
  document.getElementById('reset').addEventListener('click', reset);

  function markMode() {
    for (var n = 1; n <= MAXP; n++) document.getElementById('p' + n + 'btn').setAttribute('aria-pressed', n === players ? 'true' : 'false');
  }
  function setMode(n) {
    players = n;
    try { localStorage.setItem(PKEY, String(n)); } catch (e) { /* storage is optional */ }
    markMode(); reset();
  }
  [1, 2, 3].forEach(function (n) {
    document.getElementById('p' + n + 'btn').addEventListener('click', function () { if (players !== n) setMode(n); });
  });
  markMode();

  reset();
  buildBg();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(buildBg); }
  loop.start();
})();
