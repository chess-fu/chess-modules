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
import FenParser from '@chess-fu/fen-parser';
import PgnParser from '@chess-fu/pgn-parser';
import { Move, MoveOptions, Offset, Color, GameResult } from './chessTypes';
import { MoveTable, MoveCriteria } from './chessMoves';

import {
  WHITE, BLACK,
  NONE, PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING, WKING, BKING,
  BOARD_WIDTH, BOARD_HEIGHT, BOARD_SIZE,
  SLASH, PLUS, HASH, START_FEN,
  WHITE_WINS, BLACK_WINS, DRAW, ONGOING,
  CASTLE_KING_OFFSETX, CASTLE_QUEEN_OFFSETX,
  STANDARD_PGN_HEADERS
} from './constants';

import {
  buildSAN, isPieceColor, offsetToIndex, indexToOffset, indexToSquare, offsetValid, deltaOffsets, addOffsets, squareColor
} from './chessUtils';

type MoveData = Move & Offset & {
  restoreFEN?: string;
};

type MoveOptionsINT = MoveOptions & {
  squareIx: number,
  exists?: boolean;
  simple?: boolean;
  captures?: boolean;
};

const lowerA = 'a';
const lowerACode = 'a'.charCodeAt(0);
const letter0Code = '0'.charCodeAt(0);

const INDEXES: { [key: string]: number } = {};

const STRING = 'string';

const EMPTY_STRING = '';
const EMPTY_ARRAY: any[] = Object.freeze<any[]>([]) as any[];
const EMPTY_BOARD = () => { const r = new Array<string>(BOARD_SIZE); for (let i = 0; i < BOARD_SIZE; i++) r[i] = NONE; return r; };

const PATTERN_FEN_DASH = /\-+/g;
const PATTERN_PROMOTE_RNB = /=[RNB]/;
const PATTERN_PROMOTE_TYPE = /=([QRNB])/;
const PATTERN_ANNOTATION = /(([\!\?]+)|$\d{1,3})+$/;
const PATTERN_LOWER_CASE = /[a-z]/g;
const PATTERN_UPPER_CASE = /[A-Z]/g;
const PATTERN_PGN_QUOTED = /"|\\\\/g;

const PIECE_TYPES = 'kqbnrp'.split(EMPTY_STRING);
const PROMOTIONS = 'qrnb'.split(EMPTY_STRING);
const PIECES: { [key: string]: string } = {};
const COLORPIECES: { [key: string]: string } = {};


/** global initializer: build static map tables... */
(function initializer() {
  // FEN ORDER: a8 ... h1 = 64
  for (let rank = 0; rank < BOARD_WIDTH; rank++) {
    for (let file = 0; file < BOARD_WIDTH; file++) {
      INDEXES[`${String.fromCharCode(lowerACode + file)}${rank + 1}`] = file + (((BOARD_HEIGHT - 1) - rank) * BOARD_WIDTH);
    }
  }

  for (const piece of PIECE_TYPES) {
    PIECES[WHITE + piece] = piece.toUpperCase();
    PIECES[BLACK + piece] = piece.toLowerCase();
    PIECES[piece.toUpperCase()] = piece.toUpperCase();
    PIECES[piece.toLowerCase()] = piece.toLowerCase();
    COLORPIECES[piece.toUpperCase()] = WHITE + piece;
    COLORPIECES[piece.toLowerCase()] = BLACK + piece;
  }
})();

export class ChessGame {
  private _headers: { [key: string]: string };
  private _history: MoveData[];
  private _board: string[];

  private _turn: Color;
  private _enpass: number;
  private _halfmoveClock: number;
  private _moveNumber: number;
  private _whiteKing: number;
  private _blackKing: number;
  private _castles: string;

  private _cacheValid: boolean;
  private _gameResult: GameResult;
  private _checked: boolean;
  private _noValidMoves: boolean;

  constructor(fen?: string) {
    if (fen) {
      this.load(fen);
    }
    else {
      this.init();
    }
  }

