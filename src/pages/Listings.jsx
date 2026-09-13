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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Hero Header */}
      <div className="rounded-3xl overflow-hidden p-10 sm:p-14 bg-white border border-slate-200 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Chennai Verified Marketplace</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold font-heading text-slate-900 tracking-tight">
            Explore Residential Listings
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
            Browse active apartments, villas, and independent floors in Chennai. Real-time unit conversions and data sanitation applied.
          </p>
        </div>
      </div>

      {/* Control Bar: Filters & Lie-Fix Toggles */}
      <div className="rounded-2xl p-8 bg-white border border-slate-200 shadow-sm space-y-6">
        
        {/* Search & Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <div className="md:col-span-5 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apartment, locality, ID..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Locality Dropdown */}
          <div className="md:col-span-3">
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 capitalize focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
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
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
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
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="carpet_area-desc">Area: Large to Small</option>
              <option value="posted_at-desc">Newest First</option>
            </select>
          </div>

        </div>

        {/* Toggles Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-slate-200">
          
          <div className="flex flex-wrap items-center gap-6">
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deduplicate}
                onChange={(e) => setDeduplicate(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Deduplicate API Repeat Listings</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hideCorrupt}
                onChange={(e) => setHideCorrupt(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Hide Corrupt Listings</span>
            </label>

          </div>

          <div className="text-sm font-medium text-slate-600">
            Showing <span className="text-blue-600 font-bold">{processedListings.length}</span> listings 
            <span className="text-slate-500"> (Server: {totalRecords})</span>
          </div>

        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 text-sm font-medium">Fetching properties from API server...</p>
        </div>
      ) : error ? (
        <div className="p-10 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 mx-auto" />
          <p className="font-semibold text-lg">{error}</p>
          <button onClick={fetchListings} className="px-6 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700">
            Retry Connection
          </button>
        </div>
      ) : processedListings.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-slate-200 bg-white">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No properties found</h3>
          <p className="text-slate-600 text-sm mt-2">Try relaxing your search or filter parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedListings.map((property) => {
            const isFav = favourites.includes(property.listing_id);
            return (
              <div
                key={property.listing_id}
                className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  
                  {/* Property Card Header */}
                  <div className="p-6 pb-4">
                    
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-xs font-mono font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        {property.listing_id}
                      </span>

                      <div className="flex items-center gap-2">
                        {property.is_verified && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        )}
                        <button
                          onClick={() => onToggleFav(property.listing_id)}
                          className={`p-2 rounded-lg border transition-all ${
                            isFav
                              ? 'bg-red-50 border-red-300 text-red-600'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600'
                          }`}
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Locality */}
                    <h3 className="font-heading font-bold text-lg text-slate-900 line-clamp-2 mb-2">
                      {property.apartment_name || 'Independent Residence'}
                    </h3>
                    <p className="flex items-center gap-2 text-sm text-slate-600 capitalize">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{property.locality}, Chennai</span>
                    </p>

                    {/* Unit Notice Warning Badge */}
                    {property.unit_notice && (
                      <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{property.unit_notice}</span>
                      </div>
                    )}

                    {property.is_fake && (
                      <div className="mt-4 p-3 rounded-lg bg-purple-50 border border-purple-300 text-purple-800 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>Suspected Lead-Gen Fake Listing</span>
                      </div>
                    )}

                  </div>

                  {/* Specs Grid */}
                  <div className="px-6 py-4 grid grid-cols-3 gap-3 border-y border-slate-200 bg-blue-50/40">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Bed className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-xs text-slate-600">Bedroom</div>
                        <div className="font-bold text-sm">{property.bedroom}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Bath className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-xs text-slate-600">Bathroom</div>
                        <div className="font-bold text-sm">{property.bathroom}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Maximize2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-xs text-slate-600">Area</div>
                        <div className="font-bold text-sm text-nowrap">{property.normalized_carpet_area || property.carpet_area} sqft</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Card Footer: Price & View Link */}
                <div className="p-6 flex items-center justify-between border-t border-slate-200">
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-500 block">Total Price</span>
                    <span className="font-heading font-bold text-xl text-blue-600 mt-1">
                      {formatPrice(property.price)}
                    </span>
                  </div>

                  <Link
                    to={`/listings/${property.listing_id}`}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md"
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
      <div className="flex items-center justify-between pt-8 border-t border-slate-200">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        <span className="text-sm font-mono text-slate-600">
          Page <strong className="text-blue-600 text-base">{page}</strong>
        </span>

        <button
          onClick={() => setPage(p => p + 1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all"
        >
          <span>Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
