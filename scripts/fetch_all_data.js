const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://solve.ivy.homes';
const API_KEY = 'IVY26-4C3EAEB6A76C';

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function log(msg) {
  console.log(`[FETCH] ${msg}`);
}

async function fetchHealth() {
  log('Checking /health...');
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const text = await res.text();
    log(`Health response status: ${res.status}, body: ${text}`);
    fs.writeFileSync(path.join(DATA_DIR, 'health.json'), text, 'utf-8');
  } catch (err) {
    log(`Health error: ${err.message}`);
  }
}

async function fetchAuth() {
  log('Testing /auth/login...');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        email: 'demo1@ivy.homes',
        password: '117e45bfc1'
      })
    });
    const text = await res.text();
    log(`Auth response status: ${res.status}, body: ${text}`);
    if (res.ok) {
      const data = JSON.parse(text);
      fs.writeFileSync(path.join(DATA_DIR, 'auth_token.json'), JSON.stringify(data, null, 2));
      return data.access_token || data.token;
    }
  } catch (err) {
    log(`Auth error: ${err.message}`);
  }
  return null;
}

async function fetchAllPages(endpointPath, fileName, token) {
  log(`Starting full pagination fetch for ${endpointPath}...`);
  let page = 1;
  const allRecords = [];
  let firstResponse = null;

  const headers = {
    'X-API-Key': API_KEY,
    'Authorization': `Bearer ${token}`
  };

  while (true) {
    // Request with limit 200 or default limit to see max returned
    const url = `${BASE_URL}${endpointPath}?page=${page}&limit=200`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      log(`Error fetching page ${page}: status ${res.status}`);
      const errText = await res.text();
      log(`Error detail: ${errText}`);
      break;
    }
    const data = await res.json();
    if (!firstResponse) {
      firstResponse = data;
    }

    const results = data.results || (Array.isArray(data) ? data : []);
    if (!results || results.length === 0) {
      log(`Page ${page} returned 0 results. Stopping.`);
      break;
    }

    allRecords.push(...results);
    const total = data.total;
    log(`Page ${page}: got ${results.length} items (Accumulated: ${allRecords.length} / Total: ${total})`);

    if (total !== undefined && allRecords.length >= total) {
      log(`Reached total of ${total} records.`);
      break;
    }

    page++;
    await new Promise((r) => setTimeout(r, 20));
  }

  log(`FINISH ${endpointPath}: fetched total of ${allRecords.length} records.`);
  fs.writeFileSync(
    path.join(DATA_DIR, fileName),
    JSON.stringify({ first_response_meta: firstResponse, total_records_fetched: allRecords.length, records: allRecords }, null, 2)
  );
  return allRecords;
}

async function main() {
  await fetchHealth();
  const token = await fetchAuth();
  if (!token) {
    log('Failed to get token!');
    return;
  }

  await fetchAllPages('/v1/listings', 'listings.json', token);
  await fetchAllPages('/v1/rentals', 'rentals.json', token);
  await fetchAllPages('/v1/projects', 'projects.json', token);

  log('All datasets successfully downloaded!');
}

main().catch(console.error);
