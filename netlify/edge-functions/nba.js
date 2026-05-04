const NBA_BASE_URL = 'https://stats.nba.com/stats';

const ALLOWED_ENDPOINTS = new Set([
  'commonallplayers',
  'commonplayerinfo',
  'playerawards',
  'playercareerstats',
  'leagueleaders',
  'alltimeleadersgrids',
  'shotchartdetail',
  'leagueseasonmatchups',
  'playerdashboardbyclutch',
  'playerdashptshotdefend',
  'leaguestandingsv3',
  'leaguedashteamstats',
  'teamyearbyyearstats',
  'playergamelog'
]);

const NBA_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Cache-Control': 'no-cache',
  Origin: 'https://www.nba.com',
  Pragma: 'no-cache',
  Referer: 'https://www.nba.com/',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true'
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
  });

export default async (request) => {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint');
  const clean = String(endpoint || '').toLowerCase().trim();

  if (!ALLOWED_ENDPOINTS.has(clean)) {
    return json({ error: 'Unsupported NBA stats endpoint' }, 400);
  }

  const apiUrl = new URL(`${NBA_BASE_URL}/${clean}`);
  for (const [key, value] of url.searchParams) {
    if (key !== 'endpoint') apiUrl.searchParams.append(key, value);
  }

  try {
    const response = await fetch(apiUrl.toString(), { headers: NBA_HEADERS });

    if (!response.ok) {
      return json({ error: `NBA stats returned ${response.status}` }, response.status);
    }

    const text = await response.text();
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
    });
  } catch (error) {
    return json({ error: error.message || 'NBA stats request failed' }, 502);
  }
};

export const config = { path: '/api/nba' };
