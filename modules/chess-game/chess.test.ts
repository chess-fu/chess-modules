import 'mocha';
import { assert } from 'chai';
import { Chess, START_FEN, Move } from './chess';

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

    assert.isTrue(game.isInCheck('b'));
    assert.isFalse(game.isInCheck('w'));

    const [move, ...other] = game.moves();
    assert.equal(other.length, 0, 'Expected only 1 valid move c8-b8');
    assert.equal(move.piece, 'k');
    assert.equal(move.from, 'c8');
    assert.equal(move.to, 'b8');
    assert.equal(move.capture, 'q');
    assert.equal(move.san, 'Kxb8');
  });

  it('check and mate', function () {
    const game = new Chess();
    game.load('Q1kr3r/p1ppqpp1/1p5p/4P3/8/P2BB3/1P1b1PPP/R4RK1 b - - 1 17');

    assert.isFalse(game.isInCheck('w'));
    assert.isTrue(game.isInCheck('b'));
    assert.isTrue(game.isCheckmate('b'), 'isCheckmate should be true');

    const moves = game.moves();
    assert.equal(moves.length, 0, 'Expected a checkmate');
  });

  it('will checkmate on move', function () {
    const game = new Chess();
    game.load('2kr3r/p1ppqpp1/1p5p/4P3/8/P2BBQ2/1P1b1PPP/R4RK1 w - - 0 17');

    assert.isFalse(game.isInCheck('w'));
    assert.isFalse(game.isInCheck('b'));

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

  it.only('will play SAN moves for each piece', function () {
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
    assert.isTrue(game.isCheckmate('w'));
  });

  it('should check move Rd8+', function () {
    const game = new Chess('3r2kr/ppp4p/8/4b3/P1N4P/2P4b/1P4q1/n2K4 b - - 3 24');
    console.log(game.getAttacks('d1', 'w'));
  });
});