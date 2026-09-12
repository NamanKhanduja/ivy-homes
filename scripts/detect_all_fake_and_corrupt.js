const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8')).records;
const rentals = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rentals.json'), 'utf-8')).records;
const projects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8')).records;

const uniqueMap = new Map();
listings.forEach(l => {
  if (!uniqueMap.has(l.listing_id)) {
    uniqueMap.set(l.listing_id, l);
  }
});
const uniqueListings = Array.from(uniqueMap.values());

console.log(`=== DETECT ALL FAKE & CORRUPT LISTINGS ===\n`);

// 1. CORRUPT LISTINGS DETAILED SCAN
// Corrupt listings describe something that CANNOT exist physically.
// Physical impossibilities:
// - bedroom <= 0 or bathroom <= 0
// - price <= 0
// - carpet_area <= 0
// - floor > total_floors (when total_floors > 0)
// - super_built_up_area < carpet_area
// - carpet_area in wrong units causing impossible room sizes (e.g. carpet_area < 200 for 2+ BHK)
// - latitude / longitude out of city bounds or invalid coordinate values

const corruptIds = new Set();
uniqueListings.forEach(l => {
  const reasons = [];
  if (l.bedroom <= 0) reasons.push(`bedroom=${l.bedroom}`);
  if (l.bathroom <= 0) reasons.push(`bathroom=${l.bathroom}`);
  if (l.price <= 0) reasons.push(`price=${l.price}`);
  if (l.carpet_area <= 0) reasons.push(`carpet_area=${l.carpet_area}`);
  if (l.carpet_area > 0 && l.carpet_area < 200 && l.bedroom >= 2) {
    reasons.push(`carpet_area (${l.carpet_area} sqft) physically impossible for ${l.bedroom} BHK`);
  }
  if (l.super_built_up_area !== undefined && l.super_built_up_area > 0 && l.super_built_up_area < l.carpet_area) {
    reasons.push(`super_built_up (${l.super_built_up_area}) < carpet (${l.carpet_area})`);
  }
  if (l.floor !== undefined && l.total_floors !== undefined && l.total_floors > 0 && l.floor > l.total_floors) {
    reasons.push(`floor (${l.floor}) > total_floors (${l.total_floors})`);
  }

  if (reasons.length > 0) {
    corruptIds.add(l.listing_id);
    console.log(`[CORRUPT LISTING] ${l.listing_id}: ${reasons.join(' | ')}`);
  }
});

console.log(`\nCorrupt listing IDs (${corruptIds.size}):`, Array.from(corruptIds).sort());


// 2. FAKE LISTINGS DETAILED SCAN
// Fake listings exist to generate enquiries (bait).
// Signals of fake listings:
// - Unusually low price / clickbait price (< 50% of market value for locality/BHK)
// - Contact number associated with different seller names across properties
// - Website mismatch in listing_url (e.g. website is magichomes but URL is 100acres)
// - Project ID referencing non-existent project or wrong locality project
// - Description containing clickbait text ("Price negotiable for a quick sale", etc.)

const fakeIds = new Set();
const projectSet = new Set(projects.map(p => p.project_id));

// Build locality/BHK price baseline
const locBhkPrices = new Map();
uniqueListings.forEach(l => {
  const actualArea = l.carpet_area < 200 ? l.carpet_area * 10.7639 : l.carpet_area;
  const ppsf = actualArea > 0 ? l.price / actualArea : 0;
  const key = `${l.locality}|${l.bedroom}`;
  if (!locBhkPrices.has(key)) locBhkPrices.set(key, []);
  locBhkPrices.get(key).push(ppsf);
});

uniqueListings.forEach(l => {
  const actualArea = l.carpet_area < 200 ? l.carpet_area * 10.7639 : l.carpet_area;
  const ppsf = actualArea > 0 ? l.price / actualArea : 0;
  const key = `${l.locality}|${l.bedroom}`;
  const ppsfs = locBhkPrices.get(key);
  const avgPpsf = ppsfs.reduce((a, b) => a + b, 0) / ppsfs.length;
  const ratio = ppsf / avgPpsf;

  const fakeReasons = [];

  // Check clickbait price
  if (ratio < 0.5) {
    fakeReasons.push(`Clickbait price (₹${(l.price/100000).toFixed(2)}L, PPSF ₹${Math.round(ppsf)} vs avg ₹${Math.round(avgPpsf)})`);
  }

  // Check URL domain vs website field mismatch
  if (l.listing_url) {
    const urlDomain = l.listing_url.toLowerCase();
    if (l.website === 'magichomes' && !urlDomain.includes('magichomes')) fakeReasons.push(`Website mismatch (${l.website} vs ${l.listing_url})`);
    if (l.website === '100acres' && !urlDomain.includes('100acres')) fakeReasons.push(`Website mismatch (${l.website} vs ${l.listing_url})`);
    if (l.website === 'zerobroker' && !urlDomain.includes('zerobroker')) fakeReasons.push(`Website mismatch (${l.website} vs ${l.listing_url})`);
    if (l.website === 'squarelane' && !urlDomain.includes('squarelane')) fakeReasons.push(`Website mismatch (${l.website} vs ${l.listing_url})`);
    if (l.website === 'dwelling' && !urlDomain.includes('dwelling')) fakeReasons.push(`Website mismatch (${l.website} vs ${l.listing_url})`);
  }

  // Check project_id existence in project database
  if (l.project_id && !projectSet.has(l.project_id)) {
    fakeReasons.push(`Project ID ${l.project_id} does not exist in projects API`);
  }

  if (fakeReasons.length > 0) {
    fakeIds.add(l.listing_id);
    console.log(`[FAKE LISTING] ${l.listing_id}: ${fakeReasons.join(' | ')}`);
  }
});

console.log(`\nFake listing IDs (${fakeIds.size}):`, Array.from(fakeIds).sort());

