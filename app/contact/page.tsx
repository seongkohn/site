'use client';

import { useState, FormEvent } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

export default function ContactPage() {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', organization: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      {/* Hero Banner */}
      <section
        className="py-20 text-center text-white"
        style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #85253B 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"          >
            {t('contact.title', lang)}
          </h1>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left: Contact Info */}
          <div>
            <h2
              className="text-2xl font-bold text-brand-navy mb-6"
            >
              {t('contact.getInTouch', lang)}
            </h2>

            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  {t('contact.address', lang)}
                </h3>
                <p className="text-gray-600">{t('contact.addressValue', lang)}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  {t('contact.phone', lang)}
                </h3>
                <p className="text-gray-600">{t('contact.phoneValue', lang)}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  {t('contact.email', lang)}
                </h3>
                <p className="text-gray-600">
                  <a
                    href={`mailto:${t('contact.emailValue', lang)}`}
                    className="text-brand-magenta hover:underline"
                  >
                    {t('contact.emailValue', lang)}
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <h2
              className="text-2xl font-bold text-brand-navy mb-6"
            >
              {t('contact.sendMessage', lang)}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contact.name', lang)}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contact.email', lang)}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contact.organization', lang)}
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contact.message', lang)}
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:border-transparent resize-vertical"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-brand-magenta text-white font-semibold py-2.5 px-6 rounded-md hover:bg-brand-magenta/90 transition disabled:opacity-50"
              >
                {status === 'sending' ? '...' : t('contact.send', lang)}
              </button>

              {status === 'success' && (
                <p className="text-green-600 text-sm font-medium">
                  {t('contact.success', lang)}
                </p>
              )}
              {status === 'error' && (
                <p className="text-red-600 text-sm font-medium">
                  {t('contact.error', lang)}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
