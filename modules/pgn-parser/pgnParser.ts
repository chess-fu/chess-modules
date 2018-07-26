import { HeaderEntry, MoveHistory } from './pgnTypes';
import PgnGame from './pgnGame';
import { PgnDataCursor, PgnTokenType } from './pgnDataCursor';

export class PgnParser {
  parse(data: string): PgnGame[] {
    const games: PgnGame[] = [];
    const cursor = new PgnDataCursor(data);


    while (!cursor.isEOF()) {
      const game = new PgnGame();
      // Parse 1 game
      try {
        this.parseHeaders(cursor, game.headers);
        this.parseMoves(cursor, game.history);
      }
      finally {
        if (game.headers.length || game.history.length) {
          games.push(game);
        }
      }
      break;
    }
    return games;
  }

  parseHeaders(cursor: PgnDataCursor, headers: HeaderEntry[]) {
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

  parseMoves(cursor: PgnDataCursor, history: MoveHistory[], depth: number = 0) {
    let lastPos = -1;
    let comments: string[] = [];

    while (!cursor.isEOF()) {
      if (lastPos === cursor.position()) {
        cursor.throwError('No progress made');
        break;
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
        const move = this.parseMove(cursor);
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
        this.parseMoves(cursor, ravHistory, (depth || 0) + 1);
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
        return; // last move.
      }
    }
  }

  parseMove(cursor: PgnDataCursor): MoveHistory | null {
    const comments: string[] = [];
    const move: MoveHistory = {};

    let lastPos = -1;
    while (!cursor.isEOF()) {
      if (lastPos === cursor.position()) {
        cursor.throwError('No progress made');
        break;
      }
      lastPos = cursor.position();
      cursor.skipWhitespace(false, comments);

      const letter = cursor.peek();
      const token = cursor.peekToken();
      let temp: any;

      if (token === PgnTokenType.Newline) {
        cursor.read();
        if (cursor.peekToken() === PgnTokenType.Newline) {
          move.result = '*';
          break;
        }
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
          move.to = '...';
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
