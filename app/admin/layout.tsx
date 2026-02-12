'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/check');
      if (res.ok) {
        const data = await res.json();
        setUser(data.username);
      }
    } catch {
      // not authenticated
    }
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.username);
      } else {
        setError('Invalid username or password');
      }
    } catch {
      setError('Login failed');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-pale">
        <div className="text-brand-purple">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-pale">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold text-brand-navy mb-6 text-center">Admin Login</h1>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <input
            type="text"
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <button
            type="submit"
            className="w-full bg-brand-magenta text-white py-2 rounded hover:opacity-90 transition"
          >
            Log In
          </button>
        </form>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/categories', label: 'Categories' },
    { href: '/admin/types', label: 'Types' },
    { href: '/admin/manufacturers', label: 'Brands' },
    { href: '/admin/leads', label: 'Leads' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex bg-brand-pale">
      <aside className="w-56 bg-brand-navy text-white flex-shrink-0">
        <div className="p-4 border-b border-brand-purple">
          <Link href="/" className="text-sm text-gray-300 hover:text-white">&larr; Back to Site</Link>
          <h2 className="text-lg font-bold mt-1">Admin Panel</h2>
        </div>
        <nav className="p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded text-sm mb-1 transition ${
                pathname === item.href
                  ? 'bg-brand-magenta text-white'
                  : 'text-gray-300 hover:bg-brand-purple hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t border-brand-purple">
          <p className="text-xs text-gray-400 mb-2">Logged in as {user}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-300 hover:text-white"
          >
            Log Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
