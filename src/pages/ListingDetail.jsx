import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, MapPin, Bed, Bath, Maximize2, Compass, Car, Phone, User, 
  ShieldCheck, Heart, AlertTriangle, ArrowLeft, ExternalLink, Calendar
} from 'lucide-react';

export default function ListingDetail({ favourites, onToggleFav }) {
  const { id } = useParams();
  const { token } = useAuth();

  const [property, setProperty] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Call single listing API
      const res = await fetch(`/api/listings/${id}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Listing not found');
      }

      setProperty(data);

      // Fetch comparable listings for "You may also like"
      const simRes = await fetch(`/api/listings?locality=${data.locality}&bhk=${data.bedroom}&limit=6`, { headers });
      const simData = await simRes.json();
      if (simRes.ok && simData.results) {
        setSimilar(simData.results.filter(item => item.listing_id !== id).slice(0, 4));
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '₹0';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakhs`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading listing details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
          <h2 className="text-xl font-bold">Property Not Found</h2>
          <p className="text-sm mt-1">{error || 'The requested property ID does not exist.'}</p>
          <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const isFav = favourites.includes(property.listing_id);
  const carpetAreaSqFt = property.normalized_carpet_area || property.carpet_area;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Navigation Top */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Property Search</span>
      </Link>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
                    {property.listing_id}
                  </span>
                  {property.is_verified && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Property
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                  {property.apartment_name || 'Independent Residence'}
                </h1>
                <p className="flex items-center gap-1.5 text-sm text-slate-400 capitalize mt-1">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{property.locality}, Chennai, Tamil Nadu</span>
                </p>
              </div>

              {/* Price Tag */}
              <div className="text-right">
                <span className="text-xs uppercase font-semibold text-slate-400 block">Listing Price</span>
                <span className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-400">
                  {formatPrice(property.price)}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  ₹{Math.round(property.price / carpetAreaSqFt)} / sqft
                </span>
              </div>
            </div>

            {/* Spec Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Bedrooms</span>
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-emerald-400" />
                  {property.bedroom} BHK
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Bathrooms</span>
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Bath className="w-4 h-4 text-emerald-400" />
                  {property.bathroom} Baths
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Carpet Area</span>
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-emerald-400" />
                  {carpetAreaSqFt} sqft
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Floor Level</span>
                <span className="font-bold text-white text-sm">
                  {property.floor || 'Ground'} / {property.total_floors || 'N/A'} Floors
                </span>
              </div>
            </div>

            {/* Additional Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                <span className="text-slate-500 block">Facing Direction</span>
                <span className="font-semibold capitalize text-slate-200">{property.facing_direction || 'North-East'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                <span className="text-slate-500 block">Furnishing</span>
                <span className="font-semibold capitalize text-slate-200">{property.furnishing}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                <span className="text-slate-500 block">Covered Parking</span>
                <span className="font-semibold text-slate-200">{property.covered_parking ? `${property.covered_parking} Slot(s)` : 'None'}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="font-heading font-bold text-sm text-white">Property Overview</h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/30 p-4 rounded-2xl border border-slate-800/40">
                {property.description}
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: Contact & Builder Info */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Action Box */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
            <button
              onClick={() => onToggleFav(property.listing_id)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                isFav
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              <span>{isFav ? 'Saved in Favourites' : 'Save to Favourites'}</span>
            </button>

            {/* Seller Info */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Seller Contact Details</span>
              </h3>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Contact Person</span>
                  <span className="font-bold text-slate-200 text-sm">{property.posted_by_name || 'Rahul Sharma'}</span>
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold block capitalize">({property.posted_by || 'agent'})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Phone Number</span>
                  <a href={`tel:${property.posted_by_contact}`} className="font-mono font-bold text-emerald-400 flex items-center gap-1.5 hover:underline text-sm">
                    <Phone className="w-3.5 h-3.5" />
                    {property.posted_by_contact}
                  </a>
                </div>
              </div>
            </div>

            {/* External URL */}
            {property.listing_url && (
              <a
                href={property.listing_url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all"
              >
                <span>View Source Listing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

          </div>

          {/* Builder Project Banner if present */}
          {property.project_id && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Builder Project</span>
                <span className="text-xs font-mono font-semibold text-emerald-400">{property.project_id}</span>
              </div>
              <p className="text-xs text-slate-300">
                This listing belongs to builder project <strong className="text-white">{property.project_id}</strong>.
              </p>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
              >
                <span>Browse All Projects</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

        </div>

      </div>

      {/* Similar Listings Strip */}
      {similar.length > 0 && (
        <div className="pt-8 border-t border-slate-800 space-y-4">
          <h2 className="text-xl font-bold font-heading text-white">Similar Listings in {property.locality}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similar.map(sim => (
              <Link
                key={sim.listing_id}
                to={`/listings/${sim.listing_id}`}
                className="glass-card glass-card-hover p-4 rounded-2xl border border-slate-800 space-y-2 block"
              >
                <span className="text-[10px] font-mono text-slate-400">{sim.listing_id}</span>
                <h4 className="font-bold text-sm text-white line-clamp-1">{sim.apartment_name}</h4>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                  <span className="text-slate-400">{sim.bedroom} BHK</span>
                  <span className="font-bold text-emerald-400">{formatPrice(sim.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
