'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { HeroSlide } from '@/lib/types';

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
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSlides();
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
      alert('Failed to save slide');
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
    if (!confirm('Delete this slide?')) return;
    try {
      await fetch(`/api/hero-slides/${id}`, { method: 'DELETE' });
      await fetchSlides();
    } catch {
      alert('Failed to delete slide');
    }
  }

  async function handleMove(id: number, direction: 'up' | 'down') {
    try {
      await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'hero_slides', id, direction }),
      });
      await fetchSlides();
    } catch {
      // error
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading hero slides...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-4">Hero Slides</h1>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {editingId ? 'Edit Slide' : 'Add Slide'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title EN *</label>
            <input
              type="text"
              required
              value={form.title_en}
              onChange={(e) => setForm({ ...form, title_en: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title KO *</label>
            <input
              type="text"
              required
              value={form.title_ko}
              onChange={(e) => setForm({ ...form, title_ko: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subtitle EN</label>
            <input
              type="text"
              value={form.subtitle_en}
              onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subtitle KO</label>
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
            <label className="block text-xs text-gray-400 mb-1">Image</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="text-sm text-gray-500"
                disabled={uploading}
              />
              {uploading && <span className="text-xs text-gray-400">Uploading...</span>}
            </div>
            {form.image && (
              <div className="mt-2 flex items-center gap-2">
                <Image src={form.image} alt="Preview" width={120} height={60} className="rounded border object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: '' })}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Link URL (optional)</label>
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
            <label className="block text-xs text-gray-400 mb-1">Text Color</label>
            <select
              value={form.text_color}
              onChange={(e) => setForm({ ...form, text_color: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="light">Light (white text)</option>
              <option value="dark">Dark (black text)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Text Alignment</label>
            <select
              value={form.text_align}
              onChange={(e) => setForm({ ...form, text_align: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Active</label>
            <select
              value={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: parseInt(e.target.value) })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value={1}>Yes</option>
              <option value={0}>No</option>
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
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Style</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((slide) => (
              <tr key={slide.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {slide.image ? (
                    <Image src={slide.image} alt="" width={80} height={40} className="rounded border object-cover" />
                  ) : (
                    <span className="text-gray-300 text-xs">No image</span>
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
                  <span className="inline-block mr-2">{slide.text_color === 'light' ? 'Light' : 'Dark'}</span>
                  <span>{slide.text_align === 'left' ? 'Left' : 'Right'}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${slide.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleMove(slide.id, 'up')}
                      className="p-1 text-gray-400 hover:text-brand-navy rounded hover:bg-gray-100"
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMove(slide.id, 'down')}
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
                  <button onClick={() => startEdit(slide)} className="text-brand-purple hover:text-brand-magenta text-xs mr-3">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(slide.id)} className="text-red-500 hover:text-red-700 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {slides.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No hero slides yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
