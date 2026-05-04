import { getTeamStanding, formatTeamRecord, formatTeamSeed, formatTeamMetric, formatConferenceRank, formatPlayoffResult } from '../nba/teams.js';

function getReadableBadgeTextColor(hex = '') {
  const raw = String(hex || '').trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(raw)) return '#000000';

  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#000000' : '#ffffff';
}

function getPlayoffTone(value) {
  const text = String(value || '').toLowerCase();
  const recordMatch = text.match(/\((\d+)\s*-\s*(\d+)\)/);

  if (text.includes('won') || text.includes('champion') || text.includes('advanced')) return 'good';
  if (recordMatch) {
    const wins = Number(recordMatch[1]);
    const losses = Number(recordMatch[2]);
    if (Number.isFinite(wins) && Number.isFinite(losses)) {
      if (wins >= 4 && losses < 4) return 'good';
      if (losses >= 4 && wins < 4) return 'bad';
    }
  }

  return '';
}

function getTeamContextRequest(slot) {
  if (slot?.viewMode !== 'season') return null;
  const seasonId = slot?.season?.SEASON_ID;
  const teamId = Number(slot?.season?.TEAM_ID);
  if (!seasonId || seasonId === 'Career' || !teamId) return null;
  return {
    key: `${teamId}:${seasonId}`,
    teamId,
    seasonId,
    teamAbbreviation: slot?.season?.TEAM_ABBREVIATION || slot?.player?.team || ''
  };
}

export default function TeamContextPanel({ selected, standings, teamContexts }) {
  return (
    <div className="team-context-grid">
      {selected.map((slot, index) => {
        const request = getTeamContextRequest(slot);
        const context = request ? teamContexts[request.key] : null;
        const standing = getTeamStanding(standings, slot);
        const regular = context?.regular;
        const year = context?.year;
        const hasAnyContext = Boolean(standing || regular || year);
        const team = slot.season?.TEAM_ABBREVIATION || slot.player?.team || 'NBA';
        const seasonLabel = slot.season?.SEASON_ID || 'Season';
        const badgeBg = slot?.colors?.primary;
        const badgeFg = getReadableBadgeTextColor(badgeBg);
        const stats = [
          { label: 'Record', value: formatTeamRecord(standing, regular, year) },
          { label: 'Off Rtg', value: formatTeamMetric(regular?.OFF_RATING ?? regular?.E_OFF_RATING) },
          { label: 'Def Rtg', value: formatTeamMetric(regular?.DEF_RATING ?? regular?.E_DEF_RATING) },
          { label: 'Pace', value: formatTeamMetric(regular?.PACE ?? regular?.E_PACE) },
          { label: 'Seed', value: formatTeamSeed(standing) || formatConferenceRank(year) },
          { label: 'Playoffs', value: formatPlayoffResult(year, slot.season?.SEASON_ID, standing), tone: getPlayoffTone(formatPlayoffResult(year, slot.season?.SEASON_ID, standing)) }
        ];

        return (
          <article className="team-context-card" key={slot.player?.id || index} style={{ '--slot-color': slot.colors.primary }}>
            <div className="team-context-head">
              <strong>{team}</strong>
              <span style={badgeBg ? { background: badgeBg, color: badgeFg } : undefined}>{seasonLabel}</span>
            </div>
            {slot.viewMode !== 'season' ? (
              <p className="empty-state">Switch to season mode for team context.</p>
            ) : !request ? (
              <p className="empty-state">No team context available.</p>
            ) : !hasAnyContext && (!context || context.loading) ? (
              <p className="empty-state">Loading team context...</p>
            ) : !hasAnyContext && context?.error ? (
              <p className="empty-state">{context.error}</p>
            ) : (
              <div className="team-context-stats">
                {stats.map((stat) => (
                  <div key={stat.label} className={stat.tone ? `stat-${stat.tone}` : ''}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
