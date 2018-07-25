# @chess-fu/fen-parser

## SYNOPSIS

This is a small lightweight chess FEN parser based largely on regex. It unpacks the FEN into discrete properties which can be modified and then turned back into a new FEN via the `toString` method.

## VALIDATION

The following aspects of the FEN are validated:

- The FEN must acurately represents an 8x8 board.
- The pieces must be in the standard `prnbqk` set.
- The player field is either set to `'w'` or `'b'`.
- The castle grants may be none (`'-'`) or contain `'k'` or `'q'` or any file `'abcdefgh'` for Chess960 support.
- The en passant must be none (`'-'`) or an `'abcdefgh'` file, followed by either `3` or `6` for rank.
- The half-move clock must be 1 to 3 digits long.
- The move number must be 1 to 4 digits long.

Due to some irregular FENs in use, the addition case of a missing en passant code followed by `0 0` will be allowed. In this case the FenParser will report as if the ending was `- 0 1` and the `toString` method will reflect that change. Thank you chess.com for that :D

## INSTALL

```
npm install --save @chess-fu/fen-parser
```
Not much else to it.

## USAGE

Basic usage:
```Javascript
  function () {
    assert.isTrue(FenParser.isFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
    assert.isFalse(FenParser.isFen('xxxxx/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
    const fen = new FenParser('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    assert.isTrue(fen.isValid);
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
    assert.equal(fen.toString(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }
```

### Members
  `static isFen(string): boolean`  Returns true if the the parts of the FEN appear valid at a glance. Use the `isValid` member to verify run-length encoding.
  
  `get isValid: boolean` Returns true if the FEN provided to the constructor was validated and represented the full 8x8 board.
  
  `get positions: string` Gets the encoded version of the ranks, use the ranks property to modify.
  
  `ranks: string[]` Gets or sets the unencoded rank & file position of pieces using a dash `'-'` for an empty square.
  
  `turn: 'w' | 'b'` Gets or sets the color of the player who should make the next move.
  
  `castles: string` Gets or sets the valid sides (`kqKQ`) or files (`abcdefghABCDEFGH`) valid for castling.
  
  `enpass: string` Gets or sets the currently possible en passant square in file+rank notation, or `-` for none.
  
  `halfmoveClock: number` Gets or sets the number of halfmoves since the last capture or pawn advance. 
  
  `moveNumber: number` Gets or sets the number of the full move. It starts at 1, and is incremented after Black's move.

  `toString(): string` Returns the re-assembled FEN string.
  
  `hasPiece(string): boolean` Return true if the piece (character) is found on the board.
  
  `counts(): map(string -> number)` Returns a map object for each piece type found to the number of occurrences.

## LINKS

- Source: https://github.com/chess-fu/chess-modules
- FEN: https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
- X-FEN: https://en.wikipedia.org/wiki/X-FEN
