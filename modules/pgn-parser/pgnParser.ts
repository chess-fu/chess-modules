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
import PgnGame from './pgnGame';
import { HeaderEntry, MoveHistory } from './pgnTypes';
import { PgnDataCursor, PgnTokenType } from './pgnDataCursor';

/**
 * Provides the main entry-point for parsing PGN chess game data, either single-game or 
 * a series of games.
 */
export class PgnParser {

  /**
   * @constructor
   * Creates the PgnParser class
   */
  constructor() { }

  /**
   * Parses a string of PGN data and returns the games found.
   * @param {string} data The PGN data string
   * @param {number} [offset] Optional offset into the string to start from
   * @param {number} [limit] Optional offset into the string to end at
   * @returns {PgnGame[]} The parsed game data
   */
  parse(data: string, offset?: number, limit?: number): PgnGame[] {
    const games: PgnGame[] = [];
    const cursor = new PgnDataCursor(data, offset, limit);
    let lastPos = -1;

    while (!cursor.isEOF()) {
      if (lastPos === cursor.position()) {
        return cursor.throwError('No progress made'); // safety check
      }
      lastPos = cursor.position();

      const game = new PgnGame();
      // Parse 1 game
      try {
        this._parseHeaders(cursor, game.headers);
        this._parseMoves(cursor, game.history);
      }
      finally {
        if (game.headers.length || game.history.length) {
          games.push(game);
        }
      }
    }
    return games;
  }

  /**
   * Parses a string of PGN data and reads only the headers (Tag Pairs).
   * @param {string} data The PGN data string
   * @param {number} [offset] Optional offset into the string to start from
   * @param {number} [limit] Optional offset into the string to end at
   * @returns {HeaderEntry[]} The parsed game header and comments
   */
  parseHeaders(data: string, offset?: number, limit?: number): HeaderEntry[] {
    const cursor = new PgnDataCursor(data, offset, limit);
    const result: HeaderEntry[] = [];
    this._parseHeaders(cursor, result);
    return result;
  }

  /**
   * Parses a string of PGN game moves and returns the structured data.
   * @param {string} data The PGN data string
   * @param {number} [offset] Optional offset into the string to start from
   * @param {number} [limit] Optional offset into the string to end at
   * @returns {MoveHistory[]} The parsed game moves, comments, and result
   */
  parseMoves(data: string, offset?: number, limit?: number): MoveHistory[] {
    const cursor = new PgnDataCursor(data, offset, limit);
    const result: MoveHistory[] = [];
    this._parseMoves(cursor, result);
    return result;
  }

  /**
   * Parses a single PGN game move and returns the structured data.
   * @param {string} data The PGN data string
   * @param {number} [offset] Optional offset into the string to start from
   * @param {number} [limit] Optional offset into the string to end at
   * @returns {MoveHistory} The parsed game move
   */
  parseMove(data: string, offset?: number, limit?: number): MoveHistory | null {
    const cursor = new PgnDataCursor(data, offset, limit);
    const result: MoveHistory | null = this._parseMove(cursor);
    return result;
  }

  /** @private */
  private _parseHeaders(cursor: PgnDataCursor, headers: HeaderEntry[]) {
    while (!cursor.isEOF()) {
      const comments: string[] = [];
      cursor.skipWhitespace(true, comments);
      if (comments.length) {
        headers.push({ comments });
      }
      if (cursor.peekToken() === PgnTokenType.TagPairStart) {
        const tag = cursor.readTagPair();
        if (tag) {
          headers.push(tag);
        }
      }
      else {
        return; // last header.
      }
    }
  }

  /** @private */
  private _parseMoves(cursor: PgnDataCursor, history: MoveHistory[], depth: number = 0) {
    let lastPos = -1;
    let comments: string[] = [];

    while (!cursor.isEOF()) {
      if (lastPos === cursor.position()) {
        return cursor.throwError('No progress made'); // safety check
      }
      lastPos = cursor.position();

      cursor.skipWhitespace(false, comments);
      const token = cursor.peekToken();

      if (comments.length) {
        history.push({ comments });
        comments = [];
      }

      if (token === PgnTokenType.Newline) {
        cursor.read();
        if (cursor.peekToken() === PgnTokenType.Newline) {
          return; // done.
        }
        else {
          continue; // start over. ^^^
        }
      }

      // Nearly all possible move entries start with either a number, or a letter
      if (token === PgnTokenType.SymbolChar || token === PgnTokenType.Asterisks) {
        const move = this._parseMove(cursor);
        if (move) {
          history.push(move);
        }
        if (move && move.result) {
          break;
        }
      }
      else if (token === PgnTokenType.RavStart) {
        cursor.read();
        const ravHistory: MoveHistory[] = [];
        // Recursive parser
        this._parseMoves(cursor, ravHistory, (depth || 0) + 1);
        const prevMove = history.length > 0 ? history[history.length - 1] : undefined;
        if (prevMove && !prevMove.rav) {
          prevMove.rav = ravHistory;
        }
        else {
          history.push({ rav: ravHistory });
        }
      }
      else if (token === PgnTokenType.RavEnd) {
        if (depth <= 0) {
          cursor.throwError('Unexpected close of RAV');
        }
        cursor.read();
        break;
      }
      else {
        if (token === PgnTokenType.EndOfFile) {
          return; // last move.
        }
        else {
          return cursor.throwError(`Expected move text, found "${cursor.peek()}"`);
        }
      }
    }
  }

  /** @private */
  private _parseMove(cursor: PgnDataCursor): MoveHistory | null {
    const comments: string[] = [];
    const move: MoveHistory = {};

    let lastPos = -1;
    while (!cursor.isEOF()) {
      if (lastPos === cursor.position()) {
        return cursor.throwError('No progress made'); // safety check
      }
      lastPos = cursor.position();
      cursor.skipWhitespace(false, comments);

      const letter = cursor.peek();
      const token = cursor.peekToken();
      let temp: any;

      if (token === PgnTokenType.Newline) {
        break;
      }
      else if (letter >= '0' && letter <= '9') {
        // Assumption: SAN should not begin with a number, thus this is a move number
        temp = letter > '1' ? undefined :
          letter === '0' ? cursor.peekExact('0-1') :
            (cursor.peekExact('1-0') || cursor.peekExact('1/2-1/2'));
        if (temp) {
          cursor.seek(temp.length);
          move.result = temp;
          break;
        }

        const moveNum = cursor.readNumber();
        if (moveNum) {
          move.number = moveNum;
          cursor.readAll('.');
        }
      }
      else if (token === PgnTokenType.Asterisks) {
        move.result = cursor.read();
        break;
      }
      else if (token === PgnTokenType.FullStop) {
        if (cursor.peekExact('...')) {
          cursor.readAll('.', 3);
          move.raw = move.to = '...';
          break;
        }
      }
      else if (token === PgnTokenType.SymbolChar) {
        // move text, a4 or Rxc7! etc. ... a-h, x, prnbqk, o, 0-8, +, #, [?!]{1,2}, =, -, $0-255, 
        const data = cursor.readMoveText();
        if (data) {
          (Object as any).assign(move, data);
          break;
        }
        cursor.throwError('Expected move notation');
      }
      else {
        return null;
      }
    }

    cursor.skipWhitespace(false, comments);
    if (comments.length) {
      move.comments = comments;
    }
    return move;
  }
}

export default PgnParser;
