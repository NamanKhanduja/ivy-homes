const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8')).records;

const uniqueMap = new Map();
listings.forEach(l => {
  if (!uniqueMap.has(l.listing_id)) {
    uniqueMap.set(l.listing_id, l);
  }
});
const uniqueListings = Array.from(uniqueMap.values());

console.log(`=== CORRUPT DEFINITION SCAN ===\n`);

uniqueListings.forEach(l => {
  const flags = [];
  if (l.bedroom <= 0) flags.push(`bedroom = ${l.bedroom}`);
  if (l.bathroom <= 0) flags.push(`bathroom = ${l.bathroom}`);
  if (l.carpet_area <= 0) flags.push(`carpet_area = ${l.carpet_area}`);
  if (l.super_built_up_area !== undefined && l.super_built_up_area > 0 && l.super_built_up_area < l.carpet_area) {
    flags.push(`super_built_up_area (${l.super_built_up_area}) < carpet_area (${l.carpet_area})`);
  }
  if (l.floor !== undefined && l.total_floors !== undefined && l.total_floors > 0 && l.floor > l.total_floors) {
    flags.push(`floor (${l.floor}) > total_floors (${l.total_floors})`);
  }
  // Check unrealistic area per bedroom (< 100 sqft / BHK)
  const sqftPerBhk = l.bedroom > 0 ? l.carpet_area / l.bedroom : 0;
  if (sqftPerBhk > 0 && sqftPerBhk < 80) {
    flags.push(`IMPOSSIBLE ROOM SIZE: ${sqftPerBhk.toFixed(1)} sqft/BHK (carpet=${l.carpet_area}, BHK=${l.bedroom})`);
  }

  if (flags.length > 0) {
    console.log(`[CORRUPT CANDIDATE] ID: ${l.listing_id} => ${flags.join(' | ')}`);
  }
});
