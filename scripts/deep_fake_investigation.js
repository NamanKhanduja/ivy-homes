const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8')).records;
const rentals = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rentals.json'), 'utf-8')).records;
const projects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8')).records;

console.log(`=== DEEP FAKE & CORRUPT INVESTIGATION ===\n`);

// 1. Check corrupt listings across ALL possible fields
const corrupts = [];
listings.forEach(l => {
  const errs = [];
  if (l.bedroom <= 0) errs.push('bedroom <= 0');
  if (l.bathroom <= 0) errs.push('bathroom <= 0');
  if (l.price <= 0) errs.push('price <= 0');
  if (l.carpet_area <= 0) errs.push('carpet_area <= 0');
  if (l.super_built_up_area !== undefined && l.super_built_up_area > 0 && l.super_built_up_area < l.carpet_area) errs.push('super_built_up < carpet_area');
  if (l.floor !== undefined && l.total_floors !== undefined && l.total_floors > 0 && l.floor > l.total_floors) errs.push('floor > total_floors');
  if (l.floor < 0) errs.push('floor < 0');
  if (l.total_floors < 0) errs.push('total_floors < 0');
  
  // Future posted_at date check relative to REFERENCE = 2026-09-10T00:00:00+05:30
  const refDate = new Date('2026-09-10T00:00:00+05:30').getTime();
  if (l.posted_at) {
    const postDate = new Date(l.posted_at).getTime();
    if (postDate > refDate) errs.push(`future posted_at: ${l.posted_at}`);
  }

  if (errs.length > 0) {
    corrupts.push({ id: l.listing_id, errs, record: l });
  }
});

console.log(`Corrupt listings total: ${corrupts.length}`);
corrupts.forEach(c => console.log(`ID: ${c.id} => ${c.errs.join(', ')}`));

// 2. Project unit conversion & price max investigation
console.log(`\n=== PROJECT UNITS INVESTIGATION ===`);
let maxInrProject = null;
let maxInrValue = 0;

projects.forEach(p => {
  // Convert price_min and price_max to INR:
  // If value < 10: unit is Crores (1 Cr = 10,000,000 INR)
  // If value >= 10: unit is Lakhs (1 Lakh = 100,000 INR)
  const toInr = (val) => {
    if (val === null || val === undefined) return 0;
    if (val < 10) return val * 10000000;
    return val * 100000;
  };

  const minInr = toInr(p.price_min);
  const maxInr = toInr(p.price_max);

  if (maxInr > maxInrValue) {
    maxInrValue = maxInr;
    maxInrProject = {
      project_id: p.project_id,
      apartment_name: p.apartment_name,
      price_max_raw: p.price_max,
      price_max_inr: maxInr
    };
  }
});

console.log(`Costliest project under Lakhs/Crores conversion:`, maxInrProject);

// Also test if raw price_max is just taken directly without unit conversion:
let maxRawProject = null;
let maxRawVal = 0;
projects.forEach(p => {
  if (p.price_max > maxRawVal) {
    maxRawVal = p.price_max;
    maxRawProject = { project_id: p.project_id, price_max_inr: p.price_max };
  }
});
console.log(`Costliest project if raw price_max used directly:`, maxRawProject);

// 3. FAKE LISTINGS DETECTIVE WORK
console.log(`\n=== FAKE LISTINGS DETECTIVE WORK ===`);

// Group listings by physical property (locality + apt_name + bedroom + carpet_area + floor + lat + lon)
const props = new Map();
listings.forEach(l => {
  const key = `${l.locality}|${l.apartment_name}|${l.bedroom}|${l.carpet_area}|${l.floor}|${l.latitude}|${l.longitude}`;
  if (!props.has(key)) props.set(key, []);
  props.get(key).push(l);
});

console.log(`Total properties: ${props.size}`);

// Let's inspect a few property clusters to see differences between listings of the SAME property
let clusterIndex = 0;
props.forEach((recs, key) => {
  if (clusterIndex < 3) {
    console.log(`\n--- Property Cluster #${clusterIndex + 1}: ${key} (${recs.length} listings) ---`);
    const prices = recs.map(r => r.price);
    const contacts = recs.map(r => r.posted_by_contact);
    const verifieds = recs.map(r => r.is_verified);
    const websites = recs.map(r => r.website);
    const isLives = recs.map(r => r.is_live);
    
    console.log(`Prices range: ${Math.min(...prices)} - ${Math.max(...prices)}`);
    console.log(`Distinct prices count: ${new Set(prices).size}`);
    console.log(`Verified count: ${verifieds.filter(Boolean).length} / ${recs.length}`);
    console.log(`is_live true count: ${isLives.filter(Boolean).length} / ${recs.length}`);
    console.log(`Sample rec 0:`, recs[0].listing_id, recs[0].price, recs[0].posted_by_contact, recs[0].posted_by_name, recs[0].description.slice(0, 50));
    console.log(`Sample rec 1:`, recs[1].listing_id, recs[1].price, recs[1].posted_by_contact, recs[1].posted_by_name, recs[1].description.slice(0, 50));
    clusterIndex++;
  }
});

// Let's check if there are contacts that appear across MULTIPLE DIFFERENT properties
const contactToPropsMap = new Map();
props.forEach((recs, propKey) => {
  recs.forEach(r => {
    const c = r.posted_by_contact;
    if (c) {
      if (!contactToPropsMap.has(c)) contactToPropsMap.set(c, new Set());
      contactToPropsMap.get(c).add(propKey);
    }
  });
});

console.log(`\n--- CONTACT NUMBERS ACROSS DIFFERENT PROPERTIES ---`);
let multiPropContacts = 0;
contactToPropsMap.forEach((propKeys, contact) => {
  if (propKeys.size > 1) {
    multiPropContacts++;
    // console.log(`Contact ${contact} posts across ${propKeys.size} distinct properties!`);
  }
});
console.log(`Contacts posting across multiple distinct properties: ${multiPropContacts}`);

// Let's check listing attributes anomalies:
// Mismatched price within property cluster?
// Unverified listings with outlier price?
// Description patterns?
// Mismatched project_id?

