import Dexie, { type EntityTable } from 'dexie';
import type { Match, Player } from './domain/types';

/**
 * Local IndexedDB storage via Dexie. All data stays on the device.
 *
 * To change the schema, add a new `this.version(n + 1).stores({...})` block
 * (and an `.upgrade()` if existing data needs migrating) — never edit an
 * existing version in place.
 */
export class PlayerSubDB extends Dexie {
  players!: EntityTable<Player, 'id'>;
  matches!: EntityTable<Match, 'id'>;

  constructor(name = 'player-sub') {
    super(name);
    this.version(1).stores({
      players: '++id, name',
      matches: '++id, createdAt, status',
    });
  }
}

export const db = new PlayerSubDB();

export async function addPlayer(name: string, database: PlayerSubDB = db): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Player name is required');
  return (await database.players.add({ name: trimmed, createdAt: Date.now() })) as number;
}

export async function renamePlayer(id: number, name: string, database: PlayerSubDB = db): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Player name is required');
  await database.players.update(id, { name: trimmed });
}

export async function removePlayer(id: number, database: PlayerSubDB = db): Promise<void> {
  await database.players.delete(id);
}

export async function saveMatch(match: Match, database: PlayerSubDB = db): Promise<number> {
  return (await database.matches.put(match)) as number;
}
