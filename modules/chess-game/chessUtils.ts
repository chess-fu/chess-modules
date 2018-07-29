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
import { Color, Move, Offset } from './chessTypes';
import { BOARD_WIDTH, BOARD_HEIGHT, WHITE, NONE, PAWN, SAN_CAPTURE, BLACK } from './constants';

const lowerA = 'a';
const lowerZ = 'z';
const upperA = 'A';
const upperZ = 'Z';
const lowerACode = 'a'.charCodeAt(0);

const NUMBER = 'number';

export function isPieceColor(boardPiece: string, color: Color) {
  return ((color === WHITE && boardPiece >= upperA && boardPiece <= upperZ) ||
    (color !== WHITE && boardPiece >= lowerA && boardPiece <= lowerZ));
}

export function indexToSquare(index: number) {
  if (typeof index !== NUMBER || index < 0) return NONE;
  const file = Math.floor(index / BOARD_WIDTH);
  const rank = index - (file * BOARD_WIDTH);
  return String.fromCharCode(lowerACode + rank) + (BOARD_HEIGHT - file).toString();
}

export function indexToOffset(index: number): Offset {
  const y = Math.floor(index / BOARD_WIDTH);
  const x = index - (y * BOARD_WIDTH);
  return { x, y };
}

export function squareColor(index: number): Color {
  const y = Math.floor(index / BOARD_WIDTH);
  const x = index - (y * BOARD_WIDTH);
  return (y + x) % 2 === 0 ? BLACK : WHITE;
}

export function offsetToIndex(offset: Offset): number {
  return (offset.y * BOARD_WIDTH) + offset.x;
}

export function offsetValid(offset: Offset): boolean {
  return offset.x >= 0 && offset.y >= 0 && offset.x < BOARD_WIDTH && offset.y < BOARD_HEIGHT;
}

export function addOffsets(a: Offset, b: Offset): Offset {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function deltaOffsets(a: Offset, b: Offset): Offset {
  return {
    x: Math.abs(a.x - b.x),
    y: Math.abs(a.y - b.y)
  };
}

export function buildSAN(move: Move, conflicts?: Move[]) {

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
  if (move.castle) {
    result[0] = move.castle < move.from ? 'O-O-O' : 'O-O';
  }
  else {
    result.push(move.to);
    if (move.promotion) {
      result.push(`=${move.promotion.toUpperCase()}`);
    }
  }
  if (move.check) {
    result.push(move.check);
  }
  return result.join('');
}
