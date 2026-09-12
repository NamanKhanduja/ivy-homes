const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8')).records;
const rentals = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rentals.json'), 'utf-8')).records;
const projects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8')).records;

console.log(`=== DUPLICATION & DISCREPANCY ANALYSIS ===\n`);

// 1. Listings ID uniqueness
const listingIds = listings.map(l => l.listing_id);
const uniqueListingIds = new Set(listingIds);
console.log(`LISTINGS: Total records = ${listings.length}, Unique listing_ids = ${uniqueListingIds.size}`);

// Print unique listing IDs list
console.log(`Unique listing IDs count: ${uniqueListingIds.size}`);
console.log(`Unique listing IDs:`, Array.from(uniqueListingIds));

// 2. Rentals ID uniqueness
const rentalIds = rentals.map(r => r.listing_id);
const uniqueRentalIds = new Set(rentalIds);
console.log(`\nRENTALS: Total records = ${rentals.length}, Unique rental listing_ids = ${uniqueRentalIds.size}`);
console.log(`Unique rental listing IDs:`, Array.from(uniqueRentalIds));

// 3. Projects ID uniqueness
const projectIds = projects.map(p => p.project_id);
const uniqueProjectIds = new Set(projectIds);
console.log(`\nPROJECTS: Total records = ${projects.length}, Unique project_ids = ${uniqueProjectIds.size}`);
console.log(`Unique project IDs:`, Array.from(uniqueProjectIds));

// Let's inspect the unique 50 listing records
const uniqueListingRecordsMap = new Map();
listings.forEach(l => {
  if (!uniqueListingRecordsMap.has(l.listing_id)) {
    uniqueListingRecordsMap.set(l.listing_id, l);
  }
});

const uniqueListings = Array.from(uniqueListingRecordsMap.values());

console.log(`\n=== ANALYSIS OF THE ${uniqueListings.length} UNIQUE LISTINGS ===`);
uniqueListings.forEach((l, idx) => {
  const issues = [];
  if (l.bedroom <= 0) issues.push(`bedroom=${l.bedroom}`);
  if (l.bathroom <= 0) issues.push(`bathroom=${l.bathroom}`);
  if (l.price <= 0) issues.push(`price=${l.price}`);
  if (l.carpet_area <= 0) issues.push(`carpet_area=${l.carpet_area}`);
  if (l.carpet_area < 200 && l.bedroom >= 2) issues.push(`unrealistic carpet_area ${l.carpet_area} sqft for ${l.bedroom} BHK`);
  if (l.super_built_up_area !== undefined && l.super_built_up_area > 0 && l.super_built_up_area < l.carpet_area) {
    issues.push(`super_built_up_area (${l.super_built_up_area}) < carpet_area (${l.carpet_area})`);
  }
  if (l.floor !== undefined && l.total_floors !== undefined && l.total_floors > 0 && l.floor > l.total_floors) {
    issues.push(`floor (${l.floor}) > total_floors (${l.total_floors})`);
  }
  
  if (issues.length > 0) {
    console.log(`Listing #${idx + 1} (${l.listing_id}): ${issues.join(' | ')}`);
  }
});

// Let's check how many active listings among unique listings vs total records
console.log(`\nActive count among unique listings (is_live === true): ${uniqueListings.filter(l => l.is_live === true).length} / ${uniqueListings.length}`);
console.log(`Active count among ALL 4000 records: ${listings.filter(l => l.is_live === true).length} / ${listings.length}`);

