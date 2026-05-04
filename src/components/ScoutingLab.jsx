import { Crosshair, Flame, Shield, Swords } from 'lucide-react';
import { num, formatOne, formatPct, formatSigned, formatSignedPct, formatTotal } from '../nba/compute.js';

function getSlotApiSeason(slot) {
  const selectedSeason = slot?.season?.SEASON_ID;
  if (selectedSeason && selectedSeason !== 'Career') return selectedSeason;
  return slot?.bundle?.seasons?.at(-1)?.SEASON_ID || '';
}

function getShotZoneKey(row) {
  return [row.SHOT_ZONE_BASIC, row.SHOT_ZONE_AREA, row.SHOT_ZONE_RANGE].join('|');
}

function getShotZoneStats(chart) {
  const league = new Map(
    (chart.leagueAverages || []).map((row) => [getShotZoneKey(row), num(row.FG_PCT)])
  );
  const zones = {};

  (chart.shots || []).forEach((shot) => {
    const key = getShotZoneKey(shot);
    const zone = zones[key] || { attempts: 0, makes: 0, leaguePct: league.get(key) || 0 };
    zone.attempts += 1;
    zone.makes += num(shot.SHOT_MADE_FLAG);
    zones[key] = zone;
  });

  Object.values(zones).forEach((zone) => {
    zone.fgPct = zone.attempts ? zone.makes / zone.attempts : 0;
    zone.diff = zone.leaguePct ? zone.fgPct - zone.leaguePct : 0;
  });

  return zones;
}

function getShotTemperatureColor(zone) {
  if (!zone || !Number.isFinite(zone.diff)) return '#c7c7c7';
  if (zone.diff >= 0.045) return '#ff3f3f';
  if (zone.diff >= 0.015) return '#ff9f43';
  if (zone.diff <= -0.045) return '#2f80ff';
  if (zone.diff <= -0.015) return '#67e8f9';
  return '#ffffff';
}

const CLUTCH_LABELS = {
  'Final 5 min, within 5': 'Last 5 min (within 5 pts)',
  'Final 3 min, within 5': 'Last 3 min (within 5 pts)',
  'Final 1 min, within 5': 'Last minute (within 5 pts)',
  'Final 5 min, +/- 5': 'Last 5 min (+/- 5 pts)'
};

function formatClutchLabel(label) {
  return CLUTCH_LABELS[label] || label;
}

function formatDefenseZone(label = '') {
  return String(label)
    .replace(/Less Than 6Ft/i, 'At the rim')
    .replace(/Less Than 10Ft/i, 'Inside 10 ft')
    .replace(/Greater Than 15Ft/i, '15+ ft')
    .replace(/Overall/i, 'All shots');
}

function ScoutingPanel({ icon, title, note, children, wide = false }) {
  return (
    <article className={wide ? 'scouting-panel scouting-panel-wide' : 'scouting-panel'}>
      <h3>
        {icon}
        {title}
      </h3>
      {note && <p className="scouting-note">{note}</p>}
      {children}
    </article>
  );
}

function formatMatchupLoadingLine(selected = []) {
  const leftName = selected?.[0]?.player?.name || 'Player 1';
  const rightName = selected?.[1]?.player?.name || 'Player 2';
  const seasonType = selected?.[0]?.seasonType;
  const typeLabel = seasonType === 'Playoffs' ? 'Playoffs' : (seasonType ? 'Regular' : '');

  const leftSeason = getSlotApiSeason(selected?.[0]);
  const rightSeason = getSlotApiSeason(selected?.[1]);
  const seasonLabel = leftSeason && rightSeason && leftSeason === rightSeason
    ? leftSeason
    : (leftSeason || rightSeason || '');

  return [`${leftName} vs ${rightName}`, seasonLabel, typeLabel].filter(Boolean).join(' · ');
}

