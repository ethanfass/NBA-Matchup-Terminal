import { num, getWinner } from '../nba/compute.js';
import { EDGE_STATS, STAT_COLORS } from '../nba/constants.js';

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

export default function MatchupEdgeBoard({ selected }) {
  const [first, second] = selected;
  const firstName = first?.player?.name || 'Player 1';
  const secondName = second?.player?.name || 'Player 2';

  const getValue = (slot, stat) => {
    const season = slot?.season;
    if (!season) return 0;
    return stat.compute ? stat.compute(season) : num(season[stat.key]);
  };

  return (
    <div className="edge-board">
      <div className="edge-board-head">
        <span style={{ '--edge-color': first?.colors.primary }}>{firstName}</span>
        <strong>Visual Advantage</strong>
        <span style={{ '--edge-color': second?.colors.primary }}>{secondName}</span>
      </div>
      <div className="edge-bars">
        {EDGE_STATS.map((stat) => {
          const a = getValue(first, stat);
          const b = getValue(second, stat);
          const total = Math.max(0.0001, a + b);
          const firstPct = Math.max(7, Math.min(93, (a / total) * 100));
          const winner = getWinner(a, b);
          const color = stat.color || getStatColor(stat.key);

          return (
            <div className="edge-row" key={stat.key} style={{ '--stat-color': color }}>
              <div className="edge-label">
                <strong>{stat.label}</strong>
                <span>{winner === 0 ? firstName : winner === 1 ? secondName : 'Even'}</span>
              </div>
              <div className="edge-meter" style={{ '--first-width': `${firstPct}%`, '--first-color': first?.colors.primary, '--second-color': second?.colors.primary }}>
                <span className="edge-fill edge-fill-first" />
                <span className="edge-fill edge-fill-second" />
                <em>{stat.format(a)}</em>
                <b>{stat.format(b)}</b>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
