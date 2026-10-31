import { afterEach, describe, expect, it } from 'vitest';
import { PlayerSubDB, addPlayer, removePlayer, renamePlayer, saveMatch } from './db';
import { createMatch } from './domain/match';

let database: PlayerSubDB;

afterEach(async () => {
  await database?.delete();
});

describe('db', () => {
  it('stores, renames and removes players', async () => {
    database = new PlayerSubDB('test-players');
    const id = await addPlayer('  Sam  ', database);
    expect((await database.players.get(id))?.name).toBe('Sam');

    await renamePlayer(id, 'Samira', database);
    expect((await database.players.get(id))?.name).toBe('Samira');

    await removePlayer(id, database);
    expect(await database.players.count()).toBe(0);
  });

  it('rejects blank names', async () => {
    database = new PlayerSubDB('test-blank');
    await expect(addPlayer('   ', database)).rejects.toThrow();
  });

  it('persists matches', async () => {
    database = new PlayerSubDB('test-matches');
    const id = await saveMatch(createMatch('Riverside', [1, 2]), database);
    const loaded = await database.matches.get(id);
    expect(loaded?.squad).toEqual([1, 2]);
    expect(loaded?.status).toBe('setup');
  });
});
