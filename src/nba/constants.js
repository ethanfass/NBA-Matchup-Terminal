import { formatOne, formatPct, num } from './compute.js';

export const CURRENT_SEASON = '2025-26';

export const RADAR_STATS = [
  { key: 'PTS', label: 'PTS', max: 35, format: formatOne },
  { key: 'REB', label: 'REB', max: 16, format: formatOne },
  { key: 'AST', label: 'AST', max: 13, format: formatOne },
  { key: 'STL', label: 'STL', max: 3, format: formatOne },
  { key: 'BLK', label: 'BLK', max: 4, format: formatOne },
  { key: 'FG_PCT', label: 'FG%', max: 0.7, format: formatPct, made: 'FGM', attempts: 'FGA' },
  { key: 'FG3_PCT', label: '3P%', max: 0.52, format: formatPct, made: 'FG3M', attempts: 'FG3A' },
  { key: 'FT_PCT', label: 'FT%', max: 1, format: formatPct, made: 'FTM', attempts: 'FTA' }
];

export const STAT_COLORS = {
  PTS: '#C8102E',
  REB: '#75e6b2',
  AST: '#8bdcff',
  STL: '#ffdf5d',
  BLK: '#9f7aea',
  TOV: '#000000',
  FG_PCT: '#f58426',
  FG3_PCT: '#1D428A',
  FT_PCT: '#ff8aa8'
};

export const TABLE_STATS = [
  { key: 'GP', label: 'Games' },
  { key: 'GS', label: 'Starts' },
  { key: 'MIN', label: 'Minutes' },
  { key: 'PTS', label: 'Points' },
  { key: 'REB', label: 'Rebounds' },
  { key: 'OREB', label: 'Off. Rebounds' },
  { key: 'DREB', label: 'Def. Rebounds' },
  { key: 'AST', label: 'Assists' },
  { key: 'STL', label: 'Steals' },
  { key: 'BLK', label: 'Blocks' },
  { key: 'TOV', label: 'Turnovers', lowerWins: true },
  { key: 'PF', label: 'Fouls', lowerWins: true },
  { key: 'FGM', label: 'FG Made' },
  { key: 'FGA', label: 'FG Attempts' },
  { key: 'FG_PCT', label: 'FG%', format: formatPct },
  { key: 'FG3M', label: '3P Made' },
  { key: 'FG3A', label: '3P Attempts' },
  { key: 'FG3_PCT', label: '3P%', format: formatPct },
  { key: 'FTM', label: 'FT Made' },
  { key: 'FTA', label: 'FT Attempts' },
  { key: 'FT_PCT', label: 'FT%', format: formatPct }
];

export const EDGE_STATS = [
  { key: 'PTS', label: 'Scoring', format: formatOne },
  { key: 'REB', label: 'Rebounding', format: formatOne },
  { key: 'AST', label: 'Playmaking', format: formatOne },
  { key: 'STL', label: 'Pressure', format: formatOne },
  { key: 'FG_PCT', label: 'FG Efficiency', format: formatPct },
  { key: 'TS_PCT', label: 'Shot Quality', format: formatPct, compute: (s) => {
    const denom = 2 * (num(s.FGA) + 0.44 * num(s.FTA));
    return denom > 0 ? num(s.PTS) / denom : 0;
  } }
];

export const ADVANCED_STATS = [
  {
    key: 'TS_PCT',
    label: 'True Shooting %',
    color: '#f6c945',
    format: formatPct,
    compute: (s) => {
      const denom = 2 * (num(s.FGA) + 0.44 * num(s.FTA));
      return denom > 0 ? num(s.PTS) / denom : 0;
    }
  },
  {
    key: 'EFG_PCT',
    label: 'Eff. FG %',
    color: '#fb923c',
    format: formatPct,
    compute: (s) => num(s.FGA) > 0 ? (num(s.FGM) + 0.5 * num(s.FG3M)) / num(s.FGA) : 0
  },
  {
    key: 'FG3A_RATE',
    label: '3PA Rate',
    color: '#818cf8',
    format: formatPct,
    compute: (s) => num(s.FGA) > 0 ? num(s.FG3A) / num(s.FGA) : 0
  },
  {
    key: 'FT_RATE',
    label: 'FT Rate',
    color: '#f472b6',
    format: formatPct,
    compute: (s) => num(s.FGA) > 0 ? num(s.FTA) / num(s.FGA) : 0
  },
  {
    key: 'AST_TO',
    label: 'AST / TO',
    color: '#38bdf8',
    compute: (s) => num(s.TOV) > 0 ? num(s.AST) / num(s.TOV) : 0
  },
  {
    key: 'STOCKS',
    label: 'Stocks (STL+BLK)',
    color: '#34d399',
    compute: (s) => num(s.STL) + num(s.BLK)
  },
  {
    key: 'PTS_PER_36',
    label: 'PTS / 36 Min',
    color: '#f87171',
    compute: (s) => num(s.MIN) > 0 ? (num(s.PTS) / num(s.MIN)) * 36 : 0
  },
  {
    key: 'AST_PER_36',
    label: 'AST / 36 Min',
    color: '#67e8f9',
    compute: (s) => num(s.MIN) > 0 ? (num(s.AST) / num(s.MIN)) * 36 : 0
  },
  {
    key: 'REB_PER_36',
    label: 'REB / 36 Min',
    color: '#86efac',
    compute: (s) => num(s.MIN) > 0 ? (num(s.REB) / num(s.MIN)) * 36 : 0
  }
];

export const AWARD_ROWS = [
  { key: 'mvp',   label: 'MVP',         color: '#f6c945', shorts: new Set(['MVP']) },
  { key: 'fmvp',  label: 'Finals MVP',  color: '#ff6b00', shorts: new Set(['FMVP']) },
  { key: 'champ', label: 'Champion',    color: '#22c55e', shorts: new Set(['CHAMP']) },
  { key: 'nba1',  label: '1st All-NBA', color: '#ef4444', shorts: new Set(['1NBA']) },
  { key: 'nba',   label: 'All-NBA',     color: '#f472b6', shorts: new Set(['2NBA', '3NBA', 'NBA']) },
  { key: 'dpoy',  label: 'DPOY',        color: '#14b8a6', shorts: new Set(['DPOY']) },
  { key: 'def',   label: 'All-Def',     color: '#3b82f6', shorts: new Set(['1DEF', '2DEF', 'DEF']) },
  { key: 'star',  label: 'All-Star',    color: '#a855f7', shorts: new Set(['STAR', 'ASG MVP']) },
  { key: 'roy',   label: 'ROY',         color: '#06b6d4', shorts: new Set(['ROY']) },
  { key: 'potm',  label: 'POTM',        color: '#84cc16', shorts: new Set(['POTM']) },
];

export const CAREER_COUNT_KEYS = ['PTS','REB','AST','STL','BLK','TOV','PF','OREB','DREB','FGM','FGA','FG3M','FG3A','FTM','FTA'];
