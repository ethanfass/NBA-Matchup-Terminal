import { ordinal, formatOne } from './compute.js';
import { CURRENT_SEASON } from './constants.js';
import { colorDistance } from './teamColors.js';

export const TEAM_ABBREVIATION_TO_SLUG = {
  ATL: 'hawks', BOS: 'celtics', BKN: 'nets', NJN: 'nets',
  CHA: 'hornets', CHH: 'hornets', CHI: 'bulls', CLE: 'cavaliers',
  DAL: 'mavericks', DEN: 'nuggets', DET: 'pistons', GSW: 'warriors',
  GOS: 'warriors', HOU: 'rockets', IND: 'pacers', LAC: 'clippers',
  LAL: 'lakers', MEM: 'grizzlies', VAN: 'grizzlies', MIA: 'heat',
  MIL: 'bucks', MIN: 'timberwolves', NOP: 'pelicans', NOH: 'pelicans',
  NYK: 'knicks', OKC: 'thunder', SEA: 'thunder', ORL: 'magic',
  PHI: 'sixers', PHL: 'sixers', PHX: 'suns', POR: 'trail-blazers',
  SAC: 'kings', SAS: 'spurs', SAN: 'spurs', TOR: 'raptors',
  UTA: 'jazz', UTH: 'jazz', WAS: 'wizards'
};

export const FALLBACK_STANDINGS = {
  '2025-26': [
    { TeamID: 1610612760, TeamSlug: 'thunder', Conference: 'West', Record: '64-18', WINS: 64, LOSSES: 18, PlayoffRank: 1, PlayoffSeeding: 1 },
    { TeamID: 1610612743, TeamSlug: 'nuggets', Conference: 'West', Record: '54-28', WINS: 54, LOSSES: 28, PlayoffRank: 3, PlayoffSeeding: 3 }
  ]
};

export const FALLBACK_PLAYOFF_STATUS = {
  '2025-26': {
    east: {
      pistons: 'R2 vs. CLE (0-0)',
      magic: 'R1 vs. DET (3-4)',
      cavaliers: 'R2 vs. DET (0-0)',
      raptors: 'R1 vs. CLE (3-4)',
      knicks: 'R2 vs. PHI (0-0)',
      sixers: 'R2 vs. NYK (0-0)',
      celtics: 'R1 vs. PHI (3-4)',
      hawks: 'R1 vs. NYK (2-4)'
    },
    west: {
      thunder: 'R2 vs. LAL (0-0)',
      lakers: 'R2 vs. OKC (0-0)',
      spurs: 'R2 vs. MIN (0-0)',
      timberwolves: 'R2 vs. SAS (0-0)',
      suns: 'R1 vs. OKC (0-4)',
      rockets: 'R1 vs. LAL (2-4)',
      'trail-blazers': 'R1 vs. SAS (0-4)',
      nuggets: 'R1 vs. MIN (0-4)'
    }
  }
};

function getStandingTeamSlug(standing) {
  const rawSlug = String(standing?.TeamSlug || '').trim().toLowerCase();
  if (rawSlug) return rawSlug;

  const abbr = String(standing?.TEAM_ABBREVIATION || standing?.TeamAbbreviation || '').trim().toUpperCase();
  return TEAM_ABBREVIATION_TO_SLUG[abbr] || '';
}

export function findTeamRow(rows, teamId, teamAbbreviation) {
  const teamSlug = TEAM_ABBREVIATION_TO_SLUG[teamAbbreviation];
  return (
    rows.find((row) => Number(row.TEAM_ID || row.TeamID) === Number(teamId)) ||
    rows.find((row) => row.TEAM_ABBREVIATION === teamAbbreviation || row.TeamSlug === teamSlug) ||
    null
  );
}

export function getTeamStanding(standings, slot) {
  if (slot?.viewMode !== 'season') return null;

  const seasonId = slot?.season?.SEASON_ID;
  const rows = standings?.[seasonId]?.rows || [];
  const teamId = Number(slot?.season?.TEAM_ID);
  const teamAbbreviation = slot?.season?.TEAM_ABBREVIATION || slot?.player?.team;
  const teamSlug = TEAM_ABBREVIATION_TO_SLUG[teamAbbreviation];
  const fallbackRows = FALLBACK_STANDINGS[seasonId] || [];

  return (
    rows.find((row) => Number(row.TeamID) === teamId) ||
    rows.find((row) => row.TeamSlug === teamSlug) ||
    fallbackRows.find((row) => Number(row.TeamID) === teamId) ||
    fallbackRows.find((row) => row.TeamSlug === teamSlug) ||
    null
  );
}

export function getSeasonContextText(slot, standing) {
  if (slot?.viewMode !== 'season' || !standing) return '';
  const record = formatTeamRecord(standing);
  const seed = formatTeamSeed(standing);
  return [record, seed].filter(Boolean).join(' / ');
}

export function formatTeamRecord(standing, regular, year) {
  if (standing?.Record) return standing.Record;
  const wins = standing?.WINS ?? regular?.W ?? year?.WINS;
  const losses = standing?.LOSSES ?? regular?.L ?? year?.LOSSES;
  if (!Number.isFinite(Number(wins)) || !Number.isFinite(Number(losses))) return 'N/A';
  return `${Number(wins)}-${Number(losses)}`;
}

export function formatTeamSeed(standing) {
  const rank = Number(standing?.PlayoffRank || standing?.PlayoffSeeding);
  const conferenceRaw = String(standing?.Conference || '').trim();
  const conference = conferenceRaw
    ? `${conferenceRaw.charAt(0).toUpperCase()}${conferenceRaw.slice(1).toLowerCase()}`
    : '';
  return Number.isFinite(rank) && rank > 0
    ? `${ordinal(rank)}${conference ? ` ${conference}` : ''}`
    : '';
}

export function formatConferenceRank(year) {
  const rank = Number(year?.CONF_RANK);
  return Number.isFinite(rank) && rank > 0 ? `${ordinal(rank)} conf.` : 'N/A';
}

export function formatTeamMetric(value) {
  return Number.isFinite(Number(value)) ? formatOne(value) : 'N/A';
}

export function formatPlayoffResult(year, seasonId, standing) {
  const isCurrentSeason = seasonId === CURRENT_SEASON;
  const teamSlug = getStandingTeamSlug(standing);
  const conference = String(standing?.Conference || '').toLowerCase();
  const fallbackStatus = FALLBACK_PLAYOFF_STATUS?.[seasonId]?.[conference]?.[teamSlug];
  const wins = Number(year?.PO_WINS);
  const losses = Number(year?.PO_LOSSES);
  const hasApiData = Number.isFinite(wins) && Number.isFinite(losses);

  // Prefer live API data when actual playoff games have been played
  if (hasApiData && (wins > 0 || losses > 0)) {
    const record = `${wins}-${losses}`;
    const finals = String(year?.NBA_FINALS_APPEARANCE || '').trim();
    if (finals && finals !== 'N/A') {
      const label = finals
        .replace(/LEAGUE CHAMPION/i, 'Champion')
        .replace(/FINALS APPEARANCE/i, 'Finals');
      return `${label} (${record})`;
    }
    if (isCurrentSeason && losses < 4) return `In progress (${record})`;
    return `${getPlayoffRoundFromWins(wins)} (${record})`;
  }

  // No games played yet — use fallback for upcoming matchup context
  if (fallbackStatus) return fallbackStatus;

  if (!hasApiData) return isCurrentSeason ? 'Pending' : 'N/A';

  const seededRank = Number(standing?.PlayoffRank || standing?.PlayoffSeeding);
  const hasSeed = Number.isFinite(seededRank) && seededRank > 0;
  if (isCurrentSeason) return 'Pending';
  return hasSeed ? 'N/A' : 'Missed';
}

export function getPlayoffRoundFromWins(wins) {
  if (wins >= 12) return 'Lost Finals';
  if (wins >= 8) return 'Conf. Finals';
  if (wins >= 4) return 'Conf. Semis';
  return 'First Round';
}

export function getReadableTeamTextColor(colors) {
  const candidates = [colors?.dark, colors?.primary, colors?.secondary, '#000000'].filter(Boolean);
  return candidates.find((color) => colorDistance(color, '#c7c7c7') > 110) || '#000000';
}
