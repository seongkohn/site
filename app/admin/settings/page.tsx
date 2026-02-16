'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';

interface SettingsForm {
  company_name_en: string;
  company_name_ko: string;
  company_address_en: string;
  company_address_ko: string;
  company_phone: string;
  company_fax: string;
  company_email: string;
  smtp_from: string;
  contact_recipients: string;
  leads_auto_delete_days: string;
  turnstile_enabled: string;
}

const emptySettings: SettingsForm = {
  company_name_en: '',
  company_name_ko: '',
  company_address_en: '',
  company_address_ko: '',
  company_phone: '',
  company_fax: '',
  company_email: '',
  smtp_from: '',
  contact_recipients: '',
  leads_auto_delete_days: '30',
  turnstile_enabled: 'false',
};

export default function SettingsPage() {
  const { lang } = useLanguage();
  const [settings, setSettings] = useState<SettingsForm>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageKey, setMessageKey] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessageKey, setPwMessageKey] = useState<string | null>(null);
  const [pwErrorKey, setPwErrorKey] = useState<string | null>(null);
  const [pwErrorText, setPwErrorText] = useState('');

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
          smtp_from: data.smtp_from || '',
          contact_recipients: data.contact_recipients || '',
          leads_auto_delete_days: data.leads_auto_delete_days || '30',
          turnstile_enabled: data.turnstile_enabled || 'false',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessageKey(null);
    setMessageText('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setMessageKey('settings.savedSuccess');
      } else {
        setMessageKey('settings.saveFailed');
      }
    } catch {
      setMessageKey('settings.saveFailed');
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErrorKey(null);
    setPwErrorText('');
    setPwMessageKey(null);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPwErrorKey('settings.newPasswordsNoMatch');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPwErrorKey('settings.newPasswordTooShort');
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
        setPwMessageKey('settings.passwordUpdated');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const data = await res.json();
        if (data.error) {
          setPwErrorText(data.error);
          setPwErrorKey(null);
        } else {
          setPwErrorKey('settings.passwordChangeFailed');
        }
      }
    } catch {
      setPwErrorKey('settings.passwordChangeFailed');
    }
    setPwSaving(false);
  }

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('settings.loadingSettings', lang)}</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-6">{ta('settings.title', lang)}</h1>

      {/* Company Info */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-brand-navy mb-4">{ta('settings.companyInfo', lang)}</h2>

        {(messageKey || messageText) && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded mb-4">
            {messageKey ? ta(messageKey, lang) : messageText}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{ta('settings.companyNameEn', lang)}</label>
              <input
                type="text"
                value={settings.company_name_en}
                onChange={(e) => setSettings({ ...settings, company_name_en: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{ta('settings.companyNameKo', lang)}</label>
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
              <label className="block text-xs text-gray-400 mb-1">{ta('settings.addressEn', lang)}</label>
              <input
                type="text"
                value={settings.company_address_en}
                onChange={(e) => setSettings({ ...settings, company_address_en: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{ta('settings.addressKo', lang)}</label>
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
              <label className="block text-xs text-gray-400 mb-1">{ta('settings.phone', lang)}</label>
              <input
                type="text"
                value={settings.company_phone}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{ta('settings.fax', lang)}</label>
              <input
                type="text"
                value={settings.company_fax}
                onChange={(e) => setSettings({ ...settings, company_fax: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{ta('settings.email', lang)}</label>
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
            {saving ? ta('common.saving', lang) : ta('settings.saveSettings', lang)}
          </button>
        </div>
      </form>

      {/* Email Notifications */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-brand-navy mb-4">{ta('settings.emailNotifications', lang)}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.notificationRecipients', lang)}</label>
            <input
              type="text"
              value={settings.contact_recipients}
              onChange={(e) => setSettings({ ...settings, contact_recipients: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
            <p className="text-xs text-gray-400 mt-1">{ta('settings.recipientsHelp', lang)}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.fromAddress', lang)}</label>
            <input
              type="email"
              value={settings.smtp_from}
              onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
              placeholder="noreply@seongkohn.com"
              className="w-full max-w-md border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
            <p className="text-xs text-gray-400 mt-1">{ta('settings.fromAddressHelp', lang)}</p>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-magenta text-white text-sm px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? ta('common.saving', lang) : ta('common.save', lang)}
          </button>
        </div>
      </form>

      {/* Lead Management */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-brand-navy mb-4">{ta('settings.leadManagement', lang)}</h2>
        <div className="max-w-xs">
          <label className="block text-xs text-gray-400 mb-1">{ta('settings.autoDeleteDays', lang)}</label>
          <input
            type="number"
            min="0"
            value={settings.leads_auto_delete_days}
            onChange={(e) => setSettings({ ...settings, leads_auto_delete_days: e.target.value })}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <p className="text-xs text-gray-400 mt-1">{ta('settings.autoDeleteHelp', lang)}</p>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-magenta text-white text-sm px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? ta('common.saving', lang) : ta('common.save', lang)}
          </button>
        </div>
      </form>

      {/* Turnstile / Spam Protection */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-brand-navy mb-4">{ta('settings.spamProtection', lang)}</h2>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.turnstile_enabled === 'true'}
              onChange={(e) => setSettings({ ...settings, turnstile_enabled: e.target.checked ? 'true' : 'false' })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-purple rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-magenta"></div>
          </label>
          <span className="text-sm text-gray-700">
            {settings.turnstile_enabled === 'true' ? ta('settings.enabled', lang) : ta('settings.disabled', lang)}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {ta('settings.turnstileHelp', lang)}
        </p>
        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-magenta text-white text-sm px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? ta('common.saving', lang) : ta('common.save', lang)}
          </button>
        </div>
      </form>

      {/* Password Change */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-brand-navy mb-4">{ta('settings.changePassword', lang)}</h2>

        {pwMessageKey && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded mb-4">
            {ta(pwMessageKey, lang)}
          </div>
        )}
        {(pwErrorKey || pwErrorText) && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded mb-4">
            {pwErrorKey ? ta(pwErrorKey, lang) : pwErrorText}
          </div>
        )}

        <div className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.currentPassword', lang)}</label>
            <input
              type="password"
              required
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.newPassword', lang)}</label>
            <input
              type="password"
              required
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.confirmNewPassword', lang)}</label>
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
            {pwSaving ? ta('settings.updating', lang) : ta('settings.changePassword', lang)}
          </button>
        </div>
      </form>
    </div>
  );
}
