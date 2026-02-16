'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Turnstile from '@/components/Turnstile';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const handleTurnstile = useCallback((token: string) => setTurnstileToken(token), []);
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    try {
      // Check if setup is needed first
      const setupRes = await fetch('/api/auth/setup');
      if (setupRes.ok) {
        const setupData = await setupRes.json();
        if (setupData.needsSetup) {
          setNeedsSetup(true);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/auth/check');
      if (res.ok) {
        const data = await res.json();
        setUser(data.username);
      }
    } catch {
      // not authenticated
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkAuth]);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    setErrorText('');

    if (setupForm.password !== setupForm.confirmPassword) {
      setErrorKey('auth.passwordsNoMatch');
      return;
    }
    if (setupForm.password.length < 8) {
      setErrorKey('auth.passwordTooShort');
      return;
    }
    if (setupForm.username.length < 3) {
      setErrorKey('auth.usernameTooShort');
      return;
    }

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: setupForm.username, password: setupForm.password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.username);
        setNeedsSetup(false);
      } else {
        const data = await res.json();
        if (data.error) {
          setErrorText(data.error);
          setErrorKey(null);
        } else {
          setErrorKey('auth.setupFailed');
        }
      }
    } catch {
      setErrorKey('auth.setupFailed');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    setErrorText('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginForm, turnstileToken }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.username);
      } else {
        setErrorKey('auth.invalidCredentials');
      }
    } catch {
      setErrorKey('auth.loginFailed');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-pale">
        <div className="text-brand-purple">{ta('common.loading', lang)}</div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-pale">
        <form onSubmit={handleSetup} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold text-brand-navy mb-2 text-center">{ta('auth.adminSetup', lang)}</h1>
          <p className="text-sm text-gray-500 mb-6 text-center">{ta('auth.setupDesc', lang)}</p>
          {(errorKey || errorText) && <p className="text-red-600 text-sm mb-4">{errorKey ? ta(errorKey, lang) : errorText}</p>}
          <input
            type="text"
            placeholder={ta('auth.username', lang)}
            value={setupForm.username}
            onChange={(e) => setSetupForm({ ...setupForm, username: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <input
            type="password"
            placeholder={ta('auth.passwordPlaceholder', lang)}
            value={setupForm.password}
            onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <input
            type="password"
            placeholder={ta('auth.confirmPassword', lang)}
            value={setupForm.confirmPassword}
            onChange={(e) => setSetupForm({ ...setupForm, confirmPassword: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <button
            type="submit"
            className="w-full bg-brand-magenta text-white py-2 rounded hover:opacity-90 transition"
          >
            {ta('auth.createAccount', lang)}
          </button>
        </form>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-pale">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold text-brand-navy mb-6 text-center">{ta('auth.adminLogin', lang)}</h1>
          {(errorKey || errorText) && <p className="text-red-600 text-sm mb-4">{errorKey ? ta(errorKey, lang) : errorText}</p>}
          <input
            type="text"
            placeholder={ta('auth.username', lang)}
            value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <input
            type="password"
            placeholder={ta('auth.password', lang)}
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <Turnstile onVerify={handleTurnstile} />
          <button
            type="submit"
            disabled={!turnstileToken}
            className="w-full bg-brand-magenta text-white py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {ta('auth.logIn', lang)}
          </button>
        </form>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: ta('sidebar.dashboard', lang) },
    { href: '/admin/products', label: ta('sidebar.products', lang) },
    { href: '/admin/categories', label: ta('sidebar.categories', lang) },
    { href: '/admin/types', label: ta('sidebar.types', lang) },
    { href: '/admin/brands', label: ta('sidebar.brands', lang) },
    { href: '/admin/featured', label: ta('sidebar.featured', lang) },
    { href: '/admin/hero-slides', label: ta('sidebar.heroSlides', lang) },
    { href: '/admin/about', label: ta('sidebar.aboutPage', lang) },
    { href: '/admin/leads', label: ta('sidebar.leads', lang) },
    { href: '/admin/settings', label: ta('sidebar.settings', lang) },
  ];

  return (
    <div className="min-h-screen flex bg-brand-pale">
      <aside className="w-56 bg-brand-navy text-white flex-shrink-0">
        <div className="p-4 border-b border-brand-purple">
          <Link href="/" className="text-sm text-gray-300 hover:text-white">{ta('sidebar.backToSite', lang)}</Link>
          <h2 className="text-lg font-bold mt-1">{ta('sidebar.adminPanel', lang)}</h2>
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
          <p className="text-xs text-gray-400 mb-2">{ta('sidebar.loggedInAs', lang)} {user}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-300 hover:text-white"
          >
            {ta('sidebar.logOut', lang)}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
