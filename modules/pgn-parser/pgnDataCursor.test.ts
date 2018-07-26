import 'mocha';
import { assert } from 'chai';
import { PgnDataCursor, PgnTokenType } from './pgnDataCursor';
import { HeaderEntry } from './pgnGame';

describe('PgnDataCursor', function () {

  it('constructs empty', function () {
    const cursor = new PgnDataCursor(undefined as any);
    assert.equal(cursor.peekToken(), PgnTokenType.EndOfFile);
  });

  it('parses simple tag pair', function () {
    const cursor = new PgnDataCursor('[Header "Value"]');
    const result = cursor.readTagPair() as HeaderEntry;
    assert.isNotNull(result);
    assert.equal(result.name, 'Header');
    assert.equal(result.value, 'Value');
  });

  it('parses tag pair no-space', function () {
    const cursor = new PgnDataCursor('[Header"Value"]');
    const result = cursor.readTagPair() as HeaderEntry;
    assert.isNotNull(result);
    assert.equal(result.name, 'Header');
    assert.equal(result.value, 'Value');
  });

  it('parses tag pair extra-space', function () {
    const cursor = new PgnDataCursor('[  Header  \t\v  "Value" ] ');
    const result = cursor.readTagPair() as HeaderEntry;
    assert.isNotNull(result);
    assert.equal(result.name, 'Header');
    assert.equal(result.value, 'Value');
  });

  it('parses tag pair embedded quote', function () {
    const cursor = new PgnDataCursor('[  Header  \t\v  "\\"Value\\""] ');
    const result = cursor.readTagPair() as HeaderEntry;
    assert.isNotNull(result);
    assert.equal(result.name, 'Header');
    assert.equal(result.value, '"Value"');
  });

  it('parses tag pair escaped backslash', function () {
    const cursor = new PgnDataCursor('[  Header  \t\v  "Value\\\\2"] ');
    const result = cursor.readTagPair() as HeaderEntry;
    assert.isNotNull(result);
    assert.equal(result.name, 'Header');
    assert.equal(result.value, 'Value\\2');
  });

  it('must close tag pair on same line', function () {
    const cursor = new PgnDataCursor('[  Header  \t\v  "Value"');
    assert.throws(() => cursor.readTagPair(), 'not closed');
  });

  it('tag pair on a new line', function () {
    const cursor = new PgnDataCursor('[Header\n"Value"]');
    const result = cursor.readTagPair() as HeaderEntry;
    assert.isNotNull(result);
    assert.equal(result.name, 'Header');
    assert.equal(result.value, 'Value');
  });

  it('Why is this bs allowed', function () {
    const cursor = new PgnDataCursor(`[;< opens the header
% < This is an escape on line-pos=0
{here is the "name" =}Header{odd; I know}
<This is for expansion??? someday .... maybe.>"Value"
]`);
    const result = cursor.readTagPair() as HeaderEntry;
    assert.isNotNull(result);
    assert.equal(result.name, 'Header');
    assert.equal(result.value, 'Value');
  });

  it('tag pair must have valid name', function () {
    const cursor = new PgnDataCursor('[*foo-bar "Value"]');
    assert.throws(() => cursor.readTagPair(), 'Expected a symbol start');
  });

  it('tag pair must use alpha-num or _', function () {
    const cursor = new PgnDataCursor('[foo-bar "Value"]');
    assert.throws(() => cursor.readTagPair(), 'Expected a quoted string');
  });

  it('tag pair must have 2 parts', function () {
    const cursor = new PgnDataCursor('[foobar]');
    assert.throws(() => cursor.readTagPair(), 'Expected a quoted string');
  });

  it('tag pair symbol is not quoted', function () {
    const cursor = new PgnDataCursor('["foo" "bar"]');
    assert.throws(() => cursor.readTagPair(), 'Expected a symbol start');
  });

  it('quote is on same line', function () {
    const cursor = new PgnDataCursor('[Header "Value\n"]');
    assert.throws(() => cursor.readTagPair(), 'String contains new line');
  });

  it('quote is unterminated', function () {
    const cursor = new PgnDataCursor('[Header "Valu');
    assert.throws(() => cursor.readTagPair(), 'Unterminated string');
  });

  it('throws on unterminated comment', function () {
    const cursor = new PgnDataCursor(' { This is messed up!');
    assert.throws(() => cursor.skipWhitespace(), 'Unterminated comment');
  });

  it('throws on unterminated expansion', function () {
    const cursor = new PgnDataCursor(' < This is also messed up!');
    assert.throws(() => cursor.skipWhitespace(), 'Unterminated expansion');
  });

  it('throws on read tag from bad start', function () {
    const cursor = new PgnDataCursor(' [a"B"]');
    assert.throws(() => cursor.readTagPair(), 'Expected a tag-pair open');
  });
});
