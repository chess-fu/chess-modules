import FenParser from '@chess-fu/fen-parser';

import { MoveTable, Offset } from './chessMoves';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type Color = 'w' | 'b';

export interface Move {
  color: Color;
  piece: string;
  from: string;
  to: string;
  san: string;
  castle?: string; // set to the rook's square
  enpass?: boolean;
  check?: '+' | '#';
  capture?: string;
  promotion?: string;
}

export interface MoveData extends Move, Offset {
  restoreFEN?: string;
}

const EMPTY_ARRAY: any[] = Object.freeze<any[]>([]) as any[];
const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 8;
const BOARD_SIZE = BOARD_WIDTH * BOARD_HEIGHT;
const EMPTY_BOARD = () => { const r = new Array<string>(BOARD_SIZE); for (let i = 0; i < BOARD_SIZE; i++) r[i] = '-'; return r; };

const lowerA = 'a'.charCodeAt(0);
const letter0 = '0'.charCodeAt(0);

const INDEXES: { [key: string]: number } = {};

const PAWN = 'p';
const ROOK = 'r';
const KNIGHT = 'n';
const BISHOP = 'b';
const QUEEN = 'q';
const KING = 'k';

const WKING = KING.toUpperCase();
const BKING = KING.toLowerCase();

const PIECE_TYPES = 'kqbnrp'.split('');
const PIECES: { [key: string]: string } = {};
const COLORPIECES: { [key: string]: string } = {};

/** initializer: build static map tables... */
(function initializer() {
  // FEN ORDER: a8 ... h1 = 64
  for (let rank = 0; rank < BOARD_WIDTH; rank++) {
    for (let file = 0; file < BOARD_WIDTH; file++) {
      INDEXES[`${String.fromCharCode(lowerA + file)}${rank + 1}`] = file + (((BOARD_HEIGHT - 1) - rank) * BOARD_WIDTH);
    }
  }

  for (const piece of PIECE_TYPES) {
    PIECES['w' + piece] = piece.toUpperCase();
    PIECES['b' + piece] = piece.toLowerCase();
    PIECES[piece.toUpperCase()] = piece.toUpperCase();
    PIECES[piece.toLowerCase()] = piece.toLowerCase();
    COLORPIECES[piece.toUpperCase()] = 'w' + piece;
    COLORPIECES[piece.toLowerCase()] = 'b' + piece;
  }
})();

function indexToSquare(index: number) {
  if (typeof index !== 'number' || index < 0) return '-';
  const file = Math.floor(index / BOARD_WIDTH);
  const rank = index - (file * BOARD_WIDTH);
  return String.fromCharCode(lowerA + rank) + (BOARD_HEIGHT - file).toString();
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

  if (move.capture) {
    if (move.piece === PAWN && result.length === 0) {
      result.push(move.from[0]);
    }
    result.push('x');
  }
  result.push(move.to);
  if (move.promotion) result.push(`=${move.promotion}`);
  if (move.check) result.push(move.check);
  return result.join('');
}

export class Chess {
  private header: { [key: string]: string };
  private history: MoveData[];
  private board: string[];

  private turn: Color;
  private enpass: number;
  private halfmoveClock: number;
  private moveNumber: number;
  private whiteKing: number;
  private blackKing: number;
  private castles: string;

  constructor(fen?: string) {
    if (fen) {
      this.load(fen);
    }
    else {
      this.init();
    }
  }

  init(saveHeader?: boolean) {
    if (!saveHeader) this.header = {};
    this.history = [];
    this.board = EMPTY_BOARD();
    this.turn = 'w';
    this.enpass = -1;
    this.halfmoveClock = 0;
    this.moveNumber = 1;
    this.whiteKing = this.blackKing = -1;
    this.castles = '';
  }

  load(fen?: string) {
    this.init();

    fen = fen || START_FEN;
    this.restoreFen(fen);

    if (fen !== START_FEN) {
      this.header = { ...this.header, SetUp: '1', FEN: fen };
    }
  }

  private restoreFen(fen: string) {
    const data = new FenParser(fen || START_FEN);
    const board = data.ranks.join('').split('');
    if (board.length !== BOARD_SIZE) {
      throw new Error(`Invalid FEN, size expected ${BOARD_SIZE} found ${board.length}`);
    }
    this.board = [...board];
    this.whiteKing = board.indexOf(WKING);
    this.blackKing = board.indexOf(BKING);

    this.castles = data.castles;
    this.halfmoveClock = data.halfmoveClock;
    this.moveNumber = data.moveNumber;
    this.enpass = (data.enpass in INDEXES) ? INDEXES[data.enpass] : -1;
    this.turn = data.turn === 'b' ? 'b' : 'w';
  }

  toString() { return this.fen(); }
  fen() {
    const ranks: string[] = [];
    const bstring = this.board.map(p => p || '-').join('');
    for (let file = BOARD_HEIGHT; file > 0; file--) {
      const index = INDEXES['a' + file.toString()];
      ranks.push(bstring.substr(index, BOARD_WIDTH));
    }
    return ranks.join('/').replace(/\-+/g, m => m.length.toString()) +
      ` ${this.turn} ${this.castles || '-'} ${indexToSquare(this.enpass)} ${this.halfmoveClock} ${this.moveNumber}`;
  }

