import { formatOne } from '../nba/compute.js';
import { STAT_COLORS } from '../nba/constants.js';
import { getReadableTeamTextColor } from '../nba/teams.js';
import WindowBar from './WindowBar.jsx';

export default function PlayerCard({ slot, index, teamStanding, panelId }) {
  const { player, season, bundle, colors } = slot;
  const name = player?.name || `Player ${index + 1}`;
  const photoUrl = player?.id ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png` : '';
  const seasonContext = getSeasonContextText(slot, teamStanding);
  const record = [
    ['PTS', season?.PTS],
    ['REB', season?.REB],
    ['AST', season?.AST],
    ['STL', season?.STL],
    ['BLK', season?.BLK]
  ];

  return (
    <article
      id={panelId}
      className="player-card window"
      data-empty={!player ? 'true' : 'false'}
      data-team={season?.TEAM_ABBREVIATION || player?.team || 'NBA'}
      style={{
        '--slot-color': colors.primary,
        '--slot-secondary': colors.secondary,
        '--slot-dark': colors.dark,
        '--slot-meta-color': getReadableTeamTextColor(colors)
      }}
    >
      <WindowBar title={`PLAYER_${index + 1}.BIO`} colors={colors} />
      <div className="player-card-body">
        <div className="headshot-frame">
          {photoUrl ? <img src={photoUrl} alt="" onError={(event) => (event.currentTarget.style.display = 'none')} /> : null}
          <span>{name.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="player-copy">
          <div className="player-season-meta">
            <span>{season?.TEAM_ABBREVIATION || player?.team || 'NBA'} / {season?.SEASON_ID || 'Season'}</span>
            {seasonContext && <strong>{seasonContext}</strong>}
          </div>
          <h2>{name}</h2>
          <div className="mini-stats">
            {record.map(([label, value]) => (
              <div key={label} style={{ '--stat-color': STAT_COLORS[label] }}>
                <strong>{formatOne(value)}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {bundle?.error && <p className="data-note">{bundle.error}</p>}
        </div>
      </div>
    </article>
  );
}

function getSeasonContextText(slot, standing) {
  if (slot?.viewMode !== 'season' || !standing) return '';
  const record = standing?.Record || (() => {
    const wins = standing?.WINS;
    const losses = standing?.LOSSES;
    return Number.isFinite(Number(wins)) && Number.isFinite(Number(losses))
      ? `${Number(wins)}-${Number(losses)}`
      : null;
  })();
  const seed = (() => {
    const rank = Number(standing?.PlayoffRank || standing?.PlayoffSeeding);
    const conference = standing?.Conference || '';
    if (!Number.isFinite(rank) || rank <= 0) return '';
    const ordinals = { 1: '1st', 2: '2nd', 3: '3rd' };
    const o = ordinals[rank] || `${rank}th`;
    return `${o}${conference ? ` ${conference}` : ''} seed`;
  })();
  return [record, seed].filter(Boolean).join(' / ');
}
