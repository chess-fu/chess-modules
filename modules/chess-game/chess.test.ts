import 'mocha';
import { assert } from 'chai';
import { Chess } from './chess';

describe('chess', function () {
  describe('constructs with no args', function () {
    const game = new Chess();
    assert(game, 'Should be a value');
    assert(typeof game === 'object', 'Should be an object');
  });
});