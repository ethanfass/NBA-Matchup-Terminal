import { CURRENT_SEASON } from '../src/nba/constants.js';
import { getResultSet, rowsToObjects } from '../src/nba/compute.js';
import { DB_PATH, upsertPlayers } from '../server/db.js';
import { fetchNbaStats } from '../server/nbaProxy.js';

const data = await fetchNbaStats('commonallplayers', new URLSearchParams({
  LeagueID: '00',
  Season: CURRENT_SEASON,
  IsOnlyCurrentSeason: '0'
}));

const players = rowsToObjects(getResultSet(data, 'CommonAllPlayers'))
  .filter((row) => row.GAMES_PLAYED_FLAG === 'Y')
  .map((row) => ({
    id: Number(row.PERSON_ID),
    name: row.DISPLAY_FIRST_LAST,
    fromYear: Number(row.FROM_YEAR),
    toYear: Number(row.TO_YEAR),
    team: row.TEAM_ABBREVIATION || 'NBA'
  }))
  .filter((player) => Number.isFinite(player.id) && player.name)
  .sort((a, b) => a.name.localeCompare(b.name));

if (players.length < 1000) {
  throw new Error(`NBA player index returned only ${players.length} players; refusing to replace the local index.`);
}

upsertPlayers(players, 'nba-api');

console.log(`Synced ${players.length} NBA players into ${DB_PATH}`);
