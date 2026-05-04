import { useEffect, useMemo, useState } from 'react';
import { num, averageRows, formatOne, formatSigned, formatTotal } from '../nba/compute.js';

function getSlotApiSeason(slot) {
  const selectedSeason = slot?.season?.SEASON_ID;
  if (selectedSeason && selectedSeason !== 'Career') return selectedSeason;
  return slot?.bundle?.seasons?.at(-1)?.SEASON_ID || '';
}

function getGameLogDisplay(slot, seasonType) {
  const playerId = slot?.player?.id;

  if (slot?.viewMode === 'alltime') {
    return {
      key: playerId ? `${playerId}:alltime:${seasonType}` : null,
      label: 'All-Time'
    };
  }

  const seasonId = getSlotApiSeason(slot);
  return {
    key: playerId && seasonId && seasonId !== 'Career' ? `${playerId}:${seasonId}:${seasonType}` : null,
    label: seasonId || 'Season'
  };
}

function parseGameOpponent(matchup = '') {
  const parts = String(matchup).split(/\s+(?:vs\.|@)\s+/);
  return parts[1]?.trim() || matchup;
}

function getGameScore(game) {
  const pm = game.PLUS_MINUS != null && game.PLUS_MINUS !== '' ? num(game.PLUS_MINUS) : 0;
  return (
    num(game.PTS) +
    num(game.REB) * 1.2 +
    num(game.AST) * 1.5 +
    num(game.STL) * 3 +
    num(game.BLK) * 3 -
    num(game.TOV) * 1.2 +
    pm * 0.12
  );
}

function getTopOverallGames(rows) {
  return [...rows]
    .map((game, index) => ({ game, index, score: getGameScore(game) }))
    .sort((a, b) => b.score - a.score || num(b.game.PTS) - num(a.game.PTS) || a.index - b.index)
    .slice(0, 25)
    .map(({ game, score }, index) => ({ ...game, GAME_SCORE: score, TOP_RANK: index + 1 }));
}

function formatGameDate(raw = '') {
  const str = String(raw).trim();
  if (!str) return '';
  try {
    const d = new Date(str);
    if (!isNaN(d)) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {}
  return str;
}

function getGameKey(game) {
  return `${game.GAME_ID || game.GAME_DATE || game.TOP_RANK}`;
}

function GameTooltip({ game, anchorX, wrapWidth }) {
  const pm = game.PLUS_MINUS != null && game.PLUS_MINUS !== '' ? num(game.PLUS_MINUS) : null;
  const isAway = String(game.MATCHUP || '').includes('@');
  const opponent = parseGameOpponent(game.MATCHUP);
  const tooltipWidth = 196;
  const left = Math.max(0, Math.min(anchorX - tooltipWidth / 2, Math.max(0, wrapWidth - tooltipWidth)));

  return (
    <div className="form-tooltip top-game-tooltip" style={{ left: `${left}px`, bottom: 'calc(100% + 12px)' }}>
      <div className="form-tip-head">
        <span className="form-tip-venue">{isAway ? '@ ' : 'vs '}</span>
        <span className="form-tip-opp">{opponent || game.MATCHUP || 'N/A'}</span>
        <span className={`form-tip-wl ${game.WL === 'W' ? 'form-tip-w' : 'form-tip-l'}`}>{game.WL}</span>
      </div>
      <div className="form-tip-stats">
        <div style={{ '--ts': '#c8102e' }}><b>{Math.round(num(game.PTS))}</b><span>PTS</span></div>
        <div style={{ '--ts': '#34d399' }}><b>{Math.round(num(game.REB))}</b><span>REB</span></div>
        <div style={{ '--ts': '#38bdf8' }}><b>{Math.round(num(game.AST))}</b><span>AST</span></div>
        {pm !== null && (
          <div style={{ '--ts': pm >= 0 ? '#34d399' : '#f87171' }}>
            <b>{pm >= 0 ? '+' : ''}{Math.round(pm)}</b><span>+/-</span>
          </div>
        )}
      </div>
      <div className="form-tip-score">#{game.TOP_RANK} top game - {formatOne(game.GAME_SCORE)} score</div>
      {game.GAME_DATE && <div className="form-tip-date">{formatGameDate(game.GAME_DATE)}</div>}
    </div>
  );
}

function TopGameBars({ games, selectedGame, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const maxScore = useMemo(() => Math.max(1, ...games.map((r) => r.GAME_SCORE || getGameScore(r))), [games]);
  const selectedIndex = useMemo(() => games.findIndex((game) => selectedGame && getGameKey(game) === getGameKey(selectedGame)), [games, selectedGame]);

  const setHoverFromTarget = (event, game) => {
    const barRect = event.currentTarget.getBoundingClientRect();
    const wrapRect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!wrapRect) return;

    setHovered({
      game,
      x: barRect.left - wrapRect.left + barRect.width / 2,
      wrapWidth: wrapRect.width
    });
  };

  const handleKeyNav = (event, index) => {
    if (!games.length) return;

    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = Math.min(games.length - 1, index + 1);
    else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, index - 1);
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = games.length - 1;
    else return;

    event.preventDefault();
    onSelect(games[nextIndex]);
  };

  return (
    <div className="top-games-board">
      <div className="top-games-head">
        <span>Top 25 Games</span>
        <b>Game Score Rank</b>
      </div>
      <div className="top-game-bars" onMouseLeave={() => setHovered(null)}>
        {games.map((game, i) => {
          const score = game.GAME_SCORE || getGameScore(game);
          const h = Math.max(28, Math.round((score / maxScore) * 136));
          const isSelected = selectedGame && getGameKey(selectedGame) === getGameKey(game);
          return (
            <button
              key={`${getGameKey(game)}-${i}`}
              type="button"
              className={`top-game-bar ${game.WL === 'W' ? 'form-win' : 'form-loss'} ${isSelected ? 'selected' : ''}`}
              style={{ '--bar-h': `${h}px`, '--rank': i + 1 }}
              data-rank={i + 1}
              aria-label={`Top game ${i + 1}: ${Math.round(num(game.PTS))} points against ${parseGameOpponent(game.MATCHUP)}`}
              aria-pressed={isSelected}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => onSelect(game)}
              onMouseEnter={(event) => setHoverFromTarget(event, game)}
              onFocus={(event) => setHoverFromTarget(event, game)}
              onBlur={() => setHovered(null)}
              onKeyDown={(event) => handleKeyNav(event, i)}
              tabIndex={selectedIndex === -1 ? (i === 0 ? 0 : -1) : (isSelected ? 0 : -1)}
            >
              <span>{i + 1}</span>
            </button>
          );
        })}
        {hovered && (
          <GameTooltip game={hovered.game} anchorX={hovered.x} wrapWidth={hovered.wrapWidth} />
        )}
      </div>
    </div>
  );
}

