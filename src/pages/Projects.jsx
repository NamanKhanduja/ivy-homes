import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Search, MapPin, Calendar, Maximize2, ShieldCheck, AlertTriangle, Layers } from 'lucide-react';

export default function Projects() {
  const { token } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [locality, setLocality] = useState('all');
  const [status, setStatus] = useState('all');

  const localities = [
    'all', 't nagar', 'adyar', 'anna nagar', 'velachery', 'omr', 
    'thoraipakkam', 'porur', 'perungudi', 'guindy', 'tambaram'
  ];

  useEffect(() => {
    fetchProjects();
  }, [locality, status]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (locality !== 'all') params.append('locality', locality);
      if (status !== 'all') params.append('project_status', status);

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/projects?${params.toString()}`, { headers });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Failed to load projects');
      setProjects(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.apartment_name || '').toLowerCase().includes(q) ||
      (p.developer_name || '').toLowerCase().includes(q) ||
      (p.locality || '').toLowerCase().includes(q) ||
      (p.project_id || '').toLowerCase().includes(q)
    );
  });

  const formatPriceRange = (minInr, maxInr) => {
    const minStr = minInr >= 10000000 ? `₹${(minInr / 10000000).toFixed(2)} Cr` : `₹${(minInr / 100000).toFixed(1)} L`;
    const maxStr = maxInr >= 10000000 ? `₹${(maxInr / 10000000).toFixed(2)} Cr` : `₹${(maxInr / 100000).toFixed(1)} L`;
    return `${minStr} - ${maxStr}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-8 border border-slate-800 flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Developer Communities & Modern Townships</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-white">
            Builder Projects in Chennai
          </h1>
          <p className="text-slate-400 text-sm">
            Explore major residential developments with RERA approvals, unit configurations, and verified pricing.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 text-right">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Costliest Project (Q7)</span>
          <span className="font-heading font-extrabold text-xl text-emerald-400">Assetz Woods (P40049)</span>
          <span className="text-[10px] text-slate-400 block">₹3.11 Crores Max Price (Lakhs/Crores Unit Converted)</span>
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
            placeholder="Search project name, developer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 capitalize focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Localities</option>
            {localities.filter(l => l !== 'all').map(loc => (
              <option key={loc} value={loc} className="capitalize">{loc}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="under construction">Under Construction</option>
            <option value="ready to move">Ready to Move</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading project catalog...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center">
          <p className="font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.project_id} className="glass-card glass-card-hover rounded-2xl overflow-hidden border border-slate-800 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {project.project_id}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full capitalize">
                    {project.project_status}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-lg text-white">{project.apartment_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">By <strong className="text-slate-200">{project.developer_name}</strong></p>
                  <p className="flex items-center gap-1 text-xs text-slate-400 capitalize mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{project.locality}, Chennai</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Units</span>
                    <span className="font-bold text-white">{project.total_units} Units ({project.total_towers} Towers)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Unit Size Range</span>
                    <span className="font-bold text-white">{project.min_area_sqft} - {project.max_area_sqft} sqft</span>
                  </div>
                </div>

                {project.rera_number && (
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>RERA: {project.rera_number}</span>
                  </div>
                )}

                {/* Amenities */}
                {project.amenities && project.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.amenities.slice(0, 4).map((am, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 capitalize">
                        {am}
                      </span>
                    ))}
                    {project.amenities.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400">
                        +{project.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Price Range</span>
                  <span className="font-heading font-extrabold text-base text-emerald-400">
                    {formatPriceRange(project.price_min_inr, project.price_max_inr)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Reported Listings</span>
                  <span className="text-xs font-bold text-slate-200">{project.total_listings} Available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
