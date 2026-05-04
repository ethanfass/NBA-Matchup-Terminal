import express from 'express';
import { fetchNbaStats } from './nbaProxy.js';

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/nba', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query);
    const endpoint = params.get('endpoint');
    params.delete('endpoint');

    const data = await fetchNbaStats(endpoint, params);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'NBA stats request failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`NBA proxy running on port ${PORT}`));
