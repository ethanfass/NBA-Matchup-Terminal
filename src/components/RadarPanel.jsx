import { useState } from 'react';
import { Gauge, Layers } from 'lucide-react';
import { formatOne } from '../nba/compute.js';
import { RADAR_STATS, STAT_COLORS } from '../nba/constants.js';

function getRadarTooltipPosition(event) {
  const shell = event.currentTarget.closest('.radar-shell');
  const bounds = shell?.getBoundingClientRect();

  if (!bounds || !('clientX' in event)) {
    return { x: 16, y: 16 };
  }

  const tooltipWidth = 210;
  const tooltipHeight = 105;
  const x = Math.min(
    Math.max(event.clientX - bounds.left + 14, 10),
    Math.max(10, bounds.width - tooltipWidth - 10)
  );
  const y = Math.min(
    Math.max(event.clientY - bounds.top + 14, 10),
    Math.max(10, bounds.height - tooltipHeight - 10)
  );

  return { x, y };
}

function RadarModeToggle({ mode, onModeChange }) {
  return (
    <div className="radar-mode-toggle segmented" aria-label="Radar mode">
      <button type="button" className={mode === 'overlap' ? 'active' : ''} onClick={() => onModeChange('overlap')}>
        <Layers size={17} />
        Overlay
      </button>
      <button type="button" className={mode === 'split' ? 'active' : ''} onClick={() => onModeChange('split')}>
        <Gauge size={17} />
        Split
      </button>
    </div>
  );
}

function RadarChart({ players }) {
  const [hovered, setHovered] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const size = 430;
  const center = size / 2;
  const radius = 156;
  const rings = [0.25, 0.5, 0.75, 1];

  const axes = RADAR_STATS.map((stat, index) => {
    const angle = (Math.PI * 2 * index) / RADAR_STATS.length - Math.PI / 2;
    return {
      ...stat,
      angle,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius
    };
  });

  const allDotPoints = players.map((player) => ({
    player,
    points: axes.map((axis) => {
      const raw = Number((player.radarSeason ?? player.season)?.[axis.key] || 0);
      const value = Math.max(0, Math.min(raw / axis.max, 1));
      return {
        ...axis,
        px: center + Math.cos(axis.angle) * radius * value,
        py: center + Math.sin(axis.angle) * radius * value,
        raw
      };
    })
  }));

  const handleSvgMouseMove = (event) => {
    const svgEl = event.currentTarget;
    const pt = svgEl.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgP = pt.matrixTransform(svgEl.getScreenCTM().inverse());

    let closest = null;
    let minDist = 16;
    allDotPoints.forEach(({ player, points }) => {
      points.forEach((point) => {
        const dist = Math.sqrt((svgP.x - point.px) ** 2 + (svgP.y - point.py) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closest = { point, player };
        }
      });
    });

    setHovered(closest);
    if (closest) setTooltipPosition(getRadarTooltipPosition(event));
  };

  return (
    <div className="radar-shell">
      {players.length > 1 && (
        <div className="radar-matchup-header">
          <h3>{players.map((player, index) => player.player?.name || `Player ${index + 1}`).join(' vs ')}</h3>
        </div>
      )}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Spider chart comparing NBA player stats"
        onMouseMove={handleSvgMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <rect className="radar-paper" x="24" y="24" width="382" height="382" />
        {rings.map((ring) => (
          <polygon key={ring} className="radar-ring"
            points={axes.map((axis) => `${center + Math.cos(axis.angle) * radius * ring},${center + Math.sin(axis.angle) * radius * ring}`).join(' ')} />
        ))}

        {axes.map((axis) => (
          <g key={axis.key}>
            <line className="radar-axis" x1={center} y1={center} x2={axis.x} y2={axis.y} />
            <text className="radar-label" style={{ '--stat-color': STAT_COLORS[axis.key] }}
              x={center + Math.cos(axis.angle) * (radius + 31)}
              y={center + Math.sin(axis.angle) * (radius + 31)}
              textAnchor="middle" dominantBaseline="central">
              {axis.label}
            </text>
          </g>
        ))}

        {allDotPoints.map(({ player, points }, playerIndex) => (
          <g key={player.player?.id || playerIndex}>
            <polygon className="radar-poly" style={{ '--poly-color': player.colors.primary }}
              points={points.map((point) => `${point.px},${point.py}`).join(' ')} />
            {points.map((point) => (
              <circle key={point.key} className="radar-dot"
                style={{ '--poly-color': player.colors.primary, pointerEvents: 'none' }}
                cx={point.px} cy={point.py} r="6"
                onFocus={(event) => { setHovered({ point, player }); setTooltipPosition(getRadarTooltipPosition(event)); }}
                tabIndex="0" />
            ))}
          </g>
        ))}
      </svg>

      {hovered && (
        <div className="radar-tooltip" style={{ left: tooltipPosition.x, top: tooltipPosition.y }}>
          <strong>{hovered.player.player?.name}</strong>
          <span className="tooltip-stat-line" style={{ '--stat-color': STAT_COLORS[hovered.point.key] }}>
            <b>{hovered.point.label}</b>
            <em>{hovered.point.format(hovered.point.raw)}</em>
          </span>
          {hovered.point.made && (
            <small className="tooltip-attempts">
              {hovered.point.made}/{hovered.point.attempts}:{' '}
              {formatOne(hovered.player.season?.[hovered.point.made])}/
              {formatOne(hovered.player.season?.[hovered.point.attempts])}
            </small>
          )}
        </div>
      )}
      <div className="radar-player-tags">
        {players.map((player, index) => (
          <span key={player.player?.id || index} style={{ '--matchup-color': player.colors.primary }}>
            <b>{player.player?.name || `Player ${index + 1}`}</b>
            <em>{player.season?.SEASON_ID || 'Season'} / {player.season?.TEAM_ABBREVIATION || player.player?.team || 'NBA'}</em>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RadarPanel({ selected, mode, onModeChange }) {
  if (mode === 'split') {
    return (
      <>
        <div className="split-radars">
          {selected.map((slot, index) => (
            <div className="radar-tile" key={index}>
              <h3>{slot.player?.name || `Player ${index + 1}`}</h3>
              <RadarChart players={[slot]} />
            </div>
          ))}
        </div>
        <RadarModeToggle mode={mode} onModeChange={onModeChange} />
      </>
    );
  }

  return (
    <>
      <RadarChart players={selected} />
      <RadarModeToggle mode={mode} onModeChange={onModeChange} />
    </>
  );
}
