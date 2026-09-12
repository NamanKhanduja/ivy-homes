const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8')).records;
const projects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8')).records;

const validProjectIds = new Set(projects.map(p => p.project_id));

const uniqueMap = new Map();
listings.forEach(l => {
  if (!uniqueMap.has(l.listing_id)) {
    uniqueMap.set(l.listing_id, l);
  }
});
const uniqueListings = Array.from(uniqueMap.values());

console.log(`=== PROJECT ID CROSS-REFERENCE ===\n`);
console.log(`Valid Project IDs in /v1/projects (${validProjectIds.size}):`, Array.from(validProjectIds).sort());

console.log(`\n--- ALL 50 LISTINGS & THEIR PROJECT IDS ---`);
const validProjectListings = [];
const invalidProjectListings = [];
const nullProjectListings = [];

uniqueListings.forEach(l => {
  if (l.project_id === null || l.project_id === undefined) {
    nullProjectListings.push(l);
  } else if (validProjectIds.has(l.project_id)) {
    validProjectListings.push(l);
  } else {
    invalidProjectListings.push(l);
  }
});

console.log(`Listings referencing VALID project_id (P40001 - P40050): ${validProjectListings.length}`);
validProjectListings.forEach(l => console.log(`   ID: ${l.listing_id} -> Project: ${l.project_id} (Locality: ${l.locality}, Price: ₹${l.price})`));

console.log(`\nListings with project_id = null: ${nullProjectListings.length}`);
nullProjectListings.forEach(l => console.log(`   ID: ${l.listing_id} -> Project: null (Locality: ${l.locality}, Price: ₹${l.price})`));

console.log(`\nListings referencing INVALID non-existent project_id: ${invalidProjectListings.length}`);
invalidProjectListings.forEach(l => console.log(`   ID: ${l.listing_id} -> Project: ${l.project_id}`));

