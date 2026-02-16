'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import type { HeroSlide } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';
import { SortableTableRow, DragHandle } from '@/components/admin/SortableList';

const emptyForm = {
  title_en: '',
  title_ko: '',
  subtitle_en: '',
  subtitle_ko: '',
  image: '',
  link_url: '',
  text_color: 'light',
  text_align: 'left',
  is_active: 1,
  sort_order: '',
};

export default function HeroSlidesPage() {
  const { lang } = useLanguage();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/hero-slides?all=1')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setSlides(data);
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

  async function fetchSlides() {
    try {
      const res = await fetch('/api/hero-slides?all=1');
      setSlides(await res.json());
    } catch {
      // error
    }
    setLoading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, image: data.url }));
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
        title_en: form.title_en,
        title_ko: form.title_ko,
        subtitle_en: form.subtitle_en || null,
        subtitle_ko: form.subtitle_ko || null,
        image: form.image || null,
        link_url: form.link_url || null,
        text_color: form.text_color,
        text_align: form.text_align,
        is_active: form.is_active,
        sort_order: form.sort_order ? parseInt(form.sort_order) : 0,
      };

      if (editingId) {
        await fetch(`/api/hero-slides/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/hero-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setForm(emptyForm);
      setEditingId(null);
      await fetchSlides();
    } catch {
      alert(ta('heroSlides.saveFailed', lang));
    }
    setSaving(false);
  }

  function startEdit(slide: HeroSlide) {
    setEditingId(slide.id);
    setForm({
      title_en: slide.title_en,
      title_ko: slide.title_ko,
      subtitle_en: slide.subtitle_en || '',
      subtitle_ko: slide.subtitle_ko || '',
      image: slide.image || '',
      link_url: slide.link_url || '',
      text_color: slide.text_color,
      text_align: slide.text_align,
      is_active: slide.is_active,
      sort_order: String(slide.sort_order),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: number) {
    if (!confirm(ta('heroSlides.confirmDelete', lang))) return;
    try {
      await fetch(`/api/hero-slides/${id}`, { method: 'DELETE' });
      await fetchSlides();
    } catch {
      alert(ta('heroSlides.deleteFailed', lang));
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
    if (selected.size === slides.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(slides.map((s) => s.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`${selected.size} ${ta('heroSlides.confirmBulkDelete', lang)}`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => fetch(`/api/hero-slides/${id}`, { method: 'DELETE' })));
      setSelected(new Set());
      await fetchSlides();
    } catch {
      alert(ta('heroSlides.bulkDeleteFailed', lang));
    }
    setDeleting(false);
  }

  async function handleReorder(orderedIds: number[]) {
    const prev = slides;
    setSlides(orderedIds.map((id) => slides.find((s) => s.id === id)!));
    try {
      await fetch('/api/reorder-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'hero_slides', ids: orderedIds }),
      });
    } catch {
      setSlides(prev);
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

    const ids = slides.map((slide) => slide.id);
    if (!ids.includes(activeId) || !ids.includes(overId)) return;
    handleReorder(reorderIds(ids, activeId, overId));
  }

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('heroSlides.loadingSlides', lang)}</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-4">{ta('heroSlides.title', lang)}</h1>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {editingId ? ta('heroSlides.editSlide', lang) : ta('heroSlides.addSlide', lang)}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('heroSlides.titleEn', lang)}</label>
            <input
              type="text"
              required
              value={form.title_en}
              onChange={(e) => setForm({ ...form, title_en: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('heroSlides.titleKo', lang)}</label>
            <input
              type="text"
              value={form.title_ko}
              onChange={(e) => setForm({ ...form, title_ko: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('heroSlides.subtitleEn', lang)}</label>
            <input
              type="text"
              value={form.subtitle_en}
              onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('heroSlides.subtitleKo', lang)}</label>
            <input
              type="text"
              value={form.subtitle_ko}
              onChange={(e) => setForm({ ...form, subtitle_ko: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('heroSlides.image', lang)}</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="text-sm text-gray-500"
                disabled={uploading}
              />
              {uploading && <span className="text-xs text-gray-400">{ta('common.uploading', lang)}</span>}
            </div>
            {form.image && (
              <div className="mt-2 flex items-center gap-2">
                <Image src={form.image} alt="Preview" width={120} height={60} className="rounded border object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: '' })}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  {ta('common.remove', lang)}
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('heroSlides.linkUrl', lang)}</label>
            <input
              type="text"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="/products/some-product"
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('heroSlides.textColor', lang)}</label>
            <select
              value={form.text_color}
              onChange={(e) => setForm({ ...form, text_color: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="light">{ta('heroSlides.lightText', lang)}</option>
              <option value="dark">{ta('heroSlides.darkText', lang)}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('heroSlides.textAlignment', lang)}</label>
            <select
              value={form.text_align}
              onChange={(e) => setForm({ ...form, text_align: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="left">{ta('heroSlides.left', lang)}</option>
              <option value="right">{ta('heroSlides.right', lang)}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('heroSlides.active', lang)}</label>
            <select
              value={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: parseInt(e.target.value) })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value={1}>{ta('common.yes', lang)}</option>
              <option value={0}>{ta('common.no', lang)}</option>
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
                    checked={slides.length > 0 && selected.size === slides.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="w-10"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('heroSlides.image', lang)}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('heroSlides.style', lang)}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('heroSlides.active', lang)}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.actions', lang)}</th>
              </tr>
            </thead>
            <SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {slides.map((slide) => (
                  <SortableTableRow key={slide.id} id={slide.id}>
                    {({ listeners, attributes }) => (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(slide.id)}
                            onChange={() => toggleSelect(slide.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <DragHandle listeners={listeners} attributes={attributes} />
                        </td>
                        <td className="px-4 py-3">
                          {slide.image ? (
                            <Image src={slide.image} alt="" width={80} height={40} className="rounded border object-cover" />
                          ) : (
                            <span className="text-gray-300 text-xs">{ta('heroSlides.noImage', lang)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{slide.title_en}</div>
                          <div className="text-gray-500 text-xs">{slide.title_ko}</div>
                          {slide.subtitle_en && (
                            <div className="text-gray-400 text-xs mt-0.5">{slide.subtitle_en}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          <span className="inline-block mr-2">{slide.text_color === 'light' ? ta('heroSlides.light', lang) : ta('heroSlides.dark', lang)}</span>
                          <span>{slide.text_align === 'left' ? ta('heroSlides.left', lang) : ta('heroSlides.right', lang)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block w-2 h-2 rounded-full ${slide.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => startEdit(slide)} className="text-brand-purple hover:text-brand-magenta text-xs mr-3">
                            {ta('common.edit', lang)}
                          </button>
                          <button onClick={() => handleDelete(slide.id)} className="text-red-500 hover:text-red-700 text-xs">
                            {ta('common.delete', lang)}
                          </button>
                        </td>
                      </>
                    )}
                  </SortableTableRow>
                ))}
                {slides.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                      {ta('heroSlides.noSlides', lang)}
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
