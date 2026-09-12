import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Home, KeyRound, Heart, LineChart, LogOut, ShieldCheck, User } from 'lucide-react';

export default function Navbar({ favCount = 0 }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Listings', path: '/', icon: Home },
    { name: 'Rentals', path: '/rentals', icon: KeyRound },
    { name: 'Projects', path: '/projects', icon: Building2 },
    { name: 'Saved', path: '/favourites', icon: Heart, badge: favCount },
    { name: 'Insights & Lies', path: '/insights', icon: LineChart, highlight: true }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-heading text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Ivy Homes
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-emerald-400 block -mt-1">
                Chennai Edition
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : link.highlight
                      ? 'text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-1 bg-emerald-500 text-slate-950 text-xs font-bold px-1.5 py-0.2 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Session Bar */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-200">{user.email}</p>
                  <p className="text-[10px] text-emerald-400 font-mono">Session Active</p>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-sm hover:opacity-90 shadow-md shadow-emerald-500/20 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Log In</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