function GameDetailBox({ game }) {
  if (!game) {
    return (
      <div className="game-detail-box empty">
        <strong>No game selected</strong>
        <span>Top game details</span>
      </div>
    );
  }

  const pm = game.PLUS_MINUS != null && game.PLUS_MINUS !== '' ? num(game.PLUS_MINUS) : null;
  const opponent = parseGameOpponent(game.MATCHUP);
  const statItems = [
    ['PTS', game.PTS, '#c8102e'],
    ['REB', game.REB, '#34d399'],
    ['AST', game.AST, '#38bdf8'],
    ['STL', game.STL, '#f6c945'],
    ['BLK', game.BLK, '#9f7aea'],
    ['TOV', game.TOV, '#000000'],
    ['MIN', game.MIN, '#6db5e8'],
    ['Score', game.GAME_SCORE, '#ff5fa2']
  ];

  return (
    <div className="game-detail-box">
      <div className="game-detail-head">
        <div>
          <strong>{opponent || game.MATCHUP || 'Opponent'}</strong>
          <span>{formatGameDate(game.GAME_DATE)}</span>
        </div>
        <b className={game.WL === 'W' ? 'detail-win' : 'detail-loss'}>{game.WL || '-'}</b>
      </div>
      <div className="game-detail-stats">
        {statItems.map(([label, value, color]) => (
          <span key={label} style={{ '--detail-color': color }}>
            <b>{label === 'MIN' ? formatOne(value) : label === 'Score' ? formatOne(value) : formatTotal(value)}</b>
            <em>{label}</em>
          </span>
        ))}
        {pm !== null && (
          <span className={pm >= 0 ? 'positive' : 'negative'}>
            <b>{formatSigned(pm)}</b>
            <em>+/-</em>
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryGrid({ rows, topGames, viewMode }) {
  const summary = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let totalPM = 0;
    let hasPM = false;
    let doubleDoubles = 0;
    let tripleDoubles = 0;

    for (const row of rows) {
      if (row.WL === 'W') wins += 1;
      else if (row.WL === 'L') losses += 1;

      const pmRaw = row.PLUS_MINUS;
      if (pmRaw != null && pmRaw !== '') {
        hasPM = true;
        totalPM += num(pmRaw);
      }

      const cats = [num(row.PTS), num(row.REB), num(row.AST), num(row.STL), num(row.BLK)];
      const tens = cats.filter((v) => v >= 10).length;
      if (tens >= 2) doubleDoubles += 1;
      if (tens >= 3) tripleDoubles += 1;
    }

    return {
      wins,
      losses,
      totalPM,
      avgPM: rows.length ? totalPM / rows.length : 0,
      hasPM,
      doubleDoubles,
      tripleDoubles,
      bestGame: topGames[0] || null,
      isAllTime: viewMode === 'alltime'
    };
  }, [rows, topGames, viewMode]);

  return (
    <div className="game-log-summary top-game-summary">
      <span><b>{rows.length}</b> Total GP</span>
      <span className="wl-chip">
        <span className="wl-record"><b className="wl-w">{summary.wins}</b><b className="wl-sep">-</b><b className="wl-l">{summary.losses}</b></span>
        <em>Total W-L</em>
      </span>
      {summary.hasPM && (
        <span style={{ '--pm-color': (summary.isAllTime ? summary.totalPM : summary.avgPM) >= 0 ? '#34d399' : '#f87171' }}>
          <b>{summary.isAllTime ? formatSigned(summary.totalPM) : formatSigned(summary.avgPM)}</b> {summary.isAllTime ? 'Total +/-' : 'Avg +/-'}
        </span>
      )}
      <span><b>{formatOne(averageRows(rows, 'PTS'))}</b> Avg PTS</span>
      <span><b>{formatOne(averageRows(rows, 'REB'))}</b> Avg REB</span>
      <span><b>{formatOne(averageRows(rows, 'AST'))}</b> Avg AST</span>
      {summary.bestGame && <span><b>{formatTotal(summary.bestGame.PTS)}</b> Best Score</span>}
      <span><b>{summary.tripleDoubles}</b> Triple-double</span>
      <span><b>{summary.doubleDoubles}</b> Double-double</span>
    </div>
  );
}

function PlayerGameLogPanel({ slot, index, seasonType, gameLogs }) {
  const display = getGameLogDisplay(slot, seasonType);
  const log = display.key ? gameLogs[display.key] : null;
  const rows = log?.rows || [];
  const topGames = useMemo(() => getTopOverallGames(rows), [rows]);
  const [selectedGameId, setSelectedGameId] = useState('');

  useEffect(() => {
    if (!topGames.length) {
      setSelectedGameId('');
      return;
    }

    setSelectedGameId((prev) => {
      if (prev && topGames.some((game) => getGameKey(game) === prev)) return prev;
      return getGameKey(topGames[0]);
    });
  }, [topGames]);

  const selectedGame = topGames.find((game) => getGameKey(game) === selectedGameId) || topGames[0] || null;

  const handleSelectGame = (game) => {
    setSelectedGameId(getGameKey(game));
  };

  return (
    <article className="game-log-card top-game-card" key={slot.player?.id || index} style={{ '--slot-color': slot.colors.primary }}>
      <div className="game-log-head">
        <strong>{slot.player?.name || `Player ${index + 1}`}</strong>
        <span>{display.label} / {seasonType === 'Playoffs' ? 'Playoffs' : 'Regular'}</span>
      </div>

      {log?.loading ? (
        <p className="empty-state">Loading game log...</p>
      ) : rows.length ? (
        <>
          <div className="top-game-layout">
            <TopGameBars games={topGames} selectedGame={selectedGame} onSelect={handleSelectGame} />
            <GameDetailBox game={selectedGame} />
          </div>
          <SummaryGrid rows={rows} topGames={topGames} viewMode={slot.viewMode} />
        </>
      ) : (
        <p className="empty-state">{log?.error || 'No game log returned for this selection.'}</p>
      )}
    </article>
  );
}

export default function GameLogTimeline({ selected, seasonType, gameLogs }) {
  return (
    <div className="game-log-grid top-game-grid">
      {selected.map((slot, index) => (
        <PlayerGameLogPanel
          key={slot.player?.id || index}
          slot={slot}
          index={index}
          seasonType={seasonType}
          gameLogs={gameLogs}
        />
      ))}
    </div>
  );
}