  private init() {
    this._headers = {};
    this._history = [];
    this._board = EMPTY_BOARD();
    this._turn = WHITE;
    this._enpass = -1;
    this._halfmoveClock = 0;
    this._moveNumber = 1;
    this._whiteKing = this._blackKing = -1;
    this._castles = EMPTY_STRING;
    this._cacheValid = false;
    this._gameResult = ONGOING;
  }

  load(fen?: string) {
    this.init();

    fen = fen || START_FEN;
    this.restoreFen(fen);

    if (fen !== START_FEN) {
      this._headers.SetUp = '1';
      this._headers.FEN = fen;
    }
  }

  loadPgn(pgnGame: string) {
    const [game] = new PgnParser().parse(pgnGame);
    if (!game) { throw new Error('No PGN game data found.'); }

    let startFEN = START_FEN;
    const headers = game.headersMap();

    // While PGN standard claims 'SetUp' = '1' is required, it's not always observed in practice.
    if (headers.FEN && FenParser.isFen(headers.FEN)) {
      startFEN = headers.FEN;
    }

    let moveNumber = this._moveNumber;
    this.load(startFEN);
    const moves = game.moves();
    for (let ix = 0; ix < moves.length; ix++) {
      const move = moves[ix];
      moveNumber = move.number || moveNumber;
      if (!move.san) continue;
      try {
        this.move(move.san);
      }
      catch (ex) {
        console.error(`Unable to restore game at move ${moveNumber} SAN = ${move.san}.\nFEN = ${this.fen()}`);
        throw new Error(`Invalid PGN move ${this._moveNumber}. ${this._turn === WHITE ? '' : '... '}${move.san}`);
      }
    }
  }

  private restoreFen(fen: string) {
    const data = new FenParser(fen || START_FEN);
    const board = data.ranks.join(EMPTY_STRING).split(EMPTY_STRING);
    if (board.length !== BOARD_SIZE) {
      throw new Error(`Invalid FEN, size expected ${BOARD_SIZE} found ${board.length}`);
    }
    this._board = [...board];
    this._whiteKing = board.indexOf(WKING);
    this._blackKing = board.indexOf(BKING);

    this._castles = data.castles;
    this._halfmoveClock = data.halfmoveClock;
    this._moveNumber = data.moveNumber;
    this._enpass = (data.enpass in INDEXES) ? INDEXES[data.enpass] : -1;
    this._turn = data.turn === BLACK ? BLACK : WHITE;
    this.updated();
  }

  toString() { return this.fen(); }
  fen() {
    const ranks: string[] = [];
    const bstring = this._board.map(p => p || NONE).join(EMPTY_STRING);
    for (let file = BOARD_HEIGHT; file > 0; file--) {
      const index = INDEXES[lowerA + file.toString()];
      ranks.push(bstring.substr(index, BOARD_WIDTH));
    }
    return ranks.join(SLASH).replace(PATTERN_FEN_DASH, m => m.length.toString()) +
      ` ${this._turn} ${this._castles || NONE} ${indexToSquare(this._enpass)} ${this._halfmoveClock} ${this._moveNumber}`;
  }

  pgn(options?: { newline_char: string, max_width: number }) {
    const newline = (options || {} as any).newline_char || '\n';
    const width = (options || {} as any).max_width || 80;
    if (!this._headers.Result) {
      this._headers.Result = this._gameResult;
    }
    const pgn: string[] = [];
    const headers = { ...this._headers };
    pgn.push(...this.pgnHeaders(STANDARD_PGN_HEADERS, headers));
    pgn.push(...this.pgnHeaders(Object.keys(headers), headers));
    pgn.push();
    const { turn, moveNumber } = new FenParser(this._headers.FEN || START_FEN);
    const history = this._history;
    let moveCounter = Math.max(1, moveNumber);
    let line = '';
    for (let ix = 0; ix < history.length; ix++) {

      const moveNum = `${(moveCounter++)}.`;
      let white = history[ix].san;
      if (ix === 0 && turn === 'b') {
        white = '...';
      } else {
        ix++;
      }
      const black = ix < history.length ? history[ix].san : null;
      const reqLen = 1 + moveNum.length + 1 + white.length + 1 + (black ? (black.length + 1) : 0);

      if (line.length && (line.length + reqLen) >= width) {
        pgn.push(line);
        line = '';
      }

      line += `${line.length ? ' ' : ''}${moveNum} ${white}${black ? ` ${black}` : ''}`;
    }
    if (line.length) {
      pgn.push(line);
    }
    pgn.push(this._headers.Result);
    return pgn.join(newline);
  }

