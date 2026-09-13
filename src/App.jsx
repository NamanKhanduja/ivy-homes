import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Rentals from './pages/Rentals';
import Projects from './pages/Projects';
import Favourites from './pages/Favourites';
import Insights from './pages/Insights';
import Login from './pages/Login';

function AppContent() {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState(() => {
    const saved = localStorage.getItem('ivy_favourites');
    return saved ? JSON.parse(saved) : ['MAG-4001518'];
  });

  useEffect(() => {
    localStorage.setItem('ivy_favourites', JSON.stringify(favourites));
  }, [favourites]);

  const handleToggleFav = (id) => {
    setFavourites(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-rose-900 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Animated gradient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right - Emerald/Teal glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        
        {/* Bottom left - Purple/Pink glow */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-rose-400/20 to-purple-400/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Center - Orange/Yellow accent */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-orange-400/10 to-yellow-400/5 rounded-full blur-3xl"></div>
        
        {/* Subtle overlay grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        <Navbar favCount={favourites.length} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Listings favourites={favourites} onToggleFav={handleToggleFav} />} />
            <Route path="/listings/:id" element={<ListingDetail favourites={favourites} onToggleFav={handleToggleFav} />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/favourites" element={<Favourites favourites={favourites} onToggleFav={handleToggleFav} />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-white/10 bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-sm py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
            <p>© 2026 Ivy Homes Internship Submission — Chennai Market Portal</p>
            <p>Built by Naman Khanduja</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
