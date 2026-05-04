import { useState } from 'react';
import { HelpCircle, Loader2, Zap } from 'lucide-react';
import nbaLogo from '../assets/nbalogo.svg';
import WindowBar from './WindowBar.jsx';

export default function Header({ isBusy }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <header className="app-header">
        <div className="desktop-icon">
          <img src={nbaLogo} alt="NBA" />
        </div>
        <div>
          <p className="eyebrow">NBA comparison workstation</p>
          <h1>NBA Matchup Terminal</h1>
        </div>
        <div className="status-strip" aria-label="NBA API status">
          {isBusy ? <Loader2 className="spin" size={18} /> : <Zap size={18} />}
          <span>{isBusy ? 'Loading NBA stats' : 'Stats endpoint ready'}</span>
          <strong>NBA API</strong>
        </div>
        <button
          type="button"
          className={`ibm-button help-toggle${showHelp ? ' active' : ''}`}
          onClick={() => setShowHelp((v) => !v)}
          aria-expanded={showHelp}
        >
          <HelpCircle size={18} />
          Help
        </button>
      </header>
      {showHelp && <HelpPanel />}
    </>
  );
}

function HelpPanel() {
  return (
    <div className="window help-panel">
      <WindowBar title="HELP.TXT" />
      <div className="help-grid">
        <section className="help-section">
          <h3>What is this?</h3>
          <p>A retro-style NBA stats workstation. Load any two players and compare their numbers side by side — across any season in their career.</p>
        </section>
        <section className="help-section">
          <h3>How to use</h3>
          <ol>
            <li>Type a player name in each <strong>PLAYER</strong> slot and pick from the suggestions.</li>
            <li>Use the season dropdown to pick a year for each player.</li>
            <li>Switch <strong>Regular</strong> or <strong>Playoffs</strong> to change the whole comparison mode.</li>
            <li>Hit <strong>Same Year</strong> to sync both players to the same season.</li>
            <li>Switch the radar to <strong>Split</strong> to view each chart separately.</li>
            <li>Use <strong>All-Time</strong> or <strong>Season</strong> in each player slot to drive the table, trophy case, and scouting data.</li>
          </ol>
        </section>
        <section className="help-section">
          <h3>What you get</h3>
          <p>All-Time or Season mode carries through the stat table, trophy case, and scouting lab.</p>
          <ul>
            <li><strong>Player cards</strong> — headshot, team, and top four stats at a glance.</li>
            <li><strong>Radar chart</strong> — 8-stat spider chart overlaid for both players.</li>
            <li><strong>Stat table</strong> — full per-season breakdown with head-to-head highlights.</li>
            <li><strong>Trophy case</strong> — career accolades sorted by prestige.</li>
            <li><strong>Game log</strong> - top games, hover details, and click-through box scores.</li>
            <li><strong>Scouting lab</strong> - shot charts, clutch splits, matchup tracking, and defensive shot suppression.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