  pgnHeaders(keys: string[], headers: any): string[] {
    return keys
      .filter(key => headers.hasOwnProperty(key) && headers[key] !== null && headers[key] !== undefined)
      .map(key => {
        const value = `${headers[key]}`.replace(PATTERN_PGN_QUOTED, m => '\\' + m[0]);
        headers[key] = undefined;
        return `[${key} "${value}"]`;
      });
  }

  squares(): string[] {
    return Object.keys(INDEXES);
  }

  turn(): Color {
    return this._turn;
  }

  header(...tagPairs: string[]): { [key: string]: string } {
    for (let i = 0; i < (tagPairs.length - 1); i += 2) {
      if (typeof tagPairs[i] === STRING &&
        typeof tagPairs[i + 1] === STRING) {
        this._headers[tagPairs[i]] = tagPairs[i + 1];
      }
    }
    return { ...this._headers, Result: this._gameResult };
  }

  history(options?: any): Move[] {
    return this._history.map<Move>(moveData => {
      const { restoreFEN, x, y, ...move } = moveData;
      return move as Move;
    });
  }

  get(square: string): string | null {
    if (!(square in INDEXES)) {
      throw new Error(`Invalid square identifier: "${square}"`);
    }

    const piece = this._board[INDEXES[square]];
    if (!piece || !(piece in COLORPIECES)) {
      return null;
    }

    return COLORPIECES[piece];
  }

  set(square: string, piece?: string) {
    if (!piece) {
      return this.remove(square);
    }

    if (!(square in INDEXES)) {
      throw new Error(`Invalid square identifier: "${square}"`);
    }
    if (!(piece in PIECES)) {
      throw new Error(`Invalid piece identifier: "${piece}"`);
    }

    const offset = INDEXES[square];
    piece = PIECES[piece];

    this._board[offset] = PIECES[piece];
    if (piece === WKING) {
      this._whiteKing = offset;
    }
    if (piece === BKING) {
      this._blackKing = offset;
    }
    this.updated();
  }

  remove(square: string) {
    if (!(square in INDEXES)) {
      throw new Error(`Invalid square identifier: "${square}"`);
    }
    const offset = INDEXES[square];
    this._board[offset] = NONE;
    this._whiteKing = this._whiteKing !== offset ? this._whiteKing : -1;
    this._blackKing = this._blackKing !== offset ? this._blackKing : -1;
    this.updated();
  }

  private updated() {
    this._gameResult = ONGOING;
    this._cacheValid = false;
  }

  private updateCachedState() {
    if (this._cacheValid !== true) {
      this._cacheValid = true;
      this._checked = this.testForCheck(this._turn);
      this._noValidMoves = !this.hasValidMoves(this._turn);

      if (this.isAutomaticDraw()) {
        this._gameResult = DRAW; // Insufficient Material = Forced draw
      }
      else {
        if (this._noValidMoves) {
          if (this._checked) {
            this._gameResult = this._turn === WHITE ? BLACK_WINS : WHITE_WINS;
          }
          else {
            this._gameResult = DRAW; // Stalemate = Forced draw
          }
        }
      }
    }
  }

  undo(): Move | undefined {
    const move = this._history.pop();
    if (!move) return;
    if (!move.restoreFEN) throw new Error('History entry is missing restore point.');
    this.restoreFen(move.restoreFEN);
    return move;
  }

