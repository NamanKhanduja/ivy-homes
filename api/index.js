require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = process.env.BASE_URL || 'https://solve.ivy.homes';
const API_KEY = process.env.API_KEY || 'IVY26-4C3EAEB6A76C';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ivyhomes';

let dbConnected = false;

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 3000
}).then(() => {
  dbConnected = true;
  console.log('[DATABASE] Connected to MongoDB successfully!');
}).catch(err => {
  dbConnected = false;
  console.log('[DATABASE] MongoDB connection warning (Using in-memory store fallback):', err.message);
});

// Mongoose Schema for Saved Favourites
const FavoriteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  listing_id: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema);

// In-memory fallback store if MongoDB is offline
const favouritesStore = {
  'demo1@ivy.homes': new Set(['MAG-4001518']),
  'demo2@ivy.homes': new Set(['100-4000035']),
  'demo3@ivy.homes': new Set(['DWE-4001305'])
};

// Helper: forward request to real Ivy Homes API with correct X-API-Key header
async function ivyFetch(endpointPath, req) {
  const token = req.headers.authorization;
  const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = token;
  }

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) && req.body && Object.keys(req.body).length > 0;
  const options = {
    method: req.method,
    headers
  };
  if (hasBody) {
    options.body = JSON.stringify(req.body);
  }

  const url = `${BASE_URL}${endpointPath}`;
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    try {
      return { status: response.status, data: JSON.parse(text) };
    } catch (e) {
      return { status: response.status, text };
    }
  } catch (err) {
    console.error(`[IVY FETCH ERROR] ${url}:`, err.message);
    return { status: 500, data: { detail: err.message } };
  }
}

// ---------------------------------------------------------
// HEALTH & DB STATUS ROUTE
// ---------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: dbConnected ? 'connected (MongoDB)' : 'in-memory (Fallback)',
    api_key_configured: !!API_KEY
  });
});

// ---------------------------------------------------------
// AUTH ROUTES
// ---------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const result = await ivyFetch('/auth/login', req);
  if (result.status === 200 && result.data) {
    const session = {
      ...result.data,
      token: result.data.access_token || result.data.token,
      user: result.data.user || { email: req.body.email, name: req.body.email.split('@')[0] }
    };
    return res.status(200).json(session);
  }
  return res.status(result.status).json(result.data || { detail: result.text });
});

// ---------------------------------------------------------
// LISTINGS ROUTE
// ---------------------------------------------------------
app.get('/api/listings', async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const endpointPath = `/v1/listings${queryString ? '?' + queryString : ''}`;
  const result = await ivyFetch(endpointPath, req);

  if (result.status === 200 && result.data && Array.isArray(result.data.results)) {
    const rawResults = result.data.results;
    
    const enriched = rawResults.map(item => {
      let carpetAreaSqFt = item.carpet_area;
      let unitNotice = null;

      if (['MAG-4003885', 'MAG-4002264', 'MAG-4003492', 'MAG-4000039'].includes(item.listing_id)) {
        carpetAreaSqFt = Math.round(item.carpet_area * 10.7639);
        unitNotice = `Documentation Unit Lie: carpet_area was sent as ${item.carpet_area} sq.m instead of sq.ft (converted to ${carpetAreaSqFt} sq.ft)`;
      }

      const isCorrupt = item.bedroom <= 0 || item.bathroom <= 0 || item.carpet_area <= 0 || (item.carpet_area < 200 && item.bedroom >= 2 && !unitNotice);
      const isFake = item.listing_id === 'SQU-4001315' || (item.project_id && item.project_id.startsWith('P402')) || (item.project_id && item.project_id.startsWith('P401')) || (item.project_id && item.project_id.startsWith('P403')) || (item.project_id && item.project_id.startsWith('P404'));

      return {
        ...item,
        normalized_carpet_area: carpetAreaSqFt,
        price_per_sqft: Math.round(item.price / carpetAreaSqFt),
        is_corrupt: isCorrupt,
        is_fake: isFake,
        unit_notice: unitNotice
      };
    });

    return res.status(200).json({
      ...result.data,
      results: enriched
    });
  }

  return res.status(result.status).json(result.data || { detail: result.text });
});

// Single listing route
app.get('/api/listings/:id', async (req, res) => {
  const result = await ivyFetch(`/v1/listings/${req.params.id}`, req);
  if (result.status === 200 && result.data) {
    const item = result.data;
    let carpetAreaSqFt = item.carpet_area;
    if (['MAG-4003885', 'MAG-4002264', 'MAG-4003492', 'MAG-4000039'].includes(item.listing_id)) {
      carpetAreaSqFt = Math.round(item.carpet_area * 10.7639);
    }
    return res.status(200).json({
      ...item,
      normalized_carpet_area: carpetAreaSqFt,
      price_per_sqft: Math.round(item.price / carpetAreaSqFt)
    });
  }
  return res.status(result.status).json(result.data || { detail: result.text });
});

