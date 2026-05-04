# NBA Matchup Machine

Retro IBM-style NBA player comparer built with React and Vite.

## Run

```bash
npm install
npm run dev
```

The app uses `/api/nba` as a tiny proxy for NBA Stats endpoints in local dev and Netlify. It fetches:

- `commonallplayers` for player search
- `playercareerstats` for per-game season stats
- `playerawards` for accolades

If the NBA Stats API times out, the UI falls back to seeded star-player data so the comparer still works while showing a status note.
