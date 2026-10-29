/* Witch Dinner: choose three ingredients, stir, and get a quirky dish.
   The dish is a pure function of the chosen set, so recipes repeat. No score; recipes are collected. */
(function () {
  'use strict';
  var A = window.Arcade, el = A.el, sound = A.sound;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'halloween-games:witch-book:v1';

  // glyph is the inside of a 36x36 SVG
  var ING = [
    { id: 'newt', name: 'Newt eye', color: '#8bb34a', adj: 'Gloopy', noun: 'newt-eye', dish: 'stew',
      glyph: '<circle cx="18" cy="18" r="13" fill="#8bb34a"/><ellipse cx="18" cy="18" rx="3" ry="8" fill="#130d19"/><circle cx="14" cy="13" r="2" fill="#efe6d2" opacity=".7"/>' },
    { id: 'bat', name: 'Bat wing', color: '#7a4f9a', adj: 'Flappy', noun: 'bat-wing', dish: 'crisps',
      glyph: '<path d="M18 8c-5 6-11 6-15 4 2 4 1 8 0 12 4-2 6 0 8 4 2-3 5-3 7 0 2-3 5-3 7 0 2-4 4-6 8-4-1-4-2-8 0-12-4 2-10 2-15-4z" fill="#7a4f9a"/>' },
    { id: 'spider', name: 'Spider legs', color: '#4a4658', adj: 'Skittering', noun: 'spider-leg', dish: 'noodles',
      glyph: '<g fill="none" stroke="#b4a78f" stroke-width="2.4" stroke-linecap="round"><path d="M6 8c6 2 9 6 12 12M30 8c-6 2-9 6-12 12M5 18c6 0 9 3 13 5M31 18c-6 0-9 3-13 5M8 30c4-4 7-6 10-7M28 30c-4-4-7-6-10-7"/></g><circle cx="18" cy="22" r="4" fill="#b4a78f"/>' },
    { id: 'toadstool', name: 'Toadstool', color: '#e5694a', adj: 'Spotty', noun: 'toadstool', dish: 'pie',
      glyph: '<path d="M4 20C4 10 11 5 18 5s14 5 14 15z" fill="#e5694a"/><rect x="14" y="20" width="8" height="12" rx="3" fill="#efe6d2"/><circle cx="12" cy="14" r="2.4" fill="#efe6d2"/><circle cx="21" cy="11" r="2" fill="#efe6d2"/><circle cx="26" cy="16" r="1.8" fill="#efe6d2"/>' },
    { id: 'pumpkin', name: 'Pumpkin guts', color: '#ef7d22', adj: 'Squishy', noun: 'pumpkin', dish: 'pudding',
      glyph: '<ellipse cx="18" cy="21" rx="14" ry="11" fill="#ef7d22"/><path d="M18 10v22M11 12c-4 5-4 14 0 18M25 12c4 5 4 14 0 18" fill="none" stroke="#7a3205" stroke-width="1.3" opacity=".6"/><path d="M18 11c0-3 1-5 4-6" fill="none" stroke="#6e8c3a" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'bone', name: 'Bone dust', color: '#efe6d2', adj: 'Chalky', noun: 'marrow', dish: 'broth',
      glyph: '<path d="M8 10a4 4 0 1 1 6 3l9 9a4 4 0 1 1 3 6 4 4 0 1 1-6-3l-9-9a4 4 0 1 1-3-6z" fill="#efe6d2"/>' },
    { id: 'web', name: 'Cobweb', color: '#cfd6e4', adj: 'Wispy', noun: 'cobweb', dish: 'souffle',
      glyph: '<g fill="none" stroke="#cfd6e4" stroke-width="1.6"><path d="M18 3v30M4 10l28 16M32 10L4 26"/><path d="M18 9l8 4.5v9L18 27l-8-4.5v-9zM18 15l3.5 2v4L18 23l-3.5-2v-4z"/></g>' },
    { id: 'moss', name: 'Swamp moss', color: '#6e8c3a', adj: 'Mossy', noun: 'bog-moss', dish: 'casserole',
      glyph: '<g fill="#6e8c3a"><circle cx="10" cy="22" r="7"/><circle cx="20" cy="19" r="8"/><circle cx="27" cy="24" r="6"/><circle cx="16" cy="27" r="6"/></g><circle cx="14" cy="18" r="1.5" fill="#a8c76a"/><circle cx="23" cy="15" r="1.5" fill="#a8c76a"/>' },
    { id: 'dragon', name: 'Dragon scale', color: '#d34a3a', adj: 'Fiery', noun: 'dragon-scale', dish: 'curry',
      glyph: '<path d="M18 3c9 4 14 11 14 18 0 6-6 12-14 12S4 27 4 21C4 14 9 7 18 3z" fill="#d34a3a"/><path d="M18 9v20M10 14c3 2 5 4 8 4s5-2 8-4M9 21c3 2 6 4 9 4s6-2 9-4" fill="none" stroke="#7a1f14" stroke-width="1.4" opacity=".7"/>' },
    { id: 'moon', name: 'Moon dew', color: '#9fc2ff', adj: 'Glimmering', noun: 'moon-dew', dish: 'sorbet',
      glyph: '<path d="M18 4c7 9 11 14 11 19a11 11 0 0 1-22 0c0-5 4-10 11-19z" fill="#9fc2ff"/><path d="M12 24a6 6 0 0 0 5 5" fill="none" stroke="#efe6d2" stroke-width="2" stroke-linecap="round"/>' },
    { id: 'candy', name: 'Candy corn', color: '#f2a93b', adj: 'Sugary', noun: 'candy-corn', dish: 'tacos',
      glyph: '<path d="M18 4c6 0 12 22 12 26H6C6 26 12 4 18 4z" fill="#efe6d2"/><path d="M12 20c1-6 3-12 6-16 3 4 5 10 6 16z" fill="#f2a93b"/><path d="M18 4c-2 3-3 6-4.5 10h9C21 10 20 7 18 4z" fill="#ef7d22"/>' },
    { id: 'worm', name: 'Gummy worm', color: '#a97bc0', adj: 'Wiggly', noun: 'gummy-worm', dish: 'spaghetti',
      glyph: '<path d="M6 28c0-8 10-3 12-10s8-8 12-6" fill="none" stroke="#a97bc0" stroke-width="7" stroke-linecap="round"/><circle cx="29" cy="12" r="1.3" fill="#130d19"/><circle cx="32" cy="14" r="1.3" fill="#130d19"/>' },
    { id: 'pepper', name: 'Ghost pepper', color: '#ff7a5c', adj: 'Haunting', noun: 'ghost-pepper', dish: 'chili',
      glyph: '<path d="M10 10c4-3 9-2 12 1 5 4 9 12 10 20-8 0-16-3-20-9-3-4-4-9-2-12z" fill="#efe6d2"/><circle cx="14" cy="15" r="1.7" fill="#130d19"/><circle cx="20" cy="17" r="1.7" fill="#130d19"/><path d="M10 10c0-3 2-5 5-6" fill="none" stroke="#6e8c3a" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'crow', name: 'Crow feather', color: '#3a3446', adj: 'Feathery', noun: 'crow-feather', dish: 'salad',
      glyph: '<path d="M30 4C14 6 6 16 5 31c8-2 16-6 21-13 3-4 4-9 4-14z" fill="#3a3446"/><path d="M6 31C14 22 21 15 28 7" fill="none" stroke="#9a92ab" stroke-width="1.6" stroke-linecap="round"/>' },
    { id: 'garlic', name: 'Vampire garlic', color: '#f1e8d6', adj: 'Pungent', noun: 'garlic', dish: 'bread',
      glyph: '<path d="M18 4c2 4 3 6 3 8 8 2 12 8 12 14 0 5-6 7-15 7S3 31 3 26c0-6 4-12 12-14 0-2 1-4 3-8z" fill="#f1e8d6"/><path d="M18 12c-3 5-4 12-3 21M18 12c3 5 4 12 3 21" fill="none" stroke="#b4a78f" stroke-width="1.3"/>' }
  ];
  var BY = {}; ING.forEach(function (g) { BY[g.id] = g; });

  var EFFECTS = [
    'Your voice turns into a duck’s for ten minutes.', 'Everyone at the table floats half an inch off their chair.',
    'Your shadow wanders off, then comes back with snacks.', 'Hiccups come out as tiny sparks.',
    'Your hair takes on the colour of the dish.', 'You can hear what the cutlery is thinking.',
    'Every burp plays a short tune.', 'Your fingertips glow like candles.',
    'The wallpaper starts paying you compliments.', 'You grow a pair of small, polite bat ears.',
    'Every door you open creaks in a different key.', 'You sneeze confetti until midnight.',
    'Your footsteps leave tiny pumpkins.', 'The cat begins to answer back.'
  ];
  var VERDICTS = [
    'The cat asked for seconds.', 'Three stars from a ghost who doesn’t usually eat.', 'The raven took notes.',
    'Tastes like a quiet Tuesday, in the best way.', 'Too much salt, said the skeleton, who has no tongue.',
    'A toad applauded from the corner.', 'Spooky, and a little bit lovely.', 'Gran would have asked for the recipe.',
    'The spoon stood up on its own.', 'Dinner of the year, according to a committee of crows.'
  ];
  var DESCS = [
    function (a, b, c) { return 'Simmered until the ' + a.noun + ' stopped complaining, then finished with ' + c.noun + '. Serves four, or one very hungry ghost.'; },
    function (a, b, c) { return 'The ' + b.noun + ' does the heavy lifting here. The ' + a.noun + ' is mostly for show, and the ' + c.noun + ' is a surprise.'; },
    function (a, b, c) { return 'A heavy hand of ' + a.noun + ' and a whisper of ' + b.noun + ', served as ' + c.dish + '. Best eaten by candlelight.'; }
  ];

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function mixOf(ids) {
    var r = 0, gg = 0, b = 0;
    ids.forEach(function (id) { var c = BY[id].color; r += parseInt(c.substr(1, 2), 16); gg += parseInt(c.substr(3, 2), 16); b += parseInt(c.substr(5, 2), 16); });
    var h = function (v) { var x = Math.round(v / ids.length).toString(16); return x.length < 2 ? '0' + x : x; };
    return '#' + h(r) + h(gg) + h(b);
  }
  function shade(hex, f) {
    var out = '#';
    for (var i = 1; i < 7; i += 2) {
      var v = parseInt(hex.substr(i, 2), 16);
      v = f < 0 ? v * (1 + f) : v + (255 - v) * f;
      v = Math.max(0, Math.min(255, Math.round(v)));
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  }
  function glyph(id, x, y, s) { return '<g transform="translate(' + (x - 18 * s).toFixed(1) + ' ' + (y - 18 * s).toFixed(1) + ') scale(' + s + ')">' + BY[id].glyph + '</g>'; }

  // A picture of the finished dish, drawn from its type, mixed colour and ingredients.
  var KIND = { stew: 'bowl', broth: 'bowl', curry: 'bowl', chili: 'bowl', noodles: 'noodle', spaghetti: 'noodle', salad: 'bowl',
    pie: 'pie', pudding: 'cup', sorbet: 'cup', crisps: 'plate', tacos: 'plate', bread: 'plate', souffle: 'ramekin', casserole: 'casserole' };
  function dishSvg(d) {
    var k = KIND[d.dish] || 'bowl', c = d.color, o = [], ids = d.ids, i;
    var dark = shade(c, -0.35), light = shade(c, 0.35), steam = !/sorbet|salad|crisps/.test(d.dish);
    o.push('<svg viewBox="0 0 200 150" role="img" aria-label="' + d.name + '">');
    if (d.legendary) o.push('<circle cx="100" cy="80" r="70" fill="#f2a93b" opacity=".13"/><circle cx="100" cy="80" r="52" fill="#f2a93b" opacity=".1"/>');
    o.push('<ellipse cx="100" cy="132" rx="76" ry="9" fill="#07040a" opacity=".55"/>');
    if (k === 'bowl' || k === 'noodle') {
      o.push('<path d="M28 74Q30 130 100 130T172 74z" fill="#e8dcc4"/><path d="M34 98Q100 112 166 98" fill="none" stroke="' + shade(c, -0.1) + '" stroke-width="5" opacity=".8"/>');
      o.push('<ellipse cx="100" cy="74" rx="73" ry="15" fill="#f4ecd8"/><ellipse cx="100" cy="76" rx="64" ry="11" fill="' + dark + '"/><ellipse cx="100" cy="75" rx="60" ry="9" fill="' + c + '"/>');
      if (k === 'noodle') for (i = 0; i < 6; i++) o.push('<path d="M' + (50 + i * 2) + ' ' + (72 + (i % 3) * 3) + 'q12-12 24 0t24 0t24 0t20 0" fill="none" stroke="' + light + '" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>');
      else o.push('<ellipse cx="82" cy="73" rx="14" ry="2.6" fill="' + light + '" opacity=".5"/>');
      o.push(glyph(ids[0], 66, 66, 0.8), glyph(ids[1], 100, 60, 0.9), glyph(ids[2], 134, 66, 0.8));
    } else if (k === 'pie') {
      o.push('<path d="M30 92L38 118Q100 134 162 118L170 92z" fill="#b8b3c4"/><ellipse cx="100" cy="92" rx="72" ry="22" fill="#cfcad8"/><ellipse cx="100" cy="90" rx="66" ry="19" fill="' + c + '"/><ellipse cx="100" cy="88" rx="60" ry="16" fill="#d9a45c"/>');
      o.push('<g stroke="#a8742f" stroke-width="3" opacity=".7"><path d="M60 80l50 16M80 74l50 16M100 72l40 12M60 94l36-18M82 100l48-22M108 102l32-16"/></g>');
      o.push('<path d="M34 90q4 10 14 14M166 90q-4 10-14 14" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round"/>');
      o.push(glyph(ids[0], 100, 80, 1.15), glyph(ids[1], 62, 92, 0.6), glyph(ids[2], 140, 92, 0.6));
    } else if (k === 'cup') {
      o.push('<path d="M62 62Q64 112 100 112T138 62z" fill="#cfe0ff" opacity=".35" stroke="#cfe0ff" stroke-width="2"/><path d="M66 72Q68 108 100 108T134 72z" fill="' + c + '"/><path d="M100 112v14M78 128h44" stroke="#cfe0ff" stroke-width="4" stroke-linecap="round" opacity=".7"/>');
      o.push('<ellipse cx="100" cy="62" rx="38" ry="8" fill="#cfe0ff" opacity=".4"/><path d="M62 62Q70 28 100 30t38 32z" fill="' + light + '"/><path d="M76 52q8-14 24-14" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>');
      o.push(glyph(ids[0], 100, 28, 0.85), glyph(ids[1], 68, 80, 0.55), glyph(ids[2], 132, 80, 0.55));
    } else if (k === 'plate') {
      o.push('<ellipse cx="100" cy="112" rx="82" ry="22" fill="#e8dcc4"/><ellipse cx="100" cy="110" rx="66" ry="16" fill="#f4ecd8"/><ellipse cx="100" cy="110" rx="52" ry="11" fill="none" stroke="' + shade(c, 0.1) + '" stroke-width="2"/>');
      o.push('<ellipse cx="100" cy="106" rx="46" ry="9" fill="' + c + '" opacity=".8"/>');
      for (i = 0; i < 9; i++) o.push('<circle cx="' + (62 + i * 9) + '" cy="' + (114 - (i % 3) * 3) + '" r="1.8" fill="' + dark + '"/>');
      o.push(glyph(ids[0], 62, 92, 1.1), glyph(ids[1], 100, 82, 1.25), glyph(ids[2], 138, 92, 1.1));
    } else if (k === 'ramekin') {
      o.push('<path d="M56 72L62 122Q100 132 138 122L144 72z" fill="#e8dcc4"/><path d="M60 100Q100 112 140 100" fill="none" stroke="' + c + '" stroke-width="5" opacity=".85"/><ellipse cx="100" cy="72" rx="44" ry="9" fill="#f4ecd8"/>');
      o.push('<path d="M58 72Q54 36 78 34Q88 18 108 24Q134 22 142 72z" fill="' + light + '"/><path d="M74 50q10-10 24-8" fill="none" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/>');
      o.push(glyph(ids[0], 100, 46, 1.05), glyph(ids[1], 76, 62, 0.6), glyph(ids[2], 124, 62, 0.6));
    } else {
      o.push('<path d="M26 82L174 82L162 122Q100 134 38 122z" fill="#8c8a99"/><path d="M26 82L48 62H152L174 82z" fill="#b8b3c4"/><path d="M34 82L52 66H148L166 82z" fill="' + c + '"/><path d="M40 80L54 68H146L160 80" fill="none" stroke="' + light + '" stroke-width="3" stroke-dasharray="6 6" opacity=".8"/>');
      o.push(glyph(ids[0], 70, 72, 0.8), glyph(ids[1], 100, 70, 0.9), glyph(ids[2], 130, 72, 0.8));
    }
    if (steam) o.push('<g fill="none" stroke="#efe6d2" stroke-width="3" stroke-linecap="round" opacity=".28"><path d="M78 44q-8-10 0-18t0-16"/><path d="M104 38q-8-10 0-18t0-14"/><path d="M128 44q-8-10 0-18t0-16"/></g>');
    if (d.legendary) [[34, 28, 6], [168, 36, 5], [52, 112, 4], [160, 100, 6], [100, 12, 5]].forEach(function (s) {
      o.push('<path d="M' + s[0] + ' ' + (s[1] - s[2]) + 'Q' + s[0] + ' ' + s[1] + ' ' + (s[0] + s[2]) + ' ' + s[1] + 'Q' + s[0] + ' ' + s[1] + ' ' + s[0] + ' ' + (s[1] + s[2]) + 'Q' + s[0] + ' ' + s[1] + ' ' + (s[0] - s[2]) + ' ' + s[1] + 'Q' + s[0] + ' ' + s[1] + ' ' + s[0] + ' ' + (s[1] - s[2]) + 'z" fill="#f2a93b"/>');
    });
    o.push('</svg>');
    return o.join('');
  }

  // The dish for a set of three ingredient ids. Pure and repeatable.
  function cook(ids) {
    var s = ids.slice().sort(), a = BY[s[0]], b = BY[s[1]], c = BY[s[2]], h = hash(s.join('|'));
    var legendary = h % 8 === 0;
    var effect = EFFECTS[(h >>> 3) % EFFECTS.length];
    if (legendary) effect += ' ' + EFFECTS[(h >>> 11) % EFFECTS.length];
    return {
      key: s.join('|'), ids: s, dish: c.dish, color: mixOf(s),
      name: a.adj + ' ' + cap(b.noun) + ' ' + cap(c.dish),
      desc: DESCS[(h >>> 7) % DESCS.length](a, b, c),
      effect: effect,
      verdict: VERDICTS[(h >>> 15) % VERDICTS.length],
      legendary: legendary
    };
  }

  function loadBook() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(v)) return [];
      return v.filter(function (r) { return r && typeof r.k === 'string' && typeof r.n === 'string'; }).slice(0, 400);
    } catch (e) { return []; }
  }
  function saveBook() { try { localStorage.setItem(KEY, JSON.stringify(book)); } catch (e) { /* storage may be blocked */ } }

  var book = loadBook(), shelfIds = [], pot = [], busy = false, done = false;
  var elShelf = $('shelf'), elSlots = $('slots'), elStir = $('stir'), elBrew = $('brew'), elCauldron = $('cauldron');
  var elResult = $('result'), elSteam = $('steam'), elBubbles = $('bubbles'), elLive = $('live');
  var DEFAULT = '#6e8c3a';

  function icon(g) { var s = document.createElement('span'); s.innerHTML = '<svg viewBox="0 0 36 36" aria-hidden="true">' + g.glyph + '</svg>'; return s.firstChild; }

  function restock() {
    var ids = ING.map(function (g) { return g.id; });
    for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
    shelfIds = ids.slice(0, 8);
    renderShelf();
  }

  function renderShelf() {
    elShelf.textContent = '';
    shelfIds.forEach(function (id) {
      var g = BY[id], b = el('button', 'item');
      b.type = 'button';
      b.appendChild(icon(g)); b.appendChild(el('span', '', g.name));
      b.disabled = pot.indexOf(id) >= 0 || busy;
      b.setAttribute('aria-label', 'Add ' + g.name);
      b.addEventListener('click', function () { add(id); });
      elShelf.appendChild(b);
    });
  }

  function mixColor() {
    if (!pot.length) return DEFAULT;
    var r = 0, g = 0, b = 0;
    pot.forEach(function (id) {
      var c = BY[id].color; r += parseInt(c.substr(1, 2), 16); g += parseInt(c.substr(3, 2), 16); b += parseInt(c.substr(5, 2), 16);
    });
    var n = pot.length, h = function (v) { var x = Math.round(v / n).toString(16); return x.length < 2 ? '0' + x : x; };
    return '#' + h(r) + h(g) + h(b);
  }

  function renderPot() {
    elSlots.textContent = '';
    for (var i = 0; i < 3; i++) {
      var id = pot[i], s = el(id ? 'button' : 'div', 'slot3' + (id ? ' on' : ''));
      if (id) {
        s.type = 'button'; s.appendChild(icon(BY[id]));
        s.setAttribute('aria-label', 'Remove ' + BY[id].name);
        (function (k) { s.addEventListener('click', function () { if (!busy) { pot.splice(k, 1); done = false; elResult.hidden = true; refresh(); } }); })(i);
      }
      elSlots.appendChild(s);
    }
    elBrew.setAttribute('fill', mixColor());
    elStir.disabled = pot.length !== 3 || busy;
    renderShelf();
  }
  function refresh() { renderPot(); }

  function puff(color, n) {
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i');
      p.style.left = (38 + Math.random() * 24) + '%'; p.style.setProperty('--puff', color);
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      elSteam.appendChild(p);
      setTimeout(function (q) { return function () { if (q.parentNode) q.parentNode.removeChild(q); }; }(p), 3200);
    }
  }
  function bubble() {
    elBubbles.textContent = '';
    for (var i = 0; i < 6; i++) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(75 + Math.random() * 90)); c.setAttribute('cy', String(72 + Math.random() * 8));
      c.setAttribute('r', String(2 + Math.random() * 3)); c.setAttribute('fill', '#efe6d2'); c.setAttribute('opacity', '0.7');
      c.style.animationDelay = (Math.random() * 1.2) + 's';
      elBubbles.appendChild(c);
    }
  }

  function add(id) {
    if (busy) return;
    sound.ensure();
    if (done) { pot = []; done = false; elResult.hidden = true; }
    if (pot.length >= 3 || pot.indexOf(id) >= 0) return;
    pot.push(id);
    sound.tone(300 + pot.length * 120, 0.09, 0.1, 'sine');
    puff(BY[id].color, 3);
    refresh();
    elLive.textContent = BY[id].name + ' added. ' + pot.length + ' of 3.';
  }

  function showRecipe(d, isNew) {
    $('rKind').textContent = d.legendary ? 'Legendary dinner' : 'Tonight\u2019s dinner';
    $('rNew').textContent = isNew === null ? 'From your book' : isNew ? 'New recipe' : 'Seen before';
    $('rName').textContent = d.name; $('rDesc').textContent = d.desc;
    $('rEffect').textContent = d.effect; $('rVerdict').textContent = d.verdict;
    $('rPic').innerHTML = dishSvg(d);
    $('rIngs').textContent = d.ids.map(function (id) { return BY[id].name; }).join(' + ');
    elResult.hidden = false;
    elResult.classList.remove('pop'); void elResult.offsetWidth; elResult.classList.add('pop');
  }

  function stir() {
    if (pot.length !== 3 || busy) return;
    sound.ensure(); busy = true; refresh();
    elCauldron.classList.add('stirring'); bubble(); sound.swoosh();
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(function () {
      elCauldron.classList.remove('stirring');
      var d = cook(pot), isNew = !book.some(function (r) { return r.k === d.key; });
      busy = false; done = true;
      if (isNew) { book.unshift({ k: d.key, n: d.name, e: d.effect, t: Date.now() }); saveBook(); }
      showRecipe(d, isNew);
      elCauldron.classList.remove('shake'); void elCauldron.getBoundingClientRect(); elCauldron.classList.add('shake');
      puff(mixColor(), 9); sound.chime(d.legendary ? 2 : isNew ? 1 : 0);
      elLive.textContent = d.name + '. ' + d.effect;
      renderBook(); refresh();
    }, reduced ? 100 : 1300);
  }

  function renderBook() {
    var box = $('book'); box.textContent = '';
    $('found').textContent = String(book.length);
    $('bookCount').textContent = book.length + ' of 455';
    $('bookEmpty').hidden = book.length > 0;
    book.forEach(function (r) {
      var ids = r.k.split('|');
      if (ids.length !== 3 || !ids.every(function (id) { return BY[id]; })) return;
      var d = cook(ids), b = el('button', 'recipe' + (d.legendary ? ' gold' : ''));
      b.type = 'button'; b.setAttribute('aria-label', 'View recipe: ' + d.name);
      var pic = el('span', 'thumb'); pic.innerHTML = dishSvg(d);
      b.appendChild(pic); b.appendChild(el('span', 'nm', d.name));
      b.addEventListener('click', function () {
        if (busy) return;
        pot = ids.slice(); done = true; refresh(); showRecipe(d, null);
        elLive.textContent = d.name + '. ' + d.effect;
        elResult.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      });
      box.appendChild(b);
    });
  }

  elStir.addEventListener('click', stir);
  $('empty').addEventListener('click', function () { if (busy) return; pot = []; done = false; elResult.hidden = true; refresh(); });
  $('shuffle').addEventListener('click', function () { if (!busy) restock(); });

  restock(); renderPot(); renderBook();
})();
