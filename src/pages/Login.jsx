import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('demo1@ivy.homes');
  const [password, setPassword] = useState('117e45bfc1');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = [
    { email: 'demo1@ivy.homes', label: 'Demo Account 1' },
    { email: 'demo2@ivy.homes', label: 'Demo Account 2' },
    { email: 'demo3@ivy.homes', label: 'Demo Account 3' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  const selectDemo = (accEmail) => {
    setEmail(accEmail);
    setPassword('117e45bfc1');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-heading text-white tracking-tight">
            Welcome to Ivy Homes
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Log in to access Chennai property listings, saved favourites, and market insights.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Quick Demo Accounts Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
              Select Demo User Account
            </label>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => selectDemo(acc.email)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                    email === acc.email
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {acc.email.split('@')[0]}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  placeholder="name@ivy.homes"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>Log In to App</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Authentication uses <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">X-API-Key</code> and JWT Bearer flow
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
