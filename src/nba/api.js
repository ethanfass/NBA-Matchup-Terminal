import { num, getResultSet, rowsToObjects } from './compute.js';
import { TABLE_STATS, ADVANCED_STATS } from './constants.js';
import { findTeamRow } from './teams.js';

const NBA_REQUEST_TIMEOUT_MS = 120000;
const NBA_REQUEST_ATTEMPTS = 2;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  const status = Number(error?.statusCode || error?.status);
  return error?.name === 'AbortError' || status === 429 || status >= 500;
}

export async function nbaRequest(endpoint, params) {
  const url = new URL('/api/nba', window.location.origin);
  url.searchParams.set('endpoint', endpoint);

  Object.entries(params || {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  let lastError;

  for (let attempt = 0; attempt < NBA_REQUEST_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NBA_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        const error = new Error(`NBA API returned an unreadable response for ${endpoint}.`);
        error.statusCode = response.status || 502;
        throw error;
      }

      if (!response.ok) {
        const error = new Error(data.error || `NBA stats request failed for ${endpoint}.`);
        error.statusCode = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      lastError = error.name === 'AbortError'
        ? new Error(`NBA API timed out while loading ${endpoint}.`)
        : error;
      lastError.statusCode = error.statusCode || error.status;

      if (attempt === NBA_REQUEST_ATTEMPTS - 1 || !isRetryableError(lastError)) {
        throw lastError;
      }

      await wait(450 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

export async function loadPlayerShotChart(playerId, seasonId, seasonType) {
  if (!playerId || !seasonId) return { shots: [], leagueAverages: [] };

  const data = await nbaRequest('shotchartdetail', {
    ContextMeasure: 'FGA',
    LastNGames: '0',
    LeagueID: '00',
    Month: '0',
    OpponentTeamID: '0',
    Period: '0',
    PlayerID: playerId,
    Season: seasonId,
    SeasonType: seasonType,
    TeamID: '0',
    AheadBehind: '',
    ClutchTime: '',
    College: '',
    Conference: '',
    Country: '',
    DateFrom: '',
    DateTo: '',
    Division: '',
    DraftPick: '',
    DraftYear: '',
    GameSegment: '',
    Height: '',
    Location: '',
    Outcome: '',
    PORound: '0',
    PlayerPosition: '',
    PointDiff: '',
    Position: '',
    RookieYear: '',
    SeasonSegment: '',
    StartPeriod: '',
    EndPeriod: '',
    StartRange: '0',
    EndRange: '0',
    RangeType: '0',
    VsConference: '',
    VsDivision: ''
  });

  return {
    shots: rowsToObjects(getResultSet(data, 'Shot_Chart_Detail')),
    leagueAverages: rowsToObjects(getResultSet(data, 'LeagueAverages'))
  };
}

export async function loadPlayerClutch(playerId, seasonId, seasonType) {
  if (!playerId || !seasonId) return { rows: [] };

  const data = await nbaRequest('playerdashboardbyclutch', {
    PlayerID: playerId,
    LeagueID: '00',
    Season: seasonId,
    SeasonType: seasonType,
    PerMode: 'PerGame',
    MeasureType: 'Base',
    PlusMinus: 'N',
    PaceAdjust: 'N',
    Rank: 'N',
    Outcome: '',
    Location: '',
    Month: '0',
    SeasonSegment: '',
    DateFrom: '',
    DateTo: '',
    OpponentTeamID: '0',
    VsConference: '',
    VsDivision: '',
    GameSegment: '',
    Period: '0',
    LastNGames: '0',
    AheadBehind: '',
    PointDiff: '',
    ClutchTime: 'Last 5 Minutes'
  });

  const labels = {
    Last5Min5PointPlayerDashboard: 'Final 5 min, within 5',
    Last3Min5PointPlayerDashboard: 'Final 3 min, within 5',
    Last1Min5PointPlayerDashboard: 'Final 1 min, within 5',
    Last5MinPlusMinus5PointPlayerDashboard: 'Final 5 min, +/- 5'
  };

  const rows = (data?.resultSets || [])
    .filter((set) => labels[set.name])
    .map((set) => {
      const row = rowsToObjects(set)[0];
      return row ? { ...row, label: labels[set.name] } : null;
    })
    .filter(Boolean);

  return { rows };
}

export async function loadPlayerDefense(playerId, seasonId, seasonType) {
  if (!playerId || !seasonId) return { rows: [] };

  const data = await nbaRequest('playerdashptshotdefend', {
    PlayerID: playerId,
    LeagueID: '00',
    Season: seasonId,
    SeasonType: seasonType,
    PerMode: 'PerGame',
    TeamID: '0',
    Outcome: '',
    Location: '',
    Month: '0',
    SeasonSegment: '',
    DateFrom: '',
    DateTo: '',
    OpponentTeamID: '0',
    VsConference: '',
    VsDivision: '',
    GameSegment: '',
    Period: '0',
    LastNGames: '0'
  });

  const rows = rowsToObjects(getResultSet(data, 'DefendingShots'))
    .filter((row) => row.DEFENSE_CATEGORY && row.DEFENSE_CATEGORY !== 'Overall');

  return { rows };
}

export async function loadMatchupDirection(offPlayerId, defPlayerId, seasonId, seasonType) {
  const data = await nbaRequest('leagueseasonmatchups', {
    LeagueID: '00',
    Season: seasonId,
    SeasonType: seasonType,
    OffPlayerID: offPlayerId,
    DefPlayerID: defPlayerId,
    PerMode: 'Totals'
  });

  return rowsToObjects(getResultSet(data, 'SeasonMatchups'));
}

export async function loadHeadToHead(firstPlayerId, secondPlayerId, firstSeason, secondSeason, seasonType) {
  if (!firstPlayerId || !secondPlayerId) {
    return { rows: [], reason: 'Pick two players to load true matchup tracking.' };
  }

  if (!firstSeason || !secondSeason || firstSeason !== secondSeason) {
    return { rows: [], reason: 'Choose the same tracked season for both players to load true matchup data.' };
  }

  const [firstOnSecond, secondOnFirst] = await Promise.all([
    loadMatchupDirection(firstPlayerId, secondPlayerId, firstSeason, seasonType),
    loadMatchupDirection(secondPlayerId, firstPlayerId, firstSeason, seasonType)
  ]);

  const rows = [...firstOnSecond, ...secondOnFirst].filter(Boolean);

  return {
    rows,
    reason: rows.length ? '' : 'No direct matchup possessions returned for this pair and season.'
  };
}

async function loadGameLogsBySeason(request, seasonIds, batchSize = 1) {
  const rows = [];

  for (let index = 0; index < seasonIds.length; index += batchSize) {
    const batch = seasonIds.slice(index, index + batchSize);
    const batchLogs = await Promise.allSettled(
      batch.map((seasonId) => loadGameLog({ ...request, scope: 'season', seasonId }))
    );

    rows.push(...batchLogs.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])));
  }

  return rows;
}

export async function loadGameLog(request) {
  if (request.scope === 'alltime') {
    const seasonIds = Array.from(new Set(request.seasonIds || []));
    const rows = await loadGameLogsBySeason(request, seasonIds);

    return rows.sort((a, b) => new Date(b.GAME_DATE) - new Date(a.GAME_DATE));
  }

  const data = await nbaRequest('playergamelog', {
    PlayerID: request.playerId,
    Season: request.seasonId,
    SeasonType: request.seasonType,
    LeagueID: '00'
  });

  return rowsToObjects(getResultSet(data, 'PlayerGameLog'));
}

export async function loadSeasonStandings(seasonId) {
  const data = await nbaRequest('leaguestandingsv3', {
    LeagueID: '00',
    Season: seasonId,
    SeasonType: 'Regular Season'
  });

  return rowsToObjects(getResultSet(data, 'Standings'));
}

export function getTeamDashParams(seasonId, seasonType, measureType) {
  return {
    LeagueID: '00',
    Season: seasonId,
    SeasonType: seasonType,
    MeasureType: measureType,
    PerMode: 'PerGame',
    Conference: '',
    DateFrom: '',
    DateTo: '',
    Division: '',
    GameScope: '',
    GameSegment: '',
    LastNGames: '0',
    Location: '',
    Month: '0',
    OpponentTeamID: '0',
    Outcome: '',
    PORound: '0',
    PaceAdjust: 'N',
    Period: '0',
    PlayerExperience: '',
    PlayerPosition: '',
    PlusMinus: 'N',
    Rank: 'N',
    SeasonSegment: '',
    ShotClockRange: '',
    StarterBench: '',
    TeamID: '0',
    TwoWay: '0',
    VsConference: '',
    VsDivision: ''
  };
}

export async function loadTeamContext(request) {
  const [advancedResult, yearByYearResult] = await Promise.allSettled([
    nbaRequest('leaguedashteamstats', getTeamDashParams(request.seasonId, 'Regular Season', 'Advanced')),
    nbaRequest('teamyearbyyearstats', { TeamID: request.teamId, LeagueID: '00' })
  ]);

  if (advancedResult.status !== 'fulfilled') {
    throw advancedResult.reason;
  }

  const advancedRows = rowsToObjects(getResultSet(advancedResult.value, 'LeagueDashTeamStats'));
  const yearRows = yearByYearResult.status === 'fulfilled'
    ? rowsToObjects(getResultSet(yearByYearResult.value, 'TeamStats'))
    : [];
  const seasonTag = String(request.seasonId || '').trim();
  const year = yearRows.find((row) => {
    const keys = [row.YEAR, row.SEASON_ID, row.SEASON].map((value) => String(value || '').trim());
    if (keys.includes(seasonTag)) return true;

    const seasonStart = Number(seasonTag.slice(0, 4));
    const rowStart = Number((keys.find((value) => /^\d{4}/.test(value)) || '').slice(0, 4));
    return Number.isFinite(seasonStart) && Number.isFinite(rowStart) && seasonStart === rowStart;
  }) || null;

  return {
    regular: findTeamRow(advancedRows, request.teamId, request.teamAbbreviation),
    year
  };
}

export function allTimeStatKey(name = '') {
  const match = String(name).match(/^(.+)Leaders$/);
  return match ? match[1] : '';
}

function getStatRequiredKeys(stat) {
  const requirements = {
    TS_PCT: ['PTS', 'FGA', 'FTA'],
    EFG_PCT: ['FGM', 'FG3M', 'FGA'],
    FG3A_RATE: ['FG3A', 'FGA'],
    FT_RATE: ['FTA', 'FGA'],
    AST_TO: ['AST', 'TOV'],
    STOCKS: ['STL', 'BLK'],
    PTS_PER_36: ['PTS', 'MIN'],
    AST_PER_36: ['AST', 'MIN'],
    REB_PER_36: ['REB', 'MIN']
  };

  return requirements[stat.key] || [];
}

function rankRowsByStat(rows, stat) {
  const requiredKeys = getStatRequiredKeys(stat);
  const values = rows
    .map((row) => {
      const playerId = Number(row.PLAYER_ID);
      if (!playerId) return null;

      if (
        stat.compute &&
        requiredKeys.length &&
        !requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(row, key))
      ) {
        return null;
      }

      const value = stat.compute
        ? stat.compute(row)
        : Object.prototype.hasOwnProperty.call(row, stat.key)
          ? num(row[stat.key])
          : null;

      if (!Number.isFinite(value)) return null;
      return { playerId, value };
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value);

  const ranks = {};
  let currentRank = 0;
  let previousValue = null;

  values.forEach((entry, index) => {
    if (previousValue === null || Math.abs(entry.value - previousValue) > 0.0001) {
      currentRank = index + 1;
      previousValue = entry.value;
    }
    ranks[entry.playerId] = currentRank;
  });

  return ranks;
}

function buildComputedRankings(rows, stats = [...TABLE_STATS, ...ADVANCED_STATS], existingRanks = {}) {
  return stats.reduce((rankSets, stat) => {
    if (existingRanks[stat.key]) return rankSets;

    const ranked = rankRowsByStat(rows, stat);
    if (Object.keys(ranked).length) {
      rankSets[stat.key] = ranked;
    }

    return rankSets;
  }, {});
}

function buildAllTimeRankings(data) {
  const ranks = {};
  const playerRows = new Map();

  (data?.resultSets || []).forEach((set) => {
    const statKey = allTimeStatKey(set.name);
    if (!statKey) return;

    const rows = rowsToObjects(set);
    const rankKey = `${statKey}_RANK`;

    rows.forEach((row) => {
      const playerId = Number(row.PLAYER_ID);
      if (!playerId) return;

      const rank = Number(row[rankKey]);
      if (Number.isFinite(rank)) {
        ranks[statKey] = ranks[statKey] || {};
        ranks[statKey][playerId] = rank;
      }

      const playerRow = playerRows.get(playerId) || { PLAYER_ID: playerId };
      playerRow[statKey] = num(row[statKey]);
      playerRows.set(playerId, playerRow);
    });
  });

  return {
    ...ranks,
    ...buildComputedRankings(Array.from(playerRows.values()), ADVANCED_STATS, ranks)
  };
}

export async function loadRankings(request) {
  if (request.scope === 'alltime') {
    const data = await nbaRequest('alltimeleadersgrids', {
      LeagueID: '00',
      PerMode: request.perMode === 'totals' ? 'Totals' : 'PerGame',
      SeasonType: request.seasonType,
      TopX: '250'
    });

    return buildAllTimeRankings(data);
  }

  const data = await nbaRequest('leagueleaders', {
    LeagueID: '00',
    PerMode: request.perMode === 'totals' ? 'Totals' : 'PerGame',
    Scope: 'S',
    Season: request.seasonId,
    SeasonType: request.seasonType,
    StatCategory: 'PTS'
  });
  const rows = rowsToObjects(getResultSet(data, 'LeagueLeaders'));

  return buildComputedRankings(rows);
}
