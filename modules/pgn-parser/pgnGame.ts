import { HeaderEntry, MoveHistory } from './pgnTypes';

export { HeaderEntry, MoveHistory };

export class PgnGame {
  readonly headers: HeaderEntry[];
  readonly history: MoveHistory[];

  constructor() {
    this.headers = [];
    this.history = [];
  }

  headersMap(): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    for (const header of this.headers) {
      if (header.name && header.value) {
        result[header.name] = header.value;
      }
    }
    return result;
  }

  moves(): MoveHistory[] {
    return this.history.filter(m => m.san);
  }
}

export default PgnGame;