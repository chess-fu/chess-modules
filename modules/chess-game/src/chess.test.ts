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

  it('will play a game with notation', function () {
    //tslint:disable-next-line
    const pgn = `1. e4 e5 2. Nf3 Nc6 3. c3 Nf6 { C44 Ponziani Opening: Jaenisch Counterattack } 4. d4 d6?! { (0.00 → 0.88) Inaccuracy. Best move was Nxe4. } (4... Nxe4 5. Bd3 d5 6. Nxe5 Nxe5 7. dxe5 Bc5 8. O-O O-O 9. Nd2) 5. d5 Nxe4? { (0.43 → 1.44) Mistake. Best move was Ne7. } (5... Ne7 6. Bd3 Ng6 7. O-O Be7 8. c4 O-O 9. Nc3 Nh5 10. Re1) 6. dxc6 bxc6 7. Qe2?! { (2.09 → 1.28) Inaccuracy. Best move was Qc2. } (7. Qc2 Nf6 8. c4 e4 9. Nd4 Bd7 10. Be2 d5 11. c5 Qe7 12. Nb3 a5 13. a4 d4) 7... Bf5? { (1.28 → 2.37) Mistake. Best move was f5. } (7... f5 8. Nbd2 Nf6 9. Nc4 Be7 10. Na5 Bd7 11. Qa6 Qc8 12. Bg5 Qxa6 13. Bxa6 Rb8 14. Bxf6) 8. Nbd2? { (2.37 → 1.36) Mistake. Best move was g4. } (8. g4 Bg6 9. Nxe5 dxe5 10. Bg2 Be7 11. Bxe4 Bxe4 12. Qxe4 Qd5 13. Qxd5 cxd5 14. Ke2 f6) 8... Nc5 9. Nh4?? { (1.59 → -4.86) Blunder. Best move was Nd4. } (9. Nd4 Bg6) 9... Qxh4? { (-4.86 → -2.41) Mistake. Best move was Nd3+. } (9... Nd3+ 10. Kd1 Qxh4 11. g3 Qa4+ 12. b3 Qa5 13. b4 Qa4+ 14. Nb3 a5 15. Qe3 Nxc1 16. Rxc1) 10. g3?! { (-2.41 → -2.92) Inaccuracy. Best move was Qf3. } (10. Qf3 Bd7 11. Nc4 Ne6 12. g3 Qe7 13. Qe2 e4 14. Be3 g6 15. Bh3 Bg7 16. O-O O-O) 10... Qg5? { (-2.92 → -0.63) Mistake. Best move was Qf6. } (10... Qf6 11. Qf3 d5 12. g4 Bg6 13. Qxf6 gxf6 14. Nb3 Ne6 15. h3 h5 16. Bg2 Kd7 17. Ke2) 11. Ne4 Nxe4?? { (-0.77 → 3.21) Blunder. Best move was Qe7. } (11... Qe7 12. Nxc5 dxc5 13. Bg2 Qe6 14. Qa6 e4 15. Qb7 Rd8 16. O-O Be7 17. Re1 O-O 18. Qxa7) 12. Bxg5 d5?? { (3.15 → 6.75) Blunder. Best move was Nxg5. } (12... Nxg5 13. f4 Ne6 14. Bg2 Nd8 15. fxe5 d5 16. h4 Be7 17. O-O Be6 18. Kh2 O-O 19. Rad1) 13. g4?! { (6.75 → 6.00) Inaccuracy. Best move was f3. } (13. f3 Nxg5 14. Qxe5+ Be6 15. Qxg5 Kd7 16. Qe5 f6 17. Qh5 g6 18. Qh4 f5 19. O-O-O a5) 13... Be6 14. f3? { (6.12 → 4.74) Mistake. Best move was Be3. } (14. Be3 Be7 15. f3 Nd6 16. Bc5 f6 17. O-O-O a5 18. f4 e4 19. f5 Bf7 20. Qf2 Nb7) 14... Nxg5 15. h4 Nxf3+ 16. Qxf3 Rd8?! { (4.56 → 5.51) Inaccuracy. Best move was e4. } (16... e4) 17. h5?! { (5.51 → 4.87) Inaccuracy. Best move was g5. } (17. g5 Bc5 18. Bh3 e4 19. Qg3 Bxh3 20. Rxh3 Bd6 21. Qe3 O-O 22. Qxa7 Rb8 23. b3 Rb6) 17... h6 18. Bd3? { (4.92 → 2.13) Mistake. Best move was Bh3. } (18. Bh3 Be7 19. g5 Bxg5 20. Bxe6 fxe6 21. Qg3 Bf6 22. O-O-O Kd7 23. Rhe1 a5 24. Qg6 Rhf8) 18... Rd6?? { (2.13 → 5.90) Blunder. Best move was e4. } (18... e4 19. Bxe4 dxe4 20. Qxe4 Rd5 21. c4 Rc5 22. b3 Bd6 23. O-O-O O-O 24. Rhg1 Bd7 25. Qg2) 19. Bf5 d4? { (5.57 → 7.52) Mistake. Best move was Be7. } (19... Be7 20. Qf2 d4 21. Bxe6 Rxe6 22. O-O-O c5 23. Qg2 c6 24. Qe4 Bg5+ 25. Kc2 O-O 26. c4) 20. cxd4?! { (7.52 → 6.63) Inaccuracy. Best move was Bxe6. } (20. Bxe6 Rxe6 21. O-O f6 22. Qf5 Kf7 23. cxd4 e4 24. Rae1 e3 25. Qd3 Bd6 26. Rxe3 Rxe3) 20... Rxd4?? { (6.63 → 10.96) Blunder. Best move was Bd5. } (20... Bd5 21. Be4 Rf6 22. Qe2 Bb4+ 23. Kd1 O-O 24. Bxd5 cxd5 25. Qxe5 Ba5 26. g5 Re6 27. Qxd5) 21. Qxc6+ Kd8 22. Qa8+ Kd7 23. Qxa7? { (9.83 → 7.20) Mistake. Best move was Bxe6+. } (23. Bxe6+) 23... Bb4+ 24. Ke2 Rd2+ 25. Kf3 Bxf5? { (7.23 → 8.23) Mistake. Best move was Bd6. } (25... Bd6 26. Rad1 Rxd1 27. Rxd1 Rd8 28. Ke4 Ke7 29. Rc1 Ke8 30. Rc6 Kd7 31. Qb7 Ke8 32. Bxe6) 26. gxf5 Rd3+? { (8.03 → 12.01) Mistake. Best move was Bd6. } (26... Bd6 27. Rhd1 Rxd1 28. Rxd1 Ke7 29. Rg1 Rg8 30. Ke4 Rh8 31. Rxg7 Kf6 32. Rg1 Ke7 33. a4) 27. Ke4 Rd4+ 28. Kxe5 Rd6 29. Qa4+ c6 30. Qxb4 Re8+ 31. Kf4 g5+ 32. fxg6 Rf6+ 33. Kg3 Re3+ 34. Kg2 Re2+ 35. Kg1 Rff2?! { (14.34 → Mate in 11) Checkmate is now unavoidable. Best move was fxg6. } (35... fxg6) 36. Qd4+?! { (Mate in 11 → 18.28) Lost forced checkmate sequence. Best move was Rd1+. } (36. Rd1+ Kc8 37. Qf8+ Kc7 38. Qd8+ Kb7 39. Rd7+ Ka6 40. Qa8+ Kb6 41. Qb8+ Kc5 42. Qd6+ Kb6) 36... Kc7?! { (18.28 → Mate in 10) Checkmate is now unavoidable. Best move was Ke7. } (36... Ke7 37. Qc5+) 37. Qxf2 Rxf2 38. Kxf2 Kd6 39. Rad1+ Kc5 40. Rh4?! { (Mate in 5 → Mate in 6) Not the best checkmate sequence. Best move was gxf7. } (40. gxf7 Kb6 41. f8=Q Kc7 42. Rh3 c5 43. Rb3 c4 44. Qc5#) 40... fxg6 41. hxg6 { Black resigns. } 1-0`;
    const game = new Chess();
    game.load();
    game.loadPgn(pgn);
  });

  it('will play a game with notation (2)', function () {
    //tslint:disable-next-line
    const pgn = `1. d4 c5 { A43 Old Benoni Defense } 2. c4 cxd4 3. Qxd4 Nc6 4. Qd1 e5?! { (-0.29 → 0.21) Inaccuracy. Best move was g6. } (4... g6 5. e4 Bg7 6. Be2 b6 7. Nf3 Bb7 8. O-O Rc8 9. Qc2) 5. Nc3 d5? { (-0.08 → 2.14) Mistake. Best move was Bb4. } (5... Bb4 6. Bd2 Nf6 7. e3 d6 8. Nf3 Bf5 9. Nd5 Bc5 10. Bc3) 6. Nf3? { (2.14 → -0.84) Mistake. Best move was cxd5. } (6. cxd5 Nb8 7. e4 Nd7 8. Bd3 Bd6 9. Nf3 Ngf6 10. Be3 O-O 11. Nd2 a6 12. O-O Nc5) 6... d4 7. Bg5?? { (-0.98 → -4.16) Blunder. Best move was Nd5. } (7. Nd5 Nf6) 7... f6? { (-4.16 → -2.92) Mistake. Best move was Qa5. } (7... Qa5) 8. Bh4? { (-2.92 → -4.52) Mistake. Best move was Bd2. } (8. Bd2 dxc3 9. Bxc3 Bb4 10. Bxb4 Nxb4 11. Qa4+ Nc6 12. b4 Ne7 13. e3 O-O 14. Be2 Bf5) 8... dxc3 9. Qxd8+ Kxd8 10. bxc3 Bg4 11. O-O-O+ Kc7 12. h3 Ba3+ 13. Kc2 Bf5+ 14. e4?! { (-4.46 → -5.41) Inaccuracy. Best move was Kb3. } (14. Kb3 Bc5 15. Nd2 a5 16. a4 h5 17. e4 Be6 18. Kb2 Ba7 19. Nb3 Nge7 20. Be2 g5) 14... Bxe4+ 15. Kb3 Bxf3 16. gxf3 Bc5?! { (-5.41 → -4.89) Inaccuracy. Best move was Bd6. } (16... Bd6) 17. Be2? { (-4.89 → -6.18) Mistake. Best move was Bg3. } (17. Bg3 Bd6 18. c5 Bxc5 19. f4 Bd6 20. fxe5 Bxe5 21. f4 Bd6 22. h4 Nge7 23. Bh3 Rad8) 17... g5 18. Bg3 h5?! { (-5.82 → -5.10) Inaccuracy. Best move was Nge7. } (18... Nge7 19. h4 h6 20. Kc2 f5 21. Rd5 Bd6 22. Rb5 a6 23. Rbb1 Bc5 24. Bd3 f4 25. Bh2) 19. h4 Nge7 20. f4? { (-4.69 → -7.37) Mistake. Best move was Bd3. } (20. Bd3 g4) 20... exf4 21. Bh2 Bxf2 22. Rhf1 Be3 23. Bg1?! { (-7.24 → -7.86) Inaccuracy. Best move was Bf3. } (23. Bf3 Rad8 24. Rfe1 Rxd1 25. Bxd1 Na5+ 26. Ka4 Nxc4 27. hxg5 fxg5 28. Bf3 Rd8 29. Kb4 Nd6) 23... Nf5 24. Bxe3? { (-7.43 → -8.78) Mistake. Best move was hxg5. } (24. hxg5 fxg5) 24... Nxe3 25. Rfe1? { (-8.65 → -10.12) Mistake. Best move was c5. } (25. c5 Nxd1) 25... Nxd1 26. Rxd1 Rhe8?! { (-9.92 → -8.95) Inaccuracy. Best move was g4. } (26... g4 27. Rf1 f3 28. Bd1 Ne5 29. c5 Rhe8 30. a4 Rac8 31. c6 Nxc6 32. Bc2 Ne5 33. Bf5) 27. Bf3?! { (-8.95 → -9.57) Inaccuracy. Best move was Bxh5. } (27. Bxh5 Rh8) 27... Ne5 28. Bd5 Rac8 29. c5 Nd7?! { (-9.31 → -8.76) Inaccuracy. Best move was Kb8. } (29... Kb8 30. hxg5 fxg5 31. c6 bxc6 32. Be4 g4 33. Rh1 Rh8 34. Kc2 f3 35. Kd2 h4 36. Ke3) 30. Bh1? { (-8.76 → -9.96) Mistake. Best move was hxg5. } (30. hxg5 fxg5 31. Kb4 Re3 32. Bc4 h4 33. Rd5 Ne5 34. Kb3 g4 35. Rd4 f3 36. Bf1 Re1) 30... Nxc5+ 31. Kb4 Ne4 32. Bxe4 Rxe4+ 33. Rd4?! { (-12.52 → Mate in 11) Checkmate is now unavoidable. Best move was c4. } (33. c4 g4) 33... Rce8 34. Rc4+ Rxc4+ 35. Kxc4 f3 36. Kb3 f2 37. Kc2 f1=Q 38. Kb3 Qc4+?! { (Mate in 3 → Mate in 8) Not the best checkmate sequence. Best move was Qb1+. } (38... Qb1+ 39. Ka3 Re2 40. hxg5 Rxa2#) 39. Kxc4 gxh4 40. Kb3 h3 41. a3 h2 42. c4 h1=Q 43. Kb4 Qc6?! { (Mate in 4 → Mate in 4) Not the best checkmate sequence. Best move was Re3. } (43... Re3 44. Kb5 Qb1+ 45. Ka4 Qb6 46. c5 Re4#) 44. a4 a5+?! { (Mate in 3 → Mate in 3) Not the best checkmate sequence. Best move was Re3. } (44... Re3 45. a5 a6 46. c5 Qb5#) 45. Kxa5 Qb6# { Black wins by checkmate. } 0-1`;
    const game = new Chess();
    game.load();
    game.loadPgn(pgn);
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
    this.timeout(30);
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
    this.timeout(100);
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

  it('Will load game with non-standard SAN disambiguation notation', function () {
    const chess = new Chess();
    chess.loadPgn(`
      1.d4 Nf6 2.c4 e6 3.Nf3 b6 4.a3 Ba6 5.Qc2 c5 6.d5 exd5 7.cxd5 g6 8.Nc3 Bg7
      9.g3 O-O 10.Bg2 d6 11.O-O Re8 12.Re1 b5 13.e4 Nbd7 14.Bf4 Qb6 15.Bh3 Rad8
      16.Ra1d1 Bc8 17.Bf1 a6 18.h3 Bb7 19.Nd2 c4 20.Bxc4 bxc4 21.Nd2xc4 Qa7 22.Nxd6 Rf8
      23.g4 Ne8 24.Nxb7 Qxb7 25.e5 Nc7 26.Bh2 Rfe8 27.f4  1/2-1/2
    `);
  });

  it('allows enpass to avoid check', function () {
    const game = new Chess('4r3/3k1p2/2pr3p/5PpP/1Q3K2/8/PP6/R6R w - g6 0 32');
    assert.equal(game.move('fxg6').san, 'fxg6');
  });

  it('recognizes when a castle ends in a check', function () {
    const game = new Chess('r2k1bnr/pp4pp/2n2p2/4p3/2P3bB/2P2N2/P3PPPP/R3KB1R w KQ - 1 11');
    assert.equal(game.move('O-O-O+').san, 'O-O-O+');
  });

  it('stops game on mate', function () {
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