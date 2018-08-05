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

export const WHITE = 'w';
export const BLACK = 'b';

export const PAWN = 'p';
export const ROOK = 'r';
export const KNIGHT = 'n';
export const BISHOP = 'b';
export const QUEEN = 'q';
export const KING = 'k';

export const PLUS = '+';
export const HASH = '#';
export const NONE = '-';
export const SLASH = '/';
export const SAN_CAPTURE = 'x';

export const WKING = KING.toUpperCase();
export const BKING = KING.toLowerCase();

export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 8;
export const BOARD_SIZE = BOARD_WIDTH * BOARD_HEIGHT;

export const CASTLE_QUEEN_OFFSETX = 2;
export const CASTLE_KING_OFFSETX = 6;

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const WHITE_WINS = '1-0';
export const BLACK_WINS = '1-0';
export const DRAW = '1/2-1/2';
export const ONGOING = '*';

export const STANDARD_PGN_HEADERS = ['SetUp', 'FEN', 'Event', 'Site', 'Date', 'Time', 'UTCDate', 'UTCTime', 'Round', 'White', 'Black', 'Result'];
