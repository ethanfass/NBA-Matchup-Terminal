import { CAREER_COUNT_KEYS } from './constants.js';

export function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatOne(value) {
  const parsed = num(value);
  return parsed.toLocaleString(undefined, {
    maximumFractionDigits: Number.isInteger(parsed) ? 0 : 1,
    minimumFractionDigits: Number.isInteger(parsed) ? 0 : 1
  });
}

export function formatPct(value) {
  return `${(num(value) * 100).toFixed(1)}%`;
}

export function formatTotal(value) {
  return Math.round(num(value)).toLocaleString();
}

export function formatSigned(value) {
  const parsed = num(value);
  return `${parsed > 0 ? '+' : ''}${formatOne(parsed)}`;
}

export function formatSignedPct(value) {
  const parsed = num(value);
  return `${parsed > 0 ? '+' : ''}${formatPct(parsed)}`;
}

export function computeTS(season) {
  const denom = 2 * (num(season.FGA) + 0.44 * num(season.FTA));
  return denom > 0 ? num(season.PTS) / denom : 0;
}

export function normalizeSearch(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function findPlayer(players, query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return null;
  return (
    players.find((player) => normalizeSearch(player.name) === normalized) ||
    players.find((player) => normalizeSearch(player.name).includes(normalized))
  );
}

export function mergePlayers(remote, seeded) {
  const byId = new Map();
  [...seeded, ...remote].forEach((player) => byId.set(player.id, { ...byId.get(player.id), ...player }));
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function parseSeason(season = '') {
  const str = String(season);
  const full = str.match(/\d{4}/);
  if (full) return Number(full[0]);
  const short = str.match(/\b(\d{2})-\d{2}\b/);
  if (short) return 2000 + Number(short[1]);
  return 0;
}

export function normalizeSeason(row) {
  return {
    ...row,
    GP: num(row.GP),
    GS: num(row.GS),
    MIN: num(row.MIN),
    FGM: num(row.FGM),
    FGA: num(row.FGA),
    FG_PCT: num(row.FG_PCT),
    FG3M: num(row.FG3M),
    FG3A: num(row.FG3A),
    FG3_PCT: num(row.FG3_PCT),
    FTM: num(row.FTM),
    FTA: num(row.FTA),
    FT_PCT: num(row.FT_PCT),
    OREB: num(row.OREB),
    DREB: num(row.DREB),
    REB: num(row.REB),
    AST: num(row.AST),
    STL: num(row.STL),
    BLK: num(row.BLK),
    TOV: num(row.TOV),
    PF: num(row.PF),
    PTS: num(row.PTS)
  };
}

export function getResultSet(data, name) {
  const sets = data?.resultSets || data?.resultSet ? [data.resultSet] : [];
  const resultSets = data?.resultSets || sets;
  return resultSets.find((set) => set.name === name) || resultSets[0];
}

export function rowsToObjects(resultSet) {
  if (!resultSet?.headers || !resultSet?.rowSet) return [];
  return resultSet.rowSet.map((row) =>
    resultSet.headers.reduce((record, header, index) => {
      record[header] = row[index];
      return record;
    }, {})
  );
}

export function getBundleKey(playerId, seasonType) {
  return playerId ? `${playerId}:${seasonType}` : '';
}

export function getCareerResultSetName(seasonType) {
  return seasonType === 'Playoffs' ? 'SeasonTotalsPostSeason' : 'SeasonTotalsRegularSeason';
}

export function ordinal(value) {
  const number = Number(value);
  if (number === 1) return '1st';
  if (number === 2) return '2nd';
  if (number === 3) return '3rd';
  return `${value}th`;
}

export function getWinner(a, b, lowerWins = false) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) < 0.0001) return -1;
  if (lowerWins) return a < b ? 0 : 1;
  return a > b ? 0 : 1;
}

export function averageRows(rows, key) {
  if (!rows.length) return 0;
  return rows.reduce((total, row) => total + num(row[key]), 0) / rows.length;
}

export function formatPlayerYears(player) {
  if (Number.isFinite(Number(player?.fromYear)) && Number.isFinite(Number(player?.toYear))) {
    return `${player.fromYear}-${player.toYear}`;
  }
  return player?.active ? 'Active' : 'NBA';
}

export function computePeakScore(season, mode, weights) {
  const ts = computeTS(season);
  if (mode === 'scoring') return num(season.PTS);
  if (mode === 'mvp') {
    return (
      num(season.PTS) * 1.5 +
      num(season.AST) * 1.1 +
      num(season.REB) * 0.9 +
      num(season.STL) * 1.5 +
      num(season.BLK) * 1.2 -
      num(season.TOV) * 1.0 +
      ts * 25 +
      (num(season.GP) / 82) * 5
    );
  }
  return (
    num(season.PTS) * weights.PTS +
    num(season.REB) * weights.REB +
    num(season.AST) * weights.AST +
    num(season.STL) * weights.STL +
    num(season.BLK) * weights.BLK +
    num(season.TOV) * weights.TOV +
    ts * weights.TS
  );
}

export function computeCareerStats(seasons, mode) {
  if (!seasons || !seasons.length) return null;
  let totalGP = 0, totalGS = 0, totalMIN = 0;
  const sums = Object.fromEntries(CAREER_COUNT_KEYS.map((k) => [k, 0]));

  seasons.forEach((s) => {
    const gp = num(s.GP);
    totalGP += gp;
    totalGS += num(s.GS);
    totalMIN += num(s.MIN) * gp;
    CAREER_COUNT_KEYS.forEach((k) => { sums[k] += num(s[k]) * gp; });
  });

  const FG_PCT = sums.FGA > 0 ? sums.FGM / sums.FGA : 0;
  const FG3_PCT = sums.FG3A > 0 ? sums.FG3M / sums.FG3A : 0;
  const FT_PCT = sums.FTA > 0 ? sums.FTM / sums.FTA : 0;
  const base = { GP: totalGP, GS: totalGS, FG_PCT, FG3_PCT, FT_PCT, SEASON_ID: 'Career', TEAM_ABBREVIATION: 'Career' };

  if (mode === 'totals') {
    return { ...base, MIN: totalMIN, ...sums };
  }
  const avgRow = { ...base, MIN: totalGP > 0 ? totalMIN / totalGP : 0 };
  CAREER_COUNT_KEYS.forEach((k) => { avgRow[k] = totalGP > 0 ? sums[k] / totalGP : 0; });
  return avgRow;
}
