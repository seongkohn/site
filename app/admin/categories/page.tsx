'use client';

import { useState, useEffect } from 'react';
import type { Category } from '@/lib/types';

interface CategoryWithParent extends Category {
  parent_name_en?: string;
  parent_name_ko?: string;
}

const emptyForm = { name_en: '', name_ko: '', parent_id: '', sort_order: '' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      setCategories(await res.json());
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
        parent_id: form.parent_id ? parseInt(form.parent_id) : null,
        sort_order: form.sort_order ? parseInt(form.sort_order) : null,
      };

      if (editingId) {
        await fetch(`/api/categories/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setForm(emptyForm);
      setEditingId(null);
      await fetchCategories();
    } catch {
      alert('Failed to save category');
    }
    setSaving(false);
  }

  function startEdit(cat: CategoryWithParent) {
    setEditingId(cat.id);
    setForm({
      name_en: cat.name_en,
      name_ko: cat.name_ko,
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      sort_order: cat.sort_order ? String(cat.sort_order) : '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      await fetchCategories();
    } catch {
      alert('Failed to delete category');
    }
  }

  async function handleMove(id: number, direction: 'up' | 'down') {
    try {
      await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'categories', id, direction }),
      });
      await fetchCategories();
    } catch {
      // error
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

  const parentCategories = categories.filter((c) => !c.parent_id);

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-4">Categories</h1>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {editingId ? 'Edit Category' : 'Add Category'}
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
          <div>
            <label className="block text-xs text-gray-400 mb-1">Parent</label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="">-- None (top level) --</option>
              {parentCategories
                .filter((c) => c.id !== editingId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
            </select>
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
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Parent</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {cat.parent_id && <span className="text-gray-300 mr-1">&mdash;</span>}
                  {cat.name_en}
                </td>
                <td className="px-4 py-3 text-gray-600">{cat.name_ko}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{cat.parent_name_en || '--'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleMove(cat.id, 'up')}
                      className="p-1 text-gray-400 hover:text-brand-navy rounded hover:bg-gray-100"
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMove(cat.id, 'down')}
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
                  <button onClick={() => startEdit(cat)} className="text-brand-purple hover:text-brand-magenta text-xs mr-3">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
