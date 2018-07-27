import FenParser from '@chess-fu/fen-parser';
import { MoveTable, Offset, WHEN_START_AND_EMPTY, WHEN_EMPTY, WHEN_ATTACKING } from './chessMoves';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type Color = 'w' | 'b';

export interface Move {
  color: Color;
  piece: string;
  from: string;
  to: string;
  san: string;
  castle?: string; // set to the rook's square
  check?: '+' | '#';
  enpass?: boolean;
  captured?: string;
  promotion?: string;
}

interface MoveData extends Move, Offset {
  restoreFEN?: string;
}

const lowerACode = 'a'.charCodeAt(0);
const letter0Code = '0'.charCodeAt(0);

const lowerA = 'a';
const lowerZ = 'z';
const upperA = 'A';
const upperZ = 'Z';

const INDEXES: { [key: string]: number } = {};

const WHITE = 'w';
const BLACK = 'b';

const PAWN = 'p';
const ROOK = 'r';
const KNIGHT = 'n';
const BISHOP = 'b';
const QUEEN = 'q';
const KING = 'k';

const PLUS = '+';
const HASH = '#';
const NONE = '-';
const SLASH = '/';
const SAN_CAPTURE = 'x';

const NUMBER = 'number';
const STRING = 'string';

const WKING = KING.toUpperCase();
const BKING = KING.toLowerCase();

const EMPTY_STRING = '';
const EMPTY_ARRAY: any[] = Object.freeze<any[]>([]) as any[];
const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 8;
const BOARD_SIZE = BOARD_WIDTH * BOARD_HEIGHT;
const EMPTY_BOARD = () => { const r = new Array<string>(BOARD_SIZE); for (let i = 0; i < BOARD_SIZE; i++) r[i] = NONE; return r; };

const PATTERN_FEN_DASH = /\-+/g;
const PATTERN_PROMOTE_RNB = /=[RNB]/;
const PATTERN_PROMOTE_TYPE = /=([QRNB])/;
const PATTERN_ANNOTATION = /(([\!\?]+)|$\d{1,3})+$/;
const PATTERN_LOWER_CASE = /[a-z]/g;
const PATTERN_UPPER_CASE = /[A-Z]/g;

const PIECE_TYPES = 'kqbnrp'.split(EMPTY_STRING);
const PIECES: { [key: string]: string } = {};
const COLORPIECES: { [key: string]: string } = {};

/** initializer: build static map tables... */
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

function isPieceColor(boardPiece: string, color: Color) {
  return ((color === WHITE && boardPiece >= upperA && boardPiece <= upperZ) ||
    (color !== WHITE && boardPiece >= lowerA && boardPiece <= lowerZ));
}

function indexToSquare(index: number) {
  if (typeof index !== NUMBER || index < 0) return NONE;
  const file = Math.floor(index / BOARD_WIDTH);
  const rank = index - (file * BOARD_WIDTH);
  return String.fromCharCode(lowerACode + rank) + (BOARD_HEIGHT - file).toString();
}

function indexToOffset(index: number): Offset {
  const y = Math.floor(index / BOARD_WIDTH);
  const x = index - (y * BOARD_WIDTH);
  return { x, y };
}

function offsetToIndex(offset: Offset): number {
  return (offset.y * BOARD_WIDTH) + offset.x;
}

function offsetValid(offset: Offset): boolean {
  return offset.x >= 0 && offset.y >= 0 && offset.x < BOARD_WIDTH && offset.y < BOARD_HEIGHT;
}

function addOffsets(a: Offset, b: Offset): Offset {
  return { x: a.x + b.x, y: a.y + b.y };
}

function deltaOffsets(a: Offset, b: Offset): Offset {
  return {
    x: Math.abs(a.x - b.x),
    y: Math.abs(a.y - b.y)
  };
}

function buildSAN(move: Move, conflicts?: Move[]) {
  const result: string[] = move.piece !== PAWN ? [move.piece.toUpperCase()] : [];
  if (conflicts && conflicts.length > 1) {
    const counts: { [key: string]: any } = { ranks: {}, files: {} };
    for (const mv of conflicts) {
      counts.ranks[mv.from[1]] = (counts.ranks[mv.from[1]] || 0) + 1;
      counts.files[mv.from[0]] = (counts.files[mv.from[0]] || 0) + 1;
    }
    if (Object.keys(counts.ranks).length === conflicts.length) {
      result.push(move.from[1]);
    }
    else if (Object.keys(counts.ranks).length === conflicts.length) {
      result.push(move.from[0]);
    }
    else {
      result.push(move.from);
    }
  }

  if (move.captured) {
    if (move.piece === PAWN && result.length === 0) {
      result.push(move.from[0]);
    }
    result.push(SAN_CAPTURE);
  }
  result.push(move.to);
  if (move.promotion) result.push(`=${move.promotion}`);
  if (move.check) result.push(move.check);
  return result.join(EMPTY_STRING);
}

export class Chess {
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
  private _checked: boolean;
  private _gameover: boolean;

  constructor(fen?: string) {
    if (fen) {
      this.load(fen);
    }
    else {
      this.init();
    }
  }

  init(saveHeader?: boolean) {
    if (!saveHeader) this._headers = {};
    this._history = [];
    this._board = EMPTY_BOARD();
    this._turn = WHITE;
    this._enpass = -1;
    this._halfmoveClock = 0;
    this._moveNumber = 1;
    this._whiteKing = this._blackKing = -1;
    this._castles = EMPTY_STRING;
  }

  load(fen?: string) {
    this.init();

    fen = fen || START_FEN;
    this.restoreFen(fen);

    if (fen !== START_FEN) {
      this._headers = { ...this._headers, SetUp: '1', FEN: fen };
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

  pgn(options?: { newline_char: string, max_width: number }) { return EMPTY_STRING; /* TODO */ }

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
    return this._headers;
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

  set(square: string, piece: string) {
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
    this._checked = this.isInCheck(this._turn);
    this._gameover = this.moves({ color: this._turn }).length === 0;
  }

  undo(): Move | undefined {
    const move = this._history.pop();
    if (!move) return;
    if (!move.restoreFEN) throw new Error('History entry is missing restore point.');
    this.restoreFen(move.restoreFEN);
    return move;
  }

  move(move: Move | string): Move {
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
    // TODO: Need to integrate a full SAN parser here:
    const findSan = san.trim()
      .replace(PATTERN_PROMOTE_RNB, '=Q') //we only produce queen promotions (e8=Q)
      .replace(PATTERN_ANNOTATION, EMPTY_STRING) //remove any trailing annotations
      ;
    const found = movesValid.filter(m => findSan === m.san && m.color === this._turn);
    if (found.length !== 1) {
      throw new Error(`The SAN ${san} is not valid.`);
    }
    const [move] = found;
    if (move.promotion) {
      const match = san.match(PATTERN_PROMOTE_TYPE);
      if (match) move.promotion = match[1];
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
      const pieceRemoved = this._board[offsetToIndex(killSquare)];
      if (COLORPIECES[pieceRemoved] !== `${this._turn === WHITE ? BLACK : WHITE}${PAWN}`) {
        throw new Error(`Invalid enpass capture ${COLORPIECES[pieceRemoved]} at ${indexToSquare(offsetToIndex(killSquare))}.`);
      }
    }

    // Move the piece
    this._board[sourceIndex] = NONE;
    this._board[targetIndex] = movingPiece;

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

  private getMovesBySquare(squareIx: number, color: Color, piece: string): MoveData[] {
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
        if (mv.when === WHEN_START_AND_EMPTY && !move.captured) {
          if (color === WHITE) {
            const before = this.canMoveTo({ x: targetOffset.x, y: startOffset.y - 1 }, color);
            condition = startOffset.y === 6 && !!before && !before.captured;
          }
          else {
            const before = this.canMoveTo({ x: targetOffset.x, y: startOffset.y + 1 }, color);
            condition = startOffset.y === 1 && !!before && !before.captured;
          }
        }
        else if (mv.when === WHEN_EMPTY && !move.captured) { condition = true; }
        else if (mv.when === WHEN_ATTACKING) {
          if (move.captured) condition = true;
          else if (piece === PAWN && offsetToIndex(targetOffset) === this._enpass) {
            condition = true;
            move.captured = PAWN;
            move.enpass = true;
          }
        }
        else if (!mv.when) { condition = true; }
        if (condition) {
          targets.push(move);
        }
        if (move.captured || !mv.repeat) break;
      }
    }

    return targets.map(t => ({
      color, piece,
      from: indexToSquare(squareIx),
      to: indexToSquare(offsetToIndex(t)),
      ...t
    }));
  }

  private getMovesFrom(squareIx: number): MoveData[] {
    const boardPiece = this._board[squareIx];
    if (typeof boardPiece !== STRING || boardPiece === NONE) {
      return EMPTY_ARRAY;
    }

    const colorPiece = COLORPIECES[boardPiece];
    const color = colorPiece[0] as Color;
    const piece = colorPiece[1];

    return this.getMovesBySquare(squareIx, color, piece);
  }

  getAttacks(square: string, targetColor: Color): Move[] {
    if (!(square in INDEXES)) {
      throw new Error(`Invalid square identifier: "${square}"`);
    }
    return this.isSquareAttacked(INDEXES[square], targetColor);
  }

  private isSquareAttacked(squareIx: number, color: Color): MoveData[] {
    const attacks = [
      ...this.getMovesBySquare(squareIx, color, QUEEN)
        .filter(m => m.captured && m.captured !== KNIGHT),
      ...this.getMovesBySquare(squareIx, color, KNIGHT)
        .filter(m => m.captured === KNIGHT)
    ];

    const startOffset = indexToOffset(squareIx);
    return attacks.filter(move => {
      if (move.captured === KING) {
        const dist = deltaOffsets(startOffset, move);
        return dist.x <= 1 && dist.y <= 1;
      }
      if (move.captured === PAWN) {
        if (color === WHITE) {
          return startOffset.y === move.y + 1 && 1 === Math.abs(startOffset.x - move.x);
        }
        else {
          return startOffset.y === move.y - 1 && 1 === Math.abs(startOffset.x - move.x);
        }
      }
      if (move.captured === BISHOP) {
        const dist = deltaOffsets(startOffset, move);
        return dist.x === dist.y;
      }
      if (move.captured === ROOK) {
        const dist = deltaOffsets(startOffset, move);
        return dist.x === 0 || dist.y === 0;
      }
      //Leaves KNIGHT and QUEEN, which if present are valid.
      return true;
    });
  }

  moves(options?: { square?: string, color?: Color, verbose?: boolean }): Move[] {
    options = options || {};
    const { square } = options;
    if (square && !(square in INDEXES)) {
      throw new Error(`Invalid square identifier: "${square}"`);
    }
    if (square) {
      return this.getMoves(INDEXES[square]);
    }
    else {
      const result: MoveData[] = [];
      const color = options.color || this._turn;
      for (let squareIx = 0; squareIx < BOARD_SIZE; squareIx++) {
        const boardPiece = this._board[squareIx];
        if (isPieceColor(boardPiece, color)) {
          result.push(...this.getMoves(squareIx));
        }
      }
      return result;
    }
  }

  private getMoves(squareIx: number): MoveData[] {
    const result: MoveData[] = [];
    const possible = this.getMovesFrom(squareIx);
    if (possible.length === 0) return result;

    const movingPiece = this._board[squareIx];
    const colorPiece = COLORPIECES[movingPiece];
    const color = colorPiece[0] as Color;
    const opponentColor = color === WHITE ? BLACK : WHITE;
    const piece = colorPiece[1];
    const { _whiteKing, _blackKing } = this;

    const sans: any = {};
    const fixSans: string[] = [];

    try {
      this._board[squareIx] = NONE;
      for (const move of possible) {
        const targetIx = offsetToIndex(move);
        const saved = this._board[targetIx];
        try {
          this._board[targetIx] = movingPiece;
          if (movingPiece === WKING) { this._whiteKing = targetIx; }
          else if (movingPiece === BKING) { this._blackKing = targetIx; }

          if (!this.isInCheck(color)) {
            if (this.isInCheck(opponentColor)) {
              move.check = PLUS;
              if (this.isCheckmate(opponentColor)) {
                move.check = HASH;
              }
            }
            if (move.piece === PAWN && (move.y === 0 || move.y === BOARD_HEIGHT - 1)) {
              move.promotion = QUEEN;
            }
            move.san = buildSAN(move);
            if (sans[move.san]) fixSans.push(move.san);
            else sans[move.san] = true;

            const { x, y, ...resultMove } = move;
            result.push(resultMove as MoveData);
          }
        }
        finally {
          this._board[targetIx] = saved;
        }
      }
    }
    finally {
      this._board[squareIx] = movingPiece;
      this._whiteKing = _whiteKing;
      this._blackKing = _blackKing;
    }

    for (const fixSan of fixSans) {
      const matching = result.filter(m => m.san === fixSan);
      for (const move of matching) {
        move.san = buildSAN(move, matching);
      }
    }

    return result;
  }

  insufficientMaterial() { return false; } // TODO

  isInCheck(color?: Color) {
    if (!color || color === this._turn) {
      return this._checked;
    }
    const kingSquareIx = (color || this._turn) === WHITE ? this._whiteKing : this._blackKing;
    return this.isSquareAttacked(kingSquareIx, (color || this._turn)).length > 0;
  }

  isCheckmate(color?: Color) {
    if (!color || color === this._turn) {
      return this._checked && this._gameover;
    }
    return this.isInCheck(color || this._turn) && this.moves({ color: color || this._turn }).length === 0;
  }

  isStalemate(color?: Color) {
    if (!color || color === this._turn) {
      return !this._checked && this._gameover;
    }
    return !this.isInCheck(color || this._turn) && this.moves({ color: color || this._turn }).length === 0;
  }

  isDraw() {
    return this._halfmoveClock >= 100 ||
      this.insufficientMaterial() ||
      this.isStalemate();
  }

  isGameover() {
    return this._halfmoveClock >= 100 ||
      this.insufficientMaterial() ||
      this._gameover;
  }

  // NOTE: The following are only for compatibility with chess.js api:
  /** @deprecated */
  readonly game_over = () => this.isGameover();
  /** @deprecated */
  readonly in_check = () => this.isInCheck();
  /** @deprecated */
  readonly in_checkmate = () => this.isCheckmate();
  /** @deprecated */
  readonly in_stalemate = () => this.isStalemate();
  /** @deprecated */
  readonly in_draw = () => this.isDraw();
  /** @deprecated */
  readonly insufficient_material = () => this.insufficientMaterial();
  /** @deprecated */
  readonly in_threefold_repetition = () => false;

  // 3. Castle moves
  // 4. En passant
  // 5. Stop conditions
}
