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
import { Offset } from './chessTypes';

export enum MoveCriteria {
  Empty = 1,
  EmptyAndStart = 2,
  Attacking = 3,
}

export interface MoveType extends Offset {
  readonly rotate?: boolean;
  readonly repeat?: boolean;
  readonly when?: MoveCriteria;
}

const MoveTable: { [key: string]: MoveType[] } = {
  wp: [
    { x: 0, y: -1, when: MoveCriteria.Empty },
    { x: 0, y: -2, when: MoveCriteria.EmptyAndStart },
    { x: 1, y: -1, when: MoveCriteria.Attacking },
    { x: -1, y: -1, when: MoveCriteria.Attacking }
  ],
  bp: [
    { x: 0, y: 1, when: MoveCriteria.Empty },
    { x: 0, y: 2, when: MoveCriteria.EmptyAndStart },
    { x: 1, y: 1, when: MoveCriteria.Attacking },
    { x: -1, y: 1, when: MoveCriteria.Attacking }
  ],
  r: [{ x: 0, y: 1, rotate: true, repeat: true }],
  n: [{ x: 2, y: 1, rotate: true }, { x: 1, y: 2, rotate: true }],
  b: [{ x: 1, y: 1, rotate: true, repeat: true }],
  q: [{ x: 0, y: 1, rotate: true, repeat: true }, { x: 1, y: 1, rotate: true, repeat: true }],
  k: [{ x: 0, y: 1, rotate: true }, { x: 1, y: 1, rotate: true }],
};

function rotate90(moves: MoveType): MoveType {
  const { x, y } = moves;
  return { ...moves, x: -y, y: x };
}

function expandMoves(moves: MoveType[]) {
  const rotates = moves.filter(m => m.rotate);
  const results = [
    ...moves,
    ...rotates.map(m => rotate90(m)),
    ...rotates.map(m => rotate90(rotate90(m))),
    ...rotates.map(m => rotate90(rotate90(rotate90(m)))),
  ];
  return results;
}

Object.keys(MoveTable)
  .forEach(key => {
    MoveTable[key] = expandMoves(MoveTable[key]);
  });

export { MoveTable };
