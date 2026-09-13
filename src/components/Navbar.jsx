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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5 shadow-lg shadow-cyan-400/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-heading text-lg font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Ivy Homes
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-cyan-400 block -mt-1">
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
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : link.highlight
                      ? 'text-blue-300 hover:bg-blue-500/20 hover:text-blue-200'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
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
              <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-100">{user.email}</p>
                  <p className="text-[10px] text-cyan-400 font-mono">Session Active</p>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm hover:opacity-90 shadow-lg shadow-cyan-500/40 transition-all hover:scale-105"
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
