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

## LINKS

- Source: https://github.com/chess-fu/chess-modules
