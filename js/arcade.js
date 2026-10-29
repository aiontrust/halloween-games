/* Halloween Games: shared arcade code.
   Palette, canvas helpers, game loop, sound, the score table and the initials entry screen.
   Every page loads this first and talks to the rest through window.Arcade. */
(function () {
  'use strict';

  var W = 400, H = 696, DPR = 2, PI = Math.PI, TAU = PI * 2;
  var C = {
    bone: '#efe6d2', edge: '#5d5140', ink: '#130d19', plate2: '#2a1c33', line: '#3b2c47',
    marrow: '#f2a93b', ember: '#e5694a', orchid: '#a97bc0', mute: '#8a7d98', peg: '#9a90ab',
    dim: '#b4a78f', pumpkin: '#ef7d22', leaf: '#6e8c3a'
  };
  var F = {
    display: "'IM Fell English SC', 'Iowan Old Style', Georgia, serif",
    body: "'IM Fell English', 'Iowan Old Style', Georgia, serif",
    mono: "'DM Mono', ui-monospace, Menlo, Consolas, monospace"
  };
  var ORDER = ['plinko', 'bowling', 'bats'];
  var GAMES = {
    plinko: { name: 'Bones Plinko', short: 'Bones', href: 'games/bones-plinko/index.html' },
    bowling: { name: 'Pumpkin Bowling', short: 'Bowl', href: 'games/pumpkin-bowling/index.html' },
    bats: { name: 'Bat Catcher', short: 'Bats', href: 'games/bat-catcher/index.html' }
  };
  var ROOT = (document.body && document.body.getAttribute('data-root')) || '';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function setupCanvas(cv) { cv.width = W * DPR; cv.height = H * DPR; return cv.getContext('2d'); }
  function makeLayer() {
    var c = document.createElement('canvas');
    c.width = W * DPR; c.height = H * DPR;
    var g = c.getContext('2d');
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { c: c, g: g };
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Fixed-step loop. update(dt) runs at `step`, draw() once per animation frame.
  function createLoop(step, update, draw) {
    var running = false, acc = 0, last = 0;
    function frame(ts) {
      if (!running) return;
      var dt = clamp((ts - last) / 1000, 0, 0.05);
      last = ts; acc += dt;
      while (acc >= step) { update(step); acc -= step; }
      draw();
      requestAnimationFrame(frame);
    }
    return {
      start: function () { if (running) return; running = true; acc = 0; last = performance.now(); requestAnimationFrame(frame); },
      stop: function () { running = false; },
      isRunning: function () { return running; }
    };
  }

  // Sound: small synthesized clacks and chimes. Starts only after the first tap.
  var sound = {
    ac: null, on: true, last: 0,
    ensure: function () {
      try {
        if (!this.ac) { var Ctor = window.AudioContext || window.webkitAudioContext; if (Ctor) this.ac = new Ctor(); }
        if (this.ac && this.ac.state === 'suspended') this.ac.resume();
      } catch (e) { this.ac = null; }
    },
    tone: function (freq, vol, dur, type, when) {
      if (!this.ac || !this.on) return;
      try {
        var t = this.ac.currentTime + (when || 0), o = this.ac.createOscillator(), g = this.ac.createGain();
        o.type = type || 'triangle';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(this.ac.destination);
        o.start(t); o.stop(t + dur + 0.02);
      } catch (e) { /* sound is optional */ }
    },
    clack: function (v, big) {
      var now = performance.now();
      if (now - this.last < 28) return;
      this.last = now;
      var vol = Math.min(0.09, 0.014 + v / 4500);
      this.tone((big ? 300 : 620) + Math.random() * 420, vol, 0.06, 'triangle');
      this.tone((big ? 150 : 310) + Math.random() * 120, vol * 0.6, 0.09, 'sine');
    },
    chime: function (level) {
      this.tone(520, 0.05, 0.25, 'sine');
      if (level >= 1) this.tone(780, 0.045, 0.3, 'sine', 0.08);
      if (level >= 2) this.tone(1040, 0.04, 0.35, 'sine', 0.16);
    },
    swoosh: function () {
      if (!this.ac || !this.on) return;
      try {
        var t = this.ac.currentTime, o = this.ac.createOscillator(), g = this.ac.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(420, t);
        o.frequency.exponentialRampToValueAtTime(110, t + 0.14);
        g.gain.setValueAtTime(0.03, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        o.connect(g); g.connect(this.ac.destination);
        o.start(t); o.stop(t + 0.17);
      } catch (e) { /* sound is optional */ }
    }
  };
  (function bindSoundButton() {
    var b = document.getElementById('snd');
    if (!b) return;
    try { if (localStorage.getItem('halloween-games:sound') === 'off') sound.on = false; } catch (e) { /* storage is optional */ }
    function label() { b.textContent = sound.on ? 'Sound on' : 'Sound off'; b.setAttribute('aria-pressed', sound.on ? 'true' : 'false'); }
    label();
    b.addEventListener('click', function () {
      sound.on = !sound.on;
      try { localStorage.setItem('halloween-games:sound', sound.on ? 'on' : 'off'); } catch (e) { /* storage is optional */ }
      label();
      if (sound.on) sound.ensure();
    });
  })();

  // Scores: one table for every game, kept on this device the way an arcade cabinet keeps it.
  // To share scores between devices, replace load/save below with calls to a server.
  var KEY = 'halloween-games:scores:v1', LAST = 'halloween-games:initials';
  function clean(e) {
    if (!e || typeof e !== 'object') return null;
    if (!GAMES[e.g] || typeof e.i !== 'string' || !/^[A-Z]{3}$/.test(e.i)) return null;
    if (typeof e.p !== 'number' || !isFinite(e.p) || e.p < 0 || e.p > 100000) return null;
    return { g: e.g, i: e.i, p: Math.round(e.p), t: (typeof e.t === 'number' && isFinite(e.t)) ? e.t : 0 };
  }
  var scores = {
    list: [], subs: [], persisted: true,
    load: function () {
      try {
        var raw = localStorage.getItem(KEY), arr = raw ? JSON.parse(raw) : [];
        this.list = (Array.isArray(arr) ? arr : []).map(clean).filter(Boolean);
      } catch (e) { this.persisted = false; }
    },
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(this.list)); this.persisted = true; }
      catch (e) { this.persisted = false; }
    },
    subscribe: function (fn) { this.subs.push(fn); },
    emit: function () { for (var i = 0; i < this.subs.length; i++) this.subs[i](); },
    add: function (game, initials, points) {
      var e = clean({ g: game, i: initials, p: points, t: Date.now() });
      if (!e) return null;
      this.list.push(e); this.save(); this.emit();
      return e;
    },
    clear: function () { this.list = []; this.save(); this.emit(); },
    // Best score per player per game, plus each player's overall total.
    stats: function () {
      var best = {}, per = { plinko: {}, bowling: {}, bats: {} };
      this.list.forEach(function (e) {
        var b = best[e.i] || (best[e.i] = { plinko: 0, bowling: 0, bats: 0 });
        if (e.p > b[e.g]) b[e.g] = e.p;
        var cur = per[e.g][e.i];
        if (!cur || e.p > cur.p || (e.p === cur.p && e.t < cur.t)) per[e.g][e.i] = e;
      });
      var out = { overall: [], per: { plinko: [], bowling: [], bats: [] } };
      Object.keys(best).forEach(function (i) {
        var b = best[i];
        out.overall.push({ i: i, b: b, total: b.plinko + b.bowling + b.bats });
      });
      out.overall.sort(function (a, b) { return b.total - a.total || (a.i < b.i ? -1 : 1); });
      ORDER.forEach(function (g) {
        out.per[g] = Object.keys(per[g]).map(function (i) { return per[g][i]; })
          .sort(function (a, b) { return b.p - a.p || a.t - b.t; });
      });
      return out;
    },
    // Place a score would take among other players' bests, before it is saved.
    rankOf: function (game, initials, points) {
      var n = 1, rows = this.stats().per[game];
      for (var k = 0; k < rows.length; k++) { if (rows[k].i !== initials && rows[k].p > points) n++; }
      return n;
    }
  };
  scores.load();
  window.addEventListener('storage', function (e) { if (e.key === KEY) { scores.load(); scores.emit(); } });

  // Initials entry and result screen
  var M = { built: false, open: false, run: null, letters: [65, 65, 65], idx: 0 };
  var UI = {};
  var CHEV_UP = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHEV_DN = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function initialsText() { return String.fromCharCode(M.letters[0], M.letters[1], M.letters[2]); }
  function renderSlots() {
    for (var i = 0; i < 3; i++) {
      UI.letters[i].textContent = String.fromCharCode(M.letters[i]);
      UI.slots[i].className = 'slot' + (i === M.idx ? ' on' : '');
    }
  }
  function bump(i, d) { M.letters[i] = 65 + ((M.letters[i] - 65 + d + 26) % 26); M.idx = i; renderSlots(); }

  function buildModal() {
    if (M.built) return;
    M.built = true;
    var m = el('div', 'modal'); m.hidden = true;
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'm-game');
    var card = el('div', 'mcard'); card.tabIndex = -1;
    var game = el('p', 'eyebrow'); game.id = 'm-game';
    var score = el('p', 'final', '0');
    var note = el('p', 'note');

    var entry = el('div', 'mblock');
    entry.appendChild(el('p', 'subline', 'Enter your initials'));
    var slots = el('div', 'slots'); UI.slots = []; UI.letters = [];
    [0, 1, 2].forEach(function (i) {
      var s = el('div', 'slot');
      var up = el('button', 'arrow'); up.type = 'button'; up.innerHTML = CHEV_UP; up.setAttribute('aria-label', 'Letter ' + (i + 1) + ' up');
      var ch = el('div', 'letter', 'A'); ch.setAttribute('role', 'img'); ch.setAttribute('aria-label', 'Letter ' + (i + 1));
      var dn = el('button', 'arrow'); dn.type = 'button'; dn.innerHTML = CHEV_DN; dn.setAttribute('aria-label', 'Letter ' + (i + 1) + ' down');
      up.addEventListener('click', function () { bump(i, 1); });
      dn.addEventListener('click', function () { bump(i, -1); });
      ch.addEventListener('click', function () { M.idx = i; renderSlots(); });
      s.appendChild(up); s.appendChild(ch); s.appendChild(dn);
      slots.appendChild(s); UI.slots.push(s); UI.letters.push(ch);
    });
    entry.appendChild(slots);
    var ea = el('div', 'actions');
    var save = el('button', 'btn', 'Save score'); save.type = 'button';
    var skip = el('button', 'btn ghost', 'Skip'); skip.type = 'button';
    ea.appendChild(save); ea.appendChild(skip); entry.appendChild(ea);

    var after = el('div', 'mblock'); after.hidden = true;
    var rank = el('p', 'rankline'), sub = el('p', 'subline');
    var aa = el('div', 'actions');
    var again = el('button', 'btn', 'Play again'); again.type = 'button';
    var home = el('a', 'btn ghost', 'All games'); home.href = ROOT + 'index.html';
    aa.appendChild(again); aa.appendChild(home);
    after.appendChild(rank); after.appendChild(sub); after.appendChild(aa);

    card.appendChild(game); card.appendChild(score); card.appendChild(note); card.appendChild(entry); card.appendChild(after);
    m.appendChild(card); document.body.appendChild(m);
    UI.modal = m; UI.card = card; UI.game = game; UI.score = score; UI.note = note;
    UI.entry = entry; UI.after = after; UI.rank = rank; UI.sub = sub; UI.save = save; UI.again = again;

    save.addEventListener('click', saveScore);
    skip.addEventListener('click', function () { showAfter(null); });
    again.addEventListener('click', function () { var r = M.run, fn = r && (r.onNext || r.onReplay); closeModal(); if (fn) fn(); });
  }

  function closeModal() { if (UI.modal) UI.modal.hidden = true; M.open = false; M.run = null; }

  function openModal(run) {
    buildModal();
    M.run = run; M.open = true; M.idx = 0;
    var last = 'AAA';
    try { var s = localStorage.getItem(LAST); if (s && /^[A-Z]{3}$/.test(s)) last = s; } catch (e) { /* storage is optional */ }
    M.letters = [last.charCodeAt(0), last.charCodeAt(1), last.charCodeAt(2)];
    UI.game.textContent = GAMES[run.game].name + (run.label ? ' \u00b7 ' + run.label : '');
    UI.score.textContent = String(run.points);
    UI.note.textContent = run.note || '';
    UI.again.textContent = run.nextLabel || 'Play again';
    UI.entry.hidden = false; UI.after.hidden = true;
    renderSlots();
    UI.modal.hidden = false;
    UI.card.focus();
  }

  function saveScore() {
    var run = M.run;
    if (!run || run.saved) return;
    var ini = initialsText();
    var rank = scores.rankOf(run.game, ini, run.points);
    var e = scores.add(run.game, ini, run.points);
    run.saved = true;
    try { localStorage.setItem(LAST, ini); } catch (x) { /* storage is optional */ }
    showAfter(e ? { ini: ini, rank: rank } : null);
  }

  function showAfter(res) {
    var run = M.run;
    UI.entry.hidden = true; UI.after.hidden = false;
    if (res) {
      UI.rank.textContent = 'Rank #' + res.rank + ' on ' + GAMES[run.game].name;
      var row = null, o = scores.stats().overall;
      for (var k = 0; k < o.length; k++) { if (o[k].i === res.ini) row = o[k]; }
      var line = row ? res.ini + ' has ' + row.total + ' points overall.' : '';
      if (!scores.persisted) line += ' This browser blocked storage, so the score is lost when you leave.';
      UI.sub.textContent = line;
      UI.note.textContent = [run.note, (res.rank === 1 && run.points > 0) ? 'New high score.' : ''].filter(Boolean).join(' ');
    } else {
      UI.rank.textContent = 'Score not saved';
      UI.sub.textContent = '';
    }
    UI.again.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (!M.open || !UI.entry || UI.entry.hidden) return;
    var k = e.key;
    if (/^[a-zA-Z]$/.test(k)) { M.letters[M.idx] = k.toUpperCase().charCodeAt(0); M.idx = Math.min(2, M.idx + 1); renderSlots(); e.preventDefault(); }
    else if (k === 'Backspace') { M.idx = Math.max(0, M.idx - 1); renderSlots(); e.preventDefault(); }
    else if (k === 'ArrowUp') { bump(M.idx, 1); e.preventDefault(); }
    else if (k === 'ArrowDown') { bump(M.idx, -1); e.preventDefault(); }
    else if (k === 'ArrowLeft') { M.idx = Math.max(0, M.idx - 1); renderSlots(); e.preventDefault(); }
    else if (k === 'ArrowRight') { M.idx = Math.min(2, M.idx + 1); renderSlots(); e.preventDefault(); }
    else if (k === 'Enter') {
      var a = document.activeElement;
      if (a && a.tagName === 'BUTTON') return;
      e.preventDefault(); saveScore();
    }
  });

  // Save the games for offline play (needs https or localhost).
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register(ROOT + 'sw.js').catch(function () { /* offline support is optional */ }); });
  }

  window.Arcade = {
    W: W, H: H, DPR: DPR, PI: PI, TAU: TAU, C: C, F: F, GAMES: GAMES, ORDER: ORDER, ROOT: ROOT,
    clamp: clamp, rr: rr, el: el, setupCanvas: setupCanvas, makeLayer: makeLayer, createLoop: createLoop,
    sound: sound, scores: scores,
    finish: function (run) { openModal(run); },
    modalOpen: function () { return M.open; }
  };
})();
