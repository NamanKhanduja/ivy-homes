const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BASE_URL = 'https://solve.ivy.homes';
const API_KEY = 'IVY26-4C3EAEB6A76C';

const listingsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8'));
const rentalsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rentals.json'), 'utf-8'));
const projectsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8'));
const authData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'auth_token.json'), 'utf-8'));
const token = authData.access_token || authData.token;

const listings = listingsData.records;
const rentals = rentalsData.records;
const projects = projectsData.records;

console.log(`=========================================`);
console.log(`DETAILED AUDIT & DISCOVERY SCRIPT`);
console.log(`=========================================\n`);

// ---------------------------------------------------------
// QUESTION 1: total_listing_records
// ---------------------------------------------------------
const q1 = listings.length;
console.log(`Q1: total_listing_records = ${q1}`);


// ---------------------------------------------------------
// QUESTION 3: active_listings
// ---------------------------------------------------------
const q3 = listings.filter(l => l.is_live === true).length;
console.log(`Q3: active_listings = ${q3}`);


// ---------------------------------------------------------
// QUESTION 4: corrupt_listing_ids
// Corrupt listings are records describing something that cannot exist physically.
// Let's inspect all fields for impossibility:
// - carpet_area <= 0
// - super_built_up_area < carpet_area
// - floor > total_floors (when total_floors > 0)
// - bedroom <= 0
// - bathroom < 0
// - price <= 0
// - total_floors < 0 or floor < 0
// ---------------------------------------------------------
const corruptListingMap = new Map();

listings.forEach(l => {
  const reasons = [];
  if (l.bedroom <= 0) reasons.push(`bedroom=${l.bedroom}`);
  if (l.price <= 0) reasons.push(`price=${l.price}`);
  if (l.carpet_area <= 0) reasons.push(`carpet_area=${l.carpet_area}`);
  if (l.super_built_up_area !== undefined && l.super_built_up_area > 0 && l.super_built_up_area < l.carpet_area) {
    reasons.push(`super_built_up_area (${l.super_built_up_area}) < carpet_area (${l.carpet_area})`);
  }
  if (l.floor !== undefined && l.total_floors !== undefined && l.total_floors > 0 && l.floor > l.total_floors) {
    reasons.push(`floor (${l.floor}) > total_floors (${l.total_floors})`);
  }
  if (l.floor !== undefined && l.floor < 0) reasons.push(`negative floor ${l.floor}`);
  if (l.total_floors !== undefined && l.total_floors < 0) reasons.push(`negative total_floors ${l.total_floors}`);

  if (reasons.length > 0) {
    if (!corruptListingMap.has(l.listing_id)) {
      corruptListingMap.set(l.listing_id, { reasons, record: l });
    }
  }
});

const q4_ids = Array.from(corruptListingMap.keys()).sort();
console.log(`Q4: corrupt_listing_ids count = ${q4_ids.length}`);
console.log(`Q4 listing IDs:`, q4_ids);
q4_ids.forEach(id => {
  console.log(`  ${id} => ${corruptListingMap.get(id).reasons.join(', ')}`);
});


// ---------------------------------------------------------
// QUESTION 9: fake_listing_ids
// Fake listings exist to generate enquiries (lead-gen bait).
// Patterns of fake listings:
// 1. Duplicate contact numbers / posted_by_contact reused across unrelated properties in different localities with identical descriptions or template text.
// 2. Unusually low / unrealistic prices or fake images/descriptions.
// 3. Same listing_url or duplicate listing_id with slight variations.
// 4. Repeated contact numbers (e.g. agents posting hundreds of spam fake listings).
// Let's analyze contact numbers, description patterns, and listing URLs!
// ---------------------------------------------------------
const contactCount = new Map();
listings.forEach(l => {
  const c = l.posted_by_contact;
  if (c) contactCount.set(c, (contactCount.get(c) || 0) + 1);
});

// Let's inspect listings by contact frequency, description similarity, etc.
const fakeListingMap = new Map();

// Let's check descriptions or contacts that appear across 5+ different localities or have suspicious phrases like "lead gen", "test", "call now for best deal", etc.
listings.forEach(l => {
  const desc = (l.description || '').toLowerCase();
  const title = (l.title || '').toLowerCase();
  
  // Test suspicious indicators
  const isFakeDesc = desc.includes('fake') || desc.includes('demo') || desc.includes('lead gen') || desc.includes('inquiry') || desc.includes('sample listing');
  
  // Test contact numbers associated with high volume spammers / generic fake numbers
  // e.g. +912000000000 or identical listing details duplicated multiple times
  if (isFakeDesc) {
    fakeListingMap.set(l.listing_id, `Suspicious description: ${l.description}`);
  }
});

// Let's check duplicate property signatures to see which properties are genuine vs fake duplicates
const propertyGroup = new Map();
listings.forEach(l => {
  // Signature of physical property: locality + apartment_name + bedroom + carpet_area + floor + lat + lon
  const key = `${l.locality}|${l.apartment_name || ''}|${l.bedroom}|${l.carpet_area}|${l.floor}|${l.latitude}|${l.longitude}`;
  if (!propertyGroup.has(key)) propertyGroup.set(key, []);
  propertyGroup.get(key).push(l);
});