function ShotChartCourt({ chart }) {
  const zoneStats = getShotZoneStats(chart);

  return (
    <svg className="shot-court" viewBox="0 0 500 470" role="img" aria-label="NBA shot chart">
      <rect className="court-floor" x="8" y="8" width="484" height="454" />
      <path className="court-line" d="M30 430 H470" />
      <path className="court-line" d="M190 430 V250 H310 V430" />
      <circle className="court-line court-no-fill" cx="250" cy="407" r="7" />
      <path className="court-line court-no-fill" d="M220 407 H280" />
      <path className="court-line court-no-fill" d="M170 407 A80 80 0 0 0 330 407" />
      <path className="court-line court-no-fill" d="M65 430 V310 M435 430 V310" />
      <path className="court-line court-no-fill" d="M65 310 A185 185 0 0 1 435 310" />
      <path className="court-line court-no-fill" d="M210 250 A40 40 0 0 1 290 250" />
      {chart.shots.map((shot, index) => {
        const made = num(shot.SHOT_MADE_FLAG) === 1;
        const zone = getShotZoneKey(shot);
        const color = getShotTemperatureColor(zoneStats[zone]);
        const x = Math.max(14, Math.min(486, 250 + num(shot.LOC_X)));
        const y = Math.max(14, Math.min(456, 430 - num(shot.LOC_Y)));

        return (
          <circle key={`${shot.GAME_ID}-${shot.GAME_EVENT_ID}-${index}`}
            className={made ? 'shot-dot made' : 'shot-dot missed'}
            cx={x} cy={y} r={made ? 2.6 : 2.25}
            style={{ '--shot-color': color }} />
        );
      })}
    </svg>
  );
}

function ShotChartModule({ selected, report }) {
  return (
    <ScoutingPanel icon={<Crosshair size={18} />} title="Shot Chart" wide>
      <div className="shot-chart-grid">
        {selected.map((slot, index) => {
          const chart = report?.shots?.[index];
          const seasonId = getSlotApiSeason(slot);

          return (
            <div className="shot-chart-card" key={slot.player?.id || index} style={{ '--slot-color': slot.colors.primary }}>
              <div className="scouting-subhead">
                <strong>{slot.player?.name || `Player ${index + 1}`}</strong>
                <span>{seasonId || 'Season unavailable'}</span>
              </div>
              {report?.loading ? (
                <p className="empty-state">Loading shot chart...</p>
              ) : chart?.shots?.length ? (
                <>
                  <ShotChartCourt chart={chart} />
                  <div className="shot-chart-legend">
                    <div className="legend-col">
                      <span className="legend-item"><i className="hot-dot" /> Red: way above avg</span>
                      <span className="legend-item"><i className="warm-dot" /> Orange: above avg</span>
                    </div>
                    <div className="legend-col">
                      <span className="legend-item"><i className="cold-dot" /> Blue: way below avg</span>
                      <span className="legend-item"><i className="cool-dot" /> Cyan: below avg</span>
                    </div>
                    <div className="legend-col">
                      <span className="legend-item"><i className="avg-dot" /> White: near avg</span>
                      <span className="legend-item shot-shape-legend">
                        <span className="shot-shape-pair">
                          <i className="made-dot" />
                          <i className="hollow-dot" />
                        </span>
                        Filled/Hollow: made/missed
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="empty-state">{chart?.error || 'No shot chart data returned for this season.'}</p>
              )}
            </div>
          );
        })}
      </div>
    </ScoutingPanel>
  );
}