  move(move: Move | string): Move {
    this.assertOngoing();
    if (typeof move === STRING) {
      return this.moveToSAN(move as string);
    }
    move = move as Move;
    if (move.from && move.to) {
      return this.performMove(move, true);
    }
    else if (move.san) {
      return this.moveToSAN(move.san);
    }
    else {
      throw new Error('Move is not valid.');
    }
  }


  private moveToSAN(san: string) {
    const movesValid = this.moves({ color: this._turn });
    const sanMove = new PgnParser().parseMove(san) || {};
    const found = movesValid
      .filter(m => (
        sanMove.san === m.san || (
          sanMove.to === m.to &&
          (sanMove.piece || '').toLowerCase() === m.piece.toLowerCase() &&
          (!sanMove.from || m.from.indexOf(sanMove.from.toLowerCase()) >= 0) &&
          m.color === this._turn
        )
      ));
    if (found.length !== 1) {
      console.warn(`Can not find move ${san} in ${movesValid.map(m => m.san).join(',')}`);
      throw new Error(`The SAN ${san} is not valid.`);
    }
    const [move] = found;
    if (move.promotion && sanMove.promotion) {
      move.promotion = sanMove.promotion.toLowerCase();
    }
    return this.performMove(move, false);
  }

  private performMove(move: Move, validate: boolean): Move {
    if (validate) {
      const movesValid = this.moves({ square: move.from, color: this._turn })
        .filter(m => m.from === move.from && m.to === move.to && m.color === this._turn);
      if (movesValid.length !== 1) {
        throw new Error(`Move from ${move.from} to ${move.to} is not valid.`);
      }
      move = { ...movesValid[0], promotion: move.promotion || movesValid[0].promotion } as Move;
    }

    if (!(move.from in INDEXES) || !(move.to in INDEXES)) {
      throw new Error(`Invalid move ${move.from} ${move.to} (off table).`);
    }

    // Pre-validate the promotion piece
    let { promotion } = move;
    if (move.piece === PAWN && promotion) {
      promotion = typeof promotion === STRING ? promotion.toLowerCase() : NONE;
      if (PROMOTIONS.indexOf(promotion) < 0) {
        throw new Error(`Invalid promotion piece "${move.promotion}".`);
      }
      promotion = move.promotion = this._turn === WHITE ? promotion.toUpperCase() : promotion;
    }

    const moveData = { ...move, restoreFEN: this.fen() } as MoveData;
    const sourceIndex = INDEXES[move.from];
    const sourceOffset = indexToOffset(sourceIndex);
    const targetIndex = INDEXES[move.to];
    const targetOffset = indexToOffset(targetIndex);
    const movingPiece = this._board[sourceIndex];

    // Remove the enpass capture
    if (move.piece === PAWN && move.captured === PAWN && move.enpass) {
      const killSquare = {
        y: targetOffset.y > sourceOffset.y ? targetOffset.y - 1 : targetOffset.y + 1,
        x: targetOffset.x
      };
      const killIndex = offsetToIndex(killSquare);
      const pieceRemoved = this._board[killIndex];
      if (COLORPIECES[pieceRemoved] !== `${this._turn === WHITE ? BLACK : WHITE}${PAWN}`) {
        throw new Error(`Invalid enpass capture ${COLORPIECES[pieceRemoved]} at ${indexToSquare(offsetToIndex(killSquare))}.`);
      }
      this._board[killIndex] = NONE;
    }

    // Move the piece
    this._board[sourceIndex] = NONE;
    this._board[targetIndex] = movingPiece;
    if (move.piece === PAWN && promotion) {
      this._board[targetIndex] = promotion;
    }
    if (move.piece === KING && move.castle && move.castle in INDEXES) {
      const castleIx = INDEXES[move.castle];
      const rookPiece = (this._turn === WHITE ? ROOK.toUpperCase() : ROOK);
      const queenSide = move.castle < move.from;
      const rookToIx = targetIndex + (queenSide ? 1 : -1);
      this._board[castleIx] = (this._board[castleIx] === rookPiece ? NONE : rookPiece);
      this._board[rookToIx] = rookPiece;
    }

    // Revoke castle rights...
    if (movingPiece === WKING) {
      this._whiteKing = targetIndex;
      this._castles = (this._castles || EMPTY_STRING).replace(PATTERN_UPPER_CASE, EMPTY_STRING);
    }
    else if (movingPiece === BKING) {
      this._blackKing = targetIndex;
      this._castles = (this._castles || EMPTY_STRING).replace(PATTERN_LOWER_CASE, EMPTY_STRING);
    }

    if (movingPiece.toLowerCase() === ROOK && this._castles && this._castles !== NONE) {
      const [fromRank, fromFile] = move.from.split(EMPTY_STRING);
      const startFile = this._turn === WHITE ? '1' : String.fromCharCode(letter0Code + BOARD_HEIGHT);
      const valid = this._castles;
      if (startFile === fromFile) {
        for (const ch of this._castles) {
          if (isPieceColor(ch, this._turn)) {
            let test = ch.toLowerCase();
            if (BOARD_WIDTH > 10) { /* we can't use KQkq with 12 or wider board */ }
            else if (test === KING) test = String.fromCharCode(lowerACode + BOARD_WIDTH);
            else if (test === QUEEN) test = lowerA;
            if (test === fromRank) {
              this._castles = this._castles.replace(ch, EMPTY_STRING);
              break;
            }
          }
        }
      }
    }

    // new En passant?
    this._enpass = -1;
    if (move.piece === PAWN) {
      const delta = deltaOffsets(sourceOffset, targetOffset);
      if (delta.y === 2) {
        this._enpass = offsetToIndex({
          x: sourceOffset.x,
          y: sourceOffset.y + (targetOffset.y > sourceOffset.y ? 1 : -1)
        });
      }
    }

    // Clocks and history
    this._halfmoveClock = (move.captured || move.piece === PAWN) ? 0 : this._halfmoveClock + 1;
    if (this._turn === WHITE) {
      this._turn = BLACK;
    }
    else {
      this._turn = WHITE;
      this._moveNumber++;
    }

    this._history.push(moveData);
    this.updated();
    return { ...moveData } as Move;
  }

  private canMoveTo(targetOffset: Offset, color: Color | string): MoveData | undefined {
    if (!offsetValid(targetOffset)) return;
    const result = {
      ...targetOffset
    } as MoveData;

    const occupied = this._board[offsetToIndex(targetOffset)];
    if (occupied in COLORPIECES) {
      const occupiedColor = COLORPIECES[occupied][0];
      if (occupiedColor === color) return;
      result.captured = occupied.toLowerCase();
    }
    return result as any;
  }

  private getMovesBySquare(options: MoveOptionsINT, color: Color, piece: string): MoveData[] {
    const { squareIx, simple, captures } = options;
    const startOffset = indexToOffset(squareIx);
    const targets: MoveData[] = [];
    let moveTypes = MoveTable[piece];
    if (!moveTypes) {
      moveTypes = MoveTable[`${color}${piece}`];
    }

    for (let mix = 0; mix < moveTypes.length; mix++) {
      const mv = moveTypes[mix];
      for (let mul = 1; mul < BOARD_HEIGHT; mul++) {
        const targetOffset = addOffsets(startOffset, { x: mv.x * mul, y: mv.y * mul });
        const move = this.canMoveTo(targetOffset, color);
        if (!move) break;

        let condition = false;
        if (mv.when === MoveCriteria.EmptyAndStart && !move.captured) {
          if (color === WHITE) {
            const before = this.canMoveTo({ x: targetOffset.x, y: startOffset.y - 1 }, color);
            condition = startOffset.y === 6 && !!before && !before.captured;
          }
          else {
            const before = this.canMoveTo({ x: targetOffset.x, y: startOffset.y + 1 }, color);
            condition = startOffset.y === 1 && !!before && !before.captured;
          }
        }
        else if (mv.when === MoveCriteria.Empty && !move.captured) { condition = true; }
        else if (mv.when === MoveCriteria.Attacking) {
          if (move.captured) condition = true;
          else if (piece === PAWN && offsetToIndex(targetOffset) === this._enpass) {
            condition = true;
            move.captured = PAWN;
            move.enpass = true;
          }
        }
        else if (!mv.when) { condition = true; }
        if (condition) {
          move.color = color;
          move.piece = piece;
          targets.push(move);
        }
        if (move.captured || !mv.repeat) break;
      }
    }

    if (captures) {
      return targets.filter(m => m.captured);
    }
    if (simple) {
      return targets;
    }

    // Lastly we need to add castle moves...
    if (piece === KING && (this._castles || NONE) !== NONE) {
      const moves = this.getCastleMoves(color);
      for (const move of moves) {
        targets.push(move);
      }
    }

    return targets.map(t => ({
      from: indexToSquare(squareIx),
      to: indexToSquare(offsetToIndex(t)),
      ...t
    }));
  }

