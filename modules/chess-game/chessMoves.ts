
export interface Offset {
  readonly x: number;
  readonly y: number;
}

export interface MoveType extends Offset {
  readonly rotate?: boolean;
  readonly repeat?: boolean;
  readonly when?: string;
}

const MoveTable: { [key: string]: MoveType[] } = {
  wp: [{ x: 0, y: -1, when: 'empty' }, { x: 0, y: -2, when: 'start&empty' }, { x: 1, y: -1, when: 'attack' }, { x: -1, y: -1, when: 'attack' }],
  bp: [{ x: 0, y: 1, when: 'empty' }, { x: 0, y: 2, when: 'start&empty' }, { x: 1, y: 1, when: 'attack' }, { x: -1, y: 1, when: 'attack' }],
  r: [{ x: 0, y: 1, rotate: true, repeat: true }],
  n: [{ x: 2, y: 1, rotate: true }, { x: 1, y: 2, rotate: true }],
  b: [{ x: 1, y: 1, rotate: true, repeat: true }],
  q: [{ x: 0, y: 1, rotate: true, repeat: true }, { x: 1, y: 1, rotate: true, repeat: true }],
  k: [{ x: 0, y: 1, rotate: true }, { x: 1, y: 1, rotate: true }, { x: 0, y: 0, when: 'castle' }],
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