import { parseSeason, ordinal } from './compute.js';
import { AWARD_ROWS } from './constants.js';

export function awardMatchesSeason(award, selectedSeason = '') {
  if (!selectedSeason) return false;

  const awardSeason = String(award.SEASON || '').trim();
  if (!awardSeason || awardSeason.toLowerCase() === 'null') {
    const awardYear = parseSeason(award.YEAR || award.MONTH || '');
    if (!awardYear) return false;
    const selectedStart = parseSeason(selectedSeason);
    const selectedEnd = selectedStart ? selectedStart + 1 : 0;
    return awardYear === selectedStart || awardYear === selectedEnd;
  }

  if (awardSeason === selectedSeason) return true;

  const selectedStart = parseSeason(selectedSeason);
  const selectedEnd = selectedStart ? selectedStart + 1 : 0;
  const awardYear = parseSeason(awardSeason);

  return Boolean(awardYear && (awardYear === selectedStart || awardYear === selectedEnd));
}

export function cleanAwardLabel(label = '', teamNumber = '') {
  const cleaned = String(label)
    .replace(/^NBA (?!Champion)/, '')
    .replace(/^Kia /, '')
    .replace(' Player of the Month', ' POTM')
    .replace(' Player of the Week', ' POTW')
    .trim();

  if (cleaned === 'All-NBA' && teamNumber) {
    return `All-NBA ${ordinal(teamNumber)} Team`;
  }

  if (cleaned === 'All-Defensive Team' && teamNumber) {
    return `All-Defensive ${ordinal(teamNumber)} Team`;
  }

  if (cleaned === 'All-Rookie Team' && teamNumber) {
    return `All-Rookie ${ordinal(teamNumber)} Team`;
  }

  return cleaned;
}

export function getAwardMeta(label) {
  const award = label.toLowerCase();

  if (award.includes('hall of fame')) return { rank: 0, short: 'HOF', color: '#f6c945' };
  if (award.includes('finals most valuable')) return { rank: 1, short: 'FMVP', color: '#ff6b00' };
  if (award === 'most valuable player') return { rank: 2, short: 'MVP', color: '#f6c945' };
  if (award.includes('defensive player')) return { rank: 3, short: 'DPOY', color: '#14b8a6' };
  if (award.includes('rookie of the year')) return { rank: 4, short: 'ROY', color: '#06b6d4' };
  if (award.includes('sixth man')) return { rank: 5, short: '6MOY', color: '#f58426' };
  if (award.includes('most improved')) return { rank: 5, short: 'MIP', color: '#a3e635' };
  if (award.includes('clutch player')) return { rank: 5, short: 'CLUTCH', color: '#ff6b8a' };
  if (award.includes('nba champion')) return { rank: 5, short: 'CHAMP', color: '#22c55e' };
  if (award.includes('all-nba 1st')) return { rank: 6, short: '1NBA', color: '#ef4444' };
  if (award.includes('all-nba 2nd')) return { rank: 7, short: '2NBA', color: '#f472b6' };
  if (award.includes('all-nba 3rd')) return { rank: 8, short: '3NBA', color: '#f472b6' };
  if (award.includes('all-nba')) return { rank: 9, short: 'NBA', color: '#ef4444' };
  if (award.includes('all-defensive 1st')) return { rank: 10, short: '1DEF', color: '#3b82f6' };
  if (award.includes('all-defensive 2nd')) return { rank: 11, short: '2DEF', color: '#3b82f6' };
  if (award.includes('all-defensive')) return { rank: 12, short: 'DEF', color: '#3b82f6' };
  if (award.includes('all-rookie')) return { rank: 13, short: 'ROOK', color: '#06b6d4' };
  if (award.includes('all-star most valuable')) return { rank: 14, short: 'ASG MVP', color: '#a855f7' };
  if (award.includes('all-star')) return { rank: 15, short: 'STAR', color: '#a855f7' };
  if (award.includes('scoring') || award.includes('points')) return { rank: 16, short: 'PTS', color: '#ef4444' };
  if (award.includes('assist')) return { rank: 17, short: 'AST', color: '#06b6d4' };
  if (award.includes('rebound')) return { rank: 18, short: 'REB', color: '#14b8a6' };
  if (award.includes('steal')) return { rank: 18, short: 'STL', color: '#f6c945' };
  if (award.includes('block')) return { rank: 18, short: 'BLK', color: '#a855f7' };
  if (award.includes('citizenship')) return { rank: 19, short: 'CIT', color: '#84cc16' };
  if (award.includes('sportsmanship')) return { rank: 19, short: 'SPORT', color: '#06b6d4' };
  if (award.includes('teammate')) return { rank: 19, short: 'TEAM', color: '#f6c945' };
  if (award.includes('community')) return { rank: 19, short: 'CARE', color: '#22c55e' };
  if (award.includes('olympic') || award.includes('usa basketball')) return { rank: 19, short: 'USA', color: '#3b82f6' };
  if (award.includes('sporting news')) return { rank: 19, short: 'SN', color: '#06b6d4' };
  if (award.includes('player of the year')) return { rank: 19, short: 'POY', color: '#f6c945' };
  if (award.includes('player of the month')) return { rank: 19, short: 'POTM', color: '#84cc16' };
  if (award.includes('player of the week')) return { rank: 20, short: 'POTW', color: '#a3e635' };
  if (award.includes('potm')) return { rank: 19, short: 'POTM', color: '#84cc16' };
  if (award.includes('potw')) return { rank: 20, short: 'POTW', color: '#a3e635' };

  return { rank: 99, short: compactAwardShort(label), color: fallbackAwardColor(label) };
}

export function compactAwardShort(label = '') {
  const words = label
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !['of', 'the', 'and', 'team', 'award'].includes(word.toLowerCase()));

  return (words.map((word) => word[0]).join('') || 'AWD').slice(0, 5).toUpperCase();
}

export function fallbackAwardColor(label = '') {
  const colors = ['#C8102E', '#1D428A', '#ffdf5d', '#75e6b2', '#8bdcff', '#ff8aa8', '#f58426', '#9f7aea'];
  const hash = String(label)
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return colors[hash % colors.length];
}

export function compressAwardEntries(entries) {
  const ranges = [];
  const dedupedEntries = Array.from(
    new Map(
      entries.map((entry) => [
        `${parseSeason(entry.season) || entry.season}|${entry.team || ''}`,
        entry
      ])
    ).values()
  );

  dedupedEntries.forEach((entry) => {
    const year = parseSeason(entry.season);
    const last = ranges.at(-1);

    if (last && year && last.team === entry.team && year === last.end + 1) {
      last.end = year;
      return;
    }

    ranges.push({ start: year, end: year, rawSeason: entry.season, team: entry.team });
  });

  return ranges.map((range) => {
    const seasonText = range.start
      ? range.start === range.end
        ? String(range.start)
        : `${range.start}-${range.end}`
      : range.rawSeason;

    return [seasonText, range.team].filter(Boolean).join(' ');
  });
}

export function abbreviateTeam(team = '') {
  const clean = String(team).trim();
  if (!clean) return '';

  const TEAM_NAME_TO_ABBREVIATION = {
    'Atlanta Hawks': 'ATL', 'Boston Celtics': 'BOS', 'Brooklyn Nets': 'BKN',
    'Charlotte Bobcats': 'CHA', 'Charlotte Hornets': 'CHA', 'Chicago Bulls': 'CHI',
    'Cleveland Cavaliers': 'CLE', 'Dallas Mavericks': 'DAL', 'Denver Nuggets': 'DEN',
    'Detroit Pistons': 'DET', 'Golden State Warriors': 'GSW', 'Houston Rockets': 'HOU',
    'Indiana Pacers': 'IND', 'LA Clippers': 'LAC', 'Los Angeles Clippers': 'LAC',
    'Los Angeles Lakers': 'LAL', 'Memphis Grizzlies': 'MEM', 'Miami Heat': 'MIA',
    'Milwaukee Bucks': 'MIL', 'Minnesota Timberwolves': 'MIN', 'New Jersey Nets': 'NJN',
    'New Orleans Hornets': 'NOH', 'New Orleans Pelicans': 'NOP', 'New York Knicks': 'NYK',
    'Oklahoma City Thunder': 'OKC', 'Orlando Magic': 'ORL', 'Philadelphia 76ers': 'PHI',
    'Phoenix Suns': 'PHX', 'Portland Trail Blazers': 'POR', 'Sacramento Kings': 'SAC',
    'San Antonio Spurs': 'SAS', 'Seattle SuperSonics': 'SEA', 'Toronto Raptors': 'TOR',
    'Utah Jazz': 'UTA', 'Vancouver Grizzlies': 'VAN', 'Washington Bullets': 'WAS',
    'Washington Wizards': 'WAS'
  };

  return TEAM_NAME_TO_ABBREVIATION[clean] || clean;
}

export function groupAccolades(awards) {
  const grouped = new Map();

  awards
    .map((award) => {
      const label = cleanAwardLabel(award.DESCRIPTION, award.ALL_NBA_TEAM_NUMBER);
      const meta = getAwardMeta(label);
      return {
        ...award,
        label,
        short: meta.short,
        color: meta.color,
        rank: meta.rank,
        season: award.SEASON || '',
        team: abbreviateTeam(award.TEAM)
      };
    })
    .filter((award) => award.label)
    .forEach((award) => {
      const current = grouped.get(award.label) || {
        label: award.label,
        short: award.short,
        color: award.color,
        rank: award.rank,
        entries: []
      };

      current.entries.push({ season: award.season, team: award.team });
      grouped.set(award.label, current);
    });

  return Array.from(grouped.values())
    .map((award) => {
      const entries = award.entries
        .filter((entry) => entry.season || entry.team)
        .sort((a, b) => parseSeason(a.season) - parseSeason(b.season));

      return {
        ...award,
        count: award.entries.length,
        details: compressAwardEntries(entries).join(', ')
      };
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return b.count - a.count || a.label.localeCompare(b.label);
    });
}

export function buildAwardRows(awards) {
  const buckets = new Map();
  awards.forEach((award) => {
    const year = parseSeason(award.SEASON);
    if (!year) return;
    const label = cleanAwardLabel(award.DESCRIPTION, award.ALL_NBA_TEAM_NUMBER);
    const { short } = getAwardMeta(label);
    const row = AWARD_ROWS.find((r) => r.shorts.has(short));
    if (!row) return;
    if (!buckets.has(row.key)) buckets.set(row.key, new Map());
    const ymap = buckets.get(row.key);
    ymap.set(year, (ymap.get(year) || 0) + 1);
  });
  return AWARD_ROWS.filter((r) => buckets.has(r.key)).map((r) => ({ ...r, years: buckets.get(r.key) }));
}
