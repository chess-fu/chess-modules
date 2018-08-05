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

// tslint:disable-next-line:max-line-length
const matchFullFEN = /^\s*([prnbqkPRNBQK12345678]{1,8}(?:\/[prnbqkPRNBQK12345678]{1,8}){7})\s+(w|b)\s+([KQkqA-Ha-h]{1,4}|\-)\s+(?:(?:([a-h][36]|\-)\s+(\d{1,3})\s+(\d{1,4}))|(?:0\s+0))\s*$/;

const fenExpand = /[1-8]+/g;
const fenPack = /\-+/g;
const fenSubst = { 1: '-', 2: '--', 3: '---', 4: '----', 5: '-----', 6: '------', 7: '-------', 8: '--------' };

/**
 * Class FenParser - see readme for more information
 */
export class FenParser {
  /** The original string the object was constructed from */
  readonly original: string = '';
  /** true if the FEN provided to the constructor was validated and represented the full 8x8 board. */
  readonly isValid: boolean = false;
  /** Gets the encoded version of the ranks, use the ranks property to modify. */
  positions: string = '';
  /** Gets or sets the unencoded rank & file position of pieces using a dash `'-'` for an empty square. */
  ranks: string[] = [];
  /** Gets or sets the color of the player who should make the next move. */
  turn: string = '';
  /** Gets or sets the valid sides (`kqKQ`) or files (`abcdefghABCDEFGH`) valid for castling. */
  castles: string = '';
  /** Gets or sets the currently possible en passant square in file+rank notation, or `-` for none. */
  enpass: string = '';
  /** Gets or sets the number of halfmoves since the last capture or pawn advance. */
  halfmoveClock: number = 0;
  /** Gets or sets the number of the full move. It starts at 1, and is incremented after Black's move. */
  moveNumber: number = 0;

  /**
   * @static
   * @param {string} text
   * @returns {boolean} true if valid.
   * @description Returns true if the provided argument 'appears' to be a valid chess FEN
   */
  static readonly isFen = (text: string) => (typeof text === 'string' && matchFullFEN.test(text));

  /**
   * @constructor {FenParser}
   * @param {string} value a chess FEN string
   * @description Constructs a parsed FEN, check isValid property for success
   */
  constructor(value: string) {
    this.original = (typeof value === 'string') ? value : '';
    const match = this.original.match(matchFullFEN);
    this.isValid = !!match;
    if (match) {
      this.positions = match[1];
      this.ranks = match[1].split('/').map(s => s.replace(fenExpand, i => fenSubst[i]));
      this.turn = match[2];
      this.castles = match[3];
      this.enpass = match[4] !== undefined ? match[4] : '-';
      this.halfmoveClock = match[5] !== undefined ? parseInt(match[5], 10) : 0;
      this.moveNumber = match[6] !== undefined ? parseInt(match[6], 10) : 1;

      this.isValid = this.ranks.reduce((before, rank) => before && rank.length === 8, true);
    }
  }

  /**
   * Returns the properties of this as a FEN (does not valid).
   * @returns {string} The reconstructed FEN string
   */
  toString(): string {
    const positions = this.ranks.map(rank => rank.replace(fenPack, m => m.length.toString())).join('/');
    return `${positions} ${this.turn} ${this.castles} ${this.enpass} ${this.halfmoveClock} ${this.moveNumber}`;
  }

  /**
   * Checks to see if a piece exists in the FEN string.
   * @param {string} piece Any valid chess piece 'prnbqk' for black or upper-case for white.
   * @returns {boolean} true if found, otherwise false.
   */
  hasPiece(piece: string) {
    return this.positions.indexOf(piece) >= 0;
  }

  /**
   * Returns a map of each piece type encountered to the count of occurrences
   * @returns {{string: number}} an object map for {[piece]: count} 
   */
  counts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    for (const rank of this.ranks) {
      for (const ch of rank) {
        if (ch !== '-') {
          counts[ch] = (counts[ch] || 0) + 1;
        }
      }
    }
    return counts;
  }
}

export default FenParser;