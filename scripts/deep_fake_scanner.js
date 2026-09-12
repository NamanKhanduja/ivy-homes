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

console.log(`=== SCANNING FOR FAKE / LEAD-GEN LISTINGS ===\n`);

// 1. Group listings by locality & BHK to compute median price & PPSF
const groupMap = new Map();
uniqueListings.forEach(l => {
  // Convert area if in sq m (if carpet_area < 200)
  const actualArea = l.carpet_area < 200 ? l.carpet_area * 10.7639 : l.carpet_area;
  const ppsf = actualArea > 0 ? l.price / actualArea : 0;
  const key = `${l.locality}|${l.bedroom}`;
  if (!groupMap.has(key)) groupMap.set(key, []);
  groupMap.get(key).push({ ...l, actualArea, ppsf });
});

uniqueListings.forEach(l => {
  const actualArea = l.carpet_area < 200 ? l.carpet_area * 10.7639 : l.carpet_area;
  const ppsf = actualArea > 0 ? l.price / actualArea : 0;
  const key = `${l.locality}|${l.bedroom}`;
  const peers = groupMap.get(key);
  const avgPpsf = peers.reduce((a, b) => a + b.ppsf, 0) / peers.length;
  const ratio = ppsf / avgPpsf;

  const desc = l.description.toLowerCase();
  
  // Potential signals of fake listings:
  // - Clickbait price (ratio < 0.5)
  // - Unverified status with suspicious contact or mismatched text
  // - Repeated contact number across unrelated properties
  // - Description mentioning quick sale, negotiable, fake bait
  
  console.log(`ID: ${l.listing_id.padEnd(12)} | Loc: ${l.locality.padEnd(12)} | BHK: ${l.bedroom} | Price: ₹${(l.price/100000).toFixed(2)}L | PPSF: ${Math.round(ppsf).toString().padEnd(6)} | Ratio: ${ratio.toFixed(2)} | Ver: ${l.is_verified} | Live: ${l.is_live}`);
});
