/* Haunted House: pick decorations from the table, place them on the house,
   paint it, and switch the lights on and off. Saved on this device. No score. */
(function () {
  'use strict';
  var A = window.Arcade, el = A.el, sound = A.sound;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'halloween-games:house:v1';

  var SWATCH = ['#6b5b73', '#a97bc0', '#e5694a', '#6e8c3a', '#efe6d2', '#3b2c47', '#f2a93b', '#5d86a8'];
  var TARGETS = [['walls', 'Walls'], ['roof', 'Roof'], ['door', 'Door'], ['trim', 'Trim']];
  var ROOMS = [['attic', 'Attic'], ['up', 'Upstairs'], ['down', 'Downstairs']];
  var DEFAULT = {
    paint: { walls: '#6b5b73', roof: '#3b2c47', door: '#e5694a', trim: '#efe6d2' },
    lights: { attic: false, up: true, down: false },
    placed: {}
  };

  // Decorations, drawn around (0,0) in roughly a 44px box.
  var BAT = '<g transform="scale(.85) translate(-24 -24)"><ellipse cx="24" cy="27" rx="4.2" ry="7.5"/><circle cx="24" cy="19" r="4.2"/><path d="M20.6 16.5l-1.6-5 4 2zM27.4 16.5l1.6-5-4 2z"/><path d="M28 22C34 14 42 14 46 20c-3 0-5 1-6 3-1-1-3-1-4.5 1-1.5-.5-3.5 0-4.5 2-1-1-2-1-3 0z"/><path d="M20 22C14 14 6 14 2 20c3 0 5 1 6 3 1-1 3-1 4.5 1 1.5-.5 3.5 0 4.5 2 1-1 2-1 3 0z"/></g>';
  var ITEMS = [
    { rim: true, id: 'bats', name: 'Bats', kinds: ['sky', 'roof'], svg: '<g fill="#1a1024" stroke="#a97bc0" stroke-width=".6">' + BAT + '</g>' },
    { id: 'ghost', name: 'Ghost', kinds: ['sky', 'window', 'yard'], glow: true,
      svg: '<path d="M-14 18V-4a14 14 0 0 1 28 0V18l-5-4-4.5 4-4.5-4-4.5 4-4.5-4z" fill="#e9eef9"/><ellipse cx="-5" cy="-3" rx="2.2" ry="3.2" fill="#2a1c33"/><ellipse cx="5" cy="-3" rx="2.2" ry="3.2" fill="#2a1c33"/><ellipse cx="0" cy="6" rx="2.6" ry="3.4" fill="#2a1c33"/>' },
    { rim: true, id: 'crow', name: 'Crow', kinds: ['roof', 'yard'],
      svg: '<ellipse cx="0" cy="4" rx="13" ry="8" fill="#25212e"/><circle cx="11" cy="-4" r="6" fill="#25212e"/><path d="M16 -5l8 2-8 2z" fill="#f2a93b"/><circle cx="12.5" cy="-5.5" r="1.3" fill="#e5694a"/><path d="M-10 8l-6 8M-4 11l-3 8" stroke="#25212e" stroke-width="2"/><path d="M-12 2l-10-2 8 8z" fill="#25212e"/>' },
    { rim: true, id: 'hat', name: 'Witch hat', kinds: ['roof', 'yard'],
      svg: '<path d="M-14 12L-2-22 3-20C4-10 9 2 14 12z" fill="#2a1c33"/><path d="M-12 7h24" stroke="#a97bc0" stroke-width="4"/><ellipse cx="0" cy="13" rx="22" ry="5" fill="#2a1c33"/>' },
    { id: 'jack', name: 'Jack-o’-lantern', kinds: ['yard', 'roof', 'door', 'window'], glow: true,
      svg: '<ellipse cx="0" cy="3" rx="19" ry="16" fill="#ef7d22"/><path d="M0-12v30M-9-10c-6 6-6 18 0 24M9-10c6 6 6 18 0 24" fill="none" stroke="#7a3205" stroke-width="1.2" opacity=".5"/><path d="M0-12c0-4 1-6 4-8" stroke="#6e8c3a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M-10-1l4-6 4 6zM2-1l4-6 4 6z" fill="#fbe08a"/><path d="M-9 8h18l-3 6-3-3-3 4-3-4-3 3z" fill="#fbe08a"/>' },
    { id: 'lantern', name: 'Lantern', kinds: ['yard', 'door', 'roof'], glow: true,
      svg: '<path d="M-5-18c0-5 10-5 10 0" fill="none" stroke="#b4a78f" stroke-width="2"/><rect x="-10" y="-16" width="20" height="4" rx="1.5" fill="#3b2c47"/><rect x="-9" y="-12" width="18" height="24" rx="3" fill="#f6c85a" opacity=".9"/><path d="M0-12v24M-9 0h18" stroke="#3b2c47" stroke-width="1.5"/><rect x="-10" y="12" width="20" height="4" rx="1.5" fill="#3b2c47"/>' },
    { id: 'tomb', name: 'Tombstone', kinds: ['yard'],
      svg: '<path d="M-14 20V-4a14 14 0 0 1 28 0V20z" fill="#8c8a99"/><path d="M0-8v14M-5-3h10" stroke="#4a4658" stroke-width="2.4" stroke-linecap="round"/><path d="M-14 20h28" stroke="#5a5868" stroke-width="3"/>' },
    { id: 'skull', name: 'Skull', kinds: ['window', 'door', 'yard'],
      svg: '<path d="M0-16C-10-16-16-10-16-1c0 5 3 8 6 10v6h20V9c3-2 6-5 6-10 0-9-6-15-16-15z" fill="#efe6d2"/><circle cx="-6" cy="-1" r="4" fill="#130d19"/><circle cx="6" cy="-1" r="4" fill="#130d19"/><path d="M0 4l-2.5 5h5z" fill="#130d19"/>' },
    { id: 'web', name: 'Cobweb', kinds: ['window', 'door', 'roof'],
      svg: '<g fill="none" stroke="#cfd6e4" stroke-width="1.2" opacity=".9"><path d="M-18-18L18 18M-18 18L18-18M0-20v40M-20 0h40"/><circle r="6"/><circle r="12"/><circle r="18"/></g>' },
    { id: 'candle', name: 'Candle', kinds: ['window', 'door', 'yard'], glow: true,
      svg: '<rect x="-5" y="-4" width="10" height="22" rx="2" fill="#efe6d2"/><path d="M0-6c-5-4-2-10 0-14 2 4 5 10 0 14z" fill="#f6c85a"/><path d="M0-6c-2-2-1-5 0-7 1 2 2 5 0 7z" fill="#fff3c0"/>' },
    { id: 'eyes', name: 'Glowing eyes', kinds: ['window'], glow: true,
      svg: '<ellipse cx="-8" cy="0" rx="5" ry="3.6" fill="#f2e36a"/><ellipse cx="8" cy="0" rx="5" ry="3.6" fill="#f2e36a"/><ellipse cx="-8" cy="0" rx="1.3" ry="3.4" fill="#130d19"/><ellipse cx="8" cy="0" rx="1.3" ry="3.4" fill="#130d19"/>' },
    { rim: true, id: 'cat', name: 'Black cat', kinds: ['roof', 'window', 'yard'],
      svg: '<path d="M-12 18c-2-14 2-22 12-22s14 8 12 22z" fill="#1a1626"/><path d="M-9-2l-2-12 8 5zM9-2l2-12-8 5z" fill="#1a1626"/><circle cx="-5" cy="2" r="2" fill="#f2e36a"/><circle cx="5" cy="2" r="2" fill="#f2e36a"/><path d="M12 16c10 0 12-10 8-14" fill="none" stroke="#1a1626" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'tree', name: 'Dead tree', kinds: ['yard'],
      svg: '<g fill="none" stroke="#3a2a22" stroke-width="5" stroke-linecap="round"><path d="M0 22V-2"/><path d="M0 8L-12-6M0 2L12-12M-12-6l-6-8M12-12l8-4M-12-6l4-10M12-12l-2-10" stroke-width="3"/></g>' },
    { id: 'wreath', name: 'Wreath', kinds: ['door'],
      svg: '<circle r="14" fill="none" stroke="#4d6a2a" stroke-width="7"/><circle r="14" fill="none" stroke="#6e8c3a" stroke-width="3" stroke-dasharray="3 5"/><path d="M-6 14l6-3 6 3-3 8-3-4-3 4z" fill="#ef7d22"/><circle cx="-8" cy="-6" r="2" fill="#e5694a"/><circle cx="9" cy="-3" r="2" fill="#e5694a"/>' },
    { id: 'bones', name: 'Bone pile', kinds: ['yard'],
      svg: '<g fill="#efe6d2"><path d="M-18 12a3.6 3.6 0 1 1 5-2l22-14a3.6 3.6 0 1 1 3 5.5 3.6 3.6 0 1 1-5 2L-10 16a3.6 3.6 0 1 1-8-4z"/><path d="M18 12a3.6 3.6 0 1 0-5-2l-22-14a3.6 3.6 0 1 0-3 5.5 3.6 3.6 0 1 0 5 2L10 16a3.6 3.6 0 1 0 8-4z"/></g>' },
    { id: 'pot', name: 'Cauldron', kinds: ['yard', 'door'], glow: true,
      svg: '<ellipse cx="0" cy="-4" rx="17" ry="5" fill="#6e8c3a"/><path d="M-18-4c-2 16 4 22 18 22s20-6 18-22c0 4-8 6-18 6s-18-2-18-6z" fill="#2a2433"/><circle cx="-5" cy="-6" r="2" fill="#b6e07a"/><circle cx="6" cy="-5" r="1.6" fill="#b6e07a"/>' }
  ];
  var BYID = {}; ITEMS.forEach(function (i) { BYID[i.id] = i; });

  // Where things go. kind decides which decorations fit.
  var SPOTS = [
    { id: 'skyA', kind: 'sky', x: 62, y: 72, s: 1 }, { id: 'skyB', kind: 'sky', x: 305, y: 38, s: 0.9 },
    { id: 'roofL', kind: 'roof', x: 152, y: 112, s: 0.85 }, { id: 'roofC', kind: 'roof', x: 262, y: 62, s: 0.8 },
    { id: 'wAttic', kind: 'window', x: 200, y: 128, s: 0.62, room: 'attic' },
    { id: 'wUpL', kind: 'window', x: 145, y: 200, s: 0.8, room: 'up' }, { id: 'wUpR', kind: 'window', x: 255, y: 200, s: 0.8, room: 'up' },
    { id: 'wLowL', kind: 'window', x: 140, y: 276, s: 0.8, room: 'down' }, { id: 'wLowR', kind: 'window', x: 260, y: 276, s: 0.8, room: 'down' },
    { id: 'door', kind: 'door', x: 200, y: 282, s: 0.95 },
    { id: 'yA', kind: 'yard', x: 50, y: 314, s: 1 }, { id: 'yB', kind: 'yard', x: 108, y: 338, s: 0.8 },
    { id: 'yC', kind: 'yard', x: 292, y: 338, s: 0.8 }, { id: 'yD', kind: 'yard', x: 350, y: 314, s: 1 }
  ];
  var SPOT = {}; SPOTS.forEach(function (s) { SPOT[s.id] = s; });
  var WINDOWS = {
    wAttic: { c: [200, 128], r: 17 },
    wUpL: { rect: [125, 176, 40, 48] }, wUpR: { rect: [235, 176, 40, 48] },
    wLowL: { rect: [120, 254, 40, 44] }, wLowR: { rect: [240, 254, 40, 44] }
  };

  var state, picked = null;
  var scene = $('scene'), hint = $('hint'), live = $('live');

  function load() {
    var s = JSON.parse(JSON.stringify(DEFAULT));
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && typeof v === 'object') {
        TARGETS.forEach(function (t) { var c = v.paint && v.paint[t[0]]; if (typeof c === 'string' && SWATCH.indexOf(c) >= 0) s.paint[t[0]] = c; });
        ROOMS.forEach(function (r) { if (v.lights && typeof v.lights[r[0]] === 'boolean') s.lights[r[0]] = v.lights[r[0]]; });
        if (v.placed && typeof v.placed === 'object') {
          Object.keys(v.placed).forEach(function (k) {
            var it = BYID[v.placed[k]], sp = SPOT[k];
            if (it && sp && it.kinds.indexOf(sp.kind) >= 0) s.placed[k] = it.id;
          });
        }
      }
    } catch (e) { /* ignore a damaged save */ }
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage may be blocked */ } }
  function litCount() { return ROOMS.filter(function (r) { return state.lights[r[0]]; }).length; }

  function windowShape(id, fill, extra) {
    var w = WINDOWS[id];
    return w.c ? '<circle cx="' + w.c[0] + '" cy="' + w.c[1] + '" r="' + w.r + '" fill="' + fill + '" ' + (extra || '') + '/>'
      : '<rect x="' + w.rect[0] + '" y="' + w.rect[1] + '" width="' + w.rect[2] + '" height="' + w.rect[3] + '" rx="3" fill="' + fill + '" ' + (extra || '') + '/>';
  }

  function sceneSvg() {
    var p = state.paint, lit = litCount(), out = [], i;
    var dark = 0.5 - lit * 0.12, dim = 0.6 + lit * 0.13;
    out.push('<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0816"/><stop offset="1" stop-color="#30193c"/></linearGradient></defs>');
    out.push('<rect width="400" height="360" fill="url(#sky)"/>');
    for (i = 0; i < 40; i++) {
      out.push('<circle cx="' + ((i * 97.3) % 400).toFixed(1) + '" cy="' + ((i * 53.1) % 190).toFixed(1) + '" r="' + (0.5 + (i % 3) * 0.3) + '" fill="#efe6d2" opacity="' + (0.25 + (i % 4) * 0.12).toFixed(2) + '"/>');
    }
    out.push('<circle cx="352" cy="46" r="22" fill="#f3e8c8"/><circle cx="344" cy="40" r="4" fill="#a09070" opacity=".4"/><circle cx="358" cy="54" r="3" fill="#a09070" opacity=".4"/>');
    out.push('<path d="M0 360V318q100-14 200 0t200-4V360z" fill="#16200f"/>');
    out.push('<rect x="250" y="76" width="26" height="50" fill="' + p.walls + '"/><rect x="246" y="70" width="34" height="9" fill="' + p.trim + '"/>');
    out.push('<rect x="110" y="150" width="180" height="170" fill="' + p.walls + '"/>');
    out.push('<path d="M92 158L200 64l108 94z" fill="' + p.roof + '"/><path d="M92 158L200 64l108 94" fill="none" stroke="' + p.trim + '" stroke-width="4" stroke-linejoin="round"/>');
    out.push('<rect x="104" y="316" width="192" height="6" fill="' + p.trim + '"/>');
    out.push('<rect x="176" y="242" width="48" height="78" rx="22" ry="4" fill="' + p.door + '"/><path d="M200 246v72" stroke="rgba(0,0,0,.25)" stroke-width="2"/><circle cx="212" cy="284" r="2.5" fill="#f2a93b"/>');
    Object.keys(WINDOWS).forEach(function (id) { out.push(windowShape(id, p.trim, 'transform-box="fill-box"')); });
    out.push('<rect width="400" height="360" fill="#0b0610" opacity="' + dark.toFixed(2) + '" pointer-events="none"/>');
    SPOTS.forEach(function (s) {
      if (!s.room) return;
      var on = state.lights[s.room], w = WINDOWS[s.id];
      var inset = w.c ? '<circle cx="' + w.c[0] + '" cy="' + w.c[1] + '" r="' + (w.r - 3) + '" fill="' + (on ? '#f6c85a' : '#0a0710') + '"' + (on ? ' class="lit"' : '') + '/>'
        : '<rect x="' + (w.rect[0] + 3) + '" y="' + (w.rect[1] + 3) + '" width="' + (w.rect[2] - 6) + '" height="' + (w.rect[3] - 6) + '" rx="2" fill="' + (on ? '#f6c85a' : '#0a0710') + '"' + (on ? ' class="lit"' : '') + '/>';
      out.push(inset);
      if (w.rect) out.push('<path d="M' + (w.rect[0] + w.rect[2] / 2) + ' ' + (w.rect[1] + 3) + 'v' + (w.rect[3] - 6) + 'M' + (w.rect[0] + 3) + ' ' + (w.rect[1] + w.rect[3] / 2) + 'h' + (w.rect[2] - 6) + '" stroke="' + p.trim + '" stroke-width="1.6" opacity=".85"/>');
    });
    SPOTS.forEach(function (s) {
      var id = state.placed[s.id];
      if (!id) return;
      var it = BYID[id], on = !s.room || state.lights[s.room];
      var cls = it.rim ? 'rim' : it.glow ? 'glow' + (id === 'candle' || id === 'jack' || id === 'lantern' ? ' flicker' : '') : '';
      var filter = it.glow ? '' : ' style="filter: brightness(' + dim.toFixed(2) + ')"';
      var op = s.room && it.id === 'eyes' && on ? ' opacity=".55"' : '';
      out.push('<g transform="translate(' + s.x + ' ' + s.y + ') scale(' + s.s + ')"' + filter + op + ' pointer-events="none"><g class="' + cls + '">' + it.svg + '</g></g>');
    });
    SPOTS.forEach(function (s) {
      var ok = picked && BYID[picked].kinds.indexOf(s.kind) >= 0, full = !!state.placed[s.id];
      var label = (full ? 'Remove ' + BYID[state.placed[s.id]].name + ' from ' : 'Place at ') + spotName(s);
      out.push('<g class="spot' + (ok ? ' ok' : '') + (full ? ' full' : '') + '" data-spot="' + s.id + '" role="button" tabindex="0" aria-label="' + label + '">'
        + '<circle class="ring" cx="' + s.x + '" cy="' + s.y + '" r="' + (s.kind === 'window' ? 22 : 26) + '"/>'
        + '<circle cx="' + s.x + '" cy="' + s.y + '" r="' + (s.kind === 'window' ? 26 : 28) + '" fill="transparent"/></g>');
    });
    return out.join('');
  }

  var SPOTNAMES = { skyA: 'the sky, left', skyB: 'the sky, right', roofL: 'the roof', roofC: 'the chimney', wAttic: 'the attic window',
    wUpL: 'the upstairs left window', wUpR: 'the upstairs right window', wLowL: 'the downstairs left window', wLowR: 'the downstairs right window',
    door: 'the front door', yA: 'the yard, far left', yB: 'the yard, left', yC: 'the yard, right', yD: 'the yard, far right' };
  function spotName(s) { return SPOTNAMES[s.id] || s.id; }

  function render() {
    scene.setAttribute('class', 'scene' + (picked ? ' picking' : ''));
    scene.innerHTML = sceneSvg();
    $('count').textContent = String(Object.keys(state.placed).length);
    renderControls();
  }

  function renderControls() {
    var t = $('table');
    Array.prototype.forEach.call(t.children, function (b) {
      var on = b.getAttribute('data-id') === picked;
      b.classList.toggle('picked', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $('picked').textContent = picked ? BYID[picked].name : 'Nothing picked';
    hint.textContent = picked ? 'Tap a glowing spot for the ' + BYID[picked].name.toLowerCase() + '.' : 'Pick something from the table, then tap a spot on the house.';
    Array.prototype.forEach.call($('targets').children, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-t') === target ? 'true' : 'false'); });
    Array.prototype.forEach.call($('swatches').children, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-c') === state.paint[target] ? 'true' : 'false'); });
    Array.prototype.forEach.call($('rooms').children, function (b) { b.setAttribute('aria-pressed', state.lights[b.getAttribute('data-r')] ? 'true' : 'false'); });
  }

  var target = 'walls';

  function buildControls() {
    var t = $('table');
    ITEMS.forEach(function (it) {
      var b = el('button', 'item'); b.type = 'button'; b.setAttribute('data-id', it.id);
      var wrap = document.createElement('span'); wrap.innerHTML = '<svg viewBox="-24 -24 48 48" aria-hidden="true"><circle r="23" fill="#463556"/>' + it.svg + '</svg>';
      b.appendChild(wrap.firstChild); b.appendChild(el('span', '', it.name));
      b.addEventListener('click', function () { sound.ensure(); picked = picked === it.id ? null : it.id; if (picked) sound.tone(420, 0.05, 0.08, 'sine'); render(); });
      t.appendChild(b);
    });
    TARGETS.forEach(function (tg) {
      var b = el('button', 'chip', tg[1]); b.type = 'button'; b.setAttribute('data-t', tg[0]);
      b.addEventListener('click', function () { target = tg[0]; renderControls(); });
      $('targets').appendChild(b);
    });
    SWATCH.forEach(function (c) {
      var b = el('button', 'swatch'); b.type = 'button'; b.setAttribute('data-c', c); b.style.background = c;
      b.setAttribute('aria-label', 'Paint colour ' + c);
      b.addEventListener('click', function () { sound.ensure(); state.paint[target] = c; save(); sound.tone(300, 0.07, 0.08, 'triangle'); render(); live.textContent = 'Painted the ' + target + '.'; });
      $('swatches').appendChild(b);
    });
    ROOMS.forEach(function (r) {
      var b = el('button', 'chip', r[1]); b.type = 'button'; b.setAttribute('data-r', r[0]);
      b.addEventListener('click', function () {
        sound.ensure(); state.lights[r[0]] = !state.lights[r[0]]; save();
        sound.tone(state.lights[r[0]] ? 700 : 260, 0.05, 0.08, 'square'); render();
        live.textContent = r[1] + ' light ' + (state.lights[r[0]] ? 'on' : 'off') + '.';
      });
      $('rooms').appendChild(b);
    });
  }

  function onSpot(id) {
    var s = SPOT[id]; if (!s) return;
    sound.ensure();
    if (picked) {
      var it = BYID[picked];
      if (it.kinds.indexOf(s.kind) < 0) { hint.textContent = 'The ' + it.name.toLowerCase() + ' doesn’t fit ' + spotName(s) + '. Try a glowing spot.'; sound.tone(160, 0.1, 0.1, 'sawtooth'); return; }
      state.placed[s.id] = picked; save(); sound.clack(260, false); render();
      live.textContent = it.name + ' placed at ' + spotName(s) + '.';
    } else if (state.placed[s.id]) {
      var nm = BYID[state.placed[s.id]].name; delete state.placed[s.id]; save(); sound.swoosh(); render();
      live.textContent = nm + ' removed.';
    }
  }

  scene.addEventListener('click', function (e) {
    var n = e.target; while (n && n !== scene && !(n.getAttribute && n.getAttribute('data-spot'))) n = n.parentNode;
    if (n && n !== scene) onSpot(n.getAttribute('data-spot'));
  });
  scene.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var n = e.target; if (!n || !n.getAttribute || !n.getAttribute('data-spot')) return;
    e.preventDefault(); onSpot(n.getAttribute('data-spot'));
  });

  $('allOn').addEventListener('click', function () { ROOMS.forEach(function (r) { state.lights[r[0]] = true; }); save(); sound.tone(700, 0.08, 0.08, 'square'); render(); });
  $('allOff').addEventListener('click', function () { ROOMS.forEach(function (r) { state.lights[r[0]] = false; }); save(); sound.tone(240, 0.1, 0.08, 'square'); render(); });
  $('clearDeco').addEventListener('click', function () { state.placed = {}; save(); render(); });
  $('resetHouse').addEventListener('click', function () { state = JSON.parse(JSON.stringify(DEFAULT)); picked = null; save(); render(); });

  state = load();
  buildControls();
  render();
})();
