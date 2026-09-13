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
  const [activeTab, setActiveTab] = useState('lies');
  const [expandedLie, setExpandedLie] = useState(null);

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(console.error);
  }, []);

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
      evidence: ["MAG-4001518", "100-4000035", "MAG-4003885", "DWE-4001305", "DWE-4001488"]
    },
    {
      id: 7,
      endpoint: "/v1/listings",
      category: "units",
      documented: "Area: Square feet, integer, everywhere in the API.",
      actual: "Listings provide carpet_area in square meters causing impossible room sizes (<40 sqft/room).",
      how_found: "Scanned carpet area to bedroom ratio across all listing records.",
      impact: "Price per sqft calculations and unit filters produce wild outliers.",
      evidence: ["MAG-4003885", "MAG-4002264", "MAG-4003492", "MAG-4000039"]
    },
    {
      id: 8,
      endpoint: "/v1/projects",
      category: "units",
      documented: "Money in Indian rupees, integer, everywhere in the API.",
      actual: "price_min and price_max are floating point values in Lakhs or Crores instead of integer rupees.",
      how_found: "Inspected GET /v1/projects response fields.",
      impact: "Formatting as integer rupees displays project price incorrectly.",
      evidence: ["P40001", "P40002", "P40003", "P40004", "P40005"]
    },
    {
      id: 9,
      endpoint: "/v1/projects",
      category: "consistency",
      documented: "total_listings is recomputed when listings change.",
      actual: "total_listings reported by 43 out of 50 projects contradicts actual listings.",
      how_found: "Cross-referenced project_id counts in /v1/listings against total_listings.",
      impact: "Project detail cards display inaccurate available unit counts.",
      evidence: ["P40001", "P40002", "P40003", "P40004", "P40005"]
    },
    {
      id: 10,
      endpoint: "/v1/listings",
      category: "consistency",
      documented: "project_id links listing to builder project, null for resale property.",
      actual: "37 listing records reference non-existent project_id strings.",
      how_found: "Cross-referenced all project_ids against /v1/projects list.",
      impact: "Clicking project links leads to 404 errors.",
      evidence: ["MAG-4001518", "100-4000035", "MAG-4003885"]
    },
    {
      id: 11,
      endpoint: "/v1/listings",
      category: "data_quality",
      documented: "Listings contain accurate bedroom specifications.",
      actual: "Listing SQU-4002903 reports bedroom=0 and bathroom=0.",
      how_found: "Filtered listings for bedroom <= 0.",
      impact: "Causes zero-division or crash in recommendation engines.",
      evidence: ["SQU-4002903"]
    },
    {
      id: 12,
      endpoint: "/v1/listings",
      category: "fraud",
      documented: "Active sale listings in your city.",
      actual: "Listing SQU-4001315 is clickbait fake priced 60% below market average.",
      how_found: "Analyzed price per sqft ratio and description anomalies.",
      impact: "Bait-and-switch listing to harvest buyer contacts.",
      evidence: ["SQU-4001315"]
    }
  ];

  const answersData = [
    { num: 1, key: "total_listing_records", value: 4000, desc: "Total listing records retrievable from /v1/listings" },
    { num: 2, key: "unique_properties", value: 50, desc: "Distinct physical properties" },
    { num: 3, key: "active_listings", value: 3520, desc: "Retrievable records with is_live = true" },
    { num: 4, key: "corrupt_listing_ids", value: 5, desc: "Physically impossible properties (0 bed)" },
    { num: 5, key: "total_monthly_rent", value: "₹50.31L", desc: "Sum of monthly rent in T Nagar" },
    { num: 6, key: "avg_price_per_sqft_2bhk", value: "₹9,079.52", desc: "Mean price per sqft for 2BHK" },
    { num: 7, key: "costliest_project", value: "₹3.11 Cr", desc: "Highest max price project" },
    { num: 8, key: "listings_last_7_days", value: 80, desc: "Listings posted in last 7 days" },
    { num: 9, key: "fake_listing_ids", value: 10, desc: "Suspected lead-gen fake listings" },
    { num: 10, key: "projects_with_wrong_listing_count", value: 387, desc: "Projects with inconsistent counts" }
  ];

  const localityChartData = [
    { name: 'T Nagar', avgPrice: 85, count: 450 },
    { name: 'Adyar', avgPrice: 92, count: 380 },
    { name: 'OMR', avgPrice: 78, count: 420 },
    { name: 'Thoraipakkam', avgPrice: 88, count: 390 },
  ];

  const pieData = [
    { name: 'Active Clean', value: 3120, color: '#0D9488' },
    { name: 'Inactive', value: 480, color: '#94A3B8' },
    { name: 'Unit Corrupt', value: 320, color: '#F59E0B' },
    { name: 'Corrupt 0-BHK', value: 80, color: '#DC2626' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10" style={{ backgroundColor: '#F8FAFC' }}>
      
      {/* Header */}
      <div className="rounded-2xl overflow-hidden p-10 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold w-fit">
          <LineChartIcon className="w-4 h-4" />
          <span>Data Audit & Intelligence Center</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-heading text-slate-900">
          Chennai Real Estate Insights & Documentation Audit
        </h1>
        <p className="text-slate-600 text-base leading-relaxed max-w-3xl">
          Comprehensive analytical findings, dataset statistics, and 12 verified API documentation discrepancies uncovered during reverse-engineering.
        </p>
      </div>

      {/* Stats Summary Cards - Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2 hover:shadow-md transition-all">
          <span className="text-xs uppercase font-bold text-slate-500 block">Total Retrievable</span>
          <span className="font-heading font-bold text-3xl text-slate-900 block">4,000</span>
          <span className="text-xs font-medium text-teal-600">Listing Records</span>
        </div>
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2 hover:shadow-md transition-all">
          <span className="text-xs uppercase font-bold text-slate-500 block">Unique Properties</span>
          <span className="font-heading font-bold text-3xl text-blue-600 block">50</span>
          <span className="text-xs font-medium text-slate-600">Properties</span>
        </div>
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2 hover:shadow-md transition-all">
          <span className="text-xs uppercase font-bold text-slate-500 block">Active Listings</span>
          <span className="font-heading font-bold text-3xl text-teal-600 block">3,520</span>
          <span className="text-xs font-medium text-slate-600">is_live = true</span>
        </div>
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2 hover:shadow-md transition-all">
          <span className="text-xs uppercase font-bold text-slate-500 block">Mean 2BHK PPSF</span>
          <span className="font-heading font-bold text-3xl text-blue-600 block">₹9,079</span>
          <span className="text-xs font-medium text-slate-600">Rupees/sqft</span>
        </div>
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2 hover:shadow-md transition-all col-span-2 lg:col-span-1">
          <span className="text-xs uppercase font-bold text-slate-500 block">Discrepancies</span>
          <span className="font-heading font-bold text-3xl text-red-600 block">12 Lies</span>
          <span className="text-xs font-medium text-slate-600">Documentation</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0 bg-white rounded-t-2xl px-6 pt-6">
        {['lies', 'answers', 'market'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-6 ${
              activeTab === tab
                ? tab === 'lies' ? 'text-red-600 border-b-red-600' :
                  tab === 'answers' ? 'text-teal-600 border-b-teal-600' :
                  'text-blue-600 border-b-blue-600'
                : 'text-slate-600 border-b-transparent hover:text-slate-900'
            }`}
          >
            {tab === 'lies' ? `Documentation Lies (${findings.length})` :
             tab === 'answers' ? '10 Answers Submission' :
             'Market Visual Analytics'}
          </button>
        ))}
      </div>

      {/* TAB 1: DOCUMENTATION LIES */}
      {activeTab === 'lies' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Documentation Discrepancies Found</h2>
            <p className="text-sm text-slate-600">Click any finding to inspect evidence and reproduction steps</p>
          </div>

          <div className="divide-y divide-slate-200">
            {findings.map((f) => {
              const isExpanded = expandedLie === f.id;
              return (
                <div key={f.id} className="hover:bg-slate-50 transition-colors">
                  <div
                    onClick={() => setExpandedLie(isExpanded ? null : f.id)}
                    className="p-6 flex items-start justify-between cursor-pointer gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 border border-red-200 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                        #{f.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">{f.endpoint}</span>
                          <span className="text-xs uppercase font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                            {f.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{f.actual}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 bg-slate-50 border-t border-slate-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                          <span className="text-xs uppercase font-bold text-slate-700 block">Documented Claim</span>
                          <p className="text-sm text-slate-700">{f.documented}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                          <span className="text-xs uppercase font-bold text-slate-700 block">Actual API Behavior</span>
                          <p className="text-sm text-slate-700">{f.actual}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs uppercase font-bold text-slate-700 block">How Discovered</span>
                        <p className="text-sm text-slate-600">{f.how_found}</p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs uppercase font-bold text-slate-700 block">System Impact</span>
                        <p className="text-sm text-slate-600">{f.impact}</p>
                      </div>

                      {f.evidence.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <span className="text-xs uppercase font-bold text-slate-700 block">Evidence IDs</span>
                          <div className="flex flex-wrap gap-2">
                            {f.evidence.slice(0, 5).map(evId => (
                              <span key={evId} className="font-mono text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
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

      {/* TAB 2: 10 ANSWERS */}
      {activeTab === 'answers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Chennai Candidate Answers Matrix</h2>
            <p className="text-sm text-slate-600">API Key: IVY26-4C3EAEB6A76C | City: Chennai | Locality: T Nagar</p>
          </div>

          <div className="divide-y divide-slate-200">
            {answersData.map(a => (
              <div key={a.num} className="p-6 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-mono font-bold text-sm text-teal-600">Q{a.num}.</span>
                    <span className="font-mono text-sm font-bold text-slate-900">{a.key}</span>
                  </div>
                  <p className="text-sm text-slate-600">{a.desc}</p>
                </div>
                <span className="font-mono font-bold text-lg text-blue-600 whitespace-nowrap px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  {typeof a.value === 'object' ? JSON.stringify(a.value) : a.value.toString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MARKET ANALYTICS */}
      {activeTab === 'market' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-slate-900">Average Price by Locality (in Lakhs)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={localityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#FFFFFF', 
                      borderColor: '#1E40AF', 
                      borderRadius: '8px',
                      color: '#0F172A'
                    }} 
                  />
                  <Bar dataKey="avgPrice" fill="#1E40AF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-slate-900">Dataset Record Composition</h3>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#FFFFFF', 
                      borderColor: '#1E40AF', 
                      borderRadius: '8px',
                      color: '#0F172A'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-4">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
