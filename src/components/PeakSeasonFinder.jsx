import { useMemo, useState } from 'react';
import { SlidersHorizontal, Star, TrendingUp, Trophy } from 'lucide-react';
import { num, computeTS, computePeakScore, formatOne, formatPct } from '../nba/compute.js';
import { STAT_COLORS } from '../nba/constants.js';

function getStatColor(key) {
  if (STAT_COLORS[key]) return STAT_COLORS[key];
  if (key.startsWith('FG3')) return STAT_COLORS.FG3_PCT;
  if (key.startsWith('FG')) return STAT_COLORS.FG_PCT;
  if (key.startsWith('FT')) return STAT_COLORS.FT_PCT;
  if (key.includes('REB')) return STAT_COLORS.REB;
  if (key === 'GP') return '#9aa7bd';
  if (key === 'TOV') return STAT_COLORS.TOV;
  return '#c7c7c7';
}

export default function PeakSeasonFinder({ selected, onJumpToSeason }) {
  const [mode, setMode] = useState('mvp');
  const [weights, setWeights] = useState({ PTS: 1.5, REB: 0.9, AST: 1.1, STL: 1.5, BLK: 1.2, TOV: -1.0, TS: 25 });
  const [minGP, setMinGP] = useState(20);

  const peaks = useMemo(() =>
    selected.map((slot) => {
      const seasons = slot.bundle?.seasons || [];
      const valid = seasons.filter((s) => num(s.GP) >= minGP);
      if (!valid.length) return null;
      const scored = valid.map((s) => ({ season: s, score: computePeakScore(s, mode, weights) }));
      scored.sort((a, b) => b.score - a.score);
      return scored[0];
    }),
    [selected, mode, weights, minGP]
  );

  return (
    <div className="peak-finder">
      <div className="peak-toolbar">
        <div className="segmented peak-mode-tabs">
          {[['scoring', <TrendingUp size={14} />, 'Points Peak'], ['mvp', <Trophy size={14} />, 'MVP Score'], ['custom', <SlidersHorizontal size={14} />, 'Custom']].map(([id, icon, label]) => (
            <button key={id} type="button" className={mode === id ? 'active' : ''} onClick={() => setMode(id)}>
              {icon}
              {label}
            </button>
          ))}
        </div>
        <div className="min-gp-control">
          <span>Min GP</span>
          <input type="range" min="1" max="75" value={minGP} className="peak-range" onChange={(e) => setMinGP(Number(e.target.value))} />
          <strong>{minGP}</strong>
        </div>
      </div>

      {mode === 'custom' && (
        <div className="custom-weights-panel">
          {[
            { key: 'PTS', label: 'PTS', min: 0, max: 4 },
            { key: 'REB', label: 'REB', min: 0, max: 4 },
            { key: 'AST', label: 'AST', min: 0, max: 4 },
            { key: 'STL', label: 'STL', min: 0, max: 4 },
            { key: 'BLK', label: 'BLK', min: 0, max: 4 },
            { key: 'TOV', label: 'TOV', min: -4, max: 0 },
            { key: 'TS', label: 'TS%', min: 0, max: 60 }
          ].map(({ key, label, min, max }) => (
            <div key={key} className="weight-row" style={{ '--wc': getStatColor(key === 'TS' ? 'FG_PCT' : key) }}>
              <span>{label}</span>
              <input type="range" min={min} max={max} step="0.1" value={weights[key]} className="peak-range"
                onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))} />
              <strong>{(weights[key] >= 0 ? '+' : '') + weights[key].toFixed(1)}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="peak-grid">
        {selected.map((slot, index) => {
          const peak = peaks[index];
          const isCurrent = peak && slot.viewMode === 'season' && slot.season?.SEASON_ID === peak.season.SEASON_ID;

          return (
            <article key={index} className="peak-card" style={{ '--slot-color': slot.colors.primary, '--slot-dark': slot.colors.dark }}>
              <div className="peak-card-head">
                <Star size={15} />
                <span>{slot.player?.name || `Player ${index + 1}`}</span>
              </div>
              {slot.bundle?.loading ? (
                <p className="empty-state">Loading seasons...</p>
              ) : slot.bundle?.error ? (
                <p className="empty-state">{slot.bundle.error}</p>
              ) : !peak ? (
                <p className="empty-state">No qualifying seasons (min {minGP} GP).</p>
              ) : (
                <>
                  <div className="peak-season-row">
                    <div className="peak-season-badge">
                      <strong>{peak.season.SEASON_ID}</strong>
                      <span>{peak.season.TEAM_ABBREVIATION}</span>
                    </div>
                    {mode !== 'scoring' && (
                      <div className="peak-score-badge">
                        <span>Score</span>
                        <strong>{peak.score.toFixed(1)}</strong>
                      </div>
                    )}
                  </div>
                  <div className="peak-stats-row">
                    {[
                      ['PTS', num(peak.season.PTS), formatOne],
                      ['REB', num(peak.season.REB), formatOne],
                      ['AST', num(peak.season.AST), formatOne],
                      ['STL', num(peak.season.STL), formatOne],
                      ['BLK', num(peak.season.BLK), formatOne],
                      ['TS%', computeTS(peak.season), formatPct],
                      ['GP', num(peak.season.GP), (v) => String(Math.round(v))]
                    ].map(([label, value, fmt]) => (
                      <div key={label} className="peak-stat" style={{ '--sc': getStatColor(label === 'TS%' ? 'FG_PCT' : label) }}>
                        <strong>{fmt(value)}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`ibm-button wide peak-jump${isCurrent ? ' active' : ''}`}
                    onClick={() => onJumpToSeason(index, peak.season.SEASON_ID)}
                  >
                    <TrendingUp size={14} />
                    {isCurrent ? 'Viewing peak season' : 'Jump to peak season'}
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
