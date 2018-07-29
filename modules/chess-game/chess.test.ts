/*
 * ****************************************************************************
 * Copyright (C) 2018-2018 chess-fu.com
 * License: MIT
 * Author: chess-fu.com
 * Homepage: https://chess-fu.com
 * Repository: https://github.com/chess-fu/chess-modules
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the 'Software'), to 
 * deal in the Software without restriction, including without limitation the 
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
 * sell copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 * ****************************************************************************
 */
import 'mocha';
import { assert } from 'chai';
import { default as Chess, START_FEN, Move } from './index';

describe('chess', function () {
  it('constructs with no args', function () {
    const game = new Chess();
    assert(game, 'Should be a value');
    assert(typeof game === 'object', 'Should be an object');
  });

  it('loads a default FEN', function () {
    const game = new Chess();
    assert.equal(game.toString(), '8/8/8/8/8/8/8/8 w - - 0 1');
    game.load();
    assert.equal(game.toString(), START_FEN);
  });

  it('check and not mate', function () {
    const game = new Chess();
    game.load('1Qkr3r/p1ppqpp1/1p5p/4P3/8/P2BB3/1P1b1PPP/R4RK1 b - - 1 17');

    assert.isTrue(game.isInCheck());

    const [move, ...other] = game.moves();
    assert.equal(other.length, 0, 'Expected only 1 valid move c8-b8');
    assert.equal(move.piece, 'k');
    assert.equal(move.from, 'c8');
    assert.equal(move.to, 'b8');
    assert.equal(move.captured, 'q');
    assert.equal(move.san, 'Kxb8');
  });

  it('check and mate', function () {
    const game = new Chess();
    game.load('Q1kr3r/p1ppqpp1/1p5p/4P3/8/P2BB3/1P1b1PPP/R4RK1 b - - 1 17');

    assert.isTrue(game.isInCheck());
    assert.isTrue(game.isCheckmate(), 'isCheckmate should be true');

    const moves = game.moves();
    assert.equal(moves.length, 0, 'Expected a checkmate');
  });

  it('will checkmate on move', function () {
    const game = new Chess();
    game.load('2kr3r/p1ppqpp1/1p5p/4P3/8/P2BBQ2/1P1b1PPP/R4RK1 w - - 0 17');

    assert.isFalse(game.isInCheck());

    const moves = game.moves();
    assert.equal(moves.length, 50, 'Should be 50 valid moves');
    const checks = moves.filter(m => m.check);
    assert.equal(checks.length, 3, 'Should be 2 possible check or mate moves');
    assert.equal(checks.filter(c => c.from === 'd3').length, 1, 'Bishop has check');
    assert.equal(checks.filter(c => c.from === 'f3').length, 2, 'Queen has check and a mate');
    const [check] = checks.filter(c => c.to === 'b7');
    assert.isObject(check);
    assert.equal(check.san, 'Qb7+');

    const mates = moves.filter(m => m.check === '#');
    assert.equal(mates.length, 1, 'Should be 1 possible checkmate move');
    assert.equal(mates[0].from, 'f3');
    assert.equal(mates[0].to, 'a8');
    assert.equal(mates[0].piece, 'q');
    assert.equal(mates[0].check, '#');
    assert.equal(mates[0].san, 'Qa8#');
  });

  it('will play SAN moves for each piece', function () {
    const game = new Chess();
    game.load();
    //tslint:disable-next-line
    const plays = ('1. e4 e6 2. Qf3 Nc6 3. Qxf7+ Kxf7 4. Bb5 Nd4 5. c3 Nxb5 6. d4 Ne7 7. Bf4 d5 8. a4 e5 9. Bxe5 Qe8 10. Nf3 Kg8 ' +
      '11. h4 Ng6 12. Rh3 Nxe5 13. dxe5 Na3 14. e6 dxe4 15. Ne5 Nc2+ 16. Kd1 Nxa1 17. Rg3 Qxe6 18. Rxg7+ Bxg7 19. Ng4 Qxg4+ 20. f3 Qg3 ' +
      '21. fxe4 Qxg2 22. e5 Bxe5 23. Nd2 Bh3 24. Nc4 Rd8+ 25. Nd6 Rxd6+ 26. Ke1 Qxb2 27. c4 b6 28. c5 bxc5 29. a5 Qd2#').split(/\s/g);
    for (let ix = 0; ix < plays.length; ix += 3) {
      game.move(plays[ix + 1]);
      game.move(plays[ix + 2]);
    }
    // result:
    assert.equal(game.fen(), '6kr/p1p4p/3r4/P1p1b3/7P/7b/3q4/n3K3 w - - 1 30');
    assert.isTrue(game.isCheckmate());
  });

  it('perf testForCheck', function () {
    this.slow(16);
    this.timeout(20);
    const game = new Chess();
    game.load();
    //console.time('testForCheck');
    let count = 1000;
    while (--count) {
      (game as any).testForCheck();
    }
    //console.timeEnd('testForCheck');
  });

  it('perf hasValidMoves', function () {
    this.slow(48);
    this.timeout(60);
    const game = new Chess();
    game.load();
    //console.time('hasValidMoves');
    let count = 1000;
    while (--count) {
      (game as any).hasValidMoves('w');
    }
    //console.timeEnd('hasValidMoves');
  });

  it('isAutomaticDraw', function () {
    const game = new Chess('8/KQ6/8/8/8/8/8/8 w - - 0 1');
    assert.isTrue(game.isAutomaticDraw());

    game.load('8/K7/8/8/8/8/7k/8 w - - 0 1');
    assert.isTrue(game.isAutomaticDraw());

    game.load('8/KB6/8/8/8/8/7k/8 w - - 0 1');
    assert.isTrue(game.isAutomaticDraw());

    game.load('8/Kb6/8/8/8/8/7k/8 w - - 0 1');
    assert.isTrue(game.isAutomaticDraw());

    game.load('8/KN6/8/8/8/8/7k/8 w - - 0 1');
    assert.isTrue(game.isAutomaticDraw());

    game.load('8/Kn6/8/8/8/8/7k/8 w - - 0 1');
    assert.isTrue(game.isAutomaticDraw());

    game.load('8/KbB5/8/8/8/8/7k/8 w - - 0 1');
    assert.isFalse(game.isAutomaticDraw());

    game.load('8/Kb1B4/8/8/8/8/7k/8 w - - 0 1');
    assert.isTrue(game.isAutomaticDraw());
  });

  it('will castle when available', function () {
    const game = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    let castles = game.moves({ square: 'e1' }).filter(m => m.castle);
    assert.equal(castles.map(m => m.castle).sort().join(','), 'a1,h1');

    game.move('O-O');
    assert.equal(game.fen(), 'r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1');

    castles = game.moves({ square: 'e8' }).filter(m => m.castle);
    assert.equal(castles.map(m => m.castle).sort().join(','), 'a8');

    game.move('O-O-O');
    assert.equal(game.fen(), '2kr3r/8/8/8/8/8/8/R4RK1 w - - 2 2');

    game.load('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 3 3');
    castles = game.moves({ square: 'e8' }).filter(m => m.castle);
    assert.equal(castles.map(m => m.castle).sort().join(','), 'a8,h8');

    game.move('O-O');
    assert.equal(game.fen(), 'r4rk1/8/8/8/8/8/8/R3K2R w KQ - 4 4');

    castles = game.moves({ square: 'e1' }).filter(m => m.castle);
    assert.equal(castles.map(m => m.castle).sort().join(','), 'a1');

    game.move('O-O-O');
    assert.equal(game.fen(), 'r4rk1/8/8/8/8/8/8/2KR3R b - - 5 4');

    //Obstructed both
    game.load('r3k2r/8/8/8/8/8/8/RN2K1NR w KQkq - 6 7');
    castles = game.moves({ square: 'e1' }).filter(m => m.castle);
    assert.equal(castles.length, 0);

    //Obstructed queen
    game.load('r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 6 7');
    castles = game.moves({ square: 'e1' }).filter(m => m.castle);
    assert.equal(castles.length, 1);
    assert.equal(castles[0].san, 'O-O');

    //Obstructed king
    game.load('r3k2r/8/8/8/8/8/8/R3K1NR w KQkq - 6 7');
    castles = game.moves({ square: 'e1' }).filter(m => m.castle);
    assert.equal(castles.length, 1);
    assert.equal(castles[0].san, 'O-O-O');
  });

  it('disambiguation between moves', function () {
    const game = new Chess('1k1r3r/ppp1Qppp/n4n2/5q2/2P1p3/5N2/PP3PPP/RNB2RK1 b - - 2 12');
    const moves = game.moves().filter(m => m.piece === 'r' && m.to === 'e8');
    const sanMoves = moves.map(m => m.san).sort().join(',');
    assert.equal(sanMoves, 'Rde8,Rhe8');
  });

  it.only('stops game on mate', function () {
    const game = new Chess('1k1r3r/ppp1Qppp/n4n2/5q2/2P1p3/5N2/PP3PPP/RNB2RK1 b - - 2 12');

    game.move('Rhe8');
    game.move('Qxe8');
    game.move('Qg6');
    assert.isTrue(game.isOngoing());
    game.move('Qxd8#');
    assert.isFalse(game.isOngoing());
    assert.isTrue(game.isCheckmate());
    assert.equal(game.header().Result, '1-0');

    // loaded fen but in checkmate
    game.load(game.fen());
    assert.isFalse(game.isOngoing());
    assert.isTrue(game.isCheckmate());
    assert.equal(game.header().Result, '1-0');
  });

});