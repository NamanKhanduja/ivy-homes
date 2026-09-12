import React, { useState, useEffect } from 'react';
import { 
  LineChart as LineChartIcon, BarChart3, AlertTriangle, ShieldCheck, 
  Sparkles, FileText, ChevronDown, ChevronUp, Search, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';

export default function Insights() {
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('lies'); // 'lies' | 'answers' | 'market'
  const [expandedLie, setExpandedLie] = useState(null);

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(console.error);
  }, []);

  // Findings list of all 12 Discrepancies
  const findings = [
    {
      id: 1,
      endpoint: "*",
      category: "auth",
      documented: "Every request must carry API key as query param: GET /v1/listings?api_key=IVY26-XXXXXXXXXXXX",
      actual: "API rejects query param with 401 'send your key in the X-API-Key request header, not as a query parameter'. Header X-API-Key is mandatory.",
      how_found: "Sending initial GET request with ?api_key= in query string returned 401 Unauthorized with header instructions.",
      impact: "All frontend/API client requests fail unless migrated to X-API-Key request header.",
      evidence: []
    },
    {
      id: 2,
      endpoint: "/auth/login",
      category: "auth",
      documented: "Returns 'token' string valid for 86400 seconds (24 hours) with no refresh flow.",
      actual: "Returns 'access_token' and 'refresh_token' fields with expires_in=900 seconds (15 minutes) and refresh_url='/auth/refresh'.",
      how_found: "Inspected response body structure of POST /auth/login.",
      impact: "Frontend reading 'token' field gets undefined and user session expires in 15 mins instead of 24 hrs.",
      evidence: []
    },
    {
      id: 3,
      endpoint: "/v1/listings",
      category: "auth",
      documented: "Public listings browsing requires only api_key parameter without user login.",
      actual: "All /v1/ collection endpoints require Authorization: Bearer <access_token> header or return 401 missing bearer token.",
      how_found: "Requested /v1/listings with X-API-Key header but no Bearer token.",
      impact: "Unauthenticated visitors cannot browse property listings; login is strictly mandatory for all endpoints.",
      evidence: []
    },
    {
      id: 4,
      endpoint: "/v1/listings",
      category: "pagination",
      documented: "Limit parameter default 20, maximum 200.",
      actual: "Server hard-caps returned results array to maximum 50 records per page even when limit=200 is passed.",
      how_found: "Requested /v1/listings?page=1&limit=200 and observed exactly 50 records returned.",
      impact: "Full data retrieval requires 4x more API HTTP roundtrips than documented.",
      evidence: []
    },
    {
      id: 5,
      endpoint: "/v1/analytics/summary",
      category: "missing_endpoint",
      documented: "GET /v1/analytics/summary provides pre-computed aggregates for city dashboard.",
      actual: "Endpoint does not exist and returns HTTP 404 'Not Found'.",
      how_found: "Sent GET request to /v1/analytics/summary with valid key and token.",
      impact: "City analytics dashboard cannot fetch server pre-aggregates and must compute metrics client-side.",
      evidence: []
    },
    {
      id: 6,
      endpoint: "/v1/listings",
      category: "duplicates",
      documented: "Every listing_id is globally unique, and each listing corresponds to exactly one physical property.",
      actual: "Endpoint returns 4000 total records, which consist of only 50 unique listing_ids duplicated 80 times across pages.",
      how_found: "Paged through all 4000 records and grouped by listing_id.",
      impact: "Un-deduplicated property lists present 80 duplicate cards per property to buyers.",
      evidence: [
        "MAG-4001518", "100-4000035", "MAG-4003885", "DWE-4001305", "DWE-4001488", 
        "SQU-4003837", "DWE-4002244", "SQU-4002747", "DWE-4000855", "100-4001716", 
        "ZER-4002707", "100-4003009", "MAG-4002264", "SQU-4000712", "DWE-4001070", 
        "100-4001307", "ZER-4002840", "ZER-4000909", "SQU-4002241", "100-4001830"
      ]
    },
    {
      id: 7,
      endpoint: "/v1/listings",
      category: "units",
      documented: "Area: Square feet, integer, everywhere in the API.",
      actual: "Listings MAG-4003885, MAG-4002264, MAG-4003492, MAG-4000039 provide carpet_area in square meters (e.g. 111, 86, 100, 144 sq.m), causing impossible room sizes (<40 sqft/room) if read as sqft.",
      how_found: "Scanned carpet area to bedroom ratio across all listing records.",
      impact: "Price per sqft calculations and unit filters produce wild outliers unless converted (x 10.7639).",
      evidence: ["MAG-4003885", "MAG-4002264", "MAG-4003492", "MAG-4000039"]
    },
    {
      id: 8,
      endpoint: "/v1/projects",
      category: "units",
      documented: "Money in Indian rupees, integer, everywhere in the API.",
      actual: "price_min and price_max in /v1/projects are floating point values in Lakhs (>=10) or Crores (<10) (e.g. 66.1 Lakhs, 1.95 Crores) instead of integer rupees.",
      how_found: "Inspected GET /v1/projects response fields.",
      impact: "Formatting as integer rupees displays project price as ₹66 instead of ₹66,10,000.",
      evidence: ["P40001", "P40002", "P40003", "P40004", "P40005", "P40006", "P40007", "P40008", "P40009", "P40010"]
    },
    {
      id: 9,
      endpoint: "/v1/projects",
      category: "consistency",
      documented: "total_listings is recomputed whenever a listing is added or withdrawn so it always agrees with GET /v1/listings?project_id=...",
      actual: "total_listings reported by 43 out of 50 projects contradicts the actual number of active listings associated with that project_id.",
      how_found: "Cross-referenced project_id counts in /v1/listings against total_listings in /v1/projects.",
      impact: "Project detail cards display inaccurate available unit counts.",
      evidence: ["P40001", "P40002", "P40003", "P40004", "P40005", "P40007", "P40008", "P40009", "P40010", "P40011"]
    },
    {
      id: 10,
      endpoint: "/v1/listings",
      category: "consistency",
      documented: "project_id links listing to builder project, null for resale property not part of one.",
      actual: "37 listing records reference project_id strings (e.g. P40244, P40142, P40262) that do not exist in the /v1/projects database.",
      how_found: "Cross-referenced all project_ids in /v1/listings against /v1/projects list (P40001-P40050).",
      impact: "Clicking project links on detail pages leads to 404 project not found errors.",
      evidence: ["MAG-4001518", "100-4000035", "MAG-4003885", "DWE-4001305", "DWE-4001488", "SQU-4003837", "DWE-4002244", "DWE-4000855", "100-4001716", "ZER-4002707"]
    },
    {
      id: 11,
      endpoint: "/v1/listings",
      category: "data_quality",
      documented: "Listings contain accurate bedroom and physical property specifications.",
      actual: "Listing SQU-4002903 reports bedroom=0 and bathroom=0 while described as a residential plot/home in Tambaram.",
      how_found: "Filtered listings for bedroom <= 0 or bathroom <= 0.",
      impact: "Causes zero-division or crash in property recommendation engines.",
      evidence: ["SQU-4002903"]
    },
    {
      id: 12,
      endpoint: "/v1/listings",
      category: "fraud",
      documented: "Active sale listings in your city.",
      actual: "Listing SQU-4001315 is a clickbait fake listing priced at ₹28.10 Lakhs (60% below market average for Adyar 2BHKs) with text 'Price negotiable for quick sale' and invalid project reference.",
      how_found: "Analyzed price per sqft ratio and description anomalies across Adyar listings.",
      impact: "Bait-and-switch listing to harvest buyer lead contacts.",
      evidence: ["SQU-4001315"]
    }
  ];

  // Answers data for the 10 Questions
  const answersData = [
    { num: 1, key: "total_listing_records", value: 4000, desc: "Total listing records retrievable from /v1/listings after paging to end" },
    { num: 2, key: "unique_properties", value: 50, desc: "Distinct physical properties described by retrievable listing records" },
    { num: 3, key: "active_listings", value: 3520, desc: "Retrievable listing records with is_live = true (44 active unique x 80 duplicates)" },
    { num: 4, key: "corrupt_listing_ids", value: ["MAG-4000039", "MAG-4002264", "MAG-4003492", "MAG-4003885", "SQU-4002903"], desc: "Listing IDs describing physically impossible properties (0 bedrooms or sq.m unit corruption)" },
    { num: 5, key: "total_monthly_rent", value: 5031000, desc: "Sum of monthly rent across all retrievable rental records in T Nagar locality" },
    { num: 6, key: "avg_price_per_sqft_2bhk", value: 9079.52, desc: "Mean price / carpet area for active 2BHK listings excluding corrupt & fake records (INR/sqft)" },
    { num: 7, key: "costliest_project", value: { project_id: "P40049", price_max_inr: 31100000 }, desc: "Project with highest max price (Assetz Woods, ₹3.11 Crores / price_max=3.11)" },
    { num: 8, key: "listings_last_7_days", value: 80, desc: "Listings posted in [2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)" },
    { num: 9, key: "fake_listing_ids", value: ["100-4000035", "100-4000289", "100-4000399", "100-4000450", "100-4001055", "100-4001307", "100-4001716", "100-4001718", "100-4002612", "100-4003009", "100-4003522", "100-4004033", "100-4004075", "DWE-4000855", "DWE-4001070", "DWE-4001191", "DWE-4001305", "DWE-4001488", "DWE-4002244", "DWE-4004096", "MAG-4001131", "MAG-4001518", "MAG-4001840", "MAG-4002264", "MAG-4002445", "MAG-4003126", "MAG-4003492", "MAG-4003885", "SQU-4000712", "SQU-4001315", "SQU-4002241", "SQU-4002860", "SQU-4003837", "ZER-4001632", "ZER-4002010", "ZER-4002707", "ZER-4002840"], desc: "Listings referencing non-existent projects or clickbait lead-gen prices" },
    { num: 10, key: "projects_with_wrong_listing_count", value: 387, desc: "Projects where reported total_listings disagrees with actual active listings in dataset" }
  ];

  // Chart data
  const localityChartData = analytics?.by_locality ? analytics.by_locality.map(l => ({
    name: l.locality,
    avgPrice: Math.round(l.avg_price / 100000),
    count: l.count
  })) : [];

  const pieData = [
    { name: 'Active Clean', value: 3120, color: '#10B981' },
    { name: 'Inactive', value: 480, color: '#64748B' },
    { name: 'Unit Corrupt', value: 320, color: '#F59E0B' },
    { name: 'Corrupt 0-BHK', value: 80, color: '#EF4444' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold w-fit">
          <LineChartIcon className="w-3.5 h-3.5" />
          <span>Data Audit & Intelligence Center</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-white">
          Chennai Real Estate Insights & Documentation Audit
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Comprehensive analytical findings, dataset statistics, and 12 verified API documentation discrepancies uncovered during reverse-engineering.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Retrievable</span>
          <span className="font-heading font-extrabold text-2xl text-white block">4,000</span>
          <span className="text-[10px] text-emerald-400">Listing Records</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Unique Properties</span>
          <span className="font-heading font-extrabold text-2xl text-cyan-400 block">50</span>
          <span className="text-[10px] text-slate-400">Distinct Physical Properties</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Active Listings</span>
          <span className="font-heading font-extrabold text-2xl text-emerald-400 block">3,520</span>
          <span className="text-[10px] text-emerald-400">is_live = true</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Mean 2BHK PPSF</span>
          <span className="font-heading font-extrabold text-2xl text-amber-400 block">₹9,079.52</span>
          <span className="text-[10px] text-slate-400">Rupees / sqft (Q6)</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Discrepancies Uncovered</span>
          <span className="font-heading font-extrabold text-2xl text-rose-400 block">12 Lies</span>
          <span className="text-[10px] text-rose-400">Doc vs API Mismatches</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('lies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'lies'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Documentation Lies (12 Findings)
        </button>

        <button
          onClick={() => setActiveTab('answers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'answers'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          10 Answers Submission
        </button>

        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'market'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Market Visual Analytics
        </button>
      </div>

      {/* TAB 1: DOCUMENTATION LIES (12 Findings) */}
      {activeTab === 'lies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Click any finding to inspect evidence IDs and reproduction steps.</span>
            <span className="text-rose-400 font-bold">{findings.length} Verified Discrepancies</span>
          </div>

          <div className="space-y-3">
            {findings.map((f) => {
              const isExpanded = expandedLie === f.id;
              return (
                <div
                  key={f.id}
                  className="glass-card rounded-2xl border border-slate-800 overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedLie(isExpanded ? null : f.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-bold text-xs flex items-center justify-center">
                        #{f.id}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">{f.endpoint}</span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {f.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{f.actual}</p>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4 text-xs bg-slate-950/40">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-rose-400">Documented Claim</span>
                          <p className="text-slate-300">{f.documented}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-400">Actual API Behavior</span>
                          <p className="text-slate-300">{f.actual}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block">How Discovered:</span>
                        <p className="text-slate-300">{f.how_found}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block">System Impact:</span>
                        <p className="text-slate-300">{f.impact}</p>
                      </div>

                      {f.evidence.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-slate-800">
                          <span className="text-slate-400 font-bold block">Evidence Records ({f.evidence.length} IDs):</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {f.evidence.map(evId => (
                              <span key={evId} className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                                {evId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 10 ANSWERS SUBMISSION */}
      {activeTab === 'answers' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-white">Chennai Candidate Answers Matrix</h2>
              <p className="text-xs text-slate-400 mt-0.5">API Key: IVY26-4C3EAEB6A76C | City: Chennai | Assigned Locality: T Nagar</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              100% Calculated
            </span>
          </div>

          <div className="space-y-3">
            {answersData.map(a => (
              <div key={a.num} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-400">Q{a.num}.</span>
                    <span className="font-mono text-xs font-bold text-white">{a.key}</span>
                  </div>
                  <p className="text-xs text-slate-400">{a.desc}</p>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400 text-sm bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 block">
                    {typeof a.value === 'object' ? JSON.stringify(a.value) : a.value.toString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MARKET VISUAL ANALYTICS */}
      {activeTab === 'market' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Average Price by Locality */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-heading font-bold text-lg text-white">Average Price by Locality (in Lakhs)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={localityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="avgPrice" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Data Quality Breakdown */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-heading font-bold text-lg text-white">Dataset Record Composition</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
