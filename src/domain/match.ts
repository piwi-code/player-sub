import type { Match, Stint } from './types';

/**
 * Pure match logic. Every function returns a new Match rather than mutating,
 * so it is easy to test and to persist straight back to IndexedDB.
 */

export function createMatch(opponent: string, squad: number[], now = Date.now()): Match {
  return {
    opponent: opponent.trim(),
    createdAt: now,
    status: 'setup',
    squad: [...squad],
    onField: [],
    stints: [],
    substitutions: [],
  };
}

/** Before kick-off, move a squad player between field and bench. */
export function toggleStarter(match: Match, playerId: number): Match {
  if (match.status !== 'setup' || !match.squad.includes(playerId)) return match;
  const onField = match.onField.includes(playerId)
    ? match.onField.filter((id) => id !== playerId)
    : [...match.onField, playerId];
  return { ...match, onField };
}

export function startMatch(match: Match, now = Date.now()): Match {
  if (match.status !== 'setup') return match;
  return {
    ...match,
    status: 'live',
    stints: match.onField.map((playerId) => ({ playerId, start: now })),
  };
}

export function substitute(match: Match, playerOut: number, playerIn: number, now = Date.now()): Match {
  if (match.status !== 'live') return match;
  if (!match.onField.includes(playerOut)) throw new Error('Player going off is not on the field');
  if (!match.squad.includes(playerIn) || match.onField.includes(playerIn)) {
    throw new Error('Player coming on must be on the bench');
  }
  return {
    ...match,
    onField: match.onField.map((id) => (id === playerOut ? playerIn : id)),
    stints: [...closeStints(match.stints, [playerOut], now), { playerId: playerIn, start: now }],
    substitutions: [...match.substitutions, { at: now, playerOut, playerIn }],
  };
}

export function finishMatch(match: Match, now = Date.now()): Match {
  if (match.status !== 'live') return match;
  return { ...match, status: 'finished', stints: closeStints(match.stints, match.onField, now) };
}

export function bench(match: Match): number[] {
  return match.squad.filter((id) => !match.onField.includes(id));
}

/** Total milliseconds each squad player has spent on the field. */
export function timeOnField(match: Match, now = Date.now()): Map<number, number> {
  const totals = new Map<number, number>(match.squad.map((id) => [id, 0]));
  for (const s of match.stints) {
    totals.set(s.playerId, (totals.get(s.playerId) ?? 0) + ((s.end ?? now) - s.start));
  }
  return totals;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function closeStints(stints: Stint[], playerIds: number[], now: number): Stint[] {
  return stints.map((s) => (s.end === undefined && playerIds.includes(s.playerId) ? { ...s, end: now } : s));
}
