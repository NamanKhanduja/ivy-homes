const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8')).records;
const projects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8')).records;

console.log(`=== VERIFYING QUESTION 10 ===\n`);

// Count listings per project_id
const totalListingsPerProject = new Map();
const activeListingsPerProject = new Map();

listings.forEach(l => {
  if (l.project_id) {
    totalListingsPerProject.set(l.project_id, (totalListingsPerProject.get(l.project_id) || 0) + 1);
    if (l.is_live === true) {
      activeListingsPerProject.set(l.project_id, (activeListingsPerProject.get(l.project_id) || 0) + 1);
    }
  }
});

let wrongCountRetrievableProjects = 0;
projects.forEach(p => {
  const reported = p.total_listings;
  const actualAll = totalListingsPerProject.get(p.project_id) || 0;
  const actualActive = activeListingsPerProject.get(p.project_id) || 0;

  // Document states: total_listings is recomputed whenever a listing is added/withdrawn so it agrees with GET /v1/listings?project_id=...
  if (reported !== actualAll && reported !== actualActive) {
    wrongCountRetrievableProjects++;
  }
});

console.log(`Retrievable project records total: ${projects.length}`);
console.log(`Projects with wrong listing count (across all 450 retrievable project records): ${wrongCountRetrievableProjects}`);

// Unique project records (50 unique project IDs)
const uniqueProjectsMap = new Map();
projects.forEach(p => {
  if (!uniqueProjectsMap.has(p.project_id)) {
    uniqueProjectsMap.set(p.project_id, p);
  }
});

let wrongCountUniqueProjects = 0;
uniqueProjectsMap.forEach((p) => {
  const reported = p.total_listings;
  const actualAll = totalListingsPerProject.get(p.project_id) || 0;
  const actualActive = activeListingsPerProject.get(p.project_id) || 0;

  if (reported !== actualAll && reported !== actualActive) {
    wrongCountUniqueProjects++;
  }
});

console.log(`Unique project records count: ${uniqueProjectsMap.size}`);
console.log(`Projects with wrong listing count (among 50 unique projects): ${wrongCountUniqueProjects}`);

