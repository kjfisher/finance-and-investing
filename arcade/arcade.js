/* F&I Arcade engine. Each game page sets window.GAME (JSON) and loads this file.
   Modes: Solo (feedback + score + passport stamp), Duel (two players, one device), Vault Escape (small group, timed locks + code),
   Showdown (projector: reveal), Team Showdown (projector: shape cards, speed points), Four Corners (projector: walk to an answer). Desks: multi-round decisions.
   Item kinds: mc, num, order. Sort and match sets become mc items. Labs are interactive tools shown on the start screen.
   Saves only a play count and best score in this browser (localStorage "fi-passport"). Nothing is sent anywhere. */
(function () {
  var G = window.GAME, root = document.getElementById('game');
  if (!G || !root) return;
  document.documentElement.style.setProperty('--c', G.color || '#1D4E89');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var md = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var money = function (v) { var neg = v < 0; v = Math.abs(v); var s = '$' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); return neg ? '−' + s : s; };
  var KEY = 'fi-passport';
  function stamp(score, total) {
    try { var p = JSON.parse(localStorage.getItem(KEY)) || { s: {} }; var s = p.s[G.slug] || { n: 0, best: null, of: total };
      s.n++; if (s.best == null || score > s.best) { s.best = score; s.of = total; } s.t = Date.now(); p.s[G.slug] = s; localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
  }
  function toast(t) { var el = document.getElementById('gaToast'); if (!el) { el = document.createElement('div'); el.id = 'gaToast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); }, 3200); }

  /* ---------- build the item pool ---------- */
  var pool = (G.items || []).slice();
  if (G.sort) G.sort.items.forEach(function (it) { pool.push({ k: 'mc', q: (G.sort.prompt ? G.sort.prompt + ' ' : '') + '“' + it.t + '”', o: G.sort.buckets.slice(), a: it.b, why: it.why, keep: true }); });
  if (G.match) { var terms = G.match.pairs.map(function (p) { return p[0]; });
    G.match.pairs.forEach(function (p, i) { var others = shuffle(terms.filter(function (t) { return t !== p[0]; })).slice(0, 3); var o = shuffle(others.concat([p[0]]));
      pool.push({ k: 'mc', q: (G.match.prompt || 'Which term fits?') + ' ' + p[1], o: o, a: o.indexOf(p[0]), why: p[0] + ': ' + p[1] }); }); }
  if (G.order) G.order.forEach(function (r) { pool.push({ k: 'order', q: r.prompt, items: r.items, why: r.why }); });

  var CP = pool.filter(function (q) { return q.k === 'mc' && q.o.length <= 4; });
  /* ---------- screens ---------- */
  var state = {};
  function head(extra) {
    return '<div class="ga-top"><span>' + esc(G.unitName) + ' · Day ' + G.day + '</span><span>' + (extra || '') + '</span></div>' +
      '<h1 class="ga-h">' + esc(G.name) + '</h1><div class="ga-bar" aria-hidden="true"></div>';
  }
  function start() {
    document.body.classList.remove('show');
    var cpool = pool.filter(function (q) { return q.k === 'mc' && q.o.length <= 4; });
    var modes = pool.length ? (G.modes || ['solo', 'duel', 'vault', 'show', 'teams', 'corners']) : [];
    modes = modes.filter(function (m) { return m === 'vault' ? pool.length >= 6 : m === 'corners' ? cpool.length >= 4 : true; });
    var mb = { solo: '<button class="btn go" data-m="solo">Solo<small>' + Math.min(G.n || 10, pool.length) + ' questions · instant feedback</small></button>',
      duel: '<button class="btn" data-m="duel">Partner Duel<small>Two players, one device, take turns</small></button>',
      show: '<button class="btn" data-m="show">Showdown<small>Projector mode: teacher reveals answers</small></button>',
      teams: '<button class="btn" data-m="teams">Team Showdown<small>Projector · teams hold up shape cards · speed points</small></button>',
      vault: '<button class="btn" data-m="vault">Vault Escape<small>Small group · crack ' + Math.min(4, Math.floor(pool.length / 3)) + ' locks, then the code · beat the clock</small></button>',
      corners: '<button class="btn" data-m="corners">Four Corners<small>Projector · walk to the corner with your answer, then defend it</small></button>' };
    root.innerHTML = head('<a href="/">All games</a>') +
      (G.story ? '<div class="card story"><div class="kick">The story</div><h2>' + esc(G.story.title) + '</h2>' + G.story.text.map(function (p) { return '<p style="margin:0">' + md(p) + '</p>'; }).join('') + '</div>' : '') +
      '<div class="card"><p style="margin:0">' + md(G.blurb) + '</p><p class="muted" style="margin:0"><b>How to play:</b> ' + md(G.how) + '</p></div>' +
      (G.desk ? '<div class="card"><h2>' + esc(G.desk.name) + '</h2><p style="margin:0">' + md(G.desk.intro) + '</p><div class="modes"><button class="btn go" data-m="desk">Open the desk<small>' + G.desk.rounds.length + ' rounds · decisions + reasoning points</small></button></div></div>' : '') +
      (G.lab ? '<div class="card lab" id="lab"></div>' : '') +
      (modes.length ? '<div class="card"><h2>' + (G.lab || G.desk ? 'Then test yourself' : 'Pick a mode') + '</h2><div class="modes">' + modes.map(function (m) { return mb[m]; }).join('') + '</div></div>' : '') +
      '<p class="muted" style="font-size:14px;margin:0">Names in this game are made up. Your best score is saved only on this device.</p>';
    if (G.lab && LABS[G.lab]) LABS[G.lab](document.getElementById('lab'));
    root.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { var m = b.getAttribute('data-m'); m === 'duel' ? duelSetup() : m === 'teams' ? teamSetup() : m === 'desk' ? deskStart() : m === 'vault' ? vaultStart() : m === 'corners' ? cornersStart() : begin(m); }; });
  }
  function duelSetup() {
    root.innerHTML = head('Partner Duel') + '<div class="card"><h2>Who is playing?</h2><div class="lab"><div class="grid">' +
      '<label>Player 1<input id="p1" value="Player 1" maxlength="20"></label><label>Player 2<input id="p2" value="Player 2" maxlength="20"></label></div></div>' +
      '<div class="row"><button class="btn go" id="go">Start the duel</button><button class="btn" id="back">Back</button></div></div>';
    document.getElementById('back').onclick = start;
    document.getElementById('go').onclick = function () { begin('duel', [document.getElementById('p1').value.trim() || 'Player 1', document.getElementById('p2').value.trim() || 'Player 2']); };
  }
  var SH = [['▲', '#D64545'], ['◆', '#2F6FDE'], ['●', '#C98F00'], ['■', '#1E9E6A'], ['★', '#8A4FD1'], ['♥', '#D1468F']];
  function teamSetup() {
    root.innerHTML = head('Team Showdown') + '<div class="card"><h2>Set up teams</h2><p style="margin:0">Each team holds up a shape card (▲ ◆ ● ■) for its answer. After you reveal, tap each team that got it right <b>in the order they held up their card</b>: first correct team +3, every other correct team +2. Number questions: teams write the answer on a whiteboard.</p>' +
      '<p style="margin:0"><a href="/arcade/answer-cards.pdf" target="_blank" rel="noopener">Print the shape answer cards (PDF) ↗</a></p><div class="lab"><div class="grid">' +
      [1, 2, 3, 4, 5, 6].map(function (i) { return '<label>Team ' + i + (i > 2 ? ' (optional)' : '') + '<input id="t' + i + '" value="' + (i <= 4 ? 'Team ' + i : '') + '" maxlength="18"></label>'; }).join('') + '</div></div>' +
      '<div class="row"><button class="btn go" id="go">Start</button><button class="btn" id="back">Back</button></div></div>';
    document.getElementById('back').onclick = start;
    document.getElementById('go').onclick = function () { var t = []; for (var i = 1; i <= 6; i++) { var x = document.getElementById('t' + i).value.trim(); if (x) t.push(x); } if (t.length < 2) t = ['Team 1', 'Team 2']; begin('teams', t); };
  }
  function begin(mode, names) {
    var n = mode === 'duel' ? Math.min(12, pool.length - pool.length % 2) : mode === 'show' ? pool.length : mode === 'teams' ? Math.min(15, pool.length) : Math.min(G.n || 10, pool.length);
    state = { mode: mode, qs: shuffle(pool).slice(0, n), i: 0, score: (names || [0, 0]).map(function () { return 0; }).concat([0, 0]).slice(0, Math.max(2, (names || []).length)), names: names || ['You'], missed: [] };
    if (mode === 'show' || mode === 'teams') document.body.classList.add('show');
    ask();
  }
  function hud() {
    var s = state, t = 'Question ' + (s.i + 1) + ' of ' + s.qs.length;
    if (s.mode === 'solo') return '<div class="hud"><span>' + t + '</span><span>Score ' + s.score[0] + '</span></div>';
    if (s.mode === 'duel') return '<div class="hud"><span>' + t + ' · <span style="color:var(--c)">' + esc(s.names[s.i % 2]) + '’s turn</span></span><span>' + esc(s.names[0]) + ' ' + s.score[0] + ' · ' + esc(s.names[1]) + ' ' + s.score[1] + '</span></div>';
    if (s.mode === 'teams') return '<div class="hud"><span>' + t + '</span><span class="timer" id="tm">20</span></div><div class="board">' + s.names.map(function (n, k) { return '<span>' + esc(n) + ' <b>' + s.score[k] + '</b></span>'; }).join('') + '</div>';
    return '<div class="hud"><span>' + t + '</span><span class="timer" id="tm">30</span></div>';
  }
  function ask() {
    var s = state, q = s.qs[s.i];
    var body = '<p class="q">' + md(q.q) + '</p>' + (q.card ? '<div class="qcard">' + q.card + '</div>' : '');
    if (q.k === 'mc') {
      var order = q.keep ? q.o.map(function (_, i) { return i; }) : shuffle(q.o.map(function (_, i) { return i; }));
      body += '<div class="opts" role="group" aria-label="Answer choices">' + order.map(function (i, j) { return '<button class="opt" data-i="' + i + '">' + (s.mode === 'teams' && SH[j] ? '<b class="shape" style="color:' + SH[j][1] + '" aria-label="' + 'ABCDEF'[j] + '">' + SH[j][0] + '</b> ' : '<b>' + 'ABCDEF'[j] + '.</b> ') + md(q.o[i]) + '</button>'; }).join('') + '</div>';
    } else if (q.k === 'num') {
      body += (s.mode === 'show' || s.mode === 'teams') ? '<p class="muted" style="margin:0">Teams: write your answer on a whiteboard.</p>' : '<div class="numrow"><label class="sr" for="na">Your answer</label><input id="na" inputmode="decimal" autocomplete="off" placeholder="Your answer' + (q.u === '$' ? ' ($)' : q.u === '%' ? ' (%)' : '') + '"><button class="btn go" id="chk">Check</button></div>';
    } else if (q.k === 'order') {
      q.mix = shuffle(q.items);
      body += '<p class="muted" style="margin:0">Tap the items in order, first to last.</p><div class="chips" id="pool">' + q.mix.map(function (t, i) { return '<button class="chip" data-i="' + i + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
        '<ol class="order" id="ord">' + q.items.map(function () { return '<li></li>'; }).join('') + '</ol>' + ((s.mode === 'show' || s.mode === 'teams') ? '' : '<div class="row"><button class="btn" id="undo">Undo</button></div>');
    }
    var proj = s.mode === 'show' || s.mode === 'teams';
    var ctl = proj ? '<div class="row"><button class="btn go" id="rev">Reveal answer</button></div>' : '';
    root.innerHTML = head(s.mode === 'show' ? 'Showdown' : s.mode === 'teams' ? 'Team Showdown' : s.mode === 'duel' ? 'Partner Duel' : 'Solo') + '<div class="card">' + hud() + body + ctl + '<div id="fb" aria-live="polite"></div></div>';
    if (proj) { var left = s.mode === 'teams' ? 20 : 30, tm = document.getElementById('tm'); clearInterval(s.tick); s.tick = setInterval(function () { left--; if (!tm.isConnected) return clearInterval(s.tick); tm.textContent = Math.max(left, 0); tm.classList.toggle('low', left <= 5); if (left <= 0) clearInterval(s.tick); }, 1000);
      document.getElementById('rev').onclick = function () { clearInterval(s.tick); reveal(q, null); };
      if (q.k === 'order') wireOrder(q, true);
      return; }
    if (q.k === 'mc') root.querySelectorAll('.opt').forEach(function (b) { b.onclick = function () { grade(q, +b.getAttribute('data-i') === q.a, b); }; });
    if (q.k === 'num') { var inp = document.getElementById('na'); inp.focus(); var go = function () { var v = parseNum(inp.value); if (v === null) { inp.setAttribute('aria-invalid', 'true'); return; } grade(q, Math.abs(v - q.a) <= tol(q), null, v); };
      document.getElementById('chk').onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); }; }
    if (q.k === 'order') wireOrder(q, false);
  }
  function wireOrder(q, show) {
    var picked = [], lis = root.querySelectorAll('#ord li');
    root.querySelectorAll('#pool .chip').forEach(function (c) { c.onclick = function () { if (c.classList.contains('picked')) return; c.classList.add('picked'); picked.push(+c.getAttribute('data-i')); lis[picked.length - 1].textContent = q.mix[+c.getAttribute('data-i')];
      if (picked.length === q.items.length && !show) { var ok = picked.every(function (p, k) { return q.mix[p] === q.items[k]; }); lis.forEach(function (li, k) { li.classList.add(q.mix[picked[k]] === q.items[k] ? 'ok' : 'no'); }); grade(q, ok, null); } }; });
    var u = document.getElementById('undo'); if (u) u.onclick = function () { if (!picked.length) return; var last = picked.pop(); root.querySelector('#pool .chip[data-i="' + last + '"]').classList.remove('picked'); lis[picked.length].textContent = ''; };
  }
  function tol(q) { return q.tol != null ? q.tol : Math.max(0.011, Math.abs(q.a) * 0.005); }
  function parseNum(t) { t = String(t).replace(/[−–]/g, '-').replace(/[$,%\s]/g, ''); if (!/^-?\d*\.?\d+$/.test(t)) return null; return parseFloat(t); }
  function ansText(q) { if (q.k === 'mc') return q.o[q.a]; if (q.k === 'num') return q.show || (q.u === '$' ? money(q.a) : q.u === '%' ? q.a + '%' : String(q.a)); if (q.k === 'order') return q.items.join(' → '); }
  function reveal(q) {
    if (q.k === 'mc') root.querySelectorAll('.opt').forEach(function (b) { if (+b.getAttribute('data-i') === q.a) b.classList.add('ok'); b.disabled = true; });
    if (q.k === 'order') { var lis = root.querySelectorAll('#ord li'); q.items.forEach(function (t, k) { lis[k].textContent = t; lis[k].className = 'ok'; }); }
    var tb = state.mode === 'teams' ? '<p style="margin:10px 0 4px"><b>Tap each correct team, fastest first:</b></p><div class="row" id="tms">' + state.names.map(function (n, k) { return '<button class="btn" data-t="' + k + '">' + esc(n) + '</button>'; }).join('') + '</div>' : '';
    var shp = ''; if (state.mode === 'teams' && q.k === 'mc') root.querySelectorAll('.opt').forEach(function (b) { if (+b.getAttribute('data-i') === q.a && b.querySelector('.shape')) shp = b.querySelector('.shape').outerHTML + ' '; });
    document.getElementById('fb').innerHTML = '<div class="fb ok"><b>Answer: ' + shp + md(ansText(q)) + '</b>' + (q.why ? '<br>' + md(q.why) : '') + '</div>' + tb + nextBtn();
    if (tb) { var first = true; root.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { var k = +b.getAttribute('data-t'); state.score[k] += first ? 3 : 2; b.disabled = true; b.textContent = state.names[k] + (first ? ' +3 ⚡' : ' +2'); first = false;
      root.querySelectorAll('.board b')[k].textContent = state.score[k]; }; }); }
    wireNext();
  }
  function grade(q, ok, btn, val) {
    var s = state, p = s.mode === 'duel' ? s.i % 2 : 0;
    if (ok) s.score[p]++; else s.missed.push(q);
    if (q.k === 'mc') root.querySelectorAll('.opt').forEach(function (b) { b.disabled = true; if (+b.getAttribute('data-i') === q.a) b.classList.add('ok'); });
    if (btn && !ok) btn.classList.add('no');
    if (q.k === 'num') { document.getElementById('na').disabled = true; document.getElementById('chk').disabled = true; }
    var u = document.getElementById('undo'); if (u) u.disabled = true;
    document.getElementById('fb').innerHTML = '<div class="fb ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? pick(['Nice!', 'Correct.', 'Yes!', 'Exactly.']) : 'Not quite. Answer: ' + md(ansText(q))) + '</b>' + (q.why ? '<br>' + md(q.why) : '') + '</div>' + nextBtn();
    wireNext();
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function nextBtn() { return '<div class="row" style="margin-top:10px"><button class="btn go" id="nx">' + (state.i + 1 < state.qs.length ? 'Next' : 'See results') + '</button></div>'; }
  function wireNext() { var b = document.getElementById('nx'); b.focus(); b.onclick = function () { state.i++; state.i < state.qs.length ? ask() : end(); }; }
  function end() {
    var s = state, n = s.qs.length, h;
    if (s.mode === 'show') { h = '<div class="card"><h2>Showdown complete</h2><p>' + n + ' questions reviewed.</p></div>'; }
    else if (s.mode === 'teams') { var rk = s.names.map(function (nm, k) { return [nm, s.score[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
      h = '<div class="card"><p class="big">' + esc(rk[0][0]) + (rk[1] && rk[1][1] === rk[0][1] ? ' ties!' : ' wins!') + '</p><ol class="miss">' + rk.map(function (r) { return '<li><b>' + esc(r[0]) + '</b>: ' + r[1] + ' points</li>'; }).join('') + '</ol></div>'; }
    else if (s.mode === 'duel') { var a = s.score[0], b = s.score[1]; var w = a === b ? 'It’s a tie!' : esc(s.names[a > b ? 0 : 1]) + ' wins!';
      h = '<div class="card"><p class="big">' + w + '</p><p>' + esc(s.names[0]) + ': ' + a + ' of ' + n / 2 + ' · ' + esc(s.names[1]) + ': ' + b + ' of ' + n / 2 + '</p></div>'; }
    else { var sc = s.score[0], pct = sc / n, st = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1; stamp(sc, n);
      h = '<div class="card"><p class="big">' + sc + ' / ' + n + '</p><div class="stars" aria-label="' + st + ' of 3 stars">' + '★★★'.slice(0, st) + '<span class="muted">' + '★★★'.slice(st) + '</span></div><p style="margin:0">' +
        (st === 3 ? 'Ready for the quiz.' : st === 2 ? 'Almost there. Review the misses below, then play again.' : 'Review your notes and the misses below, then try again.') + '</p></div>';
      if (s.missed.length) h += '<div class="card"><h2>Review what you missed</h2><ul class="miss">' + s.missed.map(function (q) { return '<li>' + md(q.q.replace(/\s+/g, ' ')) + '<br><b>Answer:</b> ' + md(ansText(q)) + (q.why ? '. ' + md(q.why) : '') + '</li>'; }).join('') + '</ul></div>';
      toast('Passport stamp saved: ' + G.name); }
    root.innerHTML = head('Results') + h + '<div class="row"><button class="btn go" id="again">Play again</button><a class="btn" href="/">All games</a></div>';
    document.getElementById('again').onclick = start;
  }

  /* ---------- Vault Escape: locks of 3 questions; each lock gives a code digit ---------- */
  function clock(sec) { var m = Math.floor(sec / 60), x = sec % 60; return m + ':' + (x < 10 ? '0' : '') + x; }
  function vaultStart() {
    document.body.classList.remove('show');
    var L = Math.min(4, Math.floor(pool.length / 3)), qs = shuffle(pool).slice(0, L * 3);
    state = { mode: 'vault', qs: qs, i: 0, L: L, code: qs.slice(0, L).map(function () { return Math.floor(Math.random() * 10); }), t0: Date.now(), pen: 0, hints: 0, wrong: 0 };
    clearInterval(state.tick);
    root.innerHTML = head('Vault Escape') + '<div class="card"><h2>The vault</h2><p style="margin:0">The vault has <b>' + L + ' locks</b>. Each lock opens after your group answers its 3 questions correctly. Every open lock shows one digit of the vault code: <b>write each digit down</b>. Wrong answers add 30 seconds; a hint adds 15. Enter the full code at the end to escape.</p>' +
      '<div class="row"><button class="btn go" id="go">Start the clock</button><button class="btn" id="back">Back</button></div></div>';
    document.getElementById('back').onclick = start;
    document.getElementById('go').onclick = function () { state.t0 = Date.now(); state.tick = setInterval(function () { var el = document.getElementById('vclock'); if (el) el.textContent = clock(vsec()); else clearInterval(state.tick); }, 1000); vaultAsk(); };
  }
  function vsec() { return Math.round((Date.now() - state.t0) / 1000) + state.pen; }
  function locks() { var s = state, h = ''; for (var k = 0; k < s.L; k++) { var done = s.i >= (k + 1) * 3; h += '<span class="lock' + (done ? ' open' : k === Math.floor(s.i / 3) ? ' now' : '') + '">' + (done ? '🔓 ' + s.code[k] : '🔒') + '</span>'; } return '<div class="locks">' + h + '</div>'; }
  function vaultAsk() {
    var s = state, q = s.qs[s.i], k = Math.floor(s.i / 3);
    var body = '<div class="hud"><span>Lock ' + (k + 1) + ' of ' + s.L + ' · question ' + (s.i % 3 + 1) + ' of 3</span><span class="timer" id="vclock">' + clock(vsec()) + '</span></div>' + locks() +
      '<p class="q">' + md(q.q) + '</p>' + (q.card ? '<div class="qcard">' + q.card + '</div>' : '');
    if (q.k === 'mc') body += '<div class="opts">' + shuffle(q.o.map(function (_, i) { return i; })).map(function (i, j) { return '<button class="opt" data-i="' + i + '"><b>' + 'ABCDEF'[j] + '.</b> ' + md(q.o[i]) + '</button>'; }).join('') + '</div>' + (q.o.length > 2 ? '<div class="row"><button class="btn" id="hint">Hint: remove a wrong answer (+15 s)</button></div>' : '');
    if (q.k === 'num') body += '<div class="numrow"><label class="sr" for="na">Your answer</label><input id="na" inputmode="decimal" autocomplete="off" placeholder="Your answer' + (q.u === '$' ? ' ($)' : q.u === '%' ? ' (%)' : '') + '"><button class="btn go" id="chk">Try it</button></div>';
    if (q.k === 'order') { q.mix = shuffle(q.items); body += '<p class="muted" style="margin:0">Tap the items in order, first to last.</p><div class="chips" id="pool">' + q.mix.map(function (t, i) { return '<button class="chip" data-i="' + i + '">' + esc(t) + '</button>'; }).join('') + '</div><ol class="order" id="ord">' + q.items.map(function () { return '<li></li>'; }).join('') + '</ol>'; }
    root.innerHTML = head('Vault Escape') + '<div class="card">' + body + '<div id="fb" aria-live="polite"></div></div>';
    var miss = function (msg) { s.pen += 30; s.wrong++; document.getElementById('fb').innerHTML = '<div class="fb no"><b>Locked. +30 seconds.</b> ' + (msg || 'Try again.') + '</div>'; };
    if (q.k === 'mc') { root.querySelectorAll('.opt').forEach(function (b) { b.onclick = function () { if (+b.getAttribute('data-i') === q.a) { b.classList.add('ok'); vaultOk(q); } else { b.classList.add('no'); b.disabled = true; miss(); } }; });
      var hb = document.getElementById('hint'); if (hb) hb.onclick = function () { var w = [].filter.call(root.querySelectorAll('.opt:not([disabled])'), function (b) { return +b.getAttribute('data-i') !== q.a; }); if (w.length > 1) { w[0].disabled = true; w[0].style.opacity = '.3'; s.pen += 15; s.hints++; } if (w.length <= 2) hb.disabled = true; }; }
    if (q.k === 'num') { var inp = document.getElementById('na'); inp.focus(); var go = function () { var v = parseNum(inp.value); if (v === null) return; if (Math.abs(v - q.a) <= tol(q)) vaultOk(q); else { miss('Check your math and try again.'); inp.select(); } };
      document.getElementById('chk').onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); }; }
    if (q.k === 'order') { var picked = [], lis = root.querySelectorAll('#ord li');
      root.querySelectorAll('#pool .chip').forEach(function (c) { c.onclick = function () { if (c.classList.contains('picked')) return; c.classList.add('picked'); picked.push(+c.getAttribute('data-i')); lis[picked.length - 1].textContent = q.mix[+c.getAttribute('data-i')];
        if (picked.length === q.items.length) { if (picked.every(function (p, k) { return q.mix[p] === q.items[k]; })) { lis.forEach(function (li) { li.className = 'ok'; }); vaultOk(q); }
          else { miss('The order is off. Start over.'); setTimeout(function () { picked = []; lis.forEach(function (li) { li.textContent = ''; }); root.querySelectorAll('#pool .chip').forEach(function (x) { x.classList.remove('picked'); }); }, 700); } } }; }); }
  }
  function vaultOk(q) {
    var s = state; root.querySelectorAll('.opt,.chip,#chk,#hint').forEach(function (b) { b.disabled = true; }); s.i++;
    var opened = s.i % 3 === 0, k = s.i / 3 - 1;
    document.getElementById('fb').innerHTML = '<div class="fb ok"><b>' + (opened ? '🔓 Lock ' + (k + 1) + ' is open! Code digit: <span class="digit">' + s.code[k] + '</span> (write it down)' : 'Correct.') + '</b>' + (q.why ? '<br>' + md(q.why) : '') + '</div><div class="row" style="margin-top:10px"><button class="btn go" id="nx">' + (s.i < s.qs.length ? 'Next' : 'Go to the vault door') + '</button></div>';
    var nb = document.getElementById('nx'); nb.focus(); nb.onclick = function () { s.i < s.qs.length ? vaultAsk() : vaultDoor(); };
  }
  function vaultDoor() {
    var s = state;
    root.innerHTML = head('Vault Escape') + '<div class="card"><div class="hud"><span>The vault door</span><span class="timer" id="vclock">' + clock(vsec()) + '</span></div><p class="q">Enter the ' + s.L + '-digit code, in lock order.</p>' +
      '<div class="numrow"><label class="sr" for="code">Vault code</label><input id="code" inputmode="numeric" maxlength="' + s.L + '" autocomplete="off" placeholder="' + Array(s.L + 1).join('•') + '" style="letter-spacing:.4em"><button class="btn go" id="open">Open the vault</button></div><div id="fb" aria-live="polite"></div></div>';
    var inp = document.getElementById('code'); inp.focus();
    var go = function () { if (inp.value.replace(/\D/g, '') === s.code.join('')) { clearInterval(s.tick); vaultEnd(); } else { s.pen += 30; document.getElementById('fb').innerHTML = '<div class="fb no"><b>Wrong code. +30 seconds.</b> Check the digits you wrote down, in order from Lock 1.</div>'; inp.select(); } };
    document.getElementById('open').onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }
  function vaultEnd() {
    var s = state, t = vsec(), per = t / s.qs.length, stars = per <= 30 ? 3 : per <= 50 ? 2 : 1;
    stamp(Math.max(0, 1000 - t), 1000);
    root.innerHTML = head('Vault Escape') + '<div class="card"><p class="big">🔓 Escaped!</p><div class="stars" aria-label="' + stars + ' of 3 stars">' + '★★★'.slice(0, stars) + '<span style="opacity:.25">' + '★★★'.slice(stars) + '</span></div>' +
      '<div class="out"><div class="stat"><b>' + clock(t) + '</b><span>Final time (with penalties)</span></div><div class="stat"><b>' + s.wrong + '</b><span>Wrong tries (+30 s each)</span></div><div class="stat"><b>' + s.hints + '</b><span>Hints used (+15 s each)</span></div></div>' +
      '<p class="muted" style="margin:0">Show this screen to your teacher. Fastest group time wins.</p></div><div class="row"><button class="btn go" id="again">Back to the start</button><a class="btn" href="/">All games</a></div>';
    document.getElementById('again').onclick = start;
  }

  /* ---------- Four Corners: projector; shape cards posted in the corners ---------- */
  function cornersStart() {
    document.body.classList.add('show');
    state = { mode: 'corners', qs: shuffle(CP).slice(0, Math.min(10, CP.length)), i: 0 };
    root.innerHTML = head('Four Corners') + '<div class="card"><h2>Set up the room</h2><p style="margin:0">Post one shape card in each corner: <b style="color:' + SH[0][1] + '">▲</b> <b style="color:' + SH[1][1] + '">◆</b> <b style="color:' + SH[2][1] + '">●</b> <b style="color:' + SH[3][1] + '">■</b>. For each question, students walk to the corner with their answer before the timer ends. You can count each corner, then reveal. One student from the right corner explains why; one from another corner says what made their answer tempting.</p>' +
      '<p style="margin:0"><a href="/arcade/answer-cards.pdf" target="_blank" rel="noopener">Print the shape cards (PDF) ↗</a></p><div class="row"><button class="btn go" id="go">Start (' + state.qs.length + ' questions)</button><button class="btn" id="back">Back</button></div></div>';
    document.getElementById('back').onclick = start; document.getElementById('go').onclick = cornerAsk;
  }
  function cornerAsk() {
    var s = state, q = s.qs[s.i], order = q.keep ? q.o.map(function (_, i) { return i; }) : shuffle(q.o.map(function (_, i) { return i; }));
    s.cnt = order.map(function () { return 0; });
    root.innerHTML = head('Four Corners') + '<div class="card"><div class="hud"><span>Question ' + (s.i + 1) + ' of ' + s.qs.length + '</span><span class="timer" id="tm">20</span></div><p class="q">' + md(q.q) + '</p>' + (q.card ? '<div class="qcard">' + q.card + '</div>' : '') +
      '<div class="corners">' + order.map(function (i, j) { return '<div class="corner" data-i="' + i + '" style="--sc:' + SH[j][1] + '"><span class="shape" style="color:' + SH[j][1] + '">' + SH[j][0] + '</span><span class="ct">' + md(q.o[i]) + '</span><span class="tally"><button class="btn" data-j="' + j + '" data-d="-1" aria-label="One fewer">−</button><b id="c' + j + '">0</b><button class="btn" data-j="' + j + '" data-d="1" aria-label="One more">+</button></span></div>'; }).join('') + '</div>' +
      '<div class="row"><button class="btn go" id="rev">Reveal answer</button></div><div id="fb" aria-live="polite"></div></div>';
    root.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { var j = +b.getAttribute('data-j'); s.cnt[j] = Math.max(0, s.cnt[j] + +b.getAttribute('data-d')); document.getElementById('c' + j).textContent = s.cnt[j]; }; });
    var left = 20, tm = document.getElementById('tm'); clearInterval(s.tick); s.tick = setInterval(function () { left--; if (!tm.isConnected) return clearInterval(s.tick); tm.textContent = Math.max(left, 0); tm.classList.toggle('low', left <= 5); if (left <= 0) { clearInterval(s.tick); tm.textContent = 'Stop!'; } }, 1000);
    document.getElementById('rev').onclick = function () { clearInterval(s.tick); this.disabled = true;
      var shp = ''; root.querySelectorAll('.corner').forEach(function (c) { var ok = +c.getAttribute('data-i') === q.a; c.classList.add(ok ? 'ok' : 'dim'); if (ok) shp = c.querySelector('.shape').outerHTML + ' '; });
      var tot = s.cnt.reduce(function (a, b) { return a + b; }, 0), right = 0; root.querySelectorAll('.corner').forEach(function (c, j) { if (+c.getAttribute('data-i') === q.a) right = s.cnt[j]; });
      document.getElementById('fb').innerHTML = '<div class="fb ok"><b>Answer: ' + shp + md(q.o[q.a]) + '</b>' + (q.why ? '<br>' + md(q.why) : '') + (tot ? '<br><b>' + right + ' of ' + tot + '</b> picked the right corner (' + Math.round(100 * right / tot) + '%).' : '') + '</div>' +
        '<p style="margin:10px 0 0"><b>Corner talk:</b> Right corner, explain why. Another corner, what made your answer tempting?</p><div class="row" style="margin-top:10px"><button class="btn go" id="nx">' + (s.i + 1 < s.qs.length ? 'Next question' : 'Finish') + '</button></div>';
      document.getElementById('nx').onclick = function () { s.i++; s.i < s.qs.length ? cornerAsk() : start(); }; };
  }

  /* ---------- desks: multi-round decisions ---------- */
  function deskStart() {
    var D = G.desk; state = { mode: 'desk', r: 0, v: D.start, st: { yearly: 0, fee: 0 }, pts: 0, log: [] };
    document.body.classList.remove('show'); deskRound();
  }
  function applyChoice(v, st, rd, c) {
    var w = c.w || rd.w || { main: 1 }, ret = 0; if (rd.rets) Object.keys(w).forEach(function (k) { ret += w[k] * (rd.rets[k] || 0); });
    if (c.set) Object.keys(c.set).forEach(function (k) { st[k] = c.set[k]; });
    v = Math.max(0, v + (c.add || 0) + (st.yearly || 0));
    if (rd.rets) v *= 1 + (ret - (st.fee || 0)) / 100;
    return Math.round(v * 100) / 100;
  }
  function bench() { var D = G.desk, v = D.start, st = { yearly: 0, fee: 0 }; D.rounds.forEach(function (rd) { v = applyChoice(v, st, rd, rd.choices[rd.best]); }); return v; }
  function deskRound() {
    var D = G.desk, s = state, rd = D.rounds[s.r];
    root.innerHTML = head(D.name) + '<div class="card"><div class="hud"><span>' + esc(rd.when || ('Round ' + (s.r + 1))) + ' · ' + (s.r + 1) + ' of ' + D.rounds.length + '</span><span>' + esc(D.unitLabel || 'Balance') + ': ' + money(Math.round(s.v)) + '</span></div>' +
      '<p class="q">' + md(rd.title) + '</p><p style="margin:0">' + md(rd.story) + '</p>' + (rd.card ? '<div class="qcard">' + rd.card + '</div>' : '') +
      '<div class="opts">' + rd.choices.map(function (c, i) { return '<button class="opt" data-c="' + i + '">' + md(c.t) + '</button>'; }).join('') + '</div><div id="fb" aria-live="polite"></div></div>';
    root.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () {
      var c = rd.choices[+b.getAttribute('data-c')], before = s.v; s.v = applyChoice(s.v, s.st, rd, c); s.pts += c.pts; s.log.push([rd.when || 'Round ' + (s.r + 1), c.t, c.pts]);
      root.querySelectorAll('[data-c]').forEach(function (x) { x.disabled = true; }); b.classList.add(c.pts === 2 ? 'ok' : c.pts === 0 ? 'no' : 'ok');
      var ch = s.v - before;
      document.getElementById('fb').innerHTML = '<div class="fb ' + (c.pts ? 'ok' : 'no') + '"><b>What happened:</b> ' + md(c.out || rd.out || '') + '<br><b>' + esc(D.unitLabel || 'Balance') + ':</b> ' + money(Math.round(before)) + ' → ' + money(Math.round(s.v)) + ' (' + (ch >= 0 ? '+' : '−') + money(Math.abs(Math.round(ch))).replace('−', '') + ')' +
        '<br><b>Reasoning points: ' + c.pts + ' of 2.</b> ' + md(rd.lesson) + '</div><div class="row" style="margin-top:10px"><button class="btn go" id="nx">' + (s.r + 1 < D.rounds.length ? 'Next round' : 'See my report') + '</button></div>';
      var nb = document.getElementById('nx'); nb.focus(); nb.onclick = function () { s.r++; s.r < D.rounds.length ? deskRound() : deskEnd(); }; }; });
  }
  function deskEnd() {
    var D = G.desk, s = state, max = D.rounds.length * 2, bv = bench(); stamp(s.pts, max);
    root.innerHTML = head(D.name + ': report') + '<div class="card"><div class="out">' + '<div class="stat"><b>' + money(Math.round(s.v)) + '</b><span>Your final ' + esc((D.unitLabel || 'balance').toLowerCase()) + '</span></div>' +
      '<div class="stat"><b>' + s.pts + ' / ' + max + '</b><span>Reasoning points</span></div><div class="stat"><b>' + money(Math.round(bv)) + '</b><span>' + esc(D.benchLabel || 'Following the plan every round') + '</span></div></div>' +
      '<p style="margin:0">' + md(D.wrap) + '</p></div><div class="card"><h2>Your decisions</h2><ol class="miss">' + s.log.map(function (l) { return '<li><b>' + esc(l[0]) + ':</b> ' + md(l[1]) + ' · ' + l[2] + '/2</li>'; }).join('') + '</ol></div>' +
      '<div class="row"><button class="btn go" id="again">Back to the start</button><a class="btn" href="/">All games</a></div>';
    document.getElementById('again').onclick = start; toast('Passport stamp saved: ' + G.name);
  }

  /* ---------- labs ---------- */
  function inputs(el, spec) { return '<div class="grid">' + spec.map(function (f) { return '<label>' + f[1] + '<input id="L-' + f[0] + '" inputmode="decimal" value="' + f[2] + '"></label>'; }).join('') + '</div>'; }
  function v(id) { var x = parseNum(document.getElementById('L-' + id).value); return x === null ? 0 : x; }
  function stat(label, val) { return '<div class="stat"><b>' + val + '</b><span>' + label + '</span></div>'; }
  var LABS = {
    fees: function (el) {
      el.innerHTML = '<h2>Fee lab</h2><p class="muted" style="margin:0">Same investment, same market, two different fees. Change any number.</p>' +
        inputs(el, [['P', 'Invest once ($)', 10000], ['r', 'Return before fees (% a year)', 7], ['n', 'Years', 40], ['fa', 'Fund A fee (%)', 0.05], ['fb', 'Fund B fee (%)', 1]]) + '<div class="out" id="fo"></div><div id="ft"></div>';
      function go() { var P = v('P'), r = v('r') / 100, n = Math.min(v('n'), 80), a = P * Math.pow(1 + r - v('fa') / 100, n), b = P * Math.pow(1 + r - v('fb') / 100, n);
        document.getElementById('fo').innerHTML = stat('Fund A after ' + n + ' years', money(Math.round(a))) + stat('Fund B after ' + n + ' years', money(Math.round(b))) + stat('Fees cost you (B vs. A)', money(Math.round(Math.abs(a - b))));
        var rows = ''; for (var y = 10; y <= n; y += 10) rows += '<tr><td>' + y + '</td><td>' + money(Math.round(P * Math.pow(1 + r - v('fa') / 100, y))) + '</td><td>' + money(Math.round(P * Math.pow(1 + r - v('fb') / 100, y))) + '</td></tr>';
        document.getElementById('ft').innerHTML = rows ? '<table><thead><tr><th>Year</th><th>Fund A</th><th>Fund B</th></tr></thead><tbody>' + rows + '</tbody></table>' : ''; }
      el.oninput = go; go();
    },
    beta: function (el) {
      var rows = [['Holding 1', 4000, 1.3], ['Holding 2', 3000, 0.9], ['Holding 3', 2000, 1.6], ['Bond fund', 1000, 0]];
      el.innerHTML = '<h2>Beta lab: my portfolio</h2><p class="muted" style="margin:0">Type each holding, its dollar value and its beta (from any quote page). The lab weights each beta by its share of the portfolio.</p>' +
        '<table><thead><tr><th>Holding</th><th>$ value</th><th>Beta</th></tr></thead><tbody id="bt">' + [0, 1, 2, 3, 4, 5].map(function (i) { var r = rows[i] || ['', '', ''];
          return '<tr><td><input aria-label="Holding ' + (i + 1) + '" id="L-h' + i + '" value="' + r[0] + '"></td><td><input aria-label="Value ' + (i + 1) + '" id="L-d' + i + '" inputmode="decimal" value="' + r[1] + '"></td><td><input aria-label="Beta ' + (i + 1) + '" id="L-b' + i + '" inputmode="decimal" value="' + r[2] + '"></td></tr>'; }).join('') + '</tbody></table>' +
        inputs(el, [['m', 'Market move (%)', -10]]) + '<div class="out" id="bo"></div>';
      function go() { var tot = 0, wb = 0; for (var i = 0; i < 6; i++) { var d = v('d' + i), b = v('b' + i); tot += d; wb += d * b; } var beta = tot ? wb / tot : 0, mv = beta * v('m');
        document.getElementById('bo').innerHTML = stat('Portfolio value', money(tot)) + stat('Portfolio beta', beta.toFixed(2)) + stat('Predicted move', (mv >= 0 ? '+' : '−') + Math.abs(mv).toFixed(1) + '% (' + money(Math.round(tot * mv / 100)) + ')'); }
      el.oninput = go; go();
    },
    hash: function (el) {
      var data = ['Ana pays Ben 5', 'Ben pays Cal 2', 'Cal pays Dee 1', 'Dee pays Ana 3'];
      function h(s) { var x = 7; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) % 65521; return ('000' + x.toString(16)).slice(-4).toUpperCase(); }
      var stored = [], redo = 0;
      function chain() { var prev = '0000', out = []; for (var i = 0; i < 4; i++) { var hh = h(prev + '|' + data[i]); out.push({ prev: prev, hash: hh }); prev = hh; } return out; }
      function mine(from) { var c = chain(); for (var i = from; i < 4; i++) stored[i] = c[i].hash; }
      mine(0);
      function draw() { var c = chain(), html = ''; for (var i = 0; i < 4; i++) { var bad = stored[i] !== c[i].hash;
          html += '<div class="block' + (bad ? ' bad' : '') + '"><b>Block ' + (i + 1) + (bad ? ': broken' : ': valid') + '</b><label>Transactions<input id="L-t' + i + '" value="' + esc(data[i]) + '"></label>' +
            '<span>Previous hash: <code>' + c[i].prev + '</code></span><span>Hash it should have: <code>' + c[i].hash + '</code></span><span>Hash on record: <code>' + stored[i] + '</code></span><button class="btn" data-mine="' + i + '">Re-mine from here</button></div>'; }
        el.querySelector('.blocks').innerHTML = html; el.querySelector('#hr').textContent = 'Blocks you had to re-mine: ' + redo;
        el.querySelectorAll('[data-mine]').forEach(function (b) { b.onclick = function () { var f = +b.getAttribute('data-mine'); redo += 4 - f; mine(f); draw(); }; });
        el.querySelectorAll('.blocks input').forEach(function (inp, i) { inp.oninput = function () { data[i] = inp.value; var pos = inp.selectionStart; draw(); var n = document.getElementById('L-t' + i); n.focus(); n.setSelectionRange(pos, pos); }; }); }
      el.innerHTML = '<h2>Build-a-block lab</h2><p class="muted" style="margin:0">Each block stores the previous block’s hash (a fingerprint). Change a transaction in Block 1 and watch every later link break. Then re-mine to fix it, and count the work.</p><div class="blocks"></div><p id="hr" class="muted" style="margin:0"></p>';
      draw();
    },
    rental: function (el) {
      el.innerHTML = '<h2>REIT vs. rental lab</h2><p class="muted" style="margin:0">A made-up rental and a made-up REIT with the same money invested. Change any number.</p>' +
        '<h3 style="margin:4px 0 0">Rental house</h3>' + inputs(el, [['dp', 'Down payment ($)', 50000], ['rent', 'Rent ($ a month)', 1900], ['mort', 'Mortgage ($ a month)', 1150], ['tax', 'Taxes + insurance ($ a month)', 350], ['rep', 'Repairs ($ a month)', 150], ['vac', 'Months empty a year', 1]]) +
        '<h3 style="margin:4px 0 0">REIT</h3>' + inputs(el, [['y', 'REIT dividend yield (%)', 4]]) + '<div class="out" id="ro"></div>';
      function go() { var occ = Math.max(0, 12 - v('vac')), yr = v('rent') * occ - (v('mort') + v('tax') + v('rep')) * 12, reit = v('dp') * v('y') / 100;
        document.getElementById('ro').innerHTML = stat('Rental cash flow per year', money(Math.round(yr))) + stat('Rental: cash flow ÷ down payment', (v('dp') ? (yr / v('dp') * 100).toFixed(1) : '0') + '%') + stat('REIT dividends per year', money(Math.round(reit))) + stat('Time to sell', 'Rental: months · REIT: seconds'); }
      el.oninput = go; go();
    },
    auction: function (el) {
      var A = [['Index fund', [18, -20, 22]], ['Bitcoin', [120, -65, 60]], ['REIT', [12, -15, 10]], ['Gold', [-2, 20, 3]], ['Sneaker collection', [30, -40, 0]], ['Startup stake', [0, 0, -100]]];
      el.innerHTML = '<h2>Alternative-asset auction</h2><p class="muted" style="margin:0">Split <b>$100,000</b> across six assets, then play 3 made-up years. The returns are invented for this game, not predictions. Sneakers lose 10% to selling fees when you cash out.</p>' +
        inputs(el, A.map(function (a, i) { return ['a' + i, a[0] + ' ($)', [40000, 10000, 15000, 10000, 5000, 20000][i]]; })) + '<div class="row"><span id="al" class="muted"></span><button class="btn go" id="play">Play the 3 years</button></div><div id="ao"></div>';
      function tot() { var t = 0; A.forEach(function (_, i) { t += v('a' + i); }); return t; }
      el.oninput = function () { var t = tot(); document.getElementById('al').textContent = 'Allocated: ' + money(t) + (t !== 100000 ? ' (must equal $100,000)' : ' ✓'); document.getElementById('play').disabled = t !== 100000; };
      el.oninput();
      document.getElementById('play').onclick = function () { var vals = A.map(function (_, i) { return v('a' + i); }), rows = '', worst = 0;
        for (var y = 0; y < 3; y++) { vals = vals.map(function (x, i) { return x * (1 + A[i][1][y] / 100); }); var t = vals.reduce(function (a, b) { return a + b; }, 0); worst = Math.min(worst, t - 100000);
          rows += '<tr><td>Year ' + (y + 1) + '</td><td>' + money(Math.round(t)) + '</td><td>' + A.map(function (a) { return a[0] + ' ' + (a[1][y] > 0 ? '+' : '') + a[1][y] + '%'; }).join(' · ') + '</td></tr>'; }
        var end = vals.reduce(function (a, b, i) { return a + (i === 4 ? b * 0.9 : b); }, 0);
        document.getElementById('ao').innerHTML = '<table><thead><tr><th>Year</th><th>Portfolio</th><th>What happened (made up)</th></tr></thead><tbody>' + rows + '</tbody></table><div class="out">' + stat('Final value (after sneaker fees)', money(Math.round(end))) + stat('Gain or loss', money(Math.round(end - 100000))) + '</div><p class="muted" style="margin:0">Compare with a classmate who put everything in the index fund: ' + money(Math.round(100000 * 1.18 * 0.8 * 1.22)) + '. Who had the scarier ride?</p>'; };
    }
  };
  start();
})();
