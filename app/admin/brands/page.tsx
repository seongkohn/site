'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { Brand } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';
import { SortableTableRow, DragHandle } from '@/components/admin/SortableList';

const emptyForm = {
  name_en: '',
  name_ko: '',
  website: '',
  description_en: '',
  description_ko: '',
  logo: '',
  is_featured: true,
  sort_order: '',
};

export default function BrandsPage() {
  const { lang } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setBrands(data);
        }
      })
      .catch(() => {
        // no-op
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands');
      setBrands(await res.json());
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
        alert(ta('common.uploadFailed', lang));
      }
    } catch {
      alert(ta('common.uploadFailed', lang));
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        is_featured: form.is_featured ? 1 : 0,
        sort_order: form.sort_order ? parseInt(form.sort_order) : null,
      };

      if (editingId) {
        await fetch(`/api/brands/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setForm(emptyForm);
      setEditingId(null);
      await fetchBrands();
    } catch {
      alert(ta('brands.saveFailed', lang));
    }
    setSaving(false);
  }

  function startEdit(brand: Brand) {
    setEditingId(brand.id);
    setForm({
      name_en: brand.name_en,
      name_ko: brand.name_ko,
      website: brand.website || '',
      description_en: brand.description_en || '',
      description_ko: brand.description_ko || '',
      logo: brand.logo || '',
      is_featured: !!brand.is_featured,
      sort_order: brand.sort_order ? String(brand.sort_order) : '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: number) {
    if (!confirm(ta('brands.confirmDelete', lang))) return;
    try {
      await fetch(`/api/brands/${id}`, { method: 'DELETE' });
      await fetchBrands();
    } catch {
      alert(ta('brands.deleteFailed', lang));
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
    if (selected.size === brands.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(brands.map((b) => b.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`${selected.size} ${ta('brands.confirmBulkDelete', lang)}`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => fetch(`/api/brands/${id}`, { method: 'DELETE' })));
      setSelected(new Set());
      await fetchBrands();
    } catch {
      alert(ta('brands.bulkDeleteFailed', lang));
    }
    setDeleting(false);
  }

  async function handleReorder(orderedIds: number[]) {
    const prev = brands;
    setBrands(orderedIds.map((id) => brands.find((b) => b.id === id)!));
    try {
      await fetch('/api/reorder-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'brands', ids: orderedIds }),
      });
    } catch {
      setBrands(prev);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function reorderIds(ids: number[], activeId: number, overId: number): number[] {
    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return ids;

    const next = [...ids];
    next.splice(oldIndex, 1);
    next.splice(newIndex, 0, activeId);
    return next;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);
    if (Number.isNaN(activeId) || Number.isNaN(overId)) return;

    const ids = brands.map((brand) => brand.id);
    if (!ids.includes(activeId) || !ids.includes(overId)) return;
    handleReorder(reorderIds(ids, activeId, overId));
  }

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('brands.loadingBrands', lang)}</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-4">{ta('brands.title', lang)}</h1>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {editingId ? ta('brands.editBrand', lang) : ta('brands.addBrand', lang)}
        </p>
        <div className="space-y-3">
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
              <label className="block text-xs text-gray-400 mb-1">{ta('brands.website', lang)}</label>
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
              <label className="block text-xs text-gray-400 mb-1">{ta('brands.descriptionEn', lang)}</label>
              <textarea
                rows={2}
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{ta('brands.descriptionKo', lang)}</label>
              <textarea
                rows={2}
                value={form.description_ko}
                onChange={(e) => setForm({ ...form, description_ko: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('brands.logo', lang)}</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-brand-pale file:text-brand-navy"
              />
              {uploading && <span className="text-xs text-gray-400">{ta('common.uploading', lang)}</span>}
              {form.logo && (
                <span className="flex items-center gap-2">
                  <Image src={form.logo} alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
                  <button type="button" onClick={() => setForm({ ...form, logo: '' })} className="text-xs text-red-500">
                    {ta('common.remove', lang)}
                  </button>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="rounded border-gray-300"
              />
              {ta('brands.showOnWebsite', lang)}
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-magenta text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? ta('common.saving', lang) : editingId ? ta('common.update', lang) : ta('common.add', lang)}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:text-brand-navy">
                {ta('common.cancel', lang)}
              </button>
            )}
          </div>
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={brands.length > 0 && selected.size === brands.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="w-10"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('brands.logo', lang)}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.nameEn', lang)}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.nameKo', lang)}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('brands.website', lang)}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('productForm.featured', lang)}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.actions', lang)}</th>
              </tr>
            </thead>
            <SortableContext items={brands.map((brand) => brand.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {brands.map((brand) => (
                  <SortableTableRow key={brand.id} id={brand.id}>
                    {({ listeners, attributes }) => (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(brand.id)}
                            onChange={() => toggleSelect(brand.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <DragHandle listeners={listeners} attributes={attributes} />
                        </td>
                        <td className="px-4 py-3">
                          {brand.logo ? (
                            <Image src={brand.logo} alt={brand.name_en} width={32} height={32} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-gray-300 text-xs">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{brand.name_en}</td>
                        <td className="px-4 py-3 text-gray-600">{brand.name_ko}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{brand.website || '--'}</td>
                        <td className="px-4 py-3 text-center">
                          {brand.is_featured ? (
                            <span className="text-green-600 text-xs font-medium">{ta('common.yes', lang)}</span>
                          ) : (
                            <span className="text-gray-400 text-xs">{ta('common.no', lang)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => startEdit(brand)} className="text-brand-purple hover:text-brand-magenta text-xs mr-3">
                            {ta('common.edit', lang)}
                          </button>
                          <button onClick={() => handleDelete(brand.id)} className="text-red-500 hover:text-red-700 text-xs">
                            {ta('common.delete', lang)}
                          </button>
                        </td>
                      </>
                    )}
                  </SortableTableRow>
                ))}
                {brands.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                      {ta('brands.noBrands', lang)}
                    </td>
                  </tr>
                )}
              </tbody>
            </SortableContext>
          </table>
        </div>
      </DndContext>
    </div>
  );
}
