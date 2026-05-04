import { useMemo, useState } from 'react';
import { parseSeason } from '../nba/compute.js';
import { buildAwardRows, groupAccolades } from '../nba/awards.js';

export default function AwardsTimeline({ selected, onJumpToSeason }) {
  return (
    <div className="awards-tl-grid">
      {selected.map((slot, index) => (
        <AwardsTlCard key={slot.player?.id || index} slot={slot} slotIndex={index} onJumpToSeason={onJumpToSeason} />
      ))}
    </div>
  );
}

function AwardsTlCard({ slot, slotIndex, onJumpToSeason }) {
  const [hoveredYear, setHoveredYear] = useState(null);

  const allAwards = slot.bundle?.awards || [];
  const rows = useMemo(() => buildAwardRows(allAwards), [allAwards]);
  const seasons = slot.bundle?.seasons || [];
  const sortedSeasons = useMemo(
    () => [...seasons].sort((a, b) => parseSeason(a.SEASON_ID) - parseSeason(b.SEASON_ID)),
    [seasons]
  );

  if (slot.bundle?.loading) {
    return (
      <div className="awards-tl-card" style={{ '--slot-color': slot.colors.primary }}>
        <div className="awards-tl-head">
          <div className="awards-tl-title">
            <strong className="awards-tl-name">{slot.player?.name}</strong>
            <span>Loading</span>
          </div>
        </div>
        <p className="empty-state">Loading awards...</p>
      </div>
    );
  }

  if (!rows.length) {
    const grouped = groupAccolades(allAwards);
    return (
      <div className="awards-tl-card" style={{ '--slot-color': slot.colors.primary }}>
        <div className="awards-tl-head">
          <div className="awards-tl-title">
            <strong className="awards-tl-name">{slot.player?.name}</strong>
            <span>{grouped.length > 0 ? 'Totals only' : 'No awards'}</span>
          </div>
          {grouped.length > 0 && <span className="awards-tl-note">No year data - totals only</span>}
        </div>
        {grouped.length ? (
          <div className="awards-count-row">
            {grouped.slice(0, 10).map((aw) => (
              <span key={aw.label} className="awards-count-chip" style={{ '--ac': aw.color }}>
                <b>{aw.count}</b> {aw.short}
              </span>
            ))}
          </div>
        ) : (
          <p className="empty-state">No accolades data available.</p>
        )}
      </div>
    );
  }

  const allYears = rows.flatMap((r) => Array.from(r.years.keys()));
  const minYear = sortedSeasons.length ? parseSeason(sortedSeasons[0].SEASON_ID) : Math.min(...allYears);
  const maxYear = sortedSeasons.length ? parseSeason(sortedSeasons.at(-1).SEASON_ID) : Math.max(...allYears);
  const span = Math.max(1, maxYear - minYear);

  const W = 780, ROW_H = 32, PAD_L = 150, PAD_R = 44, PAD_T = 12, AXIS_H = 34, DOT_PAD = 18;
  const plotW = W - PAD_L - PAD_R;
  const H = PAD_T + rows.length * ROW_H + AXIS_H;
  const innerPlotW = Math.max(1, plotW - DOT_PAD * 2);
  const yearStep = innerPlotW / span;

  const xFor = (year) => PAD_L + DOT_PAD + ((year - minYear) / span) * innerPlotW;
  const yFor = (ri) => PAD_T + ri * ROW_H + ROW_H / 2;
  const bandFor = (year) => {
    const left = Math.max(PAD_L, xFor(year) - yearStep / 2);
    const right = Math.min(W - PAD_R, xFor(year) + yearStep / 2);
    return { x: left, width: Math.max(8, right - left) };
  };

  const selectedYear = parseSeason(slot.season?.SEASON_ID);
  const labelStep = span > 16 ? 4 : span > 8 ? 2 : 1;

  const ticks = [];
  for (let y = minYear; y <= maxYear; y++) {
    if ((y - minYear) % labelStep === 0 || y === maxYear) ticks.push(y);
  }

  const awardsForYear = (year) =>
    rows.filter((r) => r.years.has(year)).map((r) => ({ label: r.label, color: r.color, count: r.years.get(year) }));

  const readoutYear = hoveredYear !== null ? hoveredYear : selectedYear;
  const readoutAwards = readoutYear > 0 ? awardsForYear(readoutYear) : [];

  const fmtSeasonId = (year) => `${year}-${String(year + 1).slice(-2)}`;

  return (
    <div className="awards-tl-card" style={{ '--slot-color': slot.colors.primary }}>
      <div className="awards-tl-head">
        <div className="awards-tl-title">
          <strong className="awards-tl-name">{slot.player?.name}</strong>
          <span>{minYear}-{maxYear}</span>
        </div>
        {readoutAwards.length > 0 && (
          <div className="awards-tl-readout">
            <span className="awards-tl-year">{fmtSeasonId(readoutYear)}</span>
            {readoutAwards.map((a) => (
              <span key={a.label} className="awards-tl-badge" style={{ '--ac': a.color }}>
                {a.count > 1 ? `${a.count}x ` : ''}{a.label}
              </span>
            ))}
            {hoveredYear !== null && hoveredYear !== selectedYear && (
              <button className="arc-jump" onClick={() => onJumpToSeason(slotIndex, fmtSeasonId(hoveredYear))}>
                GO
              </button>
            )}
          </div>
        )}
      </div>

      <svg className="awards-svg" viewBox={`0 0 ${W} ${H}`} aria-label={`${slot.player?.name} awards timeline`}>
        {rows.map((row, ri) => (
          <rect key={row.key} x={PAD_L} y={PAD_T + ri * ROW_H + 1} width={plotW} height={ROW_H - 2}
            fill={ri % 2 === 0 ? '#f4f2e8' : '#ffffff'} />
        ))}

        <rect x={0} y={PAD_T} width={PAD_L} height={rows.length * ROW_H} fill="#e8e6de" />
        {rows.map((row, ri) => (
          <rect key={`lb-${row.key}`} x={0} y={PAD_T + ri * ROW_H + 1} width={PAD_L - 1} height={ROW_H - 2}
            fill={row.color} opacity="0.2" />
        ))}
        {rows.map((row, ri) => (
          <rect key={`la-${row.key}`} x={0} y={PAD_T + ri * ROW_H + 1} width={5} height={ROW_H - 2}
            fill={row.color} opacity="0.9" />
        ))}

        {rows.map((_, ri) => (
          <line key={ri} x1={0} y1={PAD_T + ri * ROW_H} x2={W} y2={PAD_T + ri * ROW_H}
            stroke="#000000" strokeWidth="0.45" opacity="0.18" />
        ))}

        {ticks.map((y) => (
          <line key={y} x1={xFor(y)} y1={PAD_T} x2={xFor(y)} y2={PAD_T + rows.length * ROW_H}
            stroke="#000000" strokeWidth="0.65" opacity="0.16" />
        ))}

        {selectedYear >= minYear && selectedYear <= maxYear && (
          <>
            <rect x={bandFor(selectedYear).x} y={PAD_T} width={bandFor(selectedYear).width}
              height={rows.length * ROW_H} fill={slot.colors.primary} opacity="0.1" />
            <line x1={xFor(selectedYear)} y1={PAD_T} x2={xFor(selectedYear)} y2={PAD_T + rows.length * ROW_H}
              stroke={slot.colors.primary} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
          </>
        )}

        {hoveredYear !== null && (
          <>
            <rect x={bandFor(hoveredYear).x} y={PAD_T} width={bandFor(hoveredYear).width}
              height={rows.length * ROW_H} fill={slot.colors.primary} opacity="0.18" />
            <line x1={xFor(hoveredYear)} y1={PAD_T} x2={xFor(hoveredYear)} y2={PAD_T + rows.length * ROW_H}
              stroke={slot.colors.primary} strokeWidth="2" opacity="0.9" />
          </>
        )}

        {rows.map((row, ri) => (
          <text key={row.key} x={PAD_L - 10} y={yFor(ri) + 4}
            textAnchor="end" fontSize="10" fill="#111111" fontWeight="700">{row.label}</text>
        ))}

        {rows.map((row, ri) =>
          Array.from(row.years.entries()).map(([year, count]) => (
            <g key={`${row.key}-${year}`}>
              <circle cx={xFor(year)} cy={yFor(ri)} r={9} fill={row.color} stroke="#000000" strokeWidth="2" />
              {count > 1 && (
                <text x={xFor(year)} y={yFor(ri) + 4} textAnchor="middle" fontSize="9" fill="#000000" fontWeight="700">{count}</text>
              )}
            </g>
          ))
        )}

        {ticks.map((y) => (
          <text key={y} x={xFor(y)} y={H - 10} textAnchor="middle" fontSize="10" fill="#555555" fontWeight="700">{y}</text>
        ))}

        {Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
          const year = minYear + i;
          return (
            <rect key={year} x={bandFor(year).x} y={PAD_T} width={bandFor(year).width}
              height={rows.length * ROW_H} fill="transparent" style={{ cursor: 'default' }}
              onMouseEnter={() => setHoveredYear(year)}
              onMouseLeave={() => setHoveredYear(null)}
              onClick={() => onJumpToSeason(slotIndex, fmtSeasonId(year))} />
          );
        })}
      </svg>
    </div>
  );
}
