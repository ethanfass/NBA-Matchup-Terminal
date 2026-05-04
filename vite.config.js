import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { getPlayersFromDb } from './server/db.js';
import { fetchNbaStats } from './server/nbaProxy.js';

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'nba-stats-dev-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const requestUrl = new URL(req.url || '', 'http://localhost');
          if (requestUrl.pathname === '/api/db/players') {
            try {
              sendJson(res, 200, { players: getPlayersFromDb() });
            } catch (error) {
              sendJson(res, 500, { error: error.message || 'SQLite request failed' });
            }
            return;
          }

          if (requestUrl.pathname !== '/api/nba') {
            next();
            return;
          }

          try {
            const url = requestUrl;
            const endpoint = url.searchParams.get('endpoint');
            url.searchParams.delete('endpoint');

            const data = await fetchNbaStats(endpoint, url.searchParams);
            sendJson(res, 200, data);
          } catch (error) {
            sendJson(res, error.statusCode || 502, {
              error: error.message || 'NBA stats request failed'
            });
          }
        });
      }
    }
  ]
});
