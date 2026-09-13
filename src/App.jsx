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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Subtle background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-100/20 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl opacity-40"></div>
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
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-600">
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
