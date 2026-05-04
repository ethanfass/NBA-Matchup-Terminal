import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  Building2,
  ChevronsRight,
  Crosshair,
  FlaskConical,
  GitCompareArrows,
  LineChart,
  Medal,
  Mountain,
  Shuffle,
  Table2,
  Trophy,
  Users
} from 'lucide-react';
import './styles.css';
import { fallbackPlayers } from './nba/fallbackData.js';
import { CURRENT_SEASON, CAREER_COUNT_KEYS } from './nba/constants.js';
import {
  num,
  findPlayer,
  mergePlayers,
  normalizeSeason,
  getResultSet,
  rowsToObjects,
  getBundleKey,
  getCareerResultSetName,
  computeCareerStats
} from './nba/compute.js';
import { getTeamColorSet, getSlotColors, differentiateSelectedColors } from './nba/teamColors.js';
import {
  nbaRequest,
  loadPlayerShotChart,
  loadPlayerClutch,
  loadPlayerDefense,
  loadMatchupDirection,
  loadGameLog,
  loadSeasonStandings,
  loadTeamContext,
  loadRankings
} from './nba/api.js';
import { getTeamStanding } from './nba/teams.js';

import Header from './components/Header.jsx';
import WindowBar from './components/WindowBar.jsx';
import PlayerPicker from './components/PlayerPicker.jsx';
import PlayerCard from './components/PlayerCard.jsx';
import TeamContextPanel from './components/TeamContextPanel.jsx';
import MatchupEdgeBoard from './components/MatchupEdgeBoard.jsx';
import GameLogTimeline from './components/GameLogTimeline.jsx';
import RadarPanel from './components/RadarPanel.jsx';
import AccoladesPanel from './components/AccoladesPanel.jsx';
import CareerArcChart from './components/CareerArcChart.jsx';
import AwardsTimeline from './components/AwardsTimeline.jsx';
import PeakSeasonFinder from './components/PeakSeasonFinder.jsx';
import StatsTable from './components/StatsTable.jsx';
import ScoutingLab from './components/ScoutingLab.jsx';

const DESKTOP_SHORTCUTS = [
  { id: 'compare-panel', label: 'COMPARE', color: '#1d428a', icon: GitCompareArrows },
  { id: 'players-panel', label: 'PLAYERS', color: '#c8102e', icon: Users },
  { id: 'team-context-panel', label: 'TEAM_CONTEXT', color: '#73e6b2', icon: Building2 },
  { id: 'matchup-edge-panel', label: 'MATCHUP_EDGE', color: '#ffdf5d', icon: Crosshair },
  { id: 'top-games-panel', label: 'TOP_25_GAMES', color: '#ff8aa8', icon: BarChart3 },
  { id: 'spider-chart-panel', label: 'SPIDER_CHART', color: '#8bdcff', icon: Activity },
  { id: 'career-arc-panel', label: 'CAREER_ARC', color: '#9f7aea', icon: LineChart },
  { id: 'awards-panel', label: 'TROPHY_CASE', color: '#f58426', icon: Trophy },
  { id: 'peak-season-panel', label: 'PEAK_SEASON', color: '#75e6b2', icon: Mountain },
  { id: 'stat-matchup-panel', label: 'STAT_MATCHUP', color: '#d6d3d1', icon: Table2 },
  { id: 'scouting-lab-panel', label: 'SCOUTING_LAB', color: '#06b6d4', icon: FlaskConical }
];

function getSlotApiSeason(slot) {
  const selectedSeason = slot?.season?.SEASON_ID;
  if (selectedSeason && selectedSeason !== 'Career') return selectedSeason;
  return slot?.bundle?.seasons?.at(-1)?.SEASON_ID || '';
}

