'use client';

import { useState, useEffect } from 'react';
import type { Type } from '@/lib/types';

const emptyForm = { name_en: '', name_ko: '', sort_order: '' };

export default function TypesPage() {
  const [types, setTypes] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTypes();
  }, []);

  async function fetchTypes() {
    try {
      const res = await fetch('/api/types');
      setTypes(await res.json());
    } catch {
      // error
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name_en: form.name_en,
        name_ko: form.name_ko,
        sort_order: form.sort_order ? parseInt(form.sort_order) : null,
      };
      if (editingId) {
        await fetch(`/api/types/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setForm(emptyForm);
      setEditingId(null);
      await fetchTypes();
    } catch {
      alert('Failed to save type');
    }
    setSaving(false);
  }

  function startEdit(type: Type) {
    setEditingId(type.id);
    setForm({
      name_en: type.name_en,
      name_ko: type.name_ko,
      sort_order: type.sort_order ? String(type.sort_order) : '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this type?')) return;
    try {
      await fetch(`/api/types/${id}`, { method: 'DELETE' });
      await fetchTypes();
    } catch {
      alert('Failed to delete type');
    }
  }

  async function handleMove(id: number, direction: 'up' | 'down') {
    try {
      await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'types', id, direction }),
      });
      await fetchTypes();
    } catch {
      // error
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading types...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-4">Types</h1>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {editingId ? 'Edit Type' : 'Add Type'}
        </p>
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
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-magenta text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-gray-500 hover:text-brand-navy"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name EN</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name KO</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{type.name_en}</td>
                <td className="px-4 py-3 text-gray-600">{type.name_ko}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleMove(type.id, 'up')}
                      className="p-1 text-gray-400 hover:text-brand-navy rounded hover:bg-gray-100"
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMove(type.id, 'down')}
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
                  <button onClick={() => startEdit(type)} className="text-brand-purple hover:text-brand-magenta text-xs mr-3">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(type.id)} className="text-red-500 hover:text-red-700 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {types.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No types yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
