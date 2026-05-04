import { Trophy } from 'lucide-react';
import { groupAccolades, awardMatchesSeason } from '../nba/awards.js';

export default function AccoladesPanel({ selected }) {
  return (
    <div className="accolades-grid">
      {selected.map((slot, index) => {
        const isSeasonScope = slot.viewMode !== 'alltime';
        const sourceAwards =
          isSeasonScope
            ? (slot.bundle?.awards || []).filter((award) => awardMatchesSeason(award, slot.season?.SEASON_ID))
            : slot.bundle?.awards || [];
        const awards = groupAccolades(sourceAwards);
        return (
          <div className="accolade-column" key={index} style={{ '--slot-color': slot.colors.primary }}>
            <h3>
              <Trophy size={18} />
              {slot.player?.name || `Player ${index + 1}`}
            </h3>
            {awards.length ? (
              <ol className="award-list">
                {awards.map((award) => (
                  <li className="award-row" key={award.label} style={{ '--award-color': award.color }}>
                    <strong>
                      {award.short}
                      <em>x{award.count}</em>
                    </strong>
                    <span>{award.label}</span>
                    <small>{award.details || `${award.count} total`}</small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-state">
                {isSeasonScope ? 'No season accolades yet. Switch to All-Time for career awards.' : 'No accolades returned yet.'}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