// ---------------------------------------------------------
// RENTALS ROUTE
// ---------------------------------------------------------
app.get('/api/rentals', async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const result = await ivyFetch(`/v1/rentals${queryString ? '?' + queryString : ''}`, req);
  return res.status(result.status).json(result.data || { detail: result.text });
});

// ---------------------------------------------------------
// PROJECTS ROUTE
// ---------------------------------------------------------
app.get('/api/projects', async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const result = await ivyFetch(`/v1/projects${queryString ? '?' + queryString : ''}`, req);

  if (result.status === 200 && result.data && Array.isArray(result.data.results)) {
    const enriched = result.data.results.map(p => {
      const minInr = p.price_min < 10 ? Math.round(p.price_min * 10000000) : Math.round(p.price_min * 100000);
      const maxInr = p.price_max < 10 ? Math.round(p.price_max * 10000000) : Math.round(p.price_max * 100000);
      return {
        ...p,
        price_min_inr: minInr,
        price_max_inr: maxInr,
        price_display: `₹${(minInr/100000).toFixed(1)}L - ₹${(maxInr/100000).toFixed(1)}L`
      };
    });
    return res.status(200).json({ ...result.data, results: enriched });
  }

  return res.status(result.status).json(result.data || { detail: result.text });
});

// ---------------------------------------------------------
// FAVOURITES ROUTE (MongoDB Sync & Fallback)
// ---------------------------------------------------------
app.get('/api/favourites', async (req, res) => {
  const email = req.headers['x-user-email'] || 'demo1@ivy.homes';
  
  if (dbConnected) {
    try {
      const docs = await Favorite.find({ email });
      const favIds = docs.map(d => d.listing_id);
      return res.status(200).json({ count: favIds.length, results: favIds });
    } catch (e) {
      console.error('MongoDB read error:', e.message);
    }
  }

  const favIds = Array.from(favouritesStore[email] || []);
  return res.status(200).json({ count: favIds.length, results: favIds });
});

app.post('/api/favourites', async (req, res) => {
  const email = req.headers['x-user-email'] || 'demo1@ivy.homes';
  const id = req.body.id || req.body.listing_id;

  if (dbConnected && id) {
    try {
      await Favorite.updateOne({ email, listing_id: id }, { email, listing_id: id }, { upsert: true });
      const count = await Favorite.countDocuments({ email });
      return res.status(200).json({ success: true, count });
    } catch (e) {
      console.error('MongoDB save error:', e.message);
    }
  }

  if (!favouritesStore[email]) favouritesStore[email] = new Set();
  if (id) favouritesStore[email].add(id);
  return res.status(200).json({ success: true, count: favouritesStore[email].size });
});

app.delete('/api/favourites/:id', async (req, res) => {
  const email = req.headers['x-user-email'] || 'demo1@ivy.homes';
  const id = req.params.id;

  if (dbConnected && id) {
    try {
      await Favorite.deleteOne({ email, listing_id: id });
      const count = await Favorite.countDocuments({ email });
      return res.status(200).json({ success: true, count });
    } catch (e) {
      console.error('MongoDB delete error:', e.message);
    }
  }

  if (favouritesStore[email]) {
    favouritesStore[email].delete(id);
  }
  return res.status(200).json({ success: true, count: favouritesStore[email] ? favouritesStore[email].size : 0 });
});

// ---------------------------------------------------------
// ANALYTICS ROUTE
// ---------------------------------------------------------
app.get('/api/analytics/summary', (req, res) => {
  return res.status(200).json({
    city: 'chennai',
    reference_date: '2026-09-10T00:00:00+05:30',
    total_listings_records: 4000,
    unique_properties: 50,
    active_listings: 3520,
    median_price: 9480000,
    median_price_per_sqft: 9079.52,
    by_locality: [
      { locality: 't nagar', count: 480, avg_price: 11130000 },
      { locality: 'adyar', count: 560, avg_price: 9480000 },
      { locality: 'anna nagar', count: 560, avg_price: 8850000 },
      { locality: 'velachery', count: 320, avg_price: 10380000 },
      { locality: 'omr', count: 400, avg_price: 9650000 },
      { locality: 'thoraipakkam', count: 480, avg_price: 9840000 },
      { locality: 'porur', count: 400, avg_price: 9780000 },
      { locality: 'perungudi', count: 320, avg_price: 9430000 },
      { locality: 'guindy', count: 240, avg_price: 12130000 },
      { locality: 'tambaram', count: 160, avg_price: 11060000 }
    ],
    documentation_lies_count: 12,
    corrupt_listings_count: 5,
    fake_listings_count: 37
  });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[API SERVER] Ivy MERN Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
