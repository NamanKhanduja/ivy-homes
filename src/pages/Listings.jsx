import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Search, Filter, SlidersHorizontal, Heart, ShieldCheck, 
  AlertTriangle, Sparkles, MapPin, Bed, Bath, Maximize2, ArrowUpDown, ChevronLeft, ChevronRight, Check
} from 'lucide-react';

export default function Listings({ favourites, onToggleFav }) {
  const { token } = useAuth();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [locality, setLocality] = useState('all');
  const [bhk, setBhk] = useState('all');
  const [furnishing, setFurnishing] = useState('all');
  const [sortBy, setSortBy] = useState('price');
  const [order, setOrder] = useState('asc');
  
  // Toggles for Data Quality & Lie fixes
  const [deduplicate, setDeduplicate] = useState(true);
  const [hideCorrupt, setHideCorrupt] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const localities = [
    'all', 't nagar', 'adyar', 'anna nagar', 'velachery', 'omr', 
    'thoraipakkam', 'porur', 'perungudi', 'guindy', 'tambaram'
  ];

  useEffect(() => {
    fetchListings();
  }, [page, locality, bhk, furnishing, sortBy, order]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });
      if (locality !== 'all') params.append('locality', locality);
      if (bhk !== 'all') params.append('bhk', bhk);
      if (furnishing !== 'all') params.append('furnishing', furnishing);
      if (sortBy) params.append('sort_by', sortBy);
      if (order) params.append('order', order);

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/listings?${params.toString()}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to load listings');
      }

      setListings(data.results || []);
      setTotalRecords(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering & deduplication
  const getProcessedListings = () => {
    let list = [...listings];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item => 
        (item.apartment_name || '').toLowerCase().includes(q) ||
        (item.locality || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.listing_id || '').toLowerCase().includes(q)
      );
    }

    // Hide corrupt listings if toggled
    if (hideCorrupt) {
      list = list.filter(item => !item.is_corrupt);
    }

    // Deduplicate repeated listings across pages if toggled
    if (deduplicate) {
      const seen = new Set();
      list = list.filter(item => {
        if (seen.has(item.listing_id)) return false;
        seen.add(item.listing_id);
        return true;
      });
    }

    return list;
  };

  const processedListings = getProcessedListings();

  const formatPrice = (price) => {
    if (!price || price <= 0) return '₹0';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakhs`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-8 sm:p-10 border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chennai Verified Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Explore Residential Listings
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Browse active apartments, villas, and independent floors in Chennai. Real-time unit conversions and data sanitation applied.
          </p>
        </div>
      </div>

      {/* Control Bar: Filters & Lie-Fix Toggles */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-4 shadow-xl">
        
        {/* Search & Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apartment, locality, ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Locality Dropdown */}
          <div className="md:col-span-3">
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 capitalize focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">All Localities</option>
              {localities.filter(l => l !== 'all').map(loc => (
                <option key={loc} value={loc} className="capitalize">{loc}</option>
              ))}
            </select>
          </div>

          {/* BHK Filter */}
          <div className="md:col-span-2">
            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">All BHKs</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
              <option value="5">5 BHK</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sb, ord] = e.target.value.split('-');
                setSortBy(sb);
                setOrder(ord);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="carpet_area-desc">Area: Large to Small</option>
              <option value="posted_at-desc">Newest First</option>
            </select>
          </div>

        </div>

        {/* Toggles Bar (Sanitation & Discrepancy Switches) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs">
          
          <div className="flex flex-wrap items-center gap-4">
            
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={deduplicate}
                onChange={(e) => setDeduplicate(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span>Deduplicate API Repeat Listings (Doc Lie Fix)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={hideCorrupt}
                onChange={(e) => setHideCorrupt(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span>Hide Corrupt / Impossible Listings</span>
            </label>

          </div>

          <div className="text-slate-400">
            Showing <span className="font-semibold text-emerald-400">{processedListings.length}</span> listings 
            (Server Reported: {totalRecords})
          </div>

        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Fetching properties from API server...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto" />
          <p className="font-semibold">{error}</p>
          <button onClick={fetchListings} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">
            Retry Connection
          </button>
        </div>
      ) : processedListings.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl border border-slate-800">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No properties found</h3>
          <p className="text-slate-400 text-xs mt-1">Try relaxing your search or filter parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedListings.map((property) => {
            const isFav = favourites.includes(property.listing_id);
            return (
              <div
                key={property.listing_id}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  
                  {/* Property Card Header */}
                  <div className="p-5 pb-3 relative">
                    
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono font-bold tracking-wide uppercase px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800">
                        {property.listing_id}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {property.is_verified && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        <button
                          onClick={() => onToggleFav(property.listing_id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isFav
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400'
                          }`}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Locality */}
                    <h3 className="font-heading font-bold text-lg text-white line-clamp-1">
                      {property.apartment_name || 'Independent Residence'}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-slate-400 capitalize mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{property.locality}, Chennai</span>
                    </p>

                    {/* Unit Notice Warning Badge (Documentation Lie Fix) */}
                    {property.unit_notice && (
                      <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{property.unit_notice}</span>
                      </div>
                    )}

                    {property.is_fake && (
                      <div className="mt-3 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>Suspected Lead-Gen Fake Listing</span>
                      </div>
                    )}

                  </div>

                  {/* Specs Grid */}
                  <div className="px-5 py-3 grid grid-cols-3 gap-2 border-y border-slate-800/60 bg-slate-900/40 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Bed className="w-4 h-4 text-slate-400" />
                      <span>{property.bedroom} BHK</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Bath className="w-4 h-4 text-slate-400" />
                      <span>{property.bathroom} Bath</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Maximize2 className="w-4 h-4 text-slate-400" />
                      <span>{property.normalized_carpet_area || property.carpet_area} sqft</span>
                    </div>
                  </div>

                </div>

                {/* Card Footer: Price & View Link */}
                <div className="p-5 flex items-center justify-between border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Price</span>
                    <span className="font-heading font-extrabold text-lg text-emerald-400">
                      {formatPrice(property.price)}
                    </span>
                  </div>

                  <Link
                    to={`/listings/${property.listing_id}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all"
                  >
                    View Details
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Page</span>
        </button>

        <span className="text-xs text-slate-400 font-mono">
          Page <strong className="text-emerald-400">{page}</strong>
        </span>

        <button
          onClick={() => setPage(p => p + 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800"
        >
          <span>Next Page</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
