import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, MapPin, Bed, Bath, Maximize2, Trash2, ArrowRight } from 'lucide-react';

export default function Favourites({ favourites, onToggleFav }) {
  const { user, token } = useAuth();
  const [favListings, setFavListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavListings();
  }, [favourites]);

  const fetchFavListings = async () => {
    if (favourites.length === 0) {
      setFavListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const fetched = await Promise.all(
        favourites.map(async (id) => {
          try {
            const res = await fetch(`/api/listings/${id}`, { headers });
            if (res.ok) return await res.json();
          } catch (e) {}
          return null;
        })
      );

      setFavListings(fetched.filter(Boolean));
    } catch (err) {
      console.error(err);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-8 border border-slate-800 flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>User Session Saved Properties</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-white">
            Saved Properties ({favourites.length})
          </h1>
          <p className="text-slate-400 text-sm">
            Saved properties for <strong className="text-white">{user ? user.email : 'Guest Session'}</strong>. Persisted across page refreshes and re-logins.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading your saved properties...</p>
        </div>
      ) : favListings.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl border border-slate-800 space-y-4">
          <Heart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No saved properties yet</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Click the heart icon on any property card while browsing to save it to your account favorites.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:opacity-90 transition-all"
          >
            <span>Browse Properties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favListings.map((property) => (
            <div key={property.listing_id} className="glass-card rounded-2xl border border-slate-800 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {property.listing_id}
                  </span>
                  <button
                    onClick={() => onToggleFav(property.listing_id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all text-xs flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                <h3 className="font-heading font-bold text-base text-white">{property.apartment_name}</h3>
                <p className="flex items-center gap-1 text-xs text-slate-400 capitalize mt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{property.locality}, Chennai</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500 block">Bedrooms</span>
                  <span className="font-bold text-white">{property.bedroom} BHK</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bathrooms</span>
                  <span className="font-bold text-white">{property.bathroom}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Carpet Area</span>
                  <span className="font-bold text-white">{property.normalized_carpet_area || property.carpet_area} sqft</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Listing Price</span>
                  <span className="font-heading font-extrabold text-base text-emerald-400">
                    {formatPrice(property.price)}
                  </span>
                </div>

                <Link
                  to={`/listings/${property.listing_id}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
