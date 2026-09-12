const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://solve.ivy.homes';
const API_KEY = 'IVY26-4C3EAEB6A76C';
const DATA_DIR = path.join(__dirname, '..', 'data');

async function getToken() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify({ email: 'demo1@ivy.homes', password: '117e45bfc1' })
  });
  const data = await res.json();
  console.log('\n=== AUTH RESPONSE (raw) ===');
  console.log(JSON.stringify(data, null, 2));
  return { token: data.access_token || data.token, raw: data };
}

async function checkPaginationIntegrity(token) {
  console.log('\n=== STEP 1: PAGINATION INTEGRITY CHECK (LIVE) ===');
  const authHeader = { 'X-API-Key': API_KEY, 'Authorization': `Bearer ${token}` };

  const ids = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/v1/listings?page=${page}&limit=5`, { headers: authHeader });
    const data = await res.json();
    const firstId = data.results && data.results[0] ? data.results[0].listing_id : 'N/A';
    const lastId = data.results && data.results[data.results.length-1] ? data.results[data.results.length-1].listing_id : 'N/A';
    ids.push({ page, firstId, lastId });
    console.log(`  Page ${page}: first_id=${firstId}, last_id=${lastId}, total=${data.total}`);
  }

  if (ids[0].firstId === ids[1].firstId && ids[1].firstId === ids[2].firstId) {
    console.log('  PAGINATION BUG CONFIRMED - all pages return same record!');
    return false;
  } else {
    console.log('  Pagination OK - pages return different records');
    return true;
  }
}

function checkSavedDataPagination() {
  console.log('\n=== STEP 2: VERIFY SAVED DATA PAGINATION ===');
  const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8'));
  const records = listings.records;

  const page1Ids = records.slice(0, 5).map(r => r.listing_id);
  const page2Ids = records.slice(50, 55).map(r => r.listing_id);
  const page3Ids = records.slice(100, 105).map(r => r.listing_id);

  console.log('  Saved data batch 1 (records 0-4):', page1Ids);
  console.log('  Saved data batch 2 (records 50-54):', page2Ids);
  console.log('  Saved data batch 3 (records 100-104):', page3Ids);

  const allIds = records.map(r => r.listing_id);
  const uniqueIds = new Set(allIds);
  console.log(`  Total records: ${records.length}, Unique IDs: ${uniqueIds.size}`);
  console.log(`  Repeat factor: ${(records.length / uniqueIds.size).toFixed(1)}x`);

  return listings;
}

function recomputeAnswers(listings, rentals, projects) {
  console.log('\n=== STEP 3: RECOMPUTE ALL ANSWERS ===');

  // Deduplicate all datasets
  const listDedup = new Map();
  for (const r of listings.records) {
    if (!listDedup.has(r.listing_id)) listDedup.set(r.listing_id, r);
  }
  const dedupedListings = Array.from(listDedup.values());

  const rentDedup = new Map();
  for (const r of rentals.records) {
    if (!rentDedup.has(r.listing_id)) rentDedup.set(r.listing_id, r);
  }
  const dedupedRentals = Array.from(rentDedup.values());

  const projDedup = new Map();
  for (const p of projects.records) {
    if (!projDedup.has(p.project_id)) projDedup.set(p.project_id, p);
  }
  const dedupedProjects = Array.from(projDedup.values());

  console.log(`  Listings: ${listings.records.length} records → ${dedupedListings.length} unique`);
  console.log(`  Rentals: ${rentals.records.length} records → ${dedupedRentals.length} unique`);
  console.log(`  Projects: ${projects.records.length} records → ${dedupedProjects.length} unique`);

  // Q1: total from API metadata
  const q1 = listings.first_response_meta ? listings.first_response_meta.total : listings.records.length;
  console.log(`\n  Q1 total_listing_records = ${q1}`);

  // Q2: unique listing_ids
  const q2 = dedupedListings.length;
  console.log(`  Q2 unique_properties = ${q2}`);

  // Q3: active (is_live=true) unique listings
  const activeLive = dedupedListings.filter(r => r.is_live === true);
  const q3 = activeLive.length;
  console.log(`  Q3 active_listings (unique, is_live=true) = ${q3}`);

  // Q4: TRULY corrupt - only bedroom/bathroom/area <= 0 (NOT unit mismatch)
  const sqmSet = new Set(['MAG-4003885', 'MAG-4002264', 'MAG-4003492', 'MAG-4000039']);
  const corrupt = dedupedListings.filter(r => r.bedroom <= 0 || r.bathroom <= 0);
  console.log(`  Q4 truly corrupt (bedroom or bathroom <= 0): ${JSON.stringify(corrupt.map(r => r.listing_id))}`);
  // Show the area-suspect ones separately
  const areaSuspect = dedupedListings.filter(r => sqmSet.has(r.listing_id));
  console.log(`  Area unit-mismatch listings (NOT corrupt, just doc lie): ${JSON.stringify(areaSuspect.map(r => `${r.listing_id}(area=${r.carpet_area},BHK=${r.bedroom})`))}`);

  // Q5: T Nagar total monthly rent
  const tnagarRentals = dedupedRentals.filter(r =>
    (r.locality || '').toLowerCase().replace(/\s/g,'').includes('tnagar')
  );
  const q5 = tnagarRentals.reduce((s, r) => s + (r.monthly_rent || r.rent || 0), 0);
  console.log(`  Q5 total_monthly_rent T Nagar = ${q5} (${tnagarRentals.length} unique rentals)`);
  if (tnagarRentals.length < 5) {
    console.log('  Sample T Nagar rentals:', tnagarRentals.slice(0,3).map(r => `${r.listing_id}:${r.locality}:₹${r.monthly_rent||r.rent}`));
    // Show all locality names found
    const localities = [...new Set(dedupedRentals.map(r => r.locality))].sort();
    console.log('  All rental localities:', localities);
  }

  // Q6: avg price/sqft for 2BHK
  const twoBhk = dedupedListings.filter(r => r.bedroom === 2 && r.carpet_area > 0);
  const ppsqft = twoBhk.map(r => {
    const area = sqmSet.has(r.listing_id) ? r.carpet_area * 10.7639 : r.carpet_area;
    return r.price / area;
  });
  const q6 = ppsqft.length > 0 ? Math.round((ppsqft.reduce((a,b)=>a+b,0)/ppsqft.length)*100)/100 : 0;
  console.log(`  Q6 avg_price_per_sqft_2bhk = ${q6} (${twoBhk.length} unique 2BHK)`);

  // Q7: costliest project
  const toInr = v => !v ? 0 : v < 10 ? Math.round(v*10000000) : Math.round(v*100000);
  const projSorted = dedupedProjects.map(p => ({...p, pmaxInr: toInr(p.price_max)})).sort((a,b)=>b.pmaxInr-a.pmaxInr);
  console.log(`  Q7 costliest_project: ${projSorted[0].project_id}, price_max=${projSorted[0].price_max} → ₹${projSorted[0].pmaxInr}`);
  console.log(`  Top 5: ${projSorted.slice(0,5).map(p=>`${p.project_id}(${p.price_max}→₹${p.pmaxInr})`).join(', ')}`);

  // Q8: listings in last 7 days
  const refDate = new Date('2026-09-10T23:59:59+05:30');
  const refMinus7 = new Date(refDate);
  refMinus7.setDate(refMinus7.getDate() - 7);
  const last7 = dedupedListings.filter(r => {
    if (!r.posted_at) return false;
    const d = new Date(r.posted_at);
    return d >= refMinus7 && d <= refDate;
  });
  console.log(`  Q8 listings_last_7_days (Sep 3-10 2026) = ${last7.length}`);
  console.log(`  Last 7 day listings:`, last7.map(r => `${r.listing_id}:${r.posted_at}`));

  // Q9: fake_listing_ids — invalid project_id reference
  const validProjIds = new Set(dedupedProjects.map(p => p.project_id));
  const fakes = dedupedListings.filter(r => r.project_id && !validProjIds.has(r.project_id));
  console.log(`  Q9 fake_listing_ids (project_id not in projects): ${fakes.length}`);
  console.log(`  IDs: ${JSON.stringify(fakes.map(r => r.listing_id))}`);
  console.log(`  Their project_ids: ${[...new Set(fakes.map(r=>r.project_id))].join(', ')}`);

  // Q10: projects_with_wrong_listing_count
  const listingsByProj = {};
  for (const r of dedupedListings) {
    if (r.project_id) listingsByProj[r.project_id] = (listingsByProj[r.project_id]||0)+1;
  }
  const wrongProjs = dedupedProjects.filter(p => {
    const actual = listingsByProj[p.project_id] || 0;
    return actual !== (p.total_listings||0);
  });
  console.log(`  Q10 projects_with_wrong_listing_count = ${wrongProjs.length} out of ${dedupedProjects.length}`);
  console.log(`  Sample: ${wrongProjs.slice(0,5).map(p=>`${p.project_id}(reported:${p.total_listings},actual:${listingsByProj[p.project_id]||0})`).join(', ')}`);

  return {
    q1, q2, q3,
    q4_corrupt: corrupt.map(r => r.listing_id),
    q5, q6,
    q7: { project_id: projSorted[0].project_id, price_max_inr: projSorted[0].pmaxInr },
    q8: last7.length,
    q9_fakes: fakes.map(r => r.listing_id),
    q10: wrongProjs.length,
    totalProjects: dedupedProjects.length
  };
}

async function verifyLiveFindings(token) {
  console.log('\n=== STEP 4: LIVE API VERIFICATION ===');
  const h = { 'X-API-Key': API_KEY, 'Authorization': `Bearer ${token}` };

  // Page cap test
  const r1 = await fetch(`${BASE_URL}/v1/listings?page=1&limit=200`, { headers: h });
  const d1 = await r1.json();
  console.log(`  limit=200 request → got ${d1.results?d1.results.length:0} records (cap test)`);

  // Token fields
  const r2 = await fetch(`${BASE_URL}/auth/login`, {
    method:'POST', headers:{'Content-Type':'application/json','X-API-Key':API_KEY},
    body: JSON.stringify({email:'demo2@ivy.homes',password:'117e45bfc1'})
  });
  const d2 = await r2.json();
  console.log(`  Login response keys: ${Object.keys(d2).join(', ')}`);
  console.log(`  expires_in=${d2.expires_in}, has refresh_token=${!!d2.refresh_token}`);

  // Analytics endpoint
  const r3 = await fetch(`${BASE_URL}/v1/analytics/summary`, { headers: h });
  console.log(`  GET /v1/analytics/summary → status ${r3.status}`);

  // No bearer token (just API key header)
  const r4 = await fetch(`${BASE_URL}/v1/listings?page=1&limit=1`, { headers: {'X-API-Key':API_KEY} });
  const t4 = await r4.text();
  console.log(`  No bearer, only X-API-Key header → status ${r4.status}, body: ${t4.substring(0,150)}`);

  // API key as query param
  const r5 = await fetch(`${BASE_URL}/v1/listings?page=1&limit=1&api_key=${API_KEY}`);
  const t5 = await r5.text();
  console.log(`  api_key as query param → status ${r5.status}, body: ${t5.substring(0,150)}`);
}

async function main() {
  const { token } = await getToken();
  if (!token) { console.error('Login failed!'); return; }

  await checkPaginationIntegrity(token);

  const listings = checkSavedDataPagination();
  const rentals = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rentals.json'),'utf-8'));
  const projects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'),'utf-8'));

  const answers = recomputeAnswers(listings, rentals, projects);

  await verifyLiveFindings(token);

  console.log('\n=== FINAL RECOMPUTED ANSWERS ===');
  console.log(JSON.stringify(answers, null, 2));
}

main().catch(console.error);
