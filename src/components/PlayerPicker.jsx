import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Users } from 'lucide-react';
import { normalizeSearch, formatPlayerYears } from '../nba/compute.js';

export default function PlayerPicker({ index, slot, bundle, players, selected, onPlayerInput, onSeasonChange }) {
  const seasons = bundle?.seasons || [];
  const [isSuggesting, setIsSuggesting] = useState(false);
  const suggestions = useMemo(() => {
    const query = normalizeSearch(slot.query);
    if (query.length < 2) return [];
    return players.filter((player) => normalizeSearch(player.name).includes(query)).slice(0, 8);
  }, [players, slot.query]);

  const inputRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);

  useLayoutEffect(() => {
    if (!isSuggesting || !suggestions.length) {
      setDropPos(null);
      return;
    }
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom, left: rect.left, width: rect.width });
  }, [isSuggesting, suggestions.length]);

  const viewMode = slot.viewMode || 'season';
  const seasonPlaceholder = bundle?.loading
    ? 'Loading seasons...'
    : bundle?.error
      ? 'NBA API error'
      : slot.player
        ? 'No seasons returned'
        : 'Pick a player';

  return (
    <div className="picker-panel" style={{ '--slot-color': selected?.colors?.primary || '#ffdf5d' }}>
      <label>
        <span>
          <Search size={16} />
          Player {index + 1}
        </span>
        <div className="player-input-wrap">
          <input
            ref={inputRef}
            value={slot.query}
            onChange={(event) => { onPlayerInput(event.target.value); setIsSuggesting(true); }}
            onFocus={() => setIsSuggesting(true)}
            onBlur={() => window.setTimeout(() => setIsSuggesting(false), 120)}
            placeholder="Search any NBA player"
          />
          <Search className="player-input-icon" size={16} aria-hidden="true" />
        </div>
      </label>

      {dropPos && createPortal(
        <div
          className="player-suggestions"
          style={{ position: 'fixed', top: `${dropPos.top}px`, left: `${dropPos.left}px`, width: `${dropPos.width}px` }}
        >
          {suggestions.map((player) => (
            <button
              key={player.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onPlayerInput(player.name);
                setIsSuggesting(false);
              }}
            >
              <strong>{player.name}</strong>
              <small>{formatPlayerYears(player)}</small>
            </button>
          ))}
        </div>,
        document.body
      )}

      {viewMode === 'season' && (
        <label>
          <span>
            <Users size={16} />
            Season
          </span>
          <div className="season-input-wrap">
            <select
              value={selected?.season?.SEASON_ID || slot.season || ''}
              onChange={(event) => onSeasonChange(event.target.value)}
              disabled={bundle?.loading || !seasons.length}
            >
              {!seasons.length && <option value="">{seasonPlaceholder}</option>}
              {seasons.map((season) => (
                <option key={season.SEASON_ID} value={season.SEASON_ID}>
                  {season.SEASON_ID} - {season.TEAM_ABBREVIATION}
                </option>
              ))}
            </select>
            <ChevronDown className="season-input-icon" size={16} aria-hidden="true" />
          </div>
          {bundle?.error && <p className="data-note">{bundle.error}</p>}
        </label>
      )}
    </div>
  );
}
