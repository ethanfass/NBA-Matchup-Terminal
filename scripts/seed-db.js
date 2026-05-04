import { fallbackPlayers } from '../src/nba/fallbackData.js';
import { DB_PATH, upsertPlayers } from '../server/db.js';

upsertPlayers(fallbackPlayers, 'seeded');

console.log(`Seeded ${fallbackPlayers.length} players into ${DB_PATH}`);
