import { formatOne, formatTotal, getWinner, ordinal } from '../nba/compute.js';
import { TABLE_STATS, ADVANCED_STATS, STAT_COLORS } from '../nba/constants.js';

function getStatColor(key) {
  if (STAT_COLORS[key]) return STAT_COLORS[key];
  if (key.startsWith('FG3')) return STAT_COLORS.FG3_PCT;
  if (key.startsWith('FG')) return STAT_COLORS.FG_PCT;
  if (key.startsWith('FT')) return STAT_COLORS.FT_PCT;
  if (key.includes('REB')) return STAT_COLORS.REB;
  if (key === 'GP') return '#9aa7bd';
  if (key === 'GS') return '#7bc87e';
  if (key === 'MIN') return '#6db5e8';
  if (key === 'TOV') return STAT_COLORS.TOV;
  if (key === 'PF') return '#e05c5c';
  return '#c7c7c7';
}

function getRankingRequestForSlot(slot, perMode) {
  if (!slot?.player?.id) return null;
  const rankingMode = perMode === 'totals' ? 'totals' : 'averages';

  if (slot.viewMode === 'alltime') {
    return {
      key: `alltime:${slot.seasonType}:${rankingMode}`,
      scope: 'alltime',
      seasonType: slot.seasonType,
      perMode: rankingMode
    };
  }

  const seasonId = slot.season?.SEASON_ID;
  if (!seasonId || seasonId === 'Career') return null;

  return {
    key: `season:${slot.seasonType}:${seasonId}:${rankingMode}`,
    scope: 'season',
    seasonId,
    seasonType: slot.seasonType,
    perMode: rankingMode
  };
}

function getPlayerStatRank(rankings, slot, stat, perMode) {
  const request = getRankingRequestForSlot(slot, perMode);
  if (!request || !slot?.player?.id) return null;
  const rank = rankings?.[request.key]?.ranks?.[stat.key]?.[slot.player.id];
  return Number.isFinite(rank) ? rank : null;
}

function rankTier(rank) {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  if (rank <= 10) return 'top10';
  if (rank <= 25) return 'top25';
  if (rank <= 50) return 'top50';
  if (rank <= 100) return 'top100';
  return 'low';
}

export default function StatsTable({ selected, mode, perMode, rankings }) {
  const stats = mode === 'advanced' ? ADVANCED_STATS : TABLE_STATS;
  const first = selected[0]?.season;
  const second = selected[1]?.season;
  const firstName = selected[0]?.player?.name || 'Player 1';
  const secondName = selected[1]?.player?.name || 'Player 2';

  const getValue = (season, stat) => {
    if (!season) return 0;
    if (stat.compute) return stat.compute(season);
    return Number(season[stat.key] || 0);
  };

  const getFormatter = (stat) => {
    if (stat.format) return stat.format;
    if (perMode === 'totals' && mode !== 'advanced') return formatTotal;
    return formatOne;
  };

  const renderPlayerValue = (slot, value, stat, isWinning) => {
    const rank = getPlayerStatRank(rankings, slot, stat, perMode);
    const formatter = getFormatter(stat);
    const rankScope = slot?.viewMode === 'alltime' ? 'all time' : 'this season';
    const isTopThree = rank && rank <= 3;

    return (
      <span className={`${isWinning ? 'winning ' : ''}stat-value${isTopThree ? ' top-three-rank' : ''}`}>
        <strong>{formatter(value)}</strong>
        {rank ? <small className={`stat-rank rank-${rankTier(rank)}`}>{ordinal(rank)} {rankScope}</small> : null}
      </span>
    );
  };

  return (
    <div className="stats-matrix">
      <div className="stats-matrix-head">
        <span>Stat</span>
        <span style={{ '--player-color': selected[0]?.colors.primary }}>{firstName}</span>
        <span style={{ '--player-color': selected[1]?.colors.primary }}>{secondName}</span>
      </div>
      <div className="stats-matrix-body">
        {stats.map((stat) => {
          const a = getValue(first, stat);
          const b = getValue(second, stat);
          const winner = getWinner(a, b, stat.lowerWins);
          const color = stat.color || getStatColor(stat.key);

          const [leftSlot, leftVal, rightSlot, rightVal] = winner === 0
            ? [selected[1], b, selected[0], a]
            : [selected[0], a, selected[1], b];

          return (
            <div className="stats-matrix-row" key={stat.key} style={{ '--stat-color': color }}>
              <span className="stat-name">{stat.label}</span>
              {renderPlayerValue(leftSlot, leftVal, stat, false)}
              {renderPlayerValue(rightSlot, rightVal, stat, winner !== -1)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
