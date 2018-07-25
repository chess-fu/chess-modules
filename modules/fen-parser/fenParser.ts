
const matchFullFEN =
  /^\s*([prnbqkPRNBQK12345678]{1,8}(?:\/[prnbqkPRNBQK12345678]{1,8}){7})\s+(w|b)\s+([KQkqA-Ha-h]{1,4}|\-)\s+([a-h][36]|\-)\s+(\d{1,3})\s+(\d{1,4})\s*$/;

const fenExpand = /[1-8]+/g;
const fenPack = /\-+/g;
const fenSubst = { 1: '-', 2: '--', 3: '---', 4: '----', 5: '-----', 6: '------', 7: '-------', 8: '--------' };

export class FenParser {

  readonly original: string = '';
  readonly isValid: boolean = false;
  positions: string = '';
  ranks: string[] = [];
  turn: string = '';
  castles: string = '';
  enpass: string = '';
  halfmoveClock: number = 0;
  moveNumber: number = 0;

  static readonly isFen = (text: string) => (typeof text === 'string' && matchFullFEN.test(text));

  constructor(value: string) {
    this.original = (typeof value === 'string') ? value : '';
    const match = this.original.match(matchFullFEN);
    this.isValid = !!match;
    if (match) {
      this.positions = match[1];
      this.ranks = match[1].split('/').map(s => s.replace(fenExpand, i => fenSubst[i]));
      this.turn = match[2];
      this.castles = match[3];
      this.enpass = match[4];
      this.halfmoveClock = parseInt(match[5], 10);
      this.moveNumber = parseInt(match[6], 10);

      this.isValid = this.ranks.reduce((before, rank) => before && rank.length === 8, true);
    }
  }

  toString(): string {
    const positions = this.ranks.map(rank => rank.replace(fenPack, m => m.length.toString())).join('/');
    return `${positions} ${this.turn} ${this.castles} ${this.enpass} ${this.halfmoveClock} ${this.moveNumber}`;
  }

  hasPiece(piece: string) {
    return this.positions.indexOf(piece) >= 0;
  }

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