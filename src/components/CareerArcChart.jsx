import { useMemo, useState } from 'react';
import { num, parseSeason, formatOne, formatPct } from '../nba/compute.js';

const ARC_STATS = [
  { key: 'PTS', label: 'PTS', color: '#c8102e' },
  { key: 'REB', label: 'REB', color: '#34d399' },
  { key: 'AST', label: 'AST', color: '#38bdf8' },
  { key: 'STL', label: 'STL', color: '#f6c945' },
  { key: 'BLK', label: 'BLK', color: '#9f7aea' },
  { key: 'TOV', label: 'TOV', color: '#fb923c' }
];

const ARC_READOUT_STATS = [
  ...ARC_STATS,
  { key: 'FG_PCT', label: 'FG%', color: '#ef4444', format: formatPct },
  { key: 'FG3_PCT', label: '3P%', color: '#3b82f6', format: formatPct },
  { key: 'FT_PCT', label: 'FT%', color: '#22c55e', format: formatPct }
];

function getLastName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.at(-1) || name;
}

export default function CareerArcChart({ selected, onJumpToSeason }) {
  return (
    <div className="arc-grid">
      {selected.map((slot, index) => (
        <ArcCard key={slot.player?.id || index} slot={slot} slotIndex={index} onJumpToSeason={onJumpToSeason} />
      ))}
    </div>
  );
}

function ArcCard({ slot, slotIndex, onJumpToSeason }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const W = 440, H = 180;
  const PAD = { top: 14, right: 14, bottom: 28, left: 32 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const seasons = slot.bundle?.seasons || [];
  const sorted = useMemo(
    () => [...seasons].sort((a, b) => parseSeason(a.SEASON_ID) - parseSeason(b.SEASON_ID)),
    [seasons]
  );

  if (slot.bundle?.loading) {
    return (
      <div className="arc-card" style={{ '--slot-color': slot.colors.primary }}>
        <div className="arc-head"><strong className="arc-name">{getLastName(slot.player?.name)}</strong></div>
        <p className="empty-state">Loading career data...</p>
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="arc-card" style={{ '--slot-color': slot.colors.primary }}>
        <div className="arc-head"><strong className="arc-name">{getLastName(slot.player?.name)}</strong></div>
        <p className="empty-state">No career data available.</p>
      </div>
    );
  }

  const maxVal = Math.max(1, ...sorted.flatMap((s) => ARC_STATS.map((stat) => num(s[stat.key]))));
  const yMax = Math.ceil(maxVal / 5) * 5;
  const n = sorted.length;

  const xPos = (i) => PAD.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yPos = (v) => PAD.top + plotH - (v / yMax) * plotH;

  const selectedSeasonId = slot.season?.SEASON_ID || slot.season;
  const selectedIdx = sorted.findIndex((s) => s.SEASON_ID === selectedSeasonId);
  const activeIdx = hoveredIdx !== null ? hoveredIdx : selectedIdx;
  const activeSeason = activeIdx >= 0 ? sorted[activeIdx] : null;

  const gridVals = [];
  for (let v = 0; v <= yMax; v += 10) gridVals.push(v);

  const labelStep = n > 15 ? 4 : n > 8 ? 2 : 1;

  const hitBounds = (i) => {
    const left = i === 0 ? PAD.left : (xPos(i - 1) + xPos(i)) / 2;
    const right = i === n - 1 ? W - PAD.right : (xPos(i) + xPos(i + 1)) / 2;
    return { x: left, width: right - left };
  };

  return (
    <div className="arc-card" style={{ '--slot-color': slot.colors.primary }}>
      <div className="arc-head">
        <strong className="arc-name">{getLastName(slot.player?.name)}</strong>
        {activeSeason && (
          <div className="arc-readout">
            <span className="arc-readout-season">{activeSeason.SEASON_ID}</span>
            {ARC_READOUT_STATS.map((s) => (
              <span key={s.key} className="arc-readout-stat" style={{ '--ac': s.color }}>
                <b>{s.format ? s.format(activeSeason[s.key]) : formatOne(num(activeSeason[s.key]))}</b>
                <span>{s.label}</span>
              </span>
            ))}
            {hoveredIdx !== null && hoveredIdx !== selectedIdx && (
              <button className="arc-jump" onClick={() => onJumpToSeason(slotIndex, sorted[hoveredIdx].SEASON_ID)}>
                GO
              </button>
            )}
          </div>
        )}
      </div>

      <svg className="arc-svg" viewBox={`0 0 ${W} ${H}`} aria-label={`${slot.player?.name} career arc`}>
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={yPos(v)} x2={W - PAD.right} y2={yPos(v)} stroke="#cccccc" strokeWidth="0.75" />
            <text x={PAD.left - 5} y={yPos(v) + 3.5} textAnchor="end" fontSize="8" fill="#888888">{v}</text>
          </g>
        ))}

        {sorted.map((s, i) => {
          if (i % labelStep !== 0 && i !== n - 1) return null;
          return (
            <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#888888">
              {String(s.SEASON_ID).slice(0, 4)}
            </text>
          );
        })}

        {selectedIdx >= 0 && (
          <line x1={xPos(selectedIdx)} y1={PAD.top} x2={xPos(selectedIdx)} y2={H - PAD.bottom}
            stroke={slot.colors.primary} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
        )}

        {hoveredIdx !== null && (
          <line x1={xPos(hoveredIdx)} y1={PAD.top} x2={xPos(hoveredIdx)} y2={H - PAD.bottom}
            stroke={slot.colors.primary} strokeWidth="2" opacity="0.85" />
        )}

        {ARC_STATS.map(({ key, color }) => (
          <polyline key={key}
            points={sorted.map((s, i) => `${xPos(i)},${yPos(num(s[key]))}`).join(' ')}
            fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {ARC_STATS.map(({ key, color }) =>
          sorted.map((s, i) => (
            <circle key={`${key}-${i}`} cx={xPos(i)} cy={yPos(num(s[key]))} r={i === activeIdx ? 4 : 2.5}
              fill={color} stroke={i === activeIdx ? '#000000' : 'none'}
              strokeWidth={i === activeIdx ? 1.5 : 0} opacity={i === activeIdx ? 1 : 0.75} />
          ))
        )}

        {sorted.map((s, i) => {
          const { x, width } = hitBounds(i);
          return (
            <rect key={i} x={x} y={PAD.top} width={width} height={plotH}
              fill="transparent" style={{ cursor: 'default' }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onJumpToSeason(slotIndex, s.SEASON_ID)} />
          );
        })}
      </svg>

      <div className="arc-legend">
        {ARC_STATS.map((s) => (
          <span key={s.key} className="arc-legend-item" style={{ '--ac': s.color }}>
            <span className="arc-dot" />
            {s.label}
          </span>
        ))}
        <span className="arc-legend-sep" />
        <span className="arc-career-span">
          {String(sorted[0].SEASON_ID).slice(0, 4)} – {String(sorted.at(-1).SEASON_ID).slice(0, 4)} - {n} seasons
        </span>
      </div>
    </div>
  );
}
