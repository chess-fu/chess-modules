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
import { HeaderEntry, MoveHistory } from './pgnTypes';

/**
 * PgnGame class represents a pair of headers with a move history
 */
export class PgnGame {
  /** @readonly Returns the structured content found in the headers/tag-pairs. */
  readonly headers: HeaderEntry[];
  /** @readonly Returns the structured move text content. */
  readonly history: MoveHistory[];

  /** 
   * @constructor
   * Creates an empty game
   */
  constructor() {
    this.headers = [];
    this.history = [];
  }

  /**
   * Builds and returns a key-value map of headers as an object.
   * @returns {{string: string}} Returns a map of header values.
   */
  headersMap(): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    for (const header of this.headers) {
      if (header.name && header.value) {
        result[header.name] = header.value;
      }
    }
    return result;
  }

  /**
   * Filters the move history to only those that represent actual moves.
   * @returns {MoveHistory[]} Returns filtered set from history.
   */
  moves(): MoveHistory[] {
    return this.history.filter(m => m.san);
  }
}

export default PgnGame;