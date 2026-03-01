const FSQ_BASE = 'https://places-api.foursquare.com';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const key = process.env.REACT_APP_FOURSQUARE_API_KEY;
  if (!key) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Missing REACT_APP_FOURSQUARE_API_KEY env var',
      }),
    };
  }

  try {
    const qs = new URLSearchParams(
      event.queryStringParameters || {},
    ).toString();
    const url = `${FSQ_BASE}/places/search${qs ? `?${qs}` : ''}`;

    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
        'X-Places-Api-Version': '2025-06-17',
      },
    });

    let body = await r.text();
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Link',
    };
    const link = r.headers.get('link');
    if (link) {
      headers['Link'] = link;
      const cursorMatch = link.match(/cursor=([^&>;\s]+)/);
      if (cursorMatch) {
        try {
          const data = JSON.parse(body);
          data.next_cursor = cursorMatch[1].trim();
          body = JSON.stringify(data);
        } catch (_) {}
      }
    }

    return {
      statusCode: r.status,
      headers,
      body,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: err?.message ?? String(err) }),
    };
  }
}