  private getCastleMoves(color: Color): MoveData[] {
    const results: MoveData[] = [];
    if (NONE === (this._castles || NONE)) {
      return results;
    }

    for (const sqChar of this._castles) {
      if (!isPieceColor(sqChar, color)) continue;
      let castleFile = sqChar.toLowerCase();
      castleFile = castleFile === QUEEN ? lowerA :
        castleFile === KING ? String.fromCharCode(lowerACode + BOARD_WIDTH - 1) : castleFile;

      const kingIndex = color === WHITE ? this._whiteKing : this._blackKing;
      const kingOffset = indexToOffset(kingIndex);
      const castleOffset: Offset = { x: castleFile.charCodeAt(0) - lowerACode, y: kingOffset.y };
      const move = this.getCastle(color, castleOffset);
      if (move) {
        results.push(move);
      }
    }
    return results;
  }

  private getCastle(color: Color, castleOffset: Offset): MoveData | null {
    const kingIndex = color === WHITE ? this._whiteKing : this._blackKing;
    const kingOffset = indexToOffset(kingIndex);
    const isQueenSide = castleOffset.x < kingOffset.x;
    let fromX = Math.min(kingOffset.x, castleOffset.x, isQueenSide ? CASTLE_QUEEN_OFFSETX : CASTLE_KING_OFFSETX);
    let toX = Math.max(kingOffset.x, castleOffset.x, isQueenSide ? CASTLE_QUEEN_OFFSETX : CASTLE_KING_OFFSETX);
    let testIndex = offsetToIndex({ y: kingOffset.y, x: fromX });

    for (let ix = fromX; ix <= toX; ix++ , testIndex++) {
      const occupied = this._board[testIndex];
      if (occupied === NONE) continue;
      if (occupied === WKING || occupied === BKING) continue;
      if (occupied.toLowerCase() === ROOK && testIndex === offsetToIndex(castleOffset)) continue;
      return null; // You shall not pass!
    }

    fromX = Math.min(kingOffset.x, isQueenSide ? CASTLE_QUEEN_OFFSETX : CASTLE_KING_OFFSETX);
    toX = Math.max(kingOffset.x, isQueenSide ? CASTLE_QUEEN_OFFSETX : CASTLE_KING_OFFSETX);
    testIndex = offsetToIndex({ y: kingOffset.y, x: fromX });
    for (let ix = fromX; ix <= toX; ix++ , testIndex++) {
      if (this.isSquareAttacked(testIndex, color)) {
        return null;
      }
    }

    return {
      color,
      piece: KING,
      x: isQueenSide ? CASTLE_QUEEN_OFFSETX : CASTLE_KING_OFFSETX,
      y: kingOffset.y,
      castle: indexToSquare(offsetToIndex(castleOffset)),
    } as MoveData;
  }

  private getMovesFrom(options: MoveOptionsINT): MoveData[] {
    const { squareIx } = options;
    const boardPiece = this._board[squareIx];
    if (typeof boardPiece !== STRING || boardPiece === NONE) {
      return EMPTY_ARRAY;
    }

    const colorPiece = COLORPIECES[boardPiece];
    const color = colorPiece[0] as Color;
    const piece = colorPiece[1];

    return this.getMovesBySquare(options, color, piece);
  }


