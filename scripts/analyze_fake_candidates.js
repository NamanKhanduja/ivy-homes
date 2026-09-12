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

console.log(`=== ANALYZING FAKE & CORRUPT CANDIDATES ===\n`);

// 1. Calculate price per sqft for every unique listing
const listingsWithPpsf = uniqueListings.map(l => {
  const ppsf = l.carpet_area > 0 ? l.price / l.carpet_area : 0;
  return { ...l, ppsf };
});

// Group by locality and BHK to find average PPSF and identify massive outliers (< 50% of locality avg or > 300%)
const locBhkMap = new Map();
listingsWithPpsf.forEach(l => {
  const key = `${l.locality}|${l.bedroom}`;
  if (!locBhkMap.has(key)) locBhkMap.set(key, []);
  locBhkMap.get(key).push(l.ppsf);
});

console.log(`--- PRICE PER SQFT ANALYSIS ---`);
listingsWithPpsf.forEach(l => {
  const key = `${l.locality}|${l.bedroom}`;
  const ppsfs = locBhkMap.get(key);
  const avgPpsf = ppsfs.reduce((a, b) => a + b, 0) / ppsfs.length;
  const ratio = l.ppsf / avgPpsf;
  
  if (ratio < 0.5 || ratio > 2.0 || l.carpet_area < 200 || l.bedroom === 0) {
    console.log(`[ANOMALY] ID: ${l.listing_id} | Loc: ${l.locality} | BHK: ${l.bedroom} | Area: ${l.carpet_area} | Price: ${l.price} | PPSF: ${Math.round(l.ppsf)} (Avg: ${Math.round(avgPpsf)}, ratio: ${ratio.toFixed(2)}) | Desc: ${l.description.slice(0, 60)}`);
  }
});

// 2. Check duplicate contacts across distinct names or websites
const contactMap = new Map();
uniqueListings.forEach(l => {
  const c = l.posted_by_contact;
  if (!contactMap.has(c)) contactMap.set(c, []);
  contactMap.get(c).push(l);
});

console.log(`\n--- CONTACTS WITH MULTIPLE LISTINGS ---`);
contactMap.forEach((recs, contact) => {
  if (recs.length > 1) {
    console.log(`Contact ${contact}: ${recs.length} listings`);
    recs.forEach(r => console.log(`   ${r.listing_id} | Name: ${r.posted_by_name} | Loc: ${r.locality} | Apt: ${r.apartment_name}`));
  }
});

// 3. Check for description clues (e.g. "Price negotiable for a quick sale", "lead gen", "call", "enquiry")
console.log(`\n--- SUSPICIOUS DESCRIPTIONS ---`);
uniqueListings.forEach(l => {
  const desc = l.description.toLowerCase();
  if (desc.includes('negotiable') || desc.includes('quick sale') || desc.includes('contact') || desc.includes('call') || desc.includes('enquiry') || desc.includes('urgent')) {
    console.log(`ID: ${l.listing_id} | Price: ${l.price} | Desc: ${l.description}`);
  }
});

