/*
 * Still Point Live demo: plays a simulated club night through the real big-screen page.
 *
 * index.html in this folder is a copy of the app's big-screen page (app/src/main/assets/bigscreen);
 * opened with ?demo it loads this file instead of talking to a phone. Everything here produces the
 * same state the phone publishes (LiveScreenState.kt), so the visitor sees exactly what a TV shows.
 * The darts are invented: a simple aim-and-scatter model, not the app's detector or scoring code.
 */
(function () {
  'use strict';
  var live = window.StillpointLive;
  if (!live) return;
  var FAST = /[?&]fast(&|$)/.test(location.search);
  var DART_MS = FAST ? 260 : 820, VISIT_HOLD_MS = FAST ? 500 : 1500, PAUSE_MS = FAST ? 2500 : 7000;

  var NAMES = [['Anna', 94], ['Thomas', 88], ['Femke', 81], ['Chris', 85], ['Luca', 73], ['Eva', 77], ['Ben', 69], ['Dave', 64]];
  var EVENT = 'Club night · Demo';
  var BOARD = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

  function rand() { return Math.random(); }
  function pick(list) { return list[Math.floor(rand() * list.length)]; }
  function neighbours(n) { var i = BOARD.indexOf(n); return [BOARD[(i + 19) % 20], BOARD[(i + 1) % 20]]; }

  // ---- Darts ---------------------------------------------------------------------------------

  /** One dart thrown at [aim] ('T20', 'D16', 'S7', 'DB', 'SB') by a player of [avg] three-dart average. */
  function throwAt(aim, avg) {
    var skill = Math.max(0.05, Math.min(0.55, (avg / 3 - 12.65) / 47.35)); // treble rate that gives this average
    var kind = aim.charAt(0), n = aim === 'DB' || aim === 'SB' ? 25 : parseInt(aim.slice(1), 10), r = rand();
    if (n === 25) {
      if (r < skill * 0.45) return 'DB';
      if (r < skill * 0.45 + 0.4) return 'SB';
      return 'S' + pick(BOARD);
    }
    if (kind === 'T') {
      if (r < skill) return 'T' + n;
      r = (r - skill) / (1 - skill);
      if (r < 0.55) return 'S' + n;
      if (r < 0.95) return 'S' + pick(neighbours(n));
      return 'T' + pick(neighbours(n));
    }
    if (kind === 'D') {
      var hit = 0.18 + skill * 0.6;
      if (r < hit) return 'D' + n;
      r = (r - hit) / (1 - hit);
      if (r < 0.45) return 'S' + n;
      if (r < 0.8) return 'MISS';
      return 'S' + pick(neighbours(n));
    }
    if (r < 0.88) return 'S' + n;
    return 'S' + pick(neighbours(n));
  }

  function points(label) {
    if (label === 'MISS') return 0;
    if (label === 'DB') return 50;
    if (label === 'SB') return 25;
    return ' SDT'.indexOf(label.charAt(0)) * parseInt(label.slice(1), 10);
  }
  function isDouble(label) { return label === 'DB' || label.charAt(0) === 'D'; }

  // ---- Checkout routes: fewest darts, then the way players throw them --------------------------

  var THROWS = [];
  for (var t = 20; t >= 1; t--) THROWS.push('T' + t);
  for (var s1 = 20; s1 >= 1; s1--) THROWS.push('S' + s1);
  THROWS.push('SB', 'DB');
  for (var d0 = 20; d0 >= 1; d0--) THROWS.push('D' + d0);
  var GOOD_DOUBLES = ['D20', 'D16', 'D8', 'D18', 'D12', 'D10', 'D4', 'D14', 'D6', 'D2', 'DB'];
  function doubleRank(label) { var i = GOOD_DOUBLES.indexOf(label); return i < 0 ? 20 : i; }
  function setupRank(label) { var i = ['T20', 'T19', 'T18', 'T17', 'T16', 'T15'].indexOf(label); return i >= 0 ? i : label.charAt(0) === 'S' ? 8 : label === 'SB' || label === 'DB' ? 12 : 10; }

  var routeCache = {};
  function route(left, darts) {
    var key = left + ':' + darts;
    if (key in routeCache) return routeCache[key];
    var best = null, bestCost = Infinity;
    function finish(rest) {
      if (rest === 50) return 'DB';
      if (rest >= 2 && rest <= 40 && rest % 2 === 0) return 'D' + rest / 2;
      return null;
    }
    for (var n = 1; n <= darts && !best; n++) {
      if (n === 1) {
        var f = finish(left);
        if (f) best = [f];
        continue;
      }
      THROWS.forEach(function (a) {
        var ra = left - points(a);
        if (n === 2) {
          var f2 = finish(ra);
          if (f2) { var c = setupRank(a) * 30 + doubleRank(f2); if (c < bestCost) { bestCost = c; best = [a, f2]; } }
        } else {
          THROWS.forEach(function (b) {
            var f3 = finish(ra - points(b));
            if (f3) { var c3 = setupRank(a) * 900 + setupRank(b) * 30 + doubleRank(f3); if (c3 < bestCost) { bestCost = c3; best = [a, b, f3]; } }
          });
        }
      });
    }
    routeCache[key] = best;
    return best;
  }

  /** Where a player aims the next dart: the route's first dart, or the treble 20 with a setup in mind. */
  function aimFor(left, dartsLeft) {
    var r = left <= 170 ? route(left, dartsLeft) : null;
    if (r) return r[0];
    if (left <= 60 && left > 40) return 'S' + (left - 40 <= 20 ? left - 40 : 20);
    return left === 1 ? 'MISS' : 'T20';
  }

  // ---- A match -------------------------------------------------------------------------------

  function Match(home, away, round, legsToWin) {
    this.round = round; this.legsToWin = legsToWin;
    this.players = [home, away].map(function (p) {
      return { name: p[0], skill: p[1], score: 501, legs: 0, scored: 0, darts: 0, last: [], lastTotal: null };
    });
    this.leg = 1; this.starter = 0; this.current = 0; this.visit = []; this.bust = false; this.done = false; this.lastLeg = null;
    this.legDarts = [0, 0]; this.legScored = [0, 0];
    // What each player had left after every visit of this leg, and their match average after every visit.
    this.paths = [[501], [501]]; this.momentum = [[], []];
  }
  /** A visit is over: note where it left the player, for the TV's race and momentum lines. */
  Match.prototype.visitDone = function () {
    var i = this.current, p = this.players[i];
    this.paths[i].push(p.score);
    if (p.darts) this.momentum[i].push((p.scored / p.darts * 3).toFixed(1));
  };
  Match.prototype.state = function () {
    var self = this, p = this.players[this.current], dartsLeft = 3 - this.visit.length;
    var checkout = !this.done && !this.bust && p.score <= 170 ? route(p.score, dartsLeft) || [] : [];
    var m = {
      mode: 'X01', title: '501 · First to ' + this.legsToWin + ' legs', context: 'Leg ' + this.leg,
      players: this.players.map(function (q) {
        return { name: q.name, score: String(q.score), legs: q.legs, sets: 0, average: q.darts ? (q.scored / q.darts * 3).toFixed(1) : null,
          last: q.last.slice(), lastTotal: q.lastTotal, bot: false, marks: [] };
      }),
      current: this.current, darts: this.visit.slice(), counted: this.visit.length, visit: String(this.visit.reduce(function (a, d) { return a + points(d); }, 0)),
      manualTotal: false, checkout: checkout, target: null, scoreLabel: 'Remaining', status: '', bust: this.bust, paused: false,
      canUndo: true, canRedo: false, manual: false, complete: this.done, result: this.done ? this.winner().name + ' wins' : null,
      savePending: false, cameraLive: true, previewShared: false, allowsTotal: true, showLegs: true,
      tournament: { name: EVENT, round: this.round, board: 1 }
    };
    if (this.lastLeg) m.lastLeg = this.lastLeg;
    m.momentum = this.players.map(function (q, i) { return { name: q.name, averages: self.momentum[i].slice() }; });
    return m;
  };
  Match.prototype.winner = function () { return this.players[0].legs >= this.legsToWin ? this.players[0] : this.players[1]; };
  Match.prototype.loser = function () { return this.winner() === this.players[0] ? this.players[1] : this.players[0]; };
  /** One step of play; returns the delay before the next one. */
  Match.prototype.step = function () {
    var p = this.players[this.current];
    if (this.bust || this.visit.length === 3) { // the visit ends: next player
      this.visit = []; this.bust = false; this.current = 1 - this.current;
      return DART_MS;
    }
    var label = throwAt(aimFor(p.score, 3 - this.visit.length), p.skill), before = p.score;
    this.visit.push(label);
    p.darts++; this.legDarts[this.current]++;
    var after = before - points(label);
    if (after < 0 || after === 1 || (after === 0 && !isDouble(label))) {
      var undo = this.visit.slice(0, -1).reduce(function (a, d) { return a + points(d); }, 0);
      p.score += undo; p.scored -= undo; this.legScored[this.current] -= undo;
      this.bust = true; p.last = this.visit.slice(); p.lastTotal = 'Bust';
      this.visitDone();
      return VISIT_HOLD_MS;
    }
    p.score = after; p.scored += points(label); this.legScored[this.current] += points(label);
    if (after === 0) return this.legWon(label);
    if (this.visit.length === 3) {
      p.last = this.visit.slice();
      p.lastTotal = String(this.visit.reduce(function (a, d) { return a + points(d); }, 0));
      this.visitDone();
      return VISIT_HOLD_MS;
    }
    return DART_MS;
  };
  Match.prototype.legWon = function () {
    var self = this, w = this.current, p = this.players[w];
    var out = this.visit.reduce(function (a, d) { return a + points(d); }, 0);
    p.last = this.visit.slice(); p.lastTotal = String(out); p.legs++;
    this.visitDone();
    this.lastLeg = { key: '1:' + this.leg, set: 1, leg: this.leg, sets: false, winner: p.name, darts: this.legDarts[w], checkout: out,
      averages: this.players.map(function (q, i) { return { name: q.name, average: self.legDarts[i] ? (self.legScored[i] / self.legDarts[i] * 3).toFixed(1) : null }; }),
      paths: this.paths.map(function (path) { return path.slice(); }) };
    if (p.legs >= this.legsToWin) { this.done = true; this.visit = []; return null; }
    this.leg++; this.starter = 1 - this.starter; this.current = this.starter; this.visit = [];
    this.players.forEach(function (q) { q.score = 501; q.last = []; q.lastTotal = null; });
    this.legDarts = [0, 0]; this.legScored = [0, 0]; this.paths = [[501], [501]];
    return FAST ? 3000 : 9000; // the leg card and its averages stay up
  };
  /** A match nobody watches: played instantly, for the rest of the bracket. */
  Match.prototype.playOut = function () { var guard = 0; while (!this.done && guard++ < 5000) this.step(); return this; };

  // ---- The tournament ------------------------------------------------------------------------

  var ROUNDS = [['Quarter-final', 2], ['Semi-final', 2], ['Final', 3]];
  function card(f) {
    if (!f) return null;
    return { home: f.home ? f.home[0] : null, away: f.away ? f.away[0] : null, hl: f.hl || '', al: f.al || '', hs: f.m && f.m.done ? f.m.players[0].legs : null,
      as: f.m && f.m.done ? f.m.players[1].legs : null, winner: f.m && f.m.done ? (f.m.winner() === f.m.players[0] ? 'home' : 'away') : null,
      status: f.live ? 'live' : f.m && f.m.done ? 'done' : f.home && f.away ? 'ready' : 'waiting' };
  }

  function Night() {
    var seeds = NAMES.slice();
    // Standard eight-player draw: 1v8, 4v5, 2v7, 3v6.
    var order = [[0, 7], [3, 4], [1, 6], [2, 5]];
    this.rounds = [order.map(function (pr) { return { home: seeds[pr[0]], away: seeds[pr[1]] }; }),
      [{ hl: 'Winner QF 1', al: 'Winner QF 2' }, { hl: 'Winner QF 3', al: 'Winner QF 4' }], [{ hl: 'Winner SF 1', al: 'Winner SF 2' }]];
    this.phase = 'Quarter-final';
  }
  Night.prototype.advance = function (ri, i) {
    var f = this.rounds[ri][i], next = this.rounds[ri + 1];
    if (!next) return;
    var slot = next[Math.floor(i / 2)], winner = [f.m.winner().name, f.m.winner().skill];
    if (i % 2 === 0) slot.home = winner; else slot.away = winner;
  };
  Night.prototype.state = function (extra) {
    var self = this, complete = this.rounds[2][0].m && this.rounds[2][0].m.done;
    var final = this.rounds[2][0].m;
    var t = { name: EVENT, phase: complete ? 'Complete' : this.phase, complete: !!complete, champion: complete ? final.winner().name : null,
      runnerUp: complete ? final.loser().name : null, thirdName: null, live: [], next: [], third: null, groupsOpen: false, tables: [],
      rounds: this.rounds.map(function (r, ri) { return { name: ROUNDS[ri][0], matches: r.map(card) }; }) };
    this.rounds.forEach(function (r, ri) {
      r.forEach(function (f) {
        // The demo's career averages follow each player's skill.
        if (f.live) t.live.push({ home: f.home[0], away: f.away[0], round: ROUNDS[ri][0], board: 1, score: null, homeAvg: (f.home[1] * .8).toFixed(1), awayAvg: (f.away[1] * .8).toFixed(1),
          h2h: [f.home[0].length % 4, f.away[0].length % 3 + 1] });  // invented earlier meetings
        else if (f.home && f.away && !(f.m && f.m.done) && t.next.length < 2) t.next.push({ home: f.home[0], away: f.away[0], round: ROUNDS[ri][0], board: null, score: null });
      });
    });
    if (complete) {
      var places = [{ place: 1, name: t.champion, label: 'Champion', pts: 10 }, { place: 2, name: t.runnerUp, label: 'Runner-up', pts: 7 }];
      this.rounds[1].forEach(function (f) { places.push({ place: 3, name: f.m.loser().name, label: 'Semi-final', pts: 5 }); });
      this.rounds[0].forEach(function (f) { places.push({ place: 5, name: f.m.loser().name, label: 'Quarter-final', pts: 3 }); });
      t.places = places;
    }
    return Object.assign({ match: null, tournament: t, merit: merit(complete ? t.places : []) }, extra || {});
  };

  var history = { Anna: [31, 3, 1], Thomas: [27, 3, 1], Chris: [22, 3, 1], Femke: [19, 3, 0], Luca: [14, 3, 0], Eva: [12, 3, 0], Ben: [9, 3, 0], Dave: [6, 3, 0] };
  function merit(places) {
    var rows = Object.keys(history).map(function (n) {
      var h = history[n], here = places.filter(function (p) { return p.name === n; })[0];
      return { name: n, points: h[0] + (here ? here.pts : 0), events: h[1] + 1, titles: h[2] + (here && here.place === 1 ? 1 : 0), recent: (here ? [here.place] : []).concat([3, 5, 2]) };
    }).sort(function (a, b) { return b.points - a.points || b.titles - a.titles; });
    return rows.map(function (r, i) { return Object.assign(r, { rank: i + 1, shared: false }); });
  }

  // ---- The show ------------------------------------------------------------------------------

  var timer = null;
  function later(ms, fn) { clearTimeout(timer); timer = setTimeout(fn, ms); }
  function show(st) { live.accept(st); }
  // An invented night so far, for the idle slides and the finished tournament's rotation.
  var TONIGHT = { matches: 6, highs: [
    { label: 'Best average', name: 'Anna', value: '78.4' }, { label: 'Highest checkout', name: 'Chris', value: '121' },
    { label: 'Most 180s', name: 'Thomas', value: '3' }, { label: 'Best leg', name: 'Anna', value: '15', darts: true }] };

  function run() {
    var night = new Night();
    // Before the first match: the idle slides, with an invented night so far.
    show({ match: null, tournament: null, merit: merit([]), tonight: TONIGHT });
    // Watch live: the first semi-final and the final; the rest play off screen.
    var plan = [[0, 0, false], [0, 1, false], [0, 2, false], [0, 3, false], [1, 0, true], [1, 1, false], [2, 0, true]];
    var at = 0;
    later(PAUSE_MS, nextFixture);

    function nextFixture() {
      if (at >= plan.length) { finish(); return; }
      var step = plan[at++], ri = step[0], i = step[1], f = night.rounds[ri][i];
      night.phase = ROUNDS[ri][0];
      f.m = new Match(f.home, f.away, ROUNDS[ri][0], ROUNDS[ri][1]);
      if (!step[2]) { f.m.playOut(); night.advance(ri, i); later(FAST ? 600 : 1800, function () { show(night.state()); later(FAST ? 600 : 1800, nextFixture); }); return; }
      f.live = true;
      show(night.state());                              // the call: "Now on Board 1"
      later(FAST ? 3000 : 10000, function () { show(night.state({ match: f.m.state() })); later(DART_MS * 2, function () { play(f, ri, i); }); });
    }

    function play(f, ri, i) {
      var wait = f.m.step();
      show(night.state({ match: f.m.state() }));
      if (wait === null) {                              // match over: result, then back to the bracket
        later(FAST ? 3000 : 9000, function () { f.live = false; night.advance(ri, i); show(night.state()); later(PAUSE_MS, nextFixture); });
        return;
      }
      later(wait, function () { play(f, ri, i); });
    }

    function finish() {
      var end = night.state(); end.tonight = TONIGHT;
      show(end);                                        // champion, places, the Order of Merit and tonight
      later(FAST ? 15000 : 45000, run);
    }
  }
  run();
})();
