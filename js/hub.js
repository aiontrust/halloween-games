/* Halloween Games hub: best score on each card and the scoreboard tabs. */
(function () {
  'use strict';
  var A = window.Arcade, el = A.el;
  var tab = 'overall';
  var tableEl = document.getElementById('table');

  function cell(cls, text) { return el('span', cls, text); }
  function row(cls, cells) {
    var r = el('div', 'row ' + cls);
    cells.forEach(function (c) { r.appendChild(c); });
    return r;
  }

  function renderCards(st) {
    A.ORDER.forEach(function (g) {
      var node = document.querySelector('[data-best="' + g + '"]');
      if (!node) return;
      var top = st.per[g][0];
      node.textContent = top ? 'Best ' + top.i + ' ' + top.p : 'No scores yet';
    });
  }

  function renderMakers() {
    try {
      var book = JSON.parse(localStorage.getItem('halloween-games:witch-book:v1') || '[]');
      var n = Array.isArray(book) ? book.length : 0;
      document.getElementById('witchBest').textContent = n ? n + ' of 455 recipes' : 'No recipes yet';
      var house = JSON.parse(localStorage.getItem('halloween-games:house:v1') || 'null');
      var d = house && house.placed ? Object.keys(house.placed).length : 0;
      document.getElementById('houseBest').textContent = d ? d + ' of 14 decorations' : 'Empty house';
    } catch (e) { /* storage may be blocked */ }
  }

  function renderTable(st) {
    tableEl.textContent = '';
    var rows = tab === 'overall' ? st.overall : st.per[tab];
    if (!rows.length) {
      var p = el('p', 'how', tab === 'overall'
        ? 'No scores yet. Finish a game and put your initials on the board.'
        : 'No scores on this game yet.');
      tableEl.appendChild(p);
      return;
    }
    rows = rows.slice(0, 10);
    if (tab === 'overall') {
      tableEl.appendChild(row('head', [cell('rk', '#'), cell('ini', 'Player'),
        cell('num', A.GAMES.plinko.short), cell('num', A.GAMES.bowling.short), cell('num', A.GAMES.bats.short), cell('num', 'Total')]));
      rows.forEach(function (r, i) {
        tableEl.appendChild(row(i === 0 ? 'first' : '', [cell('rk', String(i + 1)), cell('ini', r.i),
          cell('num', String(r.b.plinko)), cell('num', String(r.b.bowling)), cell('num', String(r.b.bats)), cell('num tot', String(r.total))]));
      });
    } else {
      tableEl.appendChild(row('head single', [cell('rk', '#'), cell('ini', 'Player'), cell('num', 'Score')]));
      rows.forEach(function (r, i) {
        tableEl.appendChild(row('single' + (i === 0 ? ' first' : ''), [cell('rk', String(i + 1)), cell('ini', r.i), cell('num tot', String(r.p))]));
      });
    }
  }

  function render() {
    var st = A.scores.stats();
    renderCards(st);
    renderMakers();
    renderTable(st);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) {
    b.addEventListener('click', function () {
      tab = b.getAttribute('data-tab');
      Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (o) {
        o.setAttribute('aria-selected', o === b ? 'true' : 'false');
      });
      render();
    });
  });

  var clearBtn = document.getElementById('clear'), armed = null;
  clearBtn.addEventListener('click', function () {
    if (!armed) {
      clearBtn.textContent = 'Tap again to clear every score';
      armed = setTimeout(function () { armed = null; clearBtn.textContent = 'Clear scoreboard'; }, 4000);
      return;
    }
    clearTimeout(armed); armed = null;
    clearBtn.textContent = 'Clear scoreboard';
    A.scores.clear();
  });

  A.scores.subscribe(render);
  render();
})();
