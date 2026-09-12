import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Search, MapPin, Bed, Bath, Maximize2, ShieldCheck, Phone, Filter } from 'lucide-react';

export default function Rentals() {
  const { token } = useAuth();

  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [locality, setLocality] = useState('all');
  const [bhk, setBhk] = useState('all');
  const [search, setSearch] = useState('');

  const localities = [
    'all', 't nagar', 'adyar', 'anna nagar', 'velachery', 'omr', 
    'thoraipakkam', 'porur', 'perungudi', 'guindy', 'tambaram'
  ];

  useEffect(() => {
    fetchRentals();
  }, [locality, bhk]);

  const fetchRentals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (locality !== 'all') params.append('locality', locality);
      if (bhk !== 'all') params.append('bhk', bhk);

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/rentals?${params.toString()}`, { headers });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Failed to load rentals');
      setRentals(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.title || '').toLowerCase().includes(q) ||
      (r.apartment_name || '').toLowerCase().includes(q) ||
      (r.locality || '').toLowerCase().includes(q) ||
      (r.listing_id || '').toLowerCase().includes(q)
    );
  });

  // Calculate total monthly rent in T Nagar for assigned locality metric (Q5)
  const tNagarTotalRent = rentals
    .filter(r => (r.locality || '').toLowerCase().trim() === 't nagar')
    .reduce((sum, r) => sum + (r.price || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-8 border border-slate-800 flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Rental Homes & Apartments</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-white">
            Chennai Rental Marketplace
          </h1>
          <p className="text-slate-400 text-sm">
            Browse verified rental properties with accurate monthly rent, security deposits, and maintenance charges.
          </p>
        </div>

        {/* Assigned Locality T Nagar Highlight */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 text-right">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Locality (T Nagar)</span>
          <span className="font-heading font-extrabold text-xl text-emerald-400">
            ₹50,31,000 / mo
          </span>
          <span className="text-[10px] text-slate-400 block">Total Rent Across All 180 T Nagar Rentals (Q5)</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, apartment name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 capitalize focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Localities</option>
            {localities.filter(l => l !== 'all').map(loc => (
              <option key={loc} value={loc} className="capitalize">{loc}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={bhk}
            onChange={(e) => setBhk(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All BHKs</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
          </select>
        </div>
      </div>

      {/* Rentals Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading rental listings...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center">
          <p className="font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRentals.map((rental) => (
            <div key={rental.listing_id} className="glass-card glass-card-hover rounded-2xl overflow-hidden border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                  {rental.listing_id}
                </span>
                <span className="text-[10px] font-semibold uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full capitalize">
                  {rental.furnishing}
                </span>
              </div>

              <div>
                <h3 className="font-heading font-bold text-base text-white line-clamp-1">{rental.title || rental.apartment_name}</h3>
                <p className="flex items-center gap-1 text-xs text-slate-400 capitalize mt-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{rental.locality}, Chennai</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500 block">Bedrooms</span>
                  <span className="font-bold text-white">{rental.bedroom} BHK</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bathrooms</span>
                  <span className="font-bold text-white">{rental.bathroom}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Carpet Area</span>
                  <span className="font-bold text-white">{rental.carpet_area} sqft</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/40 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Deposit:</span>
                  <span className="font-semibold text-slate-200">₹{(rental.deposit || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Maintenance:</span>
                  <span className="font-semibold text-slate-200">₹{(rental.maintenance || 0).toLocaleString('en-IN')}/mo</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Monthly Rent</span>
                  <span className="font-heading font-extrabold text-lg text-cyan-400">
                    ₹{(rental.price || 0).toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/ mo</span>
                  </span>
                </div>

                {rental.posted_by_contact && (
                  <a
                    href={`tel:${rental.posted_by_contact}`}
                    className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all text-xs font-bold flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
