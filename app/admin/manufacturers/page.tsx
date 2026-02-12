'use client';

import { useState, useEffect } from 'react';
import type { Manufacturer } from '@/lib/types';

const emptyForm = {
  name_en: '',
  name_ko: '',
  website: '',
  description_en: '',
  description_ko: '',
  logo: '',
  sort_order: '',
};

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchManufacturers();
  }, []);

  async function fetchManufacturers() {
    try {
      const res = await fetch('/api/manufacturers');
      setManufacturers(await res.json());
    } catch {
      // error
    }
    setLoading(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, logo: data.url }));
      } else {
        alert('Upload failed');
      }
    } catch {
      alert('Upload failed');
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        sort_order: form.sort_order ? parseInt(form.sort_order) : null,
      };

      if (editingId) {
        await fetch(`/api/manufacturers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/manufacturers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setForm(emptyForm);
      setEditingId(null);
      await fetchManufacturers();
    } catch {
      alert('Failed to save manufacturer');
    }
    setSaving(false);
  }

  function startEdit(mfr: Manufacturer) {
    setEditingId(mfr.id);
    setForm({
      name_en: mfr.name_en,
      name_ko: mfr.name_ko,
      website: mfr.website || '',
      description_en: mfr.description_en || '',
      description_ko: mfr.description_ko || '',
      logo: mfr.logo || '',
      sort_order: mfr.sort_order ? String(mfr.sort_order) : '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this manufacturer?')) return;
    try {
      await fetch(`/api/manufacturers/${id}`, { method: 'DELETE' });
      await fetchManufacturers();
    } catch {
      alert('Failed to delete manufacturer');
    }
  }

  async function handleMove(id: number, direction: 'up' | 'down') {
    try {
      await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'manufacturers', id, direction }),
      });
      await fetchManufacturers();
    } catch {
      // error
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading brands...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-4">Brands</h1>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {editingId ? 'Edit Brand' : 'Add Brand'}
        </p>
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name EN</label>
              <input
                type="text"
                required
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name KO</label>
              <input
                type="text"
                required
                value={form.name_ko}
                onChange={(e) => setForm({ ...form, name_ko: e.target.value })}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://"
                className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description EN</label>
              <textarea
                rows={2}
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description KO</label>
              <textarea
                rows={2}
                value={form.description_ko}
                onChange={(e) => setForm({ ...form, description_ko: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-brand-pale file:text-brand-navy"
              />
              {uploading && <span className="text-xs text-gray-400">Uploading...</span>}
              {form.logo && (
                <span className="flex items-center gap-2">
                  <img src={form.logo} alt="Logo" className="w-8 h-8 object-contain" />
                  <button type="button" onClick={() => setForm({ ...form, logo: '' })} className="text-xs text-red-500">
                    Remove
                  </button>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-magenta text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:text-brand-navy">
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Logo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name EN</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name KO</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Website</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {manufacturers.map((mfr) => (
              <tr key={mfr.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {mfr.logo ? (
                    <img src={mfr.logo} alt={mfr.name_en} className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-gray-300 text-xs">--</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{mfr.name_en}</td>
                <td className="px-4 py-3 text-gray-600">{mfr.name_ko}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{mfr.website || '--'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleMove(mfr.id, 'up')}
                      className="p-1 text-gray-400 hover:text-brand-navy rounded hover:bg-gray-100"
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMove(mfr.id, 'down')}
                      className="p-1 text-gray-400 hover:text-brand-navy rounded hover:bg-gray-100"
                      title="Move down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(mfr)} className="text-brand-purple hover:text-brand-magenta text-xs mr-3">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(mfr.id)} className="text-red-500 hover:text-red-700 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {manufacturers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No manufacturers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
