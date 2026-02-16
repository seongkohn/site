'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Category } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';
import { SortableList, SortableTableRow, DragHandle } from '@/components/admin/SortableList';

interface CategoryWithParent extends Category {
  parent_name_en?: string;
  parent_name_ko?: string;
}

const emptyForm = { name_en: '', name_ko: '', parent_id: '', sort_order: '' };

export default function CategoriesPage() {
  const { lang } = useLanguage();
  const [categories, setCategories] = useState<CategoryWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

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
      alert(ta('categories.saveFailed', lang));
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
    if (!confirm(ta('categories.confirmDelete', lang))) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      await fetchCategories();
    } catch {
      alert(ta('categories.deleteFailed', lang));
    }
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === categories.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(categories.map((c) => c.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`${selected.size} ${ta('categories.confirmBulkDelete', lang)}`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => fetch(`/api/categories/${id}`, { method: 'DELETE' })));
      setSelected(new Set());
      await fetchCategories();
    } catch {
      alert(ta('categories.bulkDeleteFailed', lang));
    }
    setDeleting(false);
  }

  const parentCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const childCategories = useMemo(() => categories.filter((c) => c.parent_id !== null), [categories]);

  // Build a display-ordered list: parent, then its children, then next parent, etc.
  const orderedCategories = useMemo(() => {
    const result: CategoryWithParent[] = [];
    for (const parent of parentCategories) {
      result.push(parent);
      for (const child of childCategories.filter((c) => c.parent_id === parent.id)) {
        result.push(child);
      }
    }
    // Add any orphaned children (parent_id doesn't match existing parent)
    for (const child of childCategories) {
      if (!result.includes(child)) result.push(child);
    }
    return result;
  }, [parentCategories, childCategories]);

  async function handleReorderLevel(orderedIds: number[], parentId: number | null) {
    // Optimistically reorder within this level
    const prev = categories;
    setCategories((cats) => {
      const updated = [...cats];
      const levelItems = orderedIds.map((id) => updated.find((c) => c.id === id)!);
      // Remove old positions and re-insert
      const withoutLevel = updated.filter((c) => !orderedIds.includes(c.id));
      // Find insertion point: before first item at next parent level or at end
      if (parentId === null) {
        // Rebuild full order: parents interleaved with children
        const result: CategoryWithParent[] = [];
        for (const p of levelItems) {
          result.push(p);
          result.push(...withoutLevel.filter((c) => c.parent_id === p.id));
        }
        // Add remaining items not yet included
        for (const c of withoutLevel) {
          if (!result.includes(c)) result.push(c);
        }
        return result;
      } else {
        // Re-insert children in new order after their parent
        const parentIndex = withoutLevel.findIndex((c) => c.id === parentId);
        const insertAt = parentIndex + 1;
        withoutLevel.splice(insertAt, 0, ...levelItems);
        return withoutLevel;
      }
    });

    try {
      await fetch('/api/reorder-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'categories', ids: orderedIds }),
      });
    } catch {
      setCategories(prev);
    }
  }

  // Group items for DnD: we need separate SortableList per level
  // For the flat table display, we show all categories but only allow drag within same level
  // We'll use separate sortable contexts per parent group

  function getParentOptions() {
    const options: { value: number; label: string }[] = [];
    for (const parent of parentCategories) {
      if (parent.id === editingId) continue;
      options.push({ value: parent.id, label: parent.name_en });
      for (const child of childCategories.filter((c) => c.parent_id === parent.id)) {
        if (child.id === editingId) continue;
        options.push({ value: child.id, label: `— ${child.name_en}` });
      }
    }
    return options;
  }

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('categories.loadingCategories', lang)}</div>;
  }

  // Group children by parent for per-level DnD
  const childrenByParent = new Map<number, CategoryWithParent[]>();
  for (const child of childCategories) {
    if (child.parent_id) {
      const group = childrenByParent.get(child.parent_id) || [];
      group.push(child);
      childrenByParent.set(child.parent_id, group);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-4">{ta('categories.title', lang)}</h1>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {editingId ? ta('categories.editCategory', lang) : ta('categories.addCategory', lang)}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('common.nameEn', lang)}</label>
            <input
              type="text"
              required
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('common.nameKo', lang)}</label>
            <input
              type="text"
              value={form.name_ko}
              onChange={(e) => setForm({ ...form, name_ko: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('categories.parent', lang)}</label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="">{ta('categories.noneTopLevel', lang)}</option>
              {getParentOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-magenta text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? ta('common.saving', lang) : editingId ? ta('common.update', lang) : ta('common.add', lang)}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-gray-500 hover:text-brand-navy"
            >
              {ta('common.cancel', lang)}
            </button>
          )}
        </div>
      </form>

      {/* Bulk delete */}
      {selected.size > 0 && (
        <div className="mb-4">
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="bg-red-500 text-white text-sm px-4 py-1.5 rounded hover:bg-red-600 transition disabled:opacity-50"
          >
            {deleting ? ta('common.deleting', lang) : `${ta('common.delete', lang)} (${selected.size})`}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={categories.length > 0 && selected.size === categories.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="w-10"></th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.nameEn', lang)}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.nameKo', lang)}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('categories.parent', lang)}</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.actions', lang)}</th>
            </tr>
          </thead>
          {/* Top-level categories with DnD */}
          <SortableList
            items={parentCategories}
            onReorder={(ids) => handleReorderLevel(ids, null)}
          >
            <tbody>
              {parentCategories.map((parent) => {
                const children = childrenByParent.get(parent.id) || [];
                return (
                  <SortableTableRow key={parent.id} id={parent.id}>
                    {({ listeners, attributes }) => (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(parent.id)}
                            onChange={() => toggleSelect(parent.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <DragHandle listeners={listeners} attributes={attributes} />
                        </td>
                        <td className="px-4 py-3">{parent.name_en}</td>
                        <td className="px-4 py-3 text-gray-600">{parent.name_ko}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">--</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => startEdit(parent)} className="text-brand-purple hover:text-brand-magenta text-xs mr-3">
                            {ta('common.edit', lang)}
                          </button>
                          <button onClick={() => handleDelete(parent.id)} className="text-red-500 hover:text-red-700 text-xs">
                            {ta('common.delete', lang)}
                          </button>
                        </td>
                      </>
                    )}
                  </SortableTableRow>
                );
              })}
            </tbody>
          </SortableList>
          {/* Subcategory groups - each parent's children as a separate sortable group */}
          {parentCategories.map((parent) => {
            const children = childrenByParent.get(parent.id);
            if (!children || children.length === 0) return null;
            return (
              <SortableList
                key={`children-${parent.id}`}
                items={children}
                onReorder={(ids) => handleReorderLevel(ids, parent.id)}
              >
                <tbody>
                  {children.map((cat) => (
                    <SortableTableRow key={cat.id} id={cat.id}>
                      {({ listeners, attributes }) => (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected.has(cat.id)}
                              onChange={() => toggleSelect(cat.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <DragHandle listeners={listeners} attributes={attributes} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-300 mr-1">{'\u2014'}</span>
                            {cat.name_en}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{cat.name_ko}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{cat.parent_name_en || parent.name_en}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => startEdit(cat)} className="text-brand-purple hover:text-brand-magenta text-xs mr-3">
                              {ta('common.edit', lang)}
                            </button>
                            <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 text-xs">
                              {ta('common.delete', lang)}
                            </button>
                          </td>
                        </>
                      )}
                    </SortableTableRow>
                  ))}
                </tbody>
              </SortableList>
            );
          })}
          {categories.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  {ta('categories.noCategories', lang)}
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
