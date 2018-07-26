
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
  capture?: boolean;
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
