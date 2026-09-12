import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on app startup
    const storedToken = localStorage.getItem('ivy_token');
    const storedUser = localStorage.getItem('ivy_user');
    const loginTime = localStorage.getItem('ivy_login_time');

    if (storedToken && storedUser) {
      // Check session age (session survives page refresh)
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      const authToken = data.token || data.access_token;
      const userData = data.user || { email, name: email.split('@')[0] };

      setToken(authToken);
      setUser(userData);

      localStorage.setItem('ivy_token', authToken);
      localStorage.setItem('ivy_user', JSON.stringify(userData));
      localStorage.setItem('ivy_login_time', Date.now().toString());

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ivy_token');
    localStorage.removeItem('ivy_user');
    localStorage.removeItem('ivy_login_time');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
