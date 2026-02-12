'use client';

import { useState, useEffect } from 'react';
import type { Lead } from '@/lib/types';

interface LeadWithProduct extends Lead {
  product_name_en?: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch('/api/leads');
      setLeads(await res.json());
    } catch {
      // error
    }
    setLoading(false);
  }

  async function markAsRead(id: number) {
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: 1 }),
      });
      setLeads(leads.map((l) => (l.id === id ? { ...l, is_read: 1 } : l)));
    } catch {
      alert('Failed to update lead');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this lead?')) return;
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      setLeads(leads.filter((l) => l.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      alert('Failed to delete lead');
    }
  }

  function toggleExpand(lead: LeadWithProduct) {
    if (expandedId === lead.id) {
      setExpandedId(null);
    } else {
      setExpandedId(lead.id);
      if (!lead.is_read) {
        markAsRead(lead.id);
      }
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading leads...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-4">Leads</h1>

      {leads.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
          No leads yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <>
                  <tr
                    key={lead.id}
                    onClick={() => toggleExpand(lead)}
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !lead.is_read ? 'bg-brand-pale/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={!lead.is_read ? 'font-semibold' : ''}>{lead.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.company || '--'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {lead.is_read ? (
                        <span className="text-xs text-gray-400">Read</span>
                      ) : (
                        <span className="inline-block bg-brand-magenta text-white text-xs px-2 py-0.5 rounded">
                          New
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {!lead.is_read && (
                        <button
                          onClick={() => markAsRead(lead.id)}
                          className="text-brand-purple hover:text-brand-magenta text-xs mr-3"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedId === lead.id && (
                    <tr key={`${lead.id}-detail`} className="border-b border-gray-100">
                      <td colSpan={6} className="px-4 py-4 bg-gray-50">
                        <div className="space-y-2 text-sm">
                          {lead.phone && (
                            <div>
                              <span className="text-xs text-gray-400">Phone:</span>{' '}
                              <span className="text-gray-700">{lead.phone}</span>
                            </div>
                          )}
                          {lead.product_name_en && (
                            <div>
                              <span className="text-xs text-gray-400">Product:</span>{' '}
                              <span className="text-gray-700">{lead.product_name_en}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-xs text-gray-400">Message:</span>
                            <p className="mt-1 text-gray-700 whitespace-pre-wrap">{lead.message}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
