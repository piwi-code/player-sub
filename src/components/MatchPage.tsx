import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveMatch } from '../db';
import {
  bench,
  createMatch,
  finishMatch,
  formatDuration,
  startMatch,
  substitute,
  timeOnField,
  toggleStarter,
} from '../domain/match';
import type { Match, Player } from '../domain/types';
import { useNow } from './useNow';

export function MatchPage() {
  const players = useLiveQuery(() => db.players.orderBy('name').toArray(), []);
  const current = useLiveQuery(
    async () => (await db.matches.where('status').anyOf('setup', 'live').reverse().sortBy('createdAt'))[0] ?? null,
    [],
  );
  const recent = useLiveQuery(
    () => db.matches.where('status').equals('finished').reverse().sortBy('createdAt'),
    [],
  );

  if (players === undefined || current === undefined) return null;

  const names = new Map(players.map((p) => [p.id!, p.name]));

  return (
    <>
      {current ? <ActiveMatch match={current} names={names} /> : <NewMatchForm players={players} />}
      {recent && recent.length > 0 && (
        <section>
          <h2>Recent matches</h2>
          <ul className="list">
            {recent.slice(0, 5).map((m) => (
              <li key={m.id}>
                <span className="grow">vs {m.opponent || 'Unknown'}</span>
                <span className="muted">{new Date(m.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function NewMatchForm({ players }: { players: Player[] }) {
  const [opponent, setOpponent] = useState('');
  const [selected, setSelected] = useState<Set<number>>(() => new Set(players.map((p) => p.id!)));

  if (players.length === 0) {
    return (
      <section>
        <h2>New match</h2>
        <p className="muted">Add some players on the Players tab first.</p>
      </section>
    );
  }

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const squad = players.map((p) => p.id!).filter((id) => selected.has(id));
    await saveMatch(createMatch(opponent, squad));
  };

  return (
    <section>
      <h2>New match</h2>
      <form onSubmit={onCreate}>
        <label className="field">
          Opponent
          <input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g. Riverside U11" />
        </label>
        <p className="muted">Who's available today?</p>
        <ul className="list">
          {players.map((p) => (
            <li key={p.id}>
              <label className="grow check">
                <input type="checkbox" checked={selected.has(p.id!)} onChange={() => toggle(p.id!)} />
                {p.name}
              </label>
            </li>
          ))}
        </ul>
        <button type="submit" disabled={selected.size === 0}>
          Create match ({selected.size} players)
        </button>
      </form>
    </section>
  );
}

function ActiveMatch({ match, names }: { match: Match; names: Map<number, string> }) {
  const now = useNow(match.status === 'live');
  const [pendingOff, setPendingOff] = useState<number | null>(null);
  const times = timeOnField(match, now);
  const nameOf = (id: number) => names.get(id) ?? 'Removed player';
  const update = (next: Match) => saveMatch(next);

  const onFieldTap = (id: number) => {
    if (match.status === 'setup') return update(toggleStarter(match, id));
    setPendingOff((cur) => (cur === id ? null : id));
  };

  const onBenchTap = async (id: number) => {
    if (match.status === 'setup') return update(toggleStarter(match, id));
    if (pendingOff === null) return;
    await update(substitute(match, pendingOff, id));
    setPendingOff(null);
  };

  const onCancel = async () => {
    if (confirm('Discard this match?')) await db.matches.delete(match.id!);
  };

  const onFinish = async () => {
    if (confirm('Finish the match?')) await update(finishMatch(match));
  };

  // Least time on field first, so it's obvious who should go on next.
  const byTime = (a: number, b: number) => (times.get(a) ?? 0) - (times.get(b) ?? 0);

  return (
    <section>
      <h2>
        vs {match.opponent || 'Unknown'} <span className="badge">{match.status}</span>
      </h2>

      {match.status === 'setup' ? (
        <p className="muted">Tap players to move them between the field and the bench, then start.</p>
      ) : pendingOff !== null ? (
        <p className="hint">Now tap a bench player to replace {nameOf(pendingOff)}.</p>
      ) : (
        <p className="muted">Tap a fielder, then a bench player, to make a substitution.</p>
      )}

      <h3>On field ({match.onField.length})</h3>
      <ul className="list players">
        {[...match.onField].sort(byTime).map((id) => (
          <li key={id}>
            <button className={`player ${pendingOff === id ? 'selected' : ''}`} onClick={() => onFieldTap(id)}>
              <span className="grow">{nameOf(id)}</span>
              <span className="time">{formatDuration(times.get(id) ?? 0)}</span>
            </button>
          </li>
        ))}
      </ul>

      <h3>Bench ({bench(match).length})</h3>
      <ul className="list players">
        {bench(match)
          .sort(byTime)
          .map((id) => (
            <li key={id}>
              <button
                className={`player bench ${pendingOff !== null ? 'target' : ''}`}
                onClick={() => onBenchTap(id)}
              >
                <span className="grow">{nameOf(id)}</span>
                <span className="time">{formatDuration(times.get(id) ?? 0)}</span>
              </button>
            </li>
          ))}
      </ul>

      <div className="actions">
        {match.status === 'setup' ? (
          <>
            <button className="secondary" onClick={onCancel}>
              Discard
            </button>
            <button onClick={() => update(startMatch(match))} disabled={match.onField.length === 0}>
              Start match
            </button>
          </>
        ) : (
          <button className="danger" onClick={onFinish}>
            Finish match
          </button>
        )}
      </div>
    </section>
  );
}
