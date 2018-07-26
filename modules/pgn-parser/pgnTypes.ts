
export interface HeaderEntry {
  name?: string;
  value?: string;
  comments?: string[];
}

export interface MoveHistory {
  number?: number;
  san?: string;
  from?: string;
  to?: string;
  piece?: string;
  nag?: string;
  rav?: MoveHistory[];
  check?: string;
  capture?: boolean;
  promotion?: string;
  annotations?: string;
  comments?: string[];
  result?: string;
  unknown?: string;
}
