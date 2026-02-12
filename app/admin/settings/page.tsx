'use client';

import { useState, useEffect } from 'react';

interface SettingsForm {
  company_name_en: string;
  company_name_ko: string;
  company_address_en: string;
  company_address_ko: string;
  company_phone: string;
  company_fax: string;
  company_email: string;
}

const emptySettings: SettingsForm = {
  company_name_en: '',
  company_name_ko: '',
  company_address_en: '',
  company_address_ko: '',
  company_phone: '',
  company_fax: '',
  company_email: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsForm>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          company_name_en: data.company_name_en || '',
          company_name_ko: data.company_name_ko || '',
          company_address_en: data.company_address_en || '',
          company_address_ko: data.company_address_ko || '',
          company_phone: data.company_phone || '',
          company_fax: data.company_fax || '',
          company_email: data.company_email || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setMessage('Settings saved successfully.');
      } else {
        setMessage('Failed to save settings.');
      }
    } catch {
      setMessage('Failed to save settings.');
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwMessage('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPwError('New passwords do not match.');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }

    setPwSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password_change: {
            current_password: passwordForm.current_password,
            new_password: passwordForm.new_password,
          },
        }),
      });

      if (res.ok) {
        setPwMessage('Password updated successfully.');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const data = await res.json();
        setPwError(data.error || 'Failed to update password.');
      }
    } catch {
      setPwError('Failed to update password.');
    }
    setPwSaving(false);
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading settings...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-6">Settings</h1>

      {/* Company Info */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-brand-navy mb-4">Company Information</h2>

        {message && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded mb-4">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Company Name (English)</label>
              <input
                type="text"
                value={settings.company_name_en}
                onChange={(e) => setSettings({ ...settings, company_name_en: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Company Name (Korean)</label>
              <input
                type="text"
                value={settings.company_name_ko}
                onChange={(e) => setSettings({ ...settings, company_name_ko: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Address (English)</label>
              <input
                type="text"
                value={settings.company_address_en}
                onChange={(e) => setSettings({ ...settings, company_address_en: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Address (Korean)</label>
              <input
                type="text"
                value={settings.company_address_ko}
                onChange={(e) => setSettings({ ...settings, company_address_ko: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone</label>
              <input
                type="text"
                value={settings.company_phone}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fax</label>
              <input
                type="text"
                value={settings.company_fax}
                onChange={(e) => setSettings({ ...settings, company_fax: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-magenta text-white text-sm px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Password Change */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-brand-navy mb-4">Change Password</h2>

        {pwMessage && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded mb-4">
            {pwMessage}
          </div>
        )}
        {pwError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded mb-4">
            {pwError}
          </div>
        )}

        <div className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">New Password</label>
            <input
              type="password"
              required
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={pwSaving}
            className="bg-brand-navy text-white text-sm px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {pwSaving ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
