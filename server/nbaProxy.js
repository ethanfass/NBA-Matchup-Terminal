const NBA_BASE_URL = 'https://stats.nba.com/stats';
const NBA_TIMEOUT_MS = 35000;
const NBA_PANEL_TIMEOUT_MS = 35000;
const NBA_RETRY_DELAYS = [0, 2500, 6000];
const NBA_PANEL_RETRY_DELAYS = [0, 1500];
const NBA_CACHE_TTL_MS = 60 * 60 * 1000;
const NBA_MAX_CONCURRENT = 1;
const NBA_PRIORITY = {
  playercareerstats: 0,
  commonallplayers: 1,
  playerawards: 2,
  commonplayerinfo: 2,
  leaguestandingsv3: 3,
  leaguedashteamstats: 3,
  playergamelog: 5
};
const nbaQueue = [];
const responseCache = new Map();
const inFlightRequests = new Map();
let activeNbaRequests = 0;
let queueSequence = 0;
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
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true'
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

function getEndpointPriority(endpoint) {
  return NBA_PRIORITY[endpoint] ?? 4;
}

function getEndpointTimeout(endpoint) {
  return endpoint === 'playercareerstats' || endpoint === 'commonallplayers' || endpoint === 'playerawards'
    ? NBA_TIMEOUT_MS
    : NBA_PANEL_TIMEOUT_MS;
}

function getEndpointRetryDelays(endpoint) {
  return endpoint === 'playercareerstats' || endpoint === 'commonallplayers' || endpoint === 'playerawards'
    ? NBA_RETRY_DELAYS
    : NBA_PANEL_RETRY_DELAYS;
}

function pumpNbaQueue() {
  if (activeNbaRequests >= NBA_MAX_CONCURRENT || !nbaQueue.length) return;

  nbaQueue.sort((a, b) => a.priority - b.priority || a.sequence - b.sequence);
  const item = nbaQueue.shift();
  activeNbaRequests += 1;

  item.task()
    .then(item.resolve, item.reject)
    .finally(() => {
      activeNbaRequests -= 1;
      pumpNbaQueue();
    });

  pumpNbaQueue();
}

function enqueueNbaRequest(task, priority) {
  return new Promise((resolve, reject) => {
    nbaQueue.push({ task, priority, resolve, reject, sequence: queueSequence });
    queueSequence += 1;
    pumpNbaQueue();
  });
}

export async function fetchNbaStats(endpoint, searchParams = new URLSearchParams()) {
  const cleanEndpoint = String(endpoint || '').toLowerCase().trim();

  if (!ALLOWED_ENDPOINTS.has(cleanEndpoint)) {
    const error = new Error('Unsupported NBA stats endpoint');
    error.statusCode = 400;
    throw error;
  }

  const url = new URL(`${NBA_BASE_URL}/${cleanEndpoint}`);

  for (const [key, value] of searchParams.entries()) {
    if (key !== 'endpoint') {
      url.searchParams.append(key, value);
    }
  }

  const cacheKey = url.toString();
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < NBA_CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const request = enqueueNbaRequest(
    () => fetchNbaStatsFromUrl(cleanEndpoint, url),
    getEndpointPriority(cleanEndpoint)
  )
    .then((data) => {
      responseCache.set(cacheKey, { data, createdAt: Date.now() });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);
  return request;
}

async function fetchNbaStatsFromUrl(endpoint, url) {
  let lastError;
  const retryDelays = getEndpointRetryDelays(endpoint);
  const requestTimeout = getEndpointTimeout(endpoint);

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt]) await wait(retryDelays[attempt]);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeout);

    try {
      const response = await fetch(url, {
        headers: NBA_HEADERS,
        signal: controller.signal
      });

      if (!response.ok) {
        const error = new Error(`NBA stats returned ${response.status}`);
        error.statusCode = response.status;
        error.retryable = isRetryableStatus(response.status);
        throw error;
      }

      try {
        return await response.json();
      } catch {
        const error = new Error('NBA stats returned invalid JSON');
        error.statusCode = 502;
        error.retryable = true;
        throw error;
      }
    } catch (error) {
      lastError = error;

      if (error.name === 'AbortError') {
        lastError = new Error('NBA stats request timed out');
        lastError.statusCode = 504;
        lastError.retryable = true;
      }

      if (attempt === retryDelays.length - 1 || !lastError.retryable) {
        throw lastError;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}