console.log(`\n--- PROPERTY GROUP ANALYSIS ---`);
console.log(`Total distinct physical properties identified: ${propertyGroup.size}`);

// Let's check how many duplicate listings exist per property signature
let totalDuplicateListingRecords = 0;
propertyGroup.forEach((records, key) => {
  if (records.length > 1) {
    totalDuplicateListingRecords += records.length;
  }
});
console.log(`Properties described by multiple records: ${Array.from(propertyGroup.values()).filter(r => r.length > 1).length}`);


// ---------------------------------------------------------
// QUESTION 2: unique_properties
// "Among those records, genuine or not, how many distinct properties do they describe? A property described by several records counts once."
// ---------------------------------------------------------
const q2 = propertyGroup.size;
console.log(`\nQ2: unique_properties = ${q2}`);


// ---------------------------------------------------------
// QUESTION 5: total_monthly_rent
// Sum of monthly rent across all retrievable rental records in assigned locality: T Nagar
// ---------------------------------------------------------
const tNagarRentals = rentals.filter(r => (r.locality || '').toLowerCase().trim() === 't nagar');
const q5 = tNagarRentals.reduce((sum, r) => sum + (r.price || 0), 0);
console.log(`\nQ5: total_monthly_rent (T Nagar) = ${q5} across ${tNagarRentals.length} rentals`);


// ---------------------------------------------------------
// QUESTION 6: avg_price_per_sqft_2bhk
// Across retrievable listing records where is_live is true and bedroom is 2,
// leaving out records in Q4 (corrupt) and Q9 (fake):
// mean of (price / carpet_area) in rupees per square foot, to 2 decimals.
// ---------------------------------------------------------
// We'll compute this precisely once fake_ids (Q9) is finalized!


// ---------------------------------------------------------
// QUESTION 7: costliest_project
// The project with the highest maximum price, as {"project_id": ..., "price_max_inr": ...}
// Note: Check unit conversion for price_max in projects!
// Let's check all projects price_max fields.
// ---------------------------------------------------------
let maxProject = null;
let maxPriceVal = -1;

projects.forEach(p => {
  const pMax = p.price_max;
  if (pMax > maxPriceVal) {
    maxPriceVal = pMax;
    maxProject = p;
  }
});

console.log(`\nQ7 Raw Costliest Project:`, maxProject);
// If price_max is 93.7 (meaning 93.7 Lakhs or 93.7 Crores, i.e. 93,700,000 INR or 9,37,00,000 INR):
// Let's check how price_max is represented in INR:
// Is price_max_inr 93.7 * 10^7 (93.7 Crores) or 93700000 or raw 93.7?
// Let's inspect projects price distribution!
console.log(`Project price_max sample values:`, projects.slice(0, 10).map(p => ({ id: p.project_id, price_min: p.price_min, price_max: p.price_max })));


// ---------------------------------------------------------
// QUESTION 8: listings_last_7_days
// Posted in [2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)
// ---------------------------------------------------------
const refEnd = new Date('2026-09-10T00:00:00+05:30').getTime();
const refStart = new Date('2026-09-03T00:00:00+05:30').getTime();

let q8 = 0;
listings.forEach(l => {
  if (l.posted_at) {
    const t = new Date(l.posted_at).getTime();
    if (t >= refStart && t < refEnd) {
      q8++;
    }
  }
});
console.log(`\nQ8: listings_last_7_days = ${q8}`);


// ---------------------------------------------------------
// QUESTION 10: projects_with_wrong_listing_count
// Compare project.total_listings vs actual count of listings referencing project_id
// ---------------------------------------------------------
const projectListingCountMap = new Map();
listings.forEach(l => {
  if (l.project_id) {
    projectListingCountMap.set(l.project_id, (projectListingCountMap.get(l.project_id) || 0) + 1);
  }
});

const projectActiveListingCountMap = new Map();
listings.forEach(l => {
  if (l.project_id && l.is_live === true) {
    projectActiveListingCountMap.set(l.project_id, (projectActiveListingCountMap.get(l.project_id) || 0) + 1);
  }
});

let wrongCountProjects = [];
projects.forEach(p => {
  const reported = p.total_listings;
  const actualAll = projectListingCountMap.get(p.project_id) || 0;
  const actualActive = projectActiveListingCountMap.get(p.project_id) || 0;
  
  // Check discrepancy
  if (reported !== actualAll && reported !== actualActive) {
    wrongCountProjects.push({
      project_id: p.project_id,
      reported,
      actualAll,
      actualActive
    });
  }
});

console.log(`\nQ10: projects_with_wrong_listing_count = ${wrongCountProjects.length}`);
console.log(`Sample wrong count projects (first 10):`, wrongCountProjects.slice(0, 10));

