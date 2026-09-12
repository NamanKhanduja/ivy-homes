const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const listingsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8'));
const rentalsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rentals.json'), 'utf-8'));
const projectsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8'));

const listings = listingsData.records;
const rentals = rentalsData.records;
const projects = projectsData.records;

console.log(`=== DATASET SUMMARY ===`);
console.log(`Listings retrievable: ${listings.length} (reported total: ${listingsData.first_response_meta.total})`);
console.log(`Rentals retrievable: ${rentals.length} (reported total: ${rentalsData.first_response_meta.total})`);
console.log(`Projects retrievable: ${projects.length} (reported total: ${projectsData.first_response_meta.total})`);

// Sample single records to inspect fields
console.log('\n--- LISTING SAMPLE KEYS ---');
console.log(Object.keys(listings[0]));
console.log(listings[0]);

console.log('\n--- RENTAL SAMPLE KEYS ---');
console.log(Object.keys(rentals[0]));
console.log(rentals[0]);

console.log('\n--- PROJECT SAMPLE KEYS ---');
console.log(Object.keys(projects[0]));
console.log(projects[0]);

// Q1: total_listing_records
console.log(`\nQ1: total_listing_records = ${listings.length}`);

// Q3: active_listings (is_live === true)
const activeListings = listings.filter(l => l.is_live === true);
console.log(`Q3: active_listings (is_live === true) = ${activeListings.length}`);
console.log(`Listings with is_live === false: ${listings.filter(l => l.is_live === false).length}`);
console.log(`Listings with is_live === undefined/null: ${listings.filter(l => l.is_live === undefined || l.is_live === null).length}`);

// Inspect unique properties: how to determine distinct property?
// Is there a property_id, or combination of fields (apartment_name, locality, floor, balcony, bedroom, facing, carpet_area, lat, lon)?
// Let's check how property uniqueness is defined!
const propertySignatures = new Set();
const propertyListingMap = new Map();

listings.forEach(l => {
  // Let's test various property signatures
  const sig = `${l.locality}|${l.apartment_name || ''}|${l.property_type}|${l.bedroom}|${l.carpet_area}|${l.floor}|${l.latitude}|${l.longitude}`;
  propertySignatures.add(sig);
  if (!propertyListingMap.has(sig)) propertyListingMap.set(sig, []);
  propertyListingMap.get(sig).push(l.listing_id);
});

console.log(`Unique property signatures count (locality+apt+type+bhk+area+floor+lat+lon): ${propertySignatures.size}`);

// Q4: Corrupt listing IDs
// Impossible values: price <= 0, carpet_area <= 0, floor > total_floors, total_floors <= 0 when floor given, bedroom <= 0, bathroom < 0, etc.
const corruptListings = [];
listings.forEach(l => {
  const issues = [];
  if (l.price <= 0) issues.push('price <= 0');
  if (l.carpet_area <= 0) issues.push('carpet_area <= 0');
  if (l.super_built_up_area !== undefined && l.super_built_up_area < l.carpet_area && l.super_built_up_area > 0) issues.push('super_built_up < carpet');
  if (l.floor !== undefined && l.total_floors !== undefined && l.floor > l.total_floors && l.total_floors > 0) issues.push('floor > total_floors');
  if (l.total_floors !== undefined && l.total_floors < 0) issues.push('negative total_floors');
  if (l.floor !== undefined && l.floor < 0) issues.push('negative floor');
  if (l.bedroom <= 0) issues.push('bedroom <= 0');
  if (l.bathroom < 0) issues.push('bathroom < 0');
  if (l.latitude < -90 || l.latitude > 90 || l.longitude < -180 || l.longitude > 180) issues.push('invalid lat/lon');
  
  if (issues.length > 0) {
    corruptListings.push({ id: l.listing_id, issues, record: l });
  }
});
console.log(`\nQ4: Corrupt listing records count: ${corruptListings.length}`);
console.log('Corrupt listing IDs:', corruptListings.map(c => c.id).sort());
corruptListings.forEach(c => console.log(`  ID: ${c.id} => ${c.issues.join(', ')}`));

// Q5: total_monthly_rent in assigned locality 'T Nagar'
const tNagarRentals = rentals.filter(r => (r.locality || '').toLowerCase().trim() === 't nagar');
const totalMonthlyRent = tNagarRentals.reduce((sum, r) => sum + (r.price || 0), 0);
console.log(`\nQ5: total_monthly_rent in 't nagar': ${totalMonthlyRent} across ${tNagarRentals.length} rentals`);

// Q7: costliest_project
let costliest = { project_id: '', price_max_inr: 0 };
projects.forEach(p => {
  const maxP = p.price_max || p.price_max_inr || 0;
  if (maxP > costliest.price_max_inr) {
    costliest = { project_id: p.project_id, price_max_inr: maxP };
  }
});
console.log(`\nQ7: costliest_project =`, costliest);

// Q8: listings_last_7_days
// REFERENCE = 2026-09-10T00:00:00+05:30
// Range: [2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)
const refDate = new Date('2026-09-10T00:00:00+05:30');
const refStart = new Date('2026-09-03T00:00:00+05:30');

let countLast7Days = 0;
listings.forEach(l => {
  if (l.posted_at) {
    const posted = new Date(l.posted_at);
    if (posted >= refStart && posted < refDate) {
      countLast7Days++;
    }
  }
});
console.log(`\nQ8: listings_last_7_days = ${countLast7Days}`);

