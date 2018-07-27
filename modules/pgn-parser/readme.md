# @chess-fu/pgn-parser

## SYNOPSIS

PGN Specification compliant parser for parsing import or export formatted PGN game data.

## STANDARDS COMPLIANCE

The library can handle some unknown characters in move text; however, it generally asserts that the formatting is loosly valid. This library does not validate legality of the moves as that is expected to be handled by another module.

Specifically this library should be compliant with the following specification sections
- 4.2: Tab characters
- 5: Commentary
- 6: Escape mechanism
- 7: Tokens
- 8.1: Tag pair section
- 8.2.2: Movetext move number indications
- 8.2.2.1: Import format move number indications
- 8.2.3: Movetext SAN (Standard Algebraic Notation)
  - The library will also accept LAN (e4-d5) or abbrieviated SAN (ed)
- 8.2.3.1: Square identification
- 8.2.3.2: Piece identification
- 8.2.3.3: Basic SAN move construction
- 8.2.3.4: Disambiguation
- 8.2.3.5: Check and checkmate indication characters
  - The library will also allow `++` to indicate a checkmate
- 8.2.3.8: SAN move suffix annotations
- 8.2.4: Movetext NAG (Numeric Annotation Glyph)
- 8.2.5: Movetext RAV (Recursive Annotation Variation)
- 8.2.6: Game Termination Markers

## INSTALL

```
npm install --save @chess-fu/pgn-parser
```
Not much else to it.

## USAGE

Basic Usage:
```Javascript
  function () {
    const parser = new PgnParser();
    const [game] = parser.parse(`
    [Event "21st European Teams"]
    [Site "Hersonissos GRE"]
    [Date "2017.10.29"]
    [Round "2.9"]
    [White "Adams,Mi"]
    [Black "Tari,A"]
    [Result "1/2-1/2"]
    [ECO "B11"]
    
    1.e4 c6 2.Nf3 d5 3.Nc3 Bg4 4.h3 Bxf3 5.Qxf3 e6 6.g3 Nf6 7.Bg2 Bc5 8.O-O Nbd7
    9.d3 O-O 10.Qe2 Bd4 11.Nd1 dxe4 12.dxe4 Qc7 13.c3 Bc5 14.Ne3 a5 15.Kh2 Rfe8
    16.a4 Bf8 17.Nc4 Nc5 18.Bg5 h6 19.Bxf6 gxf6 20.Qg4+ Bg7 21.Qh5 Nxa4 22.Rxa4 b5
    23.Rxa5 Rxa5 24.Nxa5 Qxa5 25.Qc5 Qc7 26.Ra1 Bf8 27.Qd4 Qd8 28.Qe3 Qd6 29.Qf3 Qe5
    30.h4 Rd8 31.Ra6 Rc8 32.Ra7 Qb8 33.Ra6 Be7 34.Qe3 Kg7 35.Bf3 Qe5 36.Kg2 b4
    37.Be2 bxc3 38.bxc3 Bc5 39.Qd3 Qd6 40.Qxd6 Bxd6 41.f4 Bc5 42.Kf3 Kf8 43.Bc4 Bg1
    44.Ra2 Rb8 45.Ra6 Rc8 46.Ra1 1/2-1/2
    `);
    assert.isObject(game);
    assert.equal(game.headers.length, 10);
    assert.equal(game.history.length, 92);
    assert.equal(game.history[91].result, '1/2-1/2');
  }
```
### `interface HeaderEntry`

- `name: string` The TAG token
- `value: string` The quoted string as an unescaped string value
- `comments: string[]` Comments encountered 

### `class MoveHistory`

- `number: number` The move indicator if one preceded this move 
- `raw: string` The plain-text of the move that was parsed 
- `san: string` The normalized SAN without annotations 
- `from: string` The originating file, rank or both 
- `to: string` The target file, rank, both, or castle 
- `piece: string` The piece that was moved 
- `nag: string` The NAG string, $ followed by a number 
- `rav: MoveHistory[]` The RAV alternative play 
- `check: string` The move check or mate indicator 
- `captured: boolean` True if this was a capture 
- `promotion: string` Promotion type: Q, R, N, or B 
- `annotations: string` Annotations like !, ?, !?, etc 
- `comments: string[]` Comments encountered 
- `result: string` A game result, 1-0, 0-1, 1/2-1/2, or "*"
- `unknown: string` Other non-delimiter characters following the parsed move 

### `class PgnGame`

- `readonly headers: HeaderEntry[]` Returns the structured content found in the headers/tag-pairs.
- `readonly history: MoveHistory[]` Returns the structured move text context.
- `headersMap(): { [key: string]: string }` Returns a key-value map of headers as an object.
- `moves(): MoveHistory[]` Returns the move history excluding any non-move entries.

### `class PgnParser`

- `parse(data: string): PgnGame[]` The main parse API to parse one or more games from text.

**Note:** There are other classes and members available; however, they are not deemed part of the API. Direct use of classes/members not listed above is not recommended.

## LINKS

- Source: https://github.com/chess-fu/chess-modules
- PGN General: https://en.wikipedia.org/wiki/Portable_Game_Notation
- PGN Speccification: https://raw.githubusercontent.com/chess-fu/chess-modules/master/docs/PGN-Standard.txt
