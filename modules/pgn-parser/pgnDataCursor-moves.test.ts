import 'mocha';
import { assert } from 'chai';
import { PgnDataCursor } from './pgnDataCursor';
import { HeaderEntry } from './pgnGame';
import { MoveHistory } from './pgnTypes';

export function movesToString(possible: string[][]): string[] {
  const [set, ...more] = possible;
  if (more.length === 0) { return set; }
  const suffixes = movesToString(more);
  return set.map(prefix => suffixes.map(suffix => `${prefix}${suffix}`))
    .reduce<string[]>((ar, val) => [...ar, ...val], []);
}

describe('PgnDataCursor(Moves)', function () {

  it('parses an abbreviated pawn move', function () {
    const cursor = new PgnDataCursor('ed');
    const move = cursor.readMoveText();
    assert.deepEqual(move, { piece: 'P', from: 'e', to: 'd', raw: 'ed', san: 'ed' });
  });

  it('parses an abbreviated pawn move promotion', function () {
    const cursor = new PgnDataCursor('ed=N');
    const move = cursor.readMoveText();
    assert.deepEqual(move, { piece: 'P', from: 'e', to: 'd', promotion: 'N', raw: 'ed=N', san: 'ed=N' });
  });

  it('parses a king-side castle', function () {
    const cursor = new PgnDataCursor('O-O');
    const move = cursor.readMoveText();
    assert.deepEqual(move, { piece: 'K', to: 'O-O', raw: 'O-O', san: 'O-O' });
  });

  it('parses an queen-side castle', function () {
    const cursor = new PgnDataCursor('O-O-O');
    const move = cursor.readMoveText();
    assert.deepEqual(move, { piece: 'K', to: 'O-O-O', raw: 'O-O-O', san: 'O-O-O' });
  });

  it('parses an move with unknown garbage', function () {
    const cursor = new PgnDataCursor('O-O-O-O');
    const move = cursor.readMoveText();
    assert.deepEqual(move, { piece: 'K', to: 'O-O-O', raw: 'O-O-O-O', unknown: '-O', san: 'O-O-O' });
  });

  it('parses a complex move with garbage', function () {
    const cursor = new PgnDataCursor('Qd4-d8+!!$123perfect');
    const move = cursor.readMoveText();
    assert.deepEqual(move, {
      piece: 'Q',
      from: 'd4',
      capture: false,
      to: 'd8',
      check: '+',
      annotations: '!!',
      nag: '$123',
      unknown: 'perfect',
      raw: 'Qd4-d8+!!$123perfect',
      san: 'Qd4d8+'
    });
  });

  it('parses normal varieties of moves', function () {
    const movePossibles = [
      ['', 'e', 'P4', 'e4', 'e4'], // source square
      ['d', 'd5'], // target square
      ['', '+', '++', '#'], // possible check/mate
      ['', '=Q'/*, '=R', '=N', '=B'*/], // promotions
      ['!!', '!?', '?!', '??', '!', '?'/*, '+/=', '=/+', '+/−', '−/+', '+−', '−+', '='*/], // possible annotations
      ['', '$9', '$254'],
    ];

    const all = movesToString(movePossibles);
    const results = all.map(test => {
      const cursor = new PgnDataCursor(test);
      try {
        const move = { test, ...cursor.readMoveText() as (MoveHistory & { test: string }) };
        return move;
      }
      catch (ex) {
        console.log(`${test}: ${ex.message}`);
        throw ex;
      }
    });

    // The move number is excluded, thus...
    const fail = results.filter(m => m.test !== m.raw);
    if (fail.length) {
      console.log(fail.map(m => m.test));
      assert.fail('One or more tests failed.');
    }
  });

  it('parses LAN and capture varieties of moves', function () {
    const movePossibles = [
      ['e', '4', 'e4', 'e4'], // source square
      ['-', 'x', ':'], // delimiters
      ['d', 'd5'], // target square
      ['', '+', '++', '#'], // possible check/mate
      ['', '=Q'/*, '=R', '=N', '=B'*/], // promotions
      ['!!', '!?', '?!', '??', '!', '?'/*, '+/=', '=/+', '+/−', '−/+', '+−', '−+', '='*/], // possible annotations
      ['', '$9', '$254'],
    ];

    const all = movesToString(movePossibles);
    const results = all.map(test => {
      const cursor = new PgnDataCursor(test);
      const move = { test, ...cursor.readMoveText() as (MoveHistory & { test: string }) };
      return move;
    });

    const fail = results.filter(m => m.test !== m.raw);
    if (fail.length) {
      console.log(fail.map(m => m.test));
      assert.fail('One or more tests failed.');
    }
  });

  it('parses simple tag pair', function () {
    const cursor = new PgnDataCursor('[Header "Value"]');
    const result = cursor.readTagPair() as HeaderEntry;
    assert.isNotNull(result);
    assert.equal(result.name, 'Header');
    assert.equal(result.value, 'Value');
  });

});
