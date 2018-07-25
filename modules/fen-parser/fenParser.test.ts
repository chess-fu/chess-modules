import 'mocha';
import { assert } from 'chai';
import { FenParser } from './fenParser';

const defaultFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('FenParser', function () {

  it('isFen return true for default position', function () {
    assert.isTrue(FenParser.isFen(defaultFEN));
  });

  it('isFen return true for empty position', function () {
    assert.isTrue(FenParser.isFen('8/8/8/8/8/8/8/8 w - - 0 1'));
  });

  it('isFen return false for empty string', function () {
    assert.isFalse(FenParser.isFen(''));
  });

  it('isFen return false for null', function () {
    assert.isFalse(FenParser.isFen(null as any));
  });

  it('FenParser will construct with null', function () {
    assert.equal(new FenParser(null as any).isValid, false);
  });

  it('FenParser will construct with garbage', function () {
    assert.equal(new FenParser({} as any).isValid, false);
  });

  it('parses default position', function () {
    const fen = new FenParser(defaultFEN);
    assert(fen.isValid, 'default position is valid: ' + fen.isValid);
    assert.equal(fen.positions, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    assert.equal(fen.ranks[0], 'rnbqkbnr');
    assert.equal(fen.ranks[1], 'pppppppp');
    assert.equal(fen.ranks[2], '--------');
    assert.equal(fen.ranks[3], '--------');
    assert.equal(fen.ranks[4], '--------');
    assert.equal(fen.ranks[5], '--------');
    assert.equal(fen.ranks[6], 'PPPPPPPP');
    assert.equal(fen.ranks[7], 'RNBQKBNR');
    assert.equal(fen.turn, 'w');
    assert.equal(fen.castles, 'KQkq');
    assert.equal(fen.enpass, '-');
    assert.equal(fen.halfmoveClock, 0);
    assert.equal(fen.moveNumber, 1);
  });

  it('parses default position and yields the same', function () {
    const fen = new FenParser(defaultFEN);
    assert.equal(fen.toString(), defaultFEN, 'Expected the same FEN result');
  });

  it('finds the kings', function () {
    const fen = new FenParser(defaultFEN);
    assert(fen.hasPiece('K'), 'No white king');
    assert(fen.hasPiece('k'), 'No black king');
  });

  it('counts the pieces correctly', function () {
    const fen = new FenParser(defaultFEN);
    const counts = fen.counts();
    assert.equal(counts.K, 1);
    assert.equal(counts.Q, 1);
    assert.equal(counts.B, 2);
    assert.equal(counts.N, 2);
    assert.equal(counts.R, 2);
    assert.equal(counts.P, 8);
    assert.equal(counts.k, 1);
    assert.equal(counts.q, 1);
    assert.equal(counts.b, 2);
    assert.equal(counts.n, 2);
    assert.equal(counts.r, 2);
    assert.equal(counts.p, 8);
  });

  it('parses empty position', function () {
    const fen = new FenParser('8/8/8/8/8/8/8/8 w - - 0 1');
    assert(fen.isValid, 'empty position is valid: ' + fen.isValid);
    assert.equal(fen.positions, '8/8/8/8/8/8/8/8');
    assert.equal(fen.ranks[0], '--------');
    assert.equal(fen.ranks[1], '--------');
    assert.equal(fen.ranks[2], '--------');
    assert.equal(fen.ranks[3], '--------');
    assert.equal(fen.ranks[4], '--------');
    assert.equal(fen.ranks[5], '--------');
    assert.equal(fen.ranks[6], '--------');
    assert.equal(fen.ranks[7], '--------');
    assert.equal(fen.turn, 'w');
    assert.equal(fen.castles, '-');
    assert.equal(fen.enpass, '-');
    assert.equal(fen.halfmoveClock, 0);
    assert.equal(fen.moveNumber, 1);
    assert.equal(fen.toString(), '8/8/8/8/8/8/8/8 w - - 0 1');
    assert(!fen.hasPiece('K'), 'white king');
    assert(!fen.hasPiece('k'), 'black king');
    assert.equal(Object.keys(fen.counts()).length, 0, 'Has no pieces');
  });

  it('parses a Chess960 FEN', function () {
    const fen = new FenParser('nqnbrkbr/pppppppp/8/8/8/8/PPPPPPPP/NQNBRKBR w HEhe - 0 0');
    assert.isTrue(fen.isValid, 'Valid 960 FEN was invalid.');
    assert.equal(fen.castles, 'HEhe');
  });

  it('parses a FEN when missing enpass and turn 0', function () {
    const fen = new FenParser('nqnbrkbr/pppppppp/8/8/8/8/PPPPPPPP/NQNBRKBR w KQkq 0 0');
    assert.isTrue(fen.isValid, 'enpass can be missing if turn 0.');
    assert.equal(fen.castles, 'KQkq');
    assert.equal(fen.enpass, '-');
    assert.equal(fen.halfmoveClock, 0);
    assert.equal(fen.moveNumber, 1);
  });

  describe('parsing', function () {
    //#region Test FEN values
    const tests = {
      '': false,
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR   w    KQkq    -    0 1': true,
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1': true,
      '8/PPP4k/8/8/8/8/4Kppp/8 w - - 0 1': true,
      '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1': true,
      'rnbqkbnr/p3pppp/2p5/1pPp4/3P4/8/PP2PPPP/RNBQKBNR w KQkq b6 0 4': true,
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': true,
      'rnbqk1nr/pppp1ppp/4p3/8/1b1P4/2N5/PPP1PPPP/R1BQKBNR w KQkq - 2 3': true,
      '8/k7/8/8/8/8/7p/K7 b - - 0 1': true,
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN w KQkq - 0 1': false, // incomplete
      'rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': false, // bad digit: 9
      '1nbqkbn1/pppp1ppX/8/4p3/4P3/8/PPPP1PPP/1NBQKBN1 b - - 1 2': false, // bad piece: X
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNRw KQkq - 0 1': false, // missing space
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 x': false, // not a move number
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 O': false, // letter O, not Zero
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 -1': false, // negative
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - x 1': false, // non-numeric
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1': false, // negative
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e2 0 1': false, // invalid enpass
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e7 0 1': false, // invalid enpass
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq x 0 1': false, // invalid enpass
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQxkq - 0 1': false, // invalid castle
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ? KQkq - 0 1': false, // invalid turn
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1': false, // missing segment
      'rnbqkbnr/pppppppp/17/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': false, // 17 should be 8
      'rnbqk?nr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': false, // ? not allowed
      'rnbqkbnr/pppppppp/7/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': false, // incomplete
      'rnbqkbnr/p1p1p1p1p/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': false, // too many 
      '3q1rk1/1b1rbp1p/p2p1np1/1p2pP2/3BP3/P1NB3Q/1PP3PP/4RR1K w - - 0 19': true,
      'r2r2k1/5pp1/p1p2q2/PpP1p3/1PnbP2p/5R2/2Q1BPPP/2B2RK1 b - - 3 27': true,
      'rnbq1rk1/ppp1ppbp/5np1/3p4/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ - 1 6': true,
      '8/4P1bp/pk6/1p6/4r3/1P2n3/r5PP/2R4K w - - 0 33': true,
      'r1bq1b1r/ppp3pp/4k3/3np3/1nB5/2N2Q2/PPPP1PPP/R1B1K2R w KQ - 4 9': true,
      '2bkQb1r/p1rnn2p/1p3N2/1P6/3R2R1/3P4/PP5P/5K2 b - - 5 30': true,
      'r1q1r1k1/1p1n1ppB/p2b4/2pn4/8/7P/PPQ2BP1/3R1RK1 b - - 0 25': true,
      '8/p2Q4/2P3kp/5p2/4b3/1P2P3/r6q/3K1R2 w - - 0 39': true,
      '7Q/6R1/4B3/7k/4N3/8/6PP/6K1 b - - 2 68': true,
      '8/2kP4/4K3/8/8/1p6/8/8 b - - 211 5932': true,
      '8/2kP4/4K3/8/8/1p6/8/8 b - - 2112 1': false, // too many digits in half-move
    };
    //#endregion

    Object.keys(tests).forEach(
      fen => {
        it(fen, function () { assert.equal(new FenParser(fen).isValid, tests[fen]); });
      }
    );
  });
});