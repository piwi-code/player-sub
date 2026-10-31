import { describe, expect, it } from 'vitest';
import {
  bench,
  createMatch,
  finishMatch,
  formatDuration,
  startMatch,
  substitute,
  timeOnField,
  toggleStarter,
} from './match';

const T0 = 1_000_000;
const MIN = 60_000;

function liveMatch() {
  let m = createMatch(' Riverside ', [1, 2, 3], T0);
  m = toggleStarter(m, 1);
  m = toggleStarter(m, 2);
  return startMatch(m, T0);
}

describe('match', () => {
  it('creates a match in setup with nobody on the field', () => {
    const m = createMatch(' Riverside ', [1, 2, 3], T0);
    expect(m.opponent).toBe('Riverside');
    expect(m.status).toBe('setup');
    expect(bench(m)).toEqual([1, 2, 3]);
  });

  it('toggles starters only for squad players', () => {
    let m = createMatch('X', [1, 2], T0);
    m = toggleStarter(m, 1);
    m = toggleStarter(m, 99);
    expect(m.onField).toEqual([1]);
    m = toggleStarter(m, 1);
    expect(m.onField).toEqual([]);
  });

  it('tracks time on field across substitutions', () => {
    let m = liveMatch();
    m = substitute(m, 1, 3, T0 + 10 * MIN);
    expect(m.onField).toEqual([3, 2]);
    expect(bench(m)).toEqual([1]);
    m = finishMatch(m, T0 + 25 * MIN);

    const t = timeOnField(m, T0 + 99 * MIN);
    expect(t.get(1)).toBe(10 * MIN);
    expect(t.get(2)).toBe(25 * MIN);
    expect(t.get(3)).toBe(15 * MIN);
    expect(m.substitutions).toHaveLength(1);
  });

  it('rejects invalid substitutions', () => {
    const m = liveMatch();
    expect(() => substitute(m, 3, 1)).toThrow();
    expect(() => substitute(m, 1, 2)).toThrow();
  });

  it('formats durations as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(25 * MIN)).toBe('25:00');
  });
});
