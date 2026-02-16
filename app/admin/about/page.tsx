'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';
import {
  createEmptyAboutTimelineEntry,
  defaultAboutTimeline,
  parseAboutTimeline,
  serializeAboutTimeline,
  type AboutTimelineEntry,
} from '@/lib/about-timeline';
import { SortableTableRow, DragHandle } from '@/components/admin/SortableList';

type TimelineForm = Omit<AboutTimelineEntry, 'id'>;

function newTimelineForm(): TimelineForm {
  const { id, ...rest } = createEmptyAboutTimelineEntry();
  void id;
  return rest;
}

function normalizeForm(form: TimelineForm): TimelineForm {
  return {
    year: form.year.trim(),
    title_en: form.title_en.trim(),
    title_ko: form.title_ko.trim(),
    description_en: form.description_en.trim(),
    description_ko: form.description_ko.trim(),
    image: (form.image || '').trim(),
    image_alt_en: (form.image_alt_en || '').trim(),
    image_alt_ko: (form.image_alt_ko || '').trim(),
  };
}

function validateForm(form: TimelineForm): boolean {
  return !!(
    form.year.trim() &&
    form.title_en.trim() &&
    form.title_ko.trim() &&
    form.description_en.trim() &&
    form.description_ko.trim()
  );
}