function getGameLogRequest(slot, seasonType) {
  const playerId = slot?.player?.id;

  if (slot?.viewMode === 'alltime') {
    const seasonIds = (slot?.bundle?.seasons || [])
      .map((season) => season.SEASON_ID)
      .filter((seasonId) => seasonId && seasonId !== 'Career');

    if (!playerId || !seasonIds.length) return null;

    return {
      key: `${playerId}:alltime:${seasonType}`,
      scope: 'alltime',
      playerId,
      seasonIds,
      seasonType
    };
  }

  const seasonId = getSlotApiSeason(slot);
  if (!playerId || !seasonId || seasonId === 'Career') return null;
  return { key: `${playerId}:${seasonId}:${seasonType}`, scope: 'season', playerId, seasonId, seasonType };
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

function getRankingRequestForSlot(slot, perMode) {
  if (!slot?.player?.id) return null;
  const rankingMode = perMode === 'totals' ? 'totals' : 'averages';

  if (slot.viewMode === 'alltime') {
    return {
      key: `alltime:${slot.seasonType}:${rankingMode}`,
      scope: 'alltime',
      seasonType: slot.seasonType,
      perMode: rankingMode
    };
  }

  const seasonId = slot.season?.SEASON_ID;
  if (!seasonId || seasonId === 'Career') return null;

  return {
    key: `season:${slot.seasonType}:${seasonId}:${rankingMode}`,
    scope: 'season',
    seasonId,
    seasonType: slot.seasonType,
    perMode: rankingMode
  };
}

function getScoutingKey(selected, seasonType) {
  const parts = selected.map((slot) => {
    const playerId = slot?.player?.id || 'empty';
    const seasonId = getSlotApiSeason(slot) || 'none';
    return `${playerId}:${seasonId}`;
  });
  return parts.some((part) => !part.startsWith('empty')) ? `${seasonType}:${parts.join('|')}` : '';
}

function getMatchupTitle(slots) {
  const [first, second] = slots;
  const firstName = first?.player?.name || 'Player 1';
  const secondName = second?.player?.name || 'Player 2';
  const isAllTime = first?.viewMode === 'alltime';
  const firstSeason = first?.season?.SEASON_ID || first?.season;
  const secondSeason = second?.season?.SEASON_ID || second?.season;
  const matchupScope = isAllTime
    ? 'All-Time Matchup'
    : firstSeason && firstSeason === secondSeason
      ? `${firstSeason} Matchup`
      : 'Season Matchup';

  return `${firstName} vs ${secondName} - ${matchupScope}`;
}

function DesktopShortcuts({ activeShortcut, onSelect }) {
  return (
    <nav className="desktop-shortcuts" aria-label="Panel shortcuts">
      {DESKTOP_SHORTCUTS.map((shortcut) => {
        const Icon = shortcut.icon || Medal;
        return (
        <a
          key={shortcut.id}
          href={`#${shortcut.id}`}
          className={activeShortcut === shortcut.id ? 'active' : ''}
          onClick={() => onSelect(shortcut.id)}
          onFocus={() => onSelect(shortcut.id)}
          style={{ '--shortcut-color': shortcut.color }}
        >
          <span className="shortcut-icon" aria-hidden="true">
            <Icon className="shortcut-glyph" strokeWidth={2.35} />
          </span>
          <span>{shortcut.label}</span>
        </a>
        );
      })}
    </nav>
  );
}

async function safeScoutingLoad(loader) {
  try {
    return await loader();
  } catch {
    return { error: 'Tracking feed unavailable right now.' };
  }
}

async function loadScoutingReport(selected, seasonType) {
  const slots = selected.map((slot) => ({
    playerId: slot?.player?.id,
    seasonId: getSlotApiSeason(slot)
  }));

  const [first, second] = selected;
  const firstSeason = getSlotApiSeason(first);
  const secondSeason = getSlotApiSeason(second);

  const headToHeadLoader = async () => {
    if (!first?.player?.id || !second?.player?.id) {
      return { rows: [], reason: 'Pick two players to load true matchup tracking.' };
    }
    if (!firstSeason || !secondSeason || firstSeason !== secondSeason) {
      return { rows: [], reason: 'Choose the same tracked season for both players to load true matchup data.' };
    }
    const [firstOnSecond, secondOnFirst] = await Promise.all([
      loadMatchupDirection(first.player.id, second.player.id, firstSeason, seasonType),
      loadMatchupDirection(second.player.id, first.player.id, firstSeason, seasonType)
    ]);
    const rows = [...firstOnSecond, ...secondOnFirst].filter(Boolean);
    return { rows, reason: rows.length ? '' : 'No direct matchup possessions returned for this pair and season.' };
  };

  const [shots, clutch, defense, headToHead] = await Promise.all([
    Promise.all(slots.map((slot) => safeScoutingLoad(() => loadPlayerShotChart(slot.playerId, slot.seasonId, seasonType)))),
    Promise.all(slots.map((slot) => safeScoutingLoad(() => loadPlayerClutch(slot.playerId, slot.seasonId, seasonType)))),
    Promise.all(slots.map((slot) => safeScoutingLoad(() => loadPlayerDefense(slot.playerId, slot.seasonId, seasonType)))),
    safeScoutingLoad(headToHeadLoader)
  ]);

  return { shots, clutch, defense, headToHead };
}

function App() {
  const [players, setPlayers] = useState(fallbackPlayers);
  const [playerSource, setPlayerSource] = useState('seeded');
  const [slots, setSlots] = useState([
    { player: null, query: '', season: CURRENT_SEASON, viewMode: 'season' },
    { player: null, query: '', season: CURRENT_SEASON, viewMode: 'season' }
  ]);
  const [bundles, setBundles] = useState({});
  const [radarMode, setRadarMode] = useState('overlap');
  const [seasonType, setSeasonType] = useState('Regular Season');
  const [tableMode, setTableMode] = useState('basic');
  const [perMode, setPerMode] = useState('averages');
  const [rankings, setRankings] = useState({});
  const [scoutingReports, setScoutingReports] = useState({});
  const [standings, setStandings] = useState({});
  const [teamContexts, setTeamContexts] = useState({});
  const [gameLogs, setGameLogs] = useState({});
  const [status, setStatus] = useState('Ready. Pick players or load the sample matchup.');
  const [isBusy, setIsBusy] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState('');

  useEffect(() => {
    loadPlayersFromDatabase();
    const cached = loadPlayersFromCache();
    loadPlayerIndex({ silent: cached });
  }, []);

  useEffect(() => {
    slots.forEach((slot) => {
      const key = getBundleKey(slot.player?.id, seasonType);
      if (!slot.player || bundles[key]) return;
      loadBundle(slot.player.id, seasonType);
    });
  }, [slots, bundles, seasonType]);

  useEffect(() => {
    slots.forEach((slot, index) => {
      if (!slot.player) return;
      const bundle = bundles[getBundleKey(slot.player.id, seasonType)];
      const seasons = bundle?.seasons || [];
      if (!seasons.length || bundle?.loading) return;
      if (!slot.season || !seasons.some((s) => s.SEASON_ID === slot.season)) {
        updateSlot(index, { season: seasons.at(-1).SEASON_ID });
      }
    });
  }, [bundles, seasonType]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadBundle(playerId, targetSeasonType) {
    const key = getBundleKey(playerId, targetSeasonType);
    setIsBusy(true);
    setBundles((current) => ({
      ...current,
      [key]: {
        loading: true,
        seasons: current[key]?.seasons || [],
        awards: current[key]?.awards || [],
        error: ''
      }
    }));

    try {
      const careerData = await nbaRequest('playercareerstats', { PlayerID: playerId, PerMode: 'PerGame', LeagueID: '00' });
      const careerSetName = getCareerResultSetName(targetSeasonType);
      const careerSet = (careerData?.resultSets || []).find((set) => set.name === careerSetName);
      const seasons = rowsToObjects(careerSet).map(normalizeSeason);

      if (!seasons.length) {
        throw new Error(`NBA API returned no ${targetSeasonType.toLowerCase()} seasons for this player.`);
      }

      setBundles((current) => ({
        ...current,
        [key]: {
          loading: false,
          seasons,
          awards: current[key]?.awards || [],
          error: ''
        }
      }));

      try {
        const awardsData = await nbaRequest('playerawards', { PlayerID: playerId });
        const awardSet = getResultSet(awardsData, 'PlayerAwards');
        const awards = awardSet ? rowsToObjects(awardSet) : [];
        setBundles((current) => {
          if (!current[key]) return current;
          return {
            ...current,
            [key]: {
              ...current[key],
              awards
            }
          };
        });
      } catch {}
    } catch (error) {
      setBundles((current) => ({
        ...current,
        [key]: {
          loading: false,
          seasons: [],
          awards: [],
          error: `NBA API failed: ${error.message}`
        }
      }));
    } finally {
      setIsBusy(false);
    }
  }

  const selectedBase = slots.map((slot, index) => {
    const bundle = slot.player ? bundles[getBundleKey(slot.player.id, seasonType)] : null;
    const seasons = bundle?.seasons || [];
    let season, radarSeason;

    if (slot.viewMode === 'alltime') {
      const careerAvg = computeCareerStats(seasons, 'averages');
      season = perMode === 'totals' ? computeCareerStats(seasons, 'totals') : careerAvg;
      radarSeason = careerAvg;
    } else {
      const pickedSeason = seasons.find((item) => item.SEASON_ID === slot.season) || seasons.at(-1);
      if (perMode === 'totals' && pickedSeason) {
        const gp = num(pickedSeason.GP);
        const totalSeason = { ...pickedSeason };
        CAREER_COUNT_KEYS.forEach((k) => { totalSeason[k] = num(pickedSeason[k]) * gp; });
        totalSeason.MIN = num(pickedSeason.MIN) * gp;
        season = totalSeason;
      } else {
        season = pickedSeason;
      }
      radarSeason = seasons.find((item) => item.SEASON_ID === slot.season) || seasons.at(-1);
    }

    return {
      ...slot,
      bundle,
      seasonType,
      season,
      radarSeason,
      colors: getSlotColors(slots, index, season)
    };
  });
  const selected = differentiateSelectedColors(selectedBase);

  const rankingRequests = useMemo(() => {
    const requests = new Map();
    selected.forEach((slot) => {
      const request = getRankingRequestForSlot(slot, perMode);
      if (request) requests.set(request.key, request);
    });
    return Array.from(requests.values());
  }, [selected, perMode]);

  useEffect(() => {
    const missing = rankingRequests.filter((request) => !rankings[request.key]);
    if (!missing.length) return;

    setRankings((current) => {
      const next = { ...current };
      missing.forEach((request) => { next[request.key] = { loading: true, ranks: {} }; });
      return next;
    });

    missing.forEach((request) => {
      loadRankings(request)
        .then((ranks) => setRankings((current) => ({ ...current, [request.key]: { loading: false, ranks } })))
        .catch((error) => setRankings((current) => ({ ...current, [request.key]: { loading: false, ranks: {}, error: error.message } })));
    });
  }, [rankingRequests, rankings]);

  const standingsSeasons = useMemo(() => {
    const seasons = new Set();
    selected.forEach((slot) => {
      const seasonId = slot.viewMode === 'season' ? slot.season?.SEASON_ID : '';
      if (seasonId && seasonId !== 'Career') seasons.add(seasonId);
    });
    return Array.from(seasons);
  }, [selected]);

  useEffect(() => {
    const missing = standingsSeasons.filter((seasonId) => !standings[seasonId]);
    if (!missing.length) return;

    setStandings((current) => {
      const next = { ...current };
      missing.forEach((seasonId) => { next[seasonId] = { loading: true, rows: [] }; });
      return next;
    });

    missing.forEach((seasonId) => {
      loadSeasonStandings(seasonId)
        .then((rows) => setStandings((current) => ({ ...current, [seasonId]: { loading: false, rows } })))
        .catch((error) => setStandings((current) => ({ ...current, [seasonId]: { loading: false, rows: [], error: error.message } })));
    });
  }, [standingsSeasons, standings]);

  const teamContextRequests = useMemo(() => {
    const requests = new Map();
    selected.forEach((slot) => {
      const request = getTeamContextRequest(slot);
      if (request) requests.set(request.key, request);
    });
    return Array.from(requests.values());
  }, [selected]);

  useEffect(() => {
    const missing = teamContextRequests.filter((request) => !teamContexts[request.key]);
    if (!missing.length) return;

    setTeamContexts((current) => {
      const next = { ...current };
      missing.forEach((request) => { next[request.key] = { loading: true }; });
      return next;
    });

    missing.forEach((request) => {
      loadTeamContext(request)
        .then((context) => setTeamContexts((current) => ({ ...current, [request.key]: { loading: false, ...context } })))
        .catch((error) => setTeamContexts((current) => ({ ...current, [request.key]: { loading: false, error: error.message } })));
    });
  }, [teamContextRequests, teamContexts]);

  const scoutingKey = useMemo(() => getScoutingKey(selected, seasonType), [selected, seasonType]);

  useEffect(() => {
    if (!scoutingKey || scoutingReports[scoutingKey]) return;

    setScoutingReports((current) => ({ ...current, [scoutingKey]: { loading: true } }));

    loadScoutingReport(selected, seasonType)
      .then((report) => setScoutingReports((current) => ({ ...current, [scoutingKey]: { loading: false, ...report } })))
      .catch((error) => setScoutingReports((current) => ({ ...current, [scoutingKey]: { loading: false, error: error.message } })));
  }, [scoutingKey, scoutingReports, selected]);

  const gameLogRequests = useMemo(() => {
    const requests = new Map();
    selected.forEach((slot) => {
      const request = getGameLogRequest(slot, seasonType);
      if (request) requests.set(request.key, request);
    });
    return Array.from(requests.values());
  }, [selected, seasonType]);

  useEffect(() => {
    const missing = gameLogRequests.filter((request) => !gameLogs[request.key]);
    if (!missing.length) return;

    setGameLogs((current) => {
      const next = { ...current };
      missing.forEach((request) => { next[request.key] = { loading: true, rows: [] }; });
      return next;
    });

    missing.forEach((request) => {
      loadGameLog(request)
        .then((rows) => setGameLogs((current) => ({ ...current, [request.key]: { loading: false, rows } })))
        .catch((error) => setGameLogs((current) => ({ ...current, [request.key]: { loading: false, rows: [], error: error.message } })));
    });
  }, [gameLogRequests, gameLogs]);

  const pageVars = useMemo(() => {
    const first = selected[0]?.colors;
    const second = selected[1]?.colors;
    return {
      '--team-one': first?.primary || '#C8102E',
      '--team-one-dark': first?.dark || '#000000',
      '--team-two': second?.primary || '#1D428A',
      '--team-two-dark': second?.dark || '#000000',
      '--matchup-one': first?.primary || '#C8102E',
      '--matchup-two': second?.primary || '#1D428A'
    };
  }, [selected]);

  function updateSlot(index, patch) {
    setSlots((current) =>
      current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot))
    );
  }

  function choosePlayer(index, value) {
    const player = findPlayer(players, value);
    updateSlot(index, {
      query: value,
      player: player || (value.trim() ? slots[index].player : null),
      season: player || value.trim() ? slots[index].season : CURRENT_SEASON
    });
  }

  async function loadPlayersFromDatabase() {
    try {
      const response = await fetch('/api/db/players');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'SQLite request failed');

      if (Array.isArray(data.players) && data.players.length) {
        setPlayers((current) => mergePlayers(data.players, current));
        setPlayerSource('SQLite');
        setStatus('SQLite player database ready.');
      }
    } catch {
      setPlayerSource('seeded');
    }
  }

  function loadPlayersFromCache() {
    try {
      const raw = localStorage.getItem('nba-player-index');
      if (!raw) return false;
      const { players: cached, ts } = JSON.parse(raw);
      if (Date.now() - ts > 24 * 60 * 60 * 1000) return false;
      if (!Array.isArray(cached) || cached.length < 100) return false;
      setPlayers(mergePlayers(cached, fallbackPlayers));
      setPlayerSource('cached');
      return true;
    } catch {
      return false;
    }
  }

  async function loadPlayerIndex({ silent = false } = {}) {
    if (!silent) setIsBusy(true);
    if (!silent) setStatus('Loading full NBA player index...');

    try {
      const data = await nbaRequest('commonallplayers', {
        LeagueID: '00',
        Season: CURRENT_SEASON,
        IsOnlyCurrentSeason: '0'
      });
      const resultSet = getResultSet(data, 'CommonAllPlayers');
      const remotePlayers = rowsToObjects(resultSet)
        .filter((row) => row.GAMES_PLAYED_FLAG === 'Y')
        .map((row) => ({
          id: Number(row.PERSON_ID),
          name: row.DISPLAY_FIRST_LAST,
          fromYear: Number(row.FROM_YEAR),
          toYear: Number(row.TO_YEAR),
          team: row.TEAM_ABBREVIATION || 'NBA'
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (!remotePlayers.length) throw new Error('No players returned.');

      try {
        localStorage.setItem('nba-player-index', JSON.stringify({ players: remotePlayers, ts: Date.now() }));
      } catch {}

      setPlayers(mergePlayers(remotePlayers, fallbackPlayers));
      setPlayerSource('NBA API');
      if (!silent) setStatus('Full NBA player index loaded.');
    } catch {
      if (!silent) {
        setPlayerSource('seeded fallback');
        setStatus('NBA index did not load. Seeded players and sample matchup still work.');
      }
    } finally {
      if (!silent) setIsBusy(false);
    }
  }

  function loadSamplePlayers() {
    const shai = findPlayer(players, 'Shai Gilgeous-Alexander') || fallbackPlayers.find((player) => player.id === 1628983);
    const jokic = findPlayer(players, 'Nikola Jokic') || fallbackPlayers.find((player) => player.id === 203999);

    setSlots([
      { player: shai, query: shai?.name || 'Shai Gilgeous-Alexander', season: CURRENT_SEASON, viewMode: 'season' },
      { player: jokic, query: jokic?.name || 'Nikola Jokic', season: CURRENT_SEASON, viewMode: 'season' }
    ]);
    setSeasonType('Regular Season');
    setStatus(`Loaded sample players for ${CURRENT_SEASON}.`);

    [shai, jokic].forEach((player) => {
      if (!player?.id) return;
      if (!bundles[getBundleKey(player.id, 'Regular Season')]) loadBundle(player.id, 'Regular Season');
    });
  }

  function loadRandomPlayers() {
    const pool = players.filter((player) => player?.id && player?.name);
    if (pool.length < 2) return;

    const firstIndex = Math.floor(Math.random() * pool.length);
    let secondIndex = Math.floor(Math.random() * pool.length);
    while (secondIndex === firstIndex) {
      secondIndex = Math.floor(Math.random() * pool.length);
    }

    const first = pool[firstIndex];
    const second = pool[secondIndex];

    setSlots([
      { player: first, query: first.name, season: CURRENT_SEASON, viewMode: 'alltime' },
      { player: second, query: second.name, season: CURRENT_SEASON, viewMode: 'alltime' }
    ]);
    setSeasonType('Regular Season');
    setStatus(`Loaded random all-time matchup: ${first.name} vs ${second.name}.`);

    [first, second].forEach((player) => {
      if (!player?.id) return;
      if (!bundles[getBundleKey(player.id, 'Regular Season')]) loadBundle(player.id, 'Regular Season');
    });
  }

  function syncYears() {
    const target = selected[0]?.season?.SEASON_ID;
    const secondSeasons = selected[1]?.bundle?.seasons || [];

    if (!target || !secondSeasons.some((season) => season.SEASON_ID === target)) {
      setStatus(`${selected[1]?.player?.name || 'Player 2'} does not have ${target || 'that season'} available.`);
      return;
    }

    updateSlot(1, { season: target });
    setStatus(`Both players set to ${target}.`);
  }

  function setViewMode(vm) {
    setSlots((current) => current.map((s) => ({ ...s, viewMode: vm })));
  }

  function jumpToPeakSeason(index, seasonId) {
    setSlots((current) =>
      current.map((s, i) =>
        i === index ? { ...s, season: seasonId, viewMode: 'season' } : { ...s, viewMode: 'season' }
      )
    );
    setStatus(`Jumped to ${selected[index]?.player?.name || `Player ${index + 1}`}'s peak season: ${seasonId}.`);
  }

  return (
    <main className="app-shell" style={pageVars}>
      <DesktopShortcuts activeShortcut={activeShortcut} onSelect={setActiveShortcut} />
      <Header status={status} source={playerSource} isBusy={isBusy} />

      <section id="compare-panel" className="window command-window">
        <WindowBar title="COMPARE.EXE" />
        <div className="command-grid">
          {slots.map((slot, index) => (
            <PlayerPicker
              key={index}
              index={index}
              slot={slot}
              bundle={bundles[getBundleKey(slot.player?.id, seasonType)]}
              players={players}
              selected={selected[index]}
              onPlayerInput={(value) => choosePlayer(index, value)}
              onSeasonChange={(season) => updateSlot(index, { season })}
            />
          ))}
          <div className="control-stack">
            <div className="quick-player-buttons">
              <button className="ibm-button wide sample-button" type="button" onClick={loadSamplePlayers}>
                <Users size={18} />
                Sample players
              </button>
              <button className="ibm-button wide random-button" type="button" onClick={loadRandomPlayers}>
                <Shuffle size={18} />
                Random players
              </button>
            </div>
            <div className="segmented scope-toggle" aria-label="Stat scope">
              <button type="button" className={slots[0].viewMode === 'alltime' ? 'active' : ''} onClick={() => setViewMode('alltime')}>All-Time</button>
              <button type="button" className={slots[0].viewMode === 'season' ? 'active' : ''} onClick={() => setViewMode('season')}>Season</button>
            </div>
            <button className="ibm-button wide" type="button" onClick={syncYears} disabled={slots[0].viewMode === 'alltime'}>
              <ChevronsRight size={18} />
              Same year
            </button>
            <div className="segmented season-type-toggle" aria-label="Season type">
              <button type="button" className={seasonType === 'Regular Season' ? 'active' : ''} onClick={() => setSeasonType('Regular Season')}>Regular</button>
              <button type="button" className={seasonType === 'Playoffs' ? 'active' : ''} onClick={() => setSeasonType('Playoffs')}>Playoffs</button>
            </div>
          </div>
        </div>
      </section>

      <div className="matchup-title-panel">
        <span>Matchup</span>
        <strong>{getMatchupTitle(selected)}</strong>
      </div>

      <section id="players-panel" className="matchup-hero">
        {selected.map((slot, index) => (
          <PlayerCard
            key={index}
            slot={slot}
            index={index}
            teamStanding={getTeamStanding(standings, slot)}
          />
        ))}
      </section>

      <section id="team-context-panel" className="window team-context-window">
        <WindowBar title="TEAM_CONTEXT.TXT" color="#73e6b2" />
        <TeamContextPanel selected={selected} standings={standings} teamContexts={teamContexts} />
      </section>

      <section id="matchup-edge-panel" className="window edge-window">
        <WindowBar title="MATCHUP_EDGE.BAR" color="#ffdf5d" />
        <MatchupEdgeBoard selected={selected} />
      </section>

      <section id="top-games-panel" className="window game-log-window">
        <WindowBar title="TOP_25_GAMES.LOG" color="#ff8aa8" />
        <GameLogTimeline selected={selected} seasonType={seasonType} gameLogs={gameLogs} />
      </section>

      <section className="content-grid">
        <div id="spider-chart-panel" className="window chart-window">
          <WindowBar title="SPIDER_CHART.SYS" color="#8bdcff" />
          <RadarPanel selected={selected} mode={radarMode} onModeChange={setRadarMode} />
        </div>

        <div id="trophy-case-panel" className="window accolades-window">
          <WindowBar title="TROPHY_CASE.DAT" color="#f58426" />
          <AccoladesPanel selected={selected} />
        </div>
      </section>

      <section id="career-arc-panel" className="window arc-window">
        <WindowBar title="CAREER_ARC.GRF" color="#9f7aea" />
        <CareerArcChart selected={selected} onJumpToSeason={jumpToPeakSeason} />
      </section>

      <section id="awards-panel" className="window awards-tl-window">
        <WindowBar title="AWARDS.TML" color="#f58426" />
        <AwardsTimeline selected={selected} onJumpToSeason={jumpToPeakSeason} />
      </section>

      <section id="peak-season-panel" className="window peak-window">
        <WindowBar title="PEAK_SEASON.EXE" color="#75e6b2" />
        <PeakSeasonFinder selected={selected} onJumpToSeason={jumpToPeakSeason} />
      </section>

      <section id="stat-matchup-panel" className="window table-window">
        <WindowBar title="STAT_MATCHUP.WKS" color="#d6d3d1" />
        <div className="table-toolbar-row">
          <div className="segmented stat-category" aria-label="Stat view">
            <button type="button" className={tableMode === 'basic' ? 'active' : ''} onClick={() => setTableMode('basic')}>Basic</button>
            <button type="button" className={tableMode === 'advanced' ? 'active' : ''} onClick={() => setTableMode('advanced')}>Advanced</button>
          </div>
          <div className="segmented rate-category" aria-label="Per mode">
            <button type="button" className={perMode === 'averages' ? 'active' : ''} onClick={() => setPerMode('averages')}>Averages</button>
            <button type="button" className={perMode === 'totals' ? 'active' : ''} onClick={() => setPerMode('totals')}>Totals</button>
          </div>
        </div>
        <StatsTable selected={selected} mode={tableMode} perMode={perMode} rankings={rankings} />
      </section>

      <section id="scouting-lab-panel" className="window scouting-window">
        <WindowBar title="SCOUTING_LAB.DAT" color="#06b6d4" />
        <ScoutingLab selected={selected} report={scoutingReports[scoutingKey]} />
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
