const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BASE_URL = 'https://solve.ivy.homes';
const API_KEY = 'IVY26-4C3EAEB6A76C';
const authData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'auth_token.json'), 'utf-8'));
const token = authData.access_token || authData.token;

const headers = {
  'X-API-Key': API_KEY,
  'Authorization': `Bearer ${token}`
};

async function testFilters() {
  console.log(`=== TESTING API FILTERS & SORTING ===\n`);

  // Test 1: locality filter
  const resLoc = await fetch(`${BASE_URL}/v1/listings?locality=adyar&limit=50`, { headers });
  const dataLoc = await resLoc.json();
  const resultsLoc = dataLoc.results || [];
  const nonAdyar = resultsLoc.filter(l => (l.locality || '').toLowerCase() !== 'adyar');
  console.log(`Locality filter ('adyar'): got ${resultsLoc.length} items. Non-adyar count: ${nonAdyar.length}`);

  // Test 2: bhk filter
  const resBhk = await fetch(`${BASE_URL}/v1/listings?bhk=3&limit=50`, { headers });
  const dataBhk = await resBhk.json();
  const resultsBhk = dataBhk.results || [];
  const non3Bhk = resultsBhk.filter(l => l.bedroom !== 3);
  console.log(`BHK filter (bhk=3): got ${resultsBhk.length} items. Non-3BHK count: ${non3Bhk.length}`);

  // Test 3: furnishing filter
  const resFur = await fetch(`${BASE_URL}/v1/listings?furnishing=fully-furnished&limit=50`, { headers });
  const dataFur = await resFur.json();
  const resultsFur = dataFur.results || [];
  const nonFur = resultsFur.filter(l => (l.furnishing || '').toLowerCase() !== 'fully-furnished');
  console.log(`Furnishing filter ('fully-furnished'): got ${resultsFur.length} items. Non-matching count: ${nonFur.length}`);

  // Test 4: min_price / max_price
  const resPrice = await fetch(`${BASE_URL}/v1/listings?min_price=10000000&max_price=15000000&limit=50`, { headers });
  const dataPrice = await resPrice.json();
  const resultsPrice = dataPrice.results || [];
  const outPrice = resultsPrice.filter(l => l.price < 10000000 || l.price > 15000000);
  console.log(`Price filter (10M - 15M): got ${resultsPrice.length} items. Out of range count: ${outPrice.length}`);

  // Test 5: sort_by price order desc
  const resSort = await fetch(`${BASE_URL}/v1/listings?sort_by=price&order=desc&limit=50`, { headers });
  const dataSort = await resSort.json();
  const resultsSort = dataSort.results || [];
  let isSorted = true;
  for (let i = 1; i < resultsSort.length; i++) {
    if (resultsSort[i].price > resultsSort[i-1].price) {
      isSorted = false;
      break;
    }
  }
  console.log(`Sort by price desc: got ${resultsSort.length} items. Is correctly sorted: ${isSorted}`);

  // Test 6: Single listing endpoint GET /v1/listings/{id} vs GET /v1/listing/{id}
  const sampleId = resultsLoc[0].listing_id;
  const resSinglePlural = await fetch(`${BASE_URL}/v1/listings/${sampleId}`, { headers });
  console.log(`GET /v1/listings/${sampleId} status: ${resSinglePlural.status}`);

  const resSingleSingular = await fetch(`${BASE_URL}/v1/listing/${sampleId}`, { headers });
  console.log(`GET /v1/listing/${sampleId} status: ${resSingleSingular.status}`);
}

testFilters().catch(console.error);