export default function AdminAboutPage() {
  const { lang } = useLanguage();
  const editorPanelRef = useRef<HTMLFormElement | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<AboutTimelineEntry[]>(defaultAboutTimeline);
  const [form, setForm] = useState<TimelineForm>(newTimelineForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messageKey, setMessageKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setTimelineEntries(parseAboutTimeline(data.about_timeline_json));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm(newTimelineForm());
    setEditingId(null);
  }

  function startEdit(entry: AboutTimelineEntry) {
    setEditingId(entry.id);
    setForm({
      year: entry.year,
      title_en: entry.title_en,
      title_ko: entry.title_ko,
      description_en: entry.description_en,
      description_ko: entry.description_ko,
      image: entry.image || '',
      image_alt_en: entry.image_alt_en || '',
      image_alt_ko: entry.image_alt_ko || '',
    });

    requestAnimationFrame(() => {
      editorPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function removeEntry(id: string) {
    setTimelineEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (editingId === id) {
      resetForm();
    }
  }

  function applyFormEntry(e: React.FormEvent) {
    e.preventDefault();
    setMessageKey(null);

    if (!validateForm(form)) {
      alert(lang === 'ko' ? '연도, 제목, 설명(영문/한글)을 입력해 주세요.' : 'Please fill year, title, and description in both languages.');
      return;
    }

    const normalized = normalizeForm(form);

    if (editingId) {
      setTimelineEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingId
            ? {
              ...entry,
              ...normalized,
            }
            : entry,
        ),
      );
    } else {
      const newId = createEmptyAboutTimelineEntry().id;
      setTimelineEntries((prev) => [...prev, { id: newId, ...normalized }]);
    }

    resetForm();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessageKey(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            about_timeline_json: serializeAboutTimeline(timelineEntries),
          },
        }),
      });

      setMessageKey(res.ok ? 'aboutPage.saveSuccess' : 'aboutPage.saveFailed');
    } catch {
      setMessageKey('aboutPage.saveFailed');
    }

    setSaving(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        alert(ta('common.uploadFailed', lang));
        return;
      }

      const data = await res.json();
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch {
      alert(ta('common.uploadFailed', lang));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleReorder(orderedIds: UniqueIdentifier[]) {
    setTimelineEntries((prev) => {
      const entryById = new Map(prev.map((entry) => [entry.id, entry]));
      return orderedIds
        .map((id) => entryById.get(String(id)))
        .filter((entry): entry is AboutTimelineEntry => Boolean(entry));
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function reorderIds(ids: string[], activeId: string, overId: string): string[] {
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

    const activeId = String(active.id);
    const overId = String(over.id);
    const ids = timelineEntries.map((entry) => entry.id);
    if (!ids.includes(activeId) || !ids.includes(overId)) return;
    handleReorder(reorderIds(ids, activeId, overId));
  }

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('settings.loadingSettings', lang)}</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-2">{ta('aboutPage.title', lang)}</h1>
      <p className="text-sm text-gray-500 mb-6">{ta('aboutPage.description', lang)}</p>

      {(messageKey || null) && (
        <div
          className={`text-sm px-3 py-2 rounded mb-4 border ${
            messageKey === 'aboutPage.saveSuccess'
              ? 'text-green-600 bg-green-50 border-green-200'
              : 'text-red-600 bg-red-50 border-red-200'
          }`}
        >
          {ta(messageKey, lang)}
        </div>
      )}

      <form ref={editorPanelRef} onSubmit={applyFormEntry} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-brand-navy mb-4">
          {editingId ? ta('common.edit', lang) : ta('common.add', lang)} {ta('settings.timelineEntry', lang)}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.timelineYear', lang)}</label>
            <input
              type="text"
              value={form.year}
              onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.timelineTitleEn', lang)}</label>
            <input
              type="text"
              value={form.title_en}
              onChange={(e) => setForm((prev) => ({ ...prev, title_en: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.timelineTitleKo', lang)}</label>
            <input
              type="text"
              value={form.title_ko}
              onChange={(e) => setForm((prev) => ({ ...prev, title_ko: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.timelineDescriptionEn', lang)}</label>
            <textarea
              rows={3}
              value={form.description_en}
              onChange={(e) => setForm((prev) => ({ ...prev, description_en: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.timelineDescriptionKo', lang)}</label>
            <textarea
              rows={3}
              value={form.description_ko}
              onChange={(e) => setForm((prev) => ({ ...prev, description_ko: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.timelineImage', lang)}</label>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? ta('common.uploading', lang) : ta('productForm.uploadImage', lang)}
              </label>
              {form.image && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  {ta('common.remove', lang)}
                </button>
              )}
            </div>
            {form.image && (
              <div className="mt-2">
                <Image src={form.image} alt="" width={180} height={100} className="rounded border object-cover" />
              </div>
            )}
            {!form.image && (
              <p className="mt-2 text-xs text-gray-400">
                {lang === 'ko' ? '업로드된 이미지가 없습니다.' : 'No uploaded image selected.'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.timelineImageAltEn', lang)}</label>
            <input
              type="text"
              value={form.image_alt_en || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, image_alt_en: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{ta('settings.timelineImageAltKo', lang)}</label>
            <input
              type="text"
              value={form.image_alt_ko || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, image_alt_ko: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="bg-brand-magenta text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
          >
            {editingId ? ta('common.update', lang) : ta('common.add', lang)}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-brand-navy"
            >
              {ta('common.cancel', lang)}
            </button>
          )}
        </div>
      </form>

      <form onSubmit={handleSave} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {ta('settings.aboutTimeline', lang)}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-magenta text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? ta('common.saving', lang) : ta('common.save', lang)}
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10" />
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('settings.timelineImage', lang)}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('settings.timelineYear', lang)}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.actions', lang)}</th>
              </tr>
            </thead>

            <SortableContext items={timelineEntries.map((entry) => entry.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {timelineEntries.map((entry) => (
                  <SortableTableRow key={entry.id} id={entry.id}>
                    {({ listeners, attributes }) => (
                      <>
                        <td className="px-2 py-3 text-center">
                          <DragHandle listeners={listeners} attributes={attributes} />
                        </td>
                        <td className="px-4 py-3">
                          {entry.image ? (
                            <Image src={entry.image} alt="" width={80} height={44} className="rounded border object-cover" />
                          ) : (
                            <span className="text-xs text-gray-300">{ta('heroSlides.noImage', lang)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{entry.year}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{entry.title_en}</div>
                          <div className="text-xs text-gray-500">{entry.title_ko}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => startEdit(entry)}
                            className="text-brand-purple hover:text-brand-magenta text-xs mr-3"
                          >
                            {ta('common.edit', lang)}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            {ta('common.delete', lang)}
                          </button>
                        </td>
                      </>
                    )}
                  </SortableTableRow>
                ))}

                {timelineEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                      {ta('settings.noTimelineEntries', lang)}
                    </td>
                  </tr>
                )}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </form>
    </div>
  );
}
