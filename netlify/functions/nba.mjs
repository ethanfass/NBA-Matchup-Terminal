import { fetchNbaStats } from '../../server/nbaProxy.js';

export async function handler(event) {
  try {
    const params = new URLSearchParams(event.rawQuery || '');
    const endpoint = params.get('endpoint');
    params.delete('endpoint');

    const data = await fetchNbaStats(endpoint, params);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 502,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message || 'NBA stats request failed'
      })
    };
  }
}
