/** A player on the club roster. Persisted across matches. */
export interface Player {
  id?: number;
  name: string;
  createdAt: number;
}

/** A continuous period a player spent on the field. `end` is undefined while still on. */
export interface Stint {
  playerId: number;
  start: number;
  end?: number;
}

export type MatchStatus = 'setup' | 'live' | 'finished';

export interface Match {
  id?: number;
  opponent: string;
  createdAt: number;
  status: MatchStatus;
  /** Players selected for this match. */
  squad: number[];
  /** Subset of `squad` currently on the field. */
  onField: number[];
  stints: Stint[];
  substitutions: Substitution[];
}

export interface Substitution {
  at: number;
  playerOut: number;
  playerIn: number;
}
