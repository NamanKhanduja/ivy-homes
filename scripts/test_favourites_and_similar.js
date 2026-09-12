const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BASE_URL = 'https://solve.ivy.homes';
const API_KEY = 'IVY26-4C3EAEB6A76C';
const authData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'auth_token.json'), 'utf-8'));
const token = authData.access_token || authData.token;

const headers = {
  'X-API-Key': API_KEY,
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function testEndpoints() {
  console.log(`=== TESTING FAVOURITES & SIMILAR ENDPOINTS ===\n`);

  const sampleId = 'MAG-4001518';

  // 1. Similar listings: GET /v1/listings/{id}/similar
  const resSim = await fetch(`${BASE_URL}/v1/listings/${sampleId}/similar`, { headers });
  console.log(`GET /v1/listings/${sampleId}/similar status: ${resSim.status}`);
  if (resSim.ok) console.log(`Similar body:`, await resSim.json());
  else console.log(`Similar err:`, await resSim.text());

  // 2. Favourites test variations:
  // /v1/favourites
  const favPaths = [
    '/v1/favourites',
    '/v1/favorites',
    '/v1/user/favourites',
    '/v1/users/me/favourites',
    '/favourites'
  ];

  for (const fp of favPaths) {
    const r = await fetch(`${BASE_URL}${fp}`, { headers });
    console.log(`GET ${fp} status: ${r.status}`);
    if (r.ok) {
      console.log(`SUCCESS GET ${fp}:`, await r.json());
    }
  }

  // Test POST /v1/favourites
  const resPostFav = await fetch(`${BASE_URL}/v1/favourites`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: sampleId })
  });
  console.log(`POST /v1/favourites status: ${resPostFav.status}, text: ${await resPostFav.text()}`);

  const resPostFav2 = await fetch(`${BASE_URL}/v1/favorites`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ listing_id: sampleId })
  });
  console.log(`POST /v1/favorites status: ${resPostFav2.status}, text: ${await resPostFav2.text()}`);
}

testEndpoints().catch(console.error);