function HeadToHeadModule({ selected, report }) {
  const matchups = report?.headToHead?.rows || [];
  const reason = report?.headToHead?.reason;
  const loadingLine = formatMatchupLoadingLine(selected);

  return (
    <ScoutingPanel
      icon={<Swords size={18} />}
      title="Direct Matchup"
      note="When one selected player was directly guarding the other."
    >
      {report?.loading ? (
        <p className="empty-state">
          Loading matchup tracking...
          {loadingLine ? (
            <>
              <br />
              <small>{loadingLine}</small>
            </>
          ) : null}
        </p>
      ) : matchups.length ? (
        <div className="matchup-mini-table">
          {matchups.map((row) => {
            const offenseSlot = selected.find((slot) => slot.player?.id === Number(row.OFF_PLAYER_ID));

            return (
              <div key={`${row.OFF_PLAYER_ID}-${row.DEF_PLAYER_ID}`} className="matchup-mini-row"
                style={{ '--slot-color': offenseSlot?.colors.primary || 'var(--cyan)' }}>
                <div className="matchup-player-line">
                  <strong>{row.OFF_PLAYER_NAME}</strong>
                  <small>guarded by {row.DEF_PLAYER_NAME}</small>
                </div>
                <span className="tracking-metric"><b>Matchup poss.</b><em>{formatOne(row.PARTIAL_POSS)} total</em></span>
                <span className="tracking-metric"><b>Shot %</b><em>{formatPct(row.MATCHUP_FG_PCT)}</em></span>
                <span className="tracking-metric"><b>Points</b><em>{formatTotal(row.PLAYER_PTS)}</em></span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty-state matchup-no-data">{reason || 'No matchup tracking returned for this pair.'}</p>
      )}
    </ScoutingPanel>
  );
}

function ClutchModule({ selected, report }) {
  return (
    <ScoutingPanel
      icon={<Flame size={18} />}
      title="Close-Game Stats"
      note="What they did late in games where the score was still tight."
    >
      <div className="clutch-grid">
        {selected.map((slot, index) => {
          const rows = report?.clutch?.[index]?.rows || [];
          return (
            <div className="clutch-card" key={slot.player?.id || index} style={{ '--slot-color': slot.colors.primary }}>
              <div className="scouting-subhead">
                <strong>{slot.player?.name || `Player ${index + 1}`}</strong>
                <span>{getSlotApiSeason(slot) || 'Season unavailable'}</span>
              </div>
              {report?.loading ? (
                <p className="empty-state">Loading clutch splits...</p>
              ) : rows.length ? (
                <div className="clutch-rows">
                  {rows.map((row) => (
                    <div className="clutch-row" key={row.label}>
                      <strong>{formatClutchLabel(row.label)}</strong>
                      <span className="tracking-metric"><b>Points</b><em>{formatOne(row.PTS)}</em></span>
                      <span className="tracking-metric"><b>Shot %</b><em>{formatPct(row.FG_PCT)}</em></span>
                      <span className="tracking-metric">
                        <b>Team +/-</b>
                        <em className={num(row.PLUS_MINUS) >= 0 ? 'good' : 'bad'}>{formatSigned(row.PLUS_MINUS)}</em>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No clutch split returned for this season.</p>
              )}
            </div>
          );
        })}
      </div>
    </ScoutingPanel>
  );
}

function DefenseModule({ selected, report }) {
  return (
    <ScoutingPanel
      icon={<Shield size={18} />}
      title="Shots Allowed On Defense"
      note="Lower than average is good: it means opponents shot worse when defended by this player."
    >
      <div className="defense-grid">
        {selected.map((slot, index) => {
          const rows = report?.defense?.[index]?.rows || [];
          return (
            <div className="defense-card" key={slot.player?.id || index} style={{ '--slot-color': slot.colors.primary }}>
              <div className="scouting-subhead">
                <strong>{slot.player?.name || `Player ${index + 1}`}</strong>
                <span>{getSlotApiSeason(slot) || 'Season unavailable'}</span>
              </div>
              {report?.loading ? (
                <p className="empty-state">Loading defensive zones...</p>
              ) : rows.length ? (
                <div className="defense-rows">
                  {rows.map((row) => (
                    <div className="defense-row" key={row.DEFENSE_CATEGORY}
                      style={{ '--suppression': `${Math.min(100, Math.abs(num(row.PCT_PLUSMINUS)) * 900)}%` }}>
                      <strong>{formatDefenseZone(row.DEFENSE_CATEGORY)}</strong>
                      <span className="tracking-metric"><b>Opponent FG%</b><em>{formatPct(row.D_FG_PCT)}</em></span>
                      <span className="tracking-metric">
                        <b>Vs avg</b>
                        <em className={num(row.PCT_PLUSMINUS) <= 0 ? 'good' : 'bad'}>{formatSignedPct(row.PCT_PLUSMINUS)}</em>
                      </span>
                      <span className="tracking-metric"><b>Shots</b><em>{formatOne(row.D_FGA)}</em></span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No defensive shot tracking returned for this season.</p>
              )}
            </div>
          );
        })}
      </div>
    </ScoutingPanel>
  );
}

export default function ScoutingLab({ selected, report }) {
  return (
    <div className="scouting-lab">
      <div className="scouting-grid">
        <ShotChartModule selected={selected} report={report} />
        <HeadToHeadModule selected={selected} report={report} />
        <ClutchModule selected={selected} report={report} />
        <DefenseModule selected={selected} report={report} />
      </div>
    </div>
  );
}
