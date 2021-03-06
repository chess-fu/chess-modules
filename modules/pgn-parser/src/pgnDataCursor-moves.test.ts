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
import { PgnDataCursor } from './pgnDataCursor';
import { MoveHistory, HeaderEntry } from './pgnTypes';

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

  it('parses an move with unknown garbage', function () {
    const cursor = new PgnDataCursor('a4#asdf+/\\$!@#$%^+_asdf');
    const move = cursor.readMoveText();
    assert.deepEqual(move, {
      piece: 'P',
      to: 'a4',
      check: '#',
      unknown: 'asdf+/\\$!@#$%^+_asdf',
      raw: 'a4#asdf+/\\$!@#$%^+_asdf',
      san: 'a4#'
    });
  });

  it('parses a complex move with garbage', function () {
    const cursor = new PgnDataCursor('Qd4-d8+!!$123perfect');
    const move = cursor.readMoveText();
    assert.deepEqual(move, {
      piece: 'Q',
      from: 'd4',
      captured: false,
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
        console.info(`${test}: ${ex.message}`);
        throw ex;
      }
    });

    // The move number is excluded, thus...
    const fail = results.filter(m => m.test !== m.raw);
    if (fail.length) {
      console.info(fail.map(m => m.test));
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
      console.info(fail.map(m => m.test));
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

  it('throws on invalid move', function () {
    const cursor = new PgnDataCursor('M4!! e4');
    assert.throws(() => cursor.readMoveText(), 'Invalid move');
  });

  it('throws on invalid move', function () {
    const cursor = new PgnDataCursor('j4!! e4');
    assert.throws(() => cursor.readMoveText(), 'Invalid move');
  });

  it('May return partial moves', function () {
    const cursor = new PgnDataCursor('e9# e4');
    const move = cursor.readMoveText();
    assert.deepEqual(move, { piece: 'P', to: 'e', unknown: '9#', raw: 'e9#', san: 'e' });
  });

  it('throws on invalid move promotion', function () {
    const cursor = new PgnDataCursor('Qe4=B'); // cannot promote from a queen
    assert.throws(() => cursor.readMoveText(), 'Invalid promotion');
  });

  it('throws on invalid promotion', function () {
    const cursor = new PgnDataCursor('Pe4=K'); // cannot promote to a king :(
    assert.throws(() => cursor.readMoveText(), 'Invalid promotion');
  });

  it('throws on multiple annotations', function () {
    const cursor = new PgnDataCursor('Pe4!!$2!!');
    assert.throws(() => cursor.readMoveText(), 'multiple annotations');
  });

  it('throws on multiple check flags', function () {
    const cursor = new PgnDataCursor('e4+#');
    assert.throws(() => cursor.readMoveText(), 'multiple check flags');
  });

  it('throws on multiple NAG annotations', function () {
    const cursor = new PgnDataCursor('e4+$1$23');
    assert.throws(() => cursor.readMoveText(), 'multiple annotations');
  });

  it('throws on bad NAG annotations', function () {
    const cursor = new PgnDataCursor('e4+$a');
    assert.throws(() => cursor.readMoveText(), 'Invalid NAG supplied');
  });

  it('ignores e.p. capture note', function () {
    const cursor = new PgnDataCursor('exde.p.');
    assert.deepEqual(cursor.readMoveText(), {
      piece: 'P',
      from: 'e',
      captured: true,
      to: 'd',
      raw: 'exde.p.',
      san: 'exd'
    });
  });
});