  isValidAttack(move: MoveData, offset: Offset, color: Color) {
    if (move.captured === KING) {
      const dist = deltaOffsets(offset, move);
      return dist.x <= 1 && dist.y <= 1;
    }
    if (move.captured === PAWN) {
      if (color === WHITE) {
        return offset.y === move.y + 1 && 1 === Math.abs(offset.x - move.x);
      }
      else {
        return offset.y === move.y - 1 && 1 === Math.abs(offset.x - move.x);
      }
    }
    if (move.captured === BISHOP) {
      const dist = deltaOffsets(offset, move);
      return dist.x === dist.y;
    }
    if (move.captured === ROOK) {
      const dist = deltaOffsets(offset, move);
      return dist.x === 0 || dist.y === 0;
    }
    //Leaves KNIGHT and QUEEN, which if present are valid.
    return true;
  }

  private isSquareAttacked(squareIx: number, color: Color): boolean {
    const startOffset = indexToOffset(squareIx);
    const lineAttacks = this.getMovesBySquare({ squareIx, simple: true, captures: true }, color, QUEEN);
    for (const move of lineAttacks) {
      if (move.captured && move.captured !== KNIGHT && this.isValidAttack(move, startOffset, color)) {
        return true;
      }
    }
    const knightAttacks = this.getMovesBySquare({ squareIx, simple: true, captures: true }, color, KNIGHT);
    for (const move of knightAttacks) {
      if (move.captured === KNIGHT && this.isValidAttack(move, startOffset, color)) {
        return true;
      }
    }

    return false;
  }

  moves(options?: MoveOptions): Move[] {
    options = options || {};
    const { square, exists } = options as MoveOptionsINT;
    if (square && !(square in INDEXES)) {
      throw new Error(`Invalid square identifier: "${square}"`);
    }
    if (square) {
      const result: MoveData[] = [];
      this.getMoves(result, { squareIx: INDEXES[square], ...options });
      return result;
    }
    else {
      const result: MoveData[] = [];
      const color = options.color || this._turn;
      for (let squareIx = 0; squareIx < BOARD_SIZE; squareIx++) {
        const boardPiece = this._board[squareIx];
        if (isPieceColor(boardPiece, color)) {
          this.getMoves(result, { squareIx, ...options });
          if (exists && result.length) {
            return result;
          }
        }
      }
      return result;
    }
  }

  private getMoves(result: MoveData[], options: MoveOptionsINT): void {
    const { squareIx } = options;
    const possible = this.getMovesFrom(options);
    if (possible.length === 0) return;

    const movingPiece = this._board[squareIx];
    const colorPiece = COLORPIECES[movingPiece];
    const color = colorPiece[0] as Color;
    const opponentColor = color === WHITE ? BLACK : WHITE;
    const piece = colorPiece[1];
    const { _whiteKing, _blackKing } = this;

    for (const move of possible) {
      let isLegal = false;
      this._board[squareIx] = NONE;
      const targetIx = offsetToIndex(move);
      const saved = this._board[targetIx];
      try {
        this._board[targetIx] = movingPiece;
        if (movingPiece === WKING) { this._whiteKing = targetIx; }
        else if (movingPiece === BKING) { this._blackKing = targetIx; }

        if (!this.testForCheck(color)) {
          if (this.testForCheck(opponentColor)) {
            move.check = PLUS;
            if (!this.hasValidMoves(opponentColor)) {
              move.check = HASH;
            }
          }
          isLegal = true;
        }
      }
      finally {
        this._board[targetIx] = saved;
        this._board[squareIx] = movingPiece;
        this._whiteKing = _whiteKing;
        this._blackKing = _blackKing;
      }

      if (isLegal) {
        if (options.exists) {
          result.push({} as any);
          return;
        }

        if (move.piece === PAWN && (move.y === 0 || move.y === BOARD_HEIGHT - 1)) {
          move.promotion = QUEEN;
        }

        if (!options.simple) {
          const pieceType = movingPiece.toLowerCase();
          if (pieceType === KING || (pieceType === PAWN && !move.captured)) {
            move.san = buildSAN(move, EMPTY_ARRAY);
          }
          else {
            const disambiguation = this.disambiguateFrom(targetIx, pieceType, opponentColor);
            move.san = buildSAN(move, disambiguation);
          }
        }

        const { x, y, ...resultMove } = move;
        result.push(resultMove as MoveData);
      }
    }
  }

