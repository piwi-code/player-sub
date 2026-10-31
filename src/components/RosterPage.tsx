import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addPlayer, db, removePlayer, renamePlayer } from '../db';

export function RosterPage() {
  const players = useLiveQuery(() => db.players.orderBy('name').toArray(), []);
  const [name, setName] = useState('');

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setName('');
    await addPlayer(name);
  };

  const onRename = async (id: number, current: string) => {
    const next = prompt('Rename player', current);
    if (next && next.trim() && next !== current) await renamePlayer(id, next);
  };

  const onRemove = async (id: number, playerName: string) => {
    if (confirm(`Remove ${playerName} from the roster?`)) await removePlayer(id);
  };

  return (
    <section>
      <h2>Players</h2>
      <form className="inline-form" onSubmit={onAdd}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          aria-label="Player name"
          autoComplete="off"
        />
        <button type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>

      {players === undefined ? null : players.length === 0 ? (
        <p className="muted">No players yet. Add your squad above — names are saved on this device.</p>
      ) : (
        <ul className="list">
          {players.map((p) => (
            <li key={p.id}>
              <span className="grow">{p.name}</span>
              <button className="secondary" onClick={() => onRename(p.id!, p.name)}>
                Rename
              </button>
              <button className="danger" onClick={() => onRemove(p.id!, p.name)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