  toPGN() { }

  squares(): string[] {
    return Object.keys(INDEXES);
  }

  get(square: string): string | null {
    if (!(square in INDEXES)) {
      throw new Error(`Invalid square identifier: "${square}"`);
    }

    const piece = this.board[INDEXES[square]];
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

    this.board[offset] = PIECES[piece];
    if (piece === WKING) {
      this.whiteKing = offset;
    }
    if (piece === BKING) {
      this.blackKing = offset;
    }
  }

  remove(square: string) {
    if (!(square in INDEXES)) {
      throw new Error(`Invalid square identifier: "${square}"`);
    }
    const offset = INDEXES[square];
    this.board[offset] = '-';
    this.whiteKing = this.whiteKing !== offset ? this.whiteKing : -1;
    this.blackKing = this.blackKing !== offset ? this.blackKing : -1;
  }

  getHistory(): Move[] {
    return this.history.map<Move>(moveData => {
      const { restoreFEN, x, y, ...move } = moveData;
      return move as Move;
    });
  }

  undo(): Move | undefined {
    const move = this.history.pop();
    if (!move) return;
    if (!move.restoreFEN) throw new Error('History entry is missing restore point.');
    this.restoreFen(move.restoreFEN);
    return move;
  }

  move(move: Move | string): Move {
    if (typeof move === 'string') {
      return this.moveToSAN(move as string);
    }
    else if (move.from && move.to) {
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
    const movesValid = this.moves({ color: this.turn });
    // TODO: Need to integrate a full SAN parser here:
    const findSan = san.trim()
      .replace(/=[RNB]/, '=Q') //we only produce queen promotions (e8=Q)
      .replace(/(([\!\?]+)|$\d{1,3})+$/, '') //remove any trailing annotations
      ;
    const found = movesValid.filter(m => findSan === m.san && m.color === this.turn);
    if (found.length !== 1) {
      throw new Error(`The SAN ${san} is not valid.`);
    }
    const [move] = found;
    if (move.promotion) {
      const match = san.match(/=([QRNB])/);
      if (match) move.promotion = match[1];
    }
    return this.performMove(move, false);
  }

  private performMove(move: Move, validate: boolean): Move {
    if (validate) {
      const movesValid = this.moves({ square: move.from, color: this.turn })
        .filter(m => m.from === move.from && m.to === move.to && m.color === this.turn);
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
    const movingPiece = this.board[sourceIndex];

    // Remove the enpass capture
    if (move.piece === PAWN && move.capture === PAWN && move.enpass) {
      const killSquare = {
        y: targetOffset.y > sourceOffset.y ? targetOffset.y - 1 : targetOffset.y + 1,
        x: targetOffset.x
      };
      const pieceRemoved = this.board[offsetToIndex(killSquare)];
      if (COLORPIECES[pieceRemoved] !== `${this.turn === 'w' ? 'b' : 'w'}${PAWN}`) {
        throw new Error(`Invalid enpass capture ${COLORPIECES[pieceRemoved]} at ${indexToSquare(offsetToIndex(killSquare))}.`);
      }
    }

    // Move the piece
    this.board[sourceIndex] = '-';
    this.board[targetIndex] = movingPiece;

    // Revoke castle rights...
    if (movingPiece === WKING) {
      this.whiteKing = targetIndex;
      this.castles = (this.castles || '').replace(/[A-Z]/g, '');
    }
    else if (movingPiece === BKING) {
      this.blackKing = targetIndex;
      this.castles = (this.castles || '').replace(/[a-z]/g, '');
    }

    if (movingPiece.toLowerCase() === ROOK && this.castles && this.castles !== '-') {
      const [fromRank, fromFile] = move.from.split('');
      const startFile = this.turn === 'w' ? '1' : String.fromCharCode(letter0 + BOARD_HEIGHT);
      const valid = this.castles;
      if (startFile === fromFile) {
        for (const ch of this.castles) {
          if ((this.turn === 'w' && ch >= 'A' && ch <= 'Z') || (this.turn !== 'w' && ch >= 'a' && ch <= 'z')) {
            let test = ch.toLowerCase();
            if (BOARD_WIDTH > 10) { /* we can't use KQkq with 12 or wider board */ }
            else if (test === 'k') test = String.fromCharCode(lowerA + BOARD_WIDTH);
            else if (test === 'q') test = 'a';
            if (test === fromRank) {
              this.castles = this.castles.replace(ch, '');
              break;
            }
          }
        }
      }
    }

    // new En passant?
    this.enpass = -1;
    if (move.piece === PAWN) {
      const delta = deltaOffsets(sourceOffset, targetOffset);
      if (delta.y === 2) {
        this.enpass = offsetToIndex({
          x: sourceOffset.x,
          y: sourceOffset.y + (targetOffset.y > sourceOffset.y ? 1 : -1)
        });
      }
    }

    // Clocks and history
    this.halfmoveClock = (move.capture || move.piece === PAWN) ? 0 : this.halfmoveClock + 1;
    if (this.turn === 'w') {
      this.turn = 'b';
    }
    else {
      this.turn = 'w';
      this.moveNumber++;
    }

    this.history.push(moveData);
    return { ...moveData } as Move;
  }

  private canMoveTo(targetOffset: Offset, color: Color | string): MoveData | undefined {
    if (!offsetValid(targetOffset)) return;
    const result = {
      ...targetOffset
    } as MoveData;

    const occupied = this.board[offsetToIndex(targetOffset)];
    if (occupied in COLORPIECES) {
      const occupiedColor = COLORPIECES[occupied][0];
      if (occupiedColor === color) return;
      result.capture = occupied.toLowerCase();
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
        if (mv.when === 'start&empty' && !move.capture) {
          if (color === 'w') {
            const before = this.canMoveTo({ x: targetOffset.x, y: startOffset.y - 1 }, color);
            condition = startOffset.y === 6 && !!before && !before.capture;
          }
          else {
            const before = this.canMoveTo({ x: targetOffset.x, y: startOffset.y + 1 }, color);
            condition = startOffset.y === 1 && !!before && !before.capture;
          }
        }
        else if (mv.when === 'empty' && !move.capture) { condition = true; }
        else if (mv.when === 'attack') {
          if (move.capture) condition = true;
          else if (piece === PAWN && offsetToIndex(targetOffset) === this.enpass) {
            condition = true;
            move.capture = PAWN;
            move.enpass = true;
          }
        }
        else if (!mv.when) { condition = true; }
        if (condition) {
          targets.push(move);
        }
        if (move.capture || !mv.repeat) break;
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
    const boardPiece = this.board[squareIx];
    if (typeof boardPiece !== 'string' || boardPiece === '-') {
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
        .filter(m => m.capture && m.capture !== KNIGHT),
      ...this.getMovesBySquare(squareIx, color, KNIGHT)
        .filter(m => m.capture === KNIGHT)
    ];

    const startOffset = indexToOffset(squareIx);
    return attacks.filter(move => {
      if (move.capture === KING) {
        const dist = deltaOffsets(startOffset, move);
        return dist.x <= 1 && dist.y <= 1;
      }
      if (move.capture === PAWN) {
        if (color === 'w') {
          return startOffset.y === move.y + 1 && 1 === Math.abs(startOffset.x - move.x);
        }
        else {
          return startOffset.y === move.y - 1 && 1 === Math.abs(startOffset.x - move.x);
        }
      }
      if (move.capture === BISHOP) {
        const dist = deltaOffsets(startOffset, move);
        return dist.x === dist.y;
      }
      if (move.capture === ROOK) {
        const dist = deltaOffsets(startOffset, move);
        return dist.x === 0 || dist.y === 0;
      }
      //Leaves KNIGHT and QUEEN, which if present are valid.
      return true;
    });
  }

  moves(options?: { square?: string, color?: Color }): Move[] {
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
      const color = options.color || this.turn;
      for (let squareIx = 0; squareIx < BOARD_SIZE; squareIx++) {
        const boardPiece = this.board[squareIx];
        if ((color === 'w' && boardPiece >= 'A' && boardPiece <= 'Z') ||
          (color !== 'w' && boardPiece >= 'a' && boardPiece <= 'z')) {
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

    const movingPiece = this.board[squareIx];
    const colorPiece = COLORPIECES[movingPiece];
    const color = colorPiece[0] as Color;
    const opponentColor = color === 'w' ? 'b' : 'w';
    const piece = colorPiece[1];
    const { whiteKing, blackKing } = this;

    const sans: any = {};
    const fixSans: string[] = [];

    try {
      this.board[squareIx] = '-';
      for (const move of possible) {
        const targetIx = offsetToIndex(move);
        const saved = this.board[targetIx];
        try {
          this.board[targetIx] = movingPiece;
          if (movingPiece === WKING) { this.whiteKing = targetIx; }
          else if (movingPiece === BKING) { this.blackKing = targetIx; }

          if (!this.isInCheck(color)) {
            if (this.isInCheck(opponentColor)) {
              move.check = '+';
              if (this.isCheckmate(opponentColor)) {
                move.check = '#';
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
          this.board[targetIx] = saved;
        }
      }
    }
    finally {
      this.board[squareIx] = movingPiece;
      this.whiteKing = whiteKing;
      this.blackKing = blackKing;
    }

    for (const fixSan of fixSans) {
      const matching = result.filter(m => m.san === fixSan);
      for (const move of matching) {
        move.san = buildSAN(move, matching);
      }
    }

    return result;
  }

  isInCheck(color: Color) {
    const kingSquareIx = color === 'w' ? this.whiteKing : this.blackKing;
    return this.isSquareAttacked(kingSquareIx, color).length > 0;
  }

  isCheckmate(color?: Color) {
    return this.isInCheck(color || this.turn) && this.moves({ color: color || this.turn }).length === 0;
  }

  // 3. Castle moves
  // 4. En passant
  // 5. Stop conditions
}
