
export interface Offset {
  readonly x: number;
  readonly y: number;
}

export interface MoveType extends Offset {
  readonly rotate?: boolean;
  readonly repeat?: boolean;
  readonly when?: string;
}

export const WHEN_START_AND_EMPTY = 'ps';
export const WHEN_EMPTY = 'e';
export const WHEN_ATTACKING = 'a';

const MoveTable: { [key: string]: MoveType[] } = {
  wp: [
    { x: 0, y: -1, when: WHEN_EMPTY },
    { x: 0, y: -2, when: WHEN_START_AND_EMPTY },
    { x: 1, y: -1, when: WHEN_ATTACKING },
    { x: -1, y: -1, when: WHEN_ATTACKING }
  ],
  bp: [
    { x: 0, y: 1, when: WHEN_EMPTY },
    { x: 0, y: 2, when: WHEN_START_AND_EMPTY },
    { x: 1, y: 1, when: WHEN_ATTACKING },
    { x: -1, y: 1, when: WHEN_ATTACKING }
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