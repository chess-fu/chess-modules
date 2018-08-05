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

/** HeaderEntry represents any TAG Pairs or comments encountered before the move text */
export interface HeaderEntry {
  /** The TAG token */
  name?: string;
  /** The quoted string as an unescaped string value */
  value?: string;
  /** Comments encountered */
  comments?: string[];
}

/** MoveHistory represents each move independently, may also be just a comment, rav, or result */
export interface MoveHistory {
  /** The move indicator if one preceded this move */
  number?: number;
  /** The plain-text of the move that was parsed */
  raw?: string;
  /** The normalized SAN without annotations */
  san?: string;
  /** The originating file, rank or both */
  from?: string;
  /** The target file, rank, both, or castle */
  to?: string;
  /** The piece that was moved */
  piece?: string;
  /** The NAG string, $ followed by a number */
  nag?: string;
  /** The RAV alternative play */
  rav?: MoveHistory[];
  /** The move check or mate indicator */
  check?: string;
  /** True if this was a capture */
  captured?: boolean;
  /** Promotion type: Q, R, N, or B */
  promotion?: string;
  /** Annotations like !, ?, !?, etc */
  annotations?: string;
  /** Comments encountered */
  comments?: string[];
  /** A game result, 1-0, 0-1, 1/2-1/2, or "*" */
  result?: string;
  /** Other non-delimiter characters following the parsed move */
  unknown?: string;
}