  private disambiguateFrom(squareIx: number, piece: string, color: Color): string[] {
    const results: string[] = [];
    const lineAttacks = this.getMovesBySquare({ squareIx, simple: true, captures: true }, color, piece);
    for (const move of lineAttacks) {
      if (move.captured === piece) {
        results.push(indexToSquare(offsetToIndex(move)));
      }
    }
    return results;
  }

  private testForCheck(color: Color) {
    const kingSquareIx = color === WHITE ? this._whiteKing : this._blackKing;
    return kingSquareIx < 0 || this.isSquareAttacked(kingSquareIx, color);
  }

  private hasValidMoves(color: Color) {
    return this.moves({ color, simple: true, exists: true } as MoveOptionsINT).length > 0;
  }

  getResult(): GameResult {
    return this._gameResult;
  }

  private assertOngoing() {
    if (!this.isOngoing()) {
      throw new Error(`Invalid operation, game is over: ${this.getResult()}.`);
    }
  }

  isInCheck() {
    this.updateCachedState();
    return this._checked;
  }

  isCheckmate() {
    this.updateCachedState();
    return this._checked && this._noValidMoves;
  }

  isStalemate() {
    this.updateCachedState();
    return !this._checked && this._noValidMoves;
  }

  isAutomaticDraw() {
    if (this._whiteKing < 0 || this._blackKing < 0) {
      return true; //no-king?
    }
    const boardString = this._board.join(EMPTY_STRING);
    const blackPieces = (boardString.match(PATTERN_LOWER_CASE) || []).sort().join(EMPTY_STRING);
    const whitePieces = (boardString.match(PATTERN_UPPER_CASE) || []).sort().join(EMPTY_STRING).toLowerCase();

    if (blackPieces === KING || whitePieces === KING) {
      const morePieces = whitePieces.length > blackPieces.length ? whitePieces : blackPieces;
      // These are the most common, but by no means all.
      if (morePieces === KING || morePieces === BISHOP + KING || morePieces === KING + KNIGHT) {
        return true;
      }
    }
    if (blackPieces === whitePieces && whitePieces === BISHOP + KING) {
      // here we have kb vs kb, see if they are on the same color...
      const colorBishop1 = squareColor(boardString.indexOf(BISHOP.toUpperCase()));
      const colorBishop2 = squareColor(boardString.indexOf(BISHOP));
      if (colorBishop1 === colorBishop2) {
        return true;
      }
      // TODO: handle multiple bishops of the same square color.
    }

    return false;
  }

  hasThreefoldRepetition() {
    const found: { [key: string]: number } = {};
    for (const move of this._history) {
      if (move.restoreFEN) {
        const positions = move.restoreFEN.split(' ')[0];
        const count = found[positions] = (found[positions] || 0) + 1;
        if (count >= 3) {
          return true;
        }
      }
    }
    return false;
  }

  hasExceededFiftyMoveRule() {
    return this._halfmoveClock >= 100;
  }

  canDraw() {
    return this.isOngoing() && (
      this.hasThreefoldRepetition() ||
      this.hasExceededFiftyMoveRule()
    );
  }

  setDraw() {
    this.assertOngoing();
    this._headers.Result = DRAW;
    this._gameResult = DRAW;
  }

  isDraw() {
    this.updateCachedState();
    return this.getResult() === DRAW;
  }

  isOngoing() {
    this.updateCachedState();
    return this.getResult() === ONGOING;
  }

  // 3. Castle moves
}

export default ChessGame;
