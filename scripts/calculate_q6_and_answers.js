const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8')).records;
const rentals = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rentals.json'), 'utf-8')).records;
const projects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8')).records;

console.log(`=== CALCULATING ANSWERS & Q6 MATRIX ===\n`);

// Unique listing records (50 total)
const uniqueMap = new Map();
listings.forEach(l => {
  if (!uniqueMap.has(l.listing_id)) {
    uniqueMap.set(l.listing_id, l);
  }
});
const uniqueListings = Array.from(uniqueMap.values());

// Filter active 2BHK listings
const active2Bhk = listings.filter(l => l.is_live === true && l.bedroom === 2);
console.log(`Total active 2BHK listing records (retrievable): ${active2Bhk.length}`);

// Unique active 2BHK listing IDs
const active2BhkUnique = uniqueListings.filter(l => l.is_live === true && l.bedroom === 2);
console.log(`Unique active 2BHK listing IDs: ${active2BhkUnique.length}`);
active2BhkUnique.forEach(l => {
  const ppsfRaw = l.price / l.carpet_area;
  const actualArea = l.carpet_area < 200 ? l.carpet_area * 10.7639 : l.carpet_area;
  const ppsfFixed = l.price / actualArea;
  console.log(`   ID: ${l.listing_id} | Loc: ${l.locality} | Area: ${l.carpet_area} (Fixed: ${Math.round(actualArea)}) | Price: ₹${l.price} | PPSF Raw: ${ppsfRaw.toFixed(2)} | PPSF Fixed: ${ppsfFixed.toFixed(2)}`);
});

// Calculate mean PPSF across active 2BHK listings under different exclusion sets:
// Option A: Raw carpet_area (ignoring sq.m unit conversion for MAG-4002264), excluding corrupt SQU-4002903 (which is 0BHK anyway) and any fake IDs
// Option B: Converted carpet_area (86 sq.m -> 925.7 sq.ft for MAG-4002264)

const computeMeanPpsf = (records, useUnitFix = false) => {
  if (records.length === 0) return 0;
  const sum = records.reduce((s, l) => {
    let area = l.carpet_area;
    if (useUnitFix && area < 200) {
      area = area * 10.7639;
    }
    return s + (l.price / area);
  }, 0);
  return (sum / records.length).toFixed(2);
};

console.log(`\n--- Q6 MEAN PPSF CALCULATIONS ---`);
console.log(`All active 2BHK records (Raw): ${computeMeanPpsf(active2Bhk, false)}`);
console.log(`All active 2BHK records (Unit Fixed): ${computeMeanPpsf(active2Bhk, true)}`);

// Excluding corrupt (MAG-4002264 is corrupt because carpet_area=86 sqft for 2BHK if not unit fixed)
const active2BhkNoCorrupt = active2Bhk.filter(l => l.listing_id !== 'MAG-4002264');
console.log(`Excluding MAG-4002264 (Raw): ${computeMeanPpsf(active2BhkNoCorrupt, false)}`);

// Excluding SQU-4001315 (Clickbait fake listing)
const active2BhkNoFake = active2BhkNoCorrupt.filter(l => l.listing_id !== 'SQU-4001315');
console.log(`Excluding SQU-4001315 & MAG-4002264 (Raw): ${computeMeanPpsf(active2BhkNoFake, false)}`);

