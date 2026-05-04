import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const DB_PATH = join(process.cwd(), 'data', 'nba.db');

export function openDatabase() {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      from_year INTEGER,
      to_year INTEGER,
      team TEXT DEFAULT 'NBA',
      source TEXT DEFAULT 'seeded',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
  `);
  return db;
}

export function databaseExists() {
  return existsSync(DB_PATH);
}

export function getPlayersFromDb() {
  if (!databaseExists()) return [];

  const db = openDatabase();
  try {
    return db.prepare(`
      SELECT
        id,
        name,
        from_year AS fromYear,
        to_year AS toYear,
        team
      FROM players
      ORDER BY name COLLATE NOCASE
    `).all();
  } finally {
    db.close();
  }
}

export function upsertPlayers(players, source = 'seeded') {
  const db = openDatabase();
  const insert = db.prepare(`
    INSERT INTO players (id, name, from_year, to_year, team, source, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      from_year = excluded.from_year,
      to_year = excluded.to_year,
      team = excluded.team,
      source = excluded.source,
      updated_at = CURRENT_TIMESTAMP
  `);

  try {
    db.exec('BEGIN');
    players.forEach((player) => {
      insert.run(
        Number(player.id),
        player.name,
        Number.isFinite(Number(player.fromYear)) ? Number(player.fromYear) : null,
        Number.isFinite(Number(player.toYear)) ? Number(player.toYear) : null,
        player.team || 'NBA',
        source
      );
    });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}
