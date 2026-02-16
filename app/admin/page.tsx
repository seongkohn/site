'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';

interface Stats {
  totalProducts: number;
  publishedProducts: number;
  totalLeads: number;
  unreadLeads: number;
}

export default function AdminDashboard() {
  const { lang } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('dashboard.loadingDashboard', lang)}</div>;
  }

  const cards = [
    { label: ta('dashboard.totalProducts', lang), value: stats?.totalProducts ?? 0, color: 'border-brand-purple' },
    { label: ta('dashboard.publishedProducts', lang), value: stats?.publishedProducts ?? 0, color: 'border-green-400' },
    { label: ta('dashboard.totalLeads', lang), value: stats?.totalLeads ?? 0, color: 'border-brand-navy' },
    { label: ta('dashboard.unreadLeads', lang), value: stats?.unreadLeads ?? 0, color: 'border-brand-magenta' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-6">{ta('dashboard.title', lang)}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-lg border-l-4 ${card.color} border border-gray-200 p-5`}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-brand-navy">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
