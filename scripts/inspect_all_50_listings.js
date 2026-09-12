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

console.log(`=== FULL INSPECTION OF ALL 50 UNIQUE LISTINGS ===\n`);

uniqueListings.forEach((l, i) => {
  console.log(`[${i+1}] ID: ${l.listing_id} | Live: ${l.is_live} | Verified: ${l.is_verified} | Loc: ${l.locality} | BHK: ${l.bedroom} | Area: ${l.carpet_area} sqft | Price: ₹${l.price.toLocaleString('en-IN')} | Contact: ${l.posted_by_contact} (${l.posted_by_name}) | Website: ${l.website} | Project: ${l.project_id}`);
  console.log(`    Url: ${l.listing_url}`);
  console.log(`    Desc: ${l.description}`);
  console.log(`---`);
});
