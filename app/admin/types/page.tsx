'use client';

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
import type { Type } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';
import { SortableTableRow, DragHandle } from '@/components/admin/SortableList';

const emptyForm = { name_en: '', name_ko: '', sort_order: '' };

export default function TypesPage() {
  const { lang } = useLanguage();
  const [types, setTypes] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/types')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setTypes(data);
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
      alert(ta('types.saveFailed', lang));
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
    if (!confirm(ta('types.confirmDelete', lang))) return;
    try {
      await fetch(`/api/types/${id}`, { method: 'DELETE' });
      await fetchTypes();
    } catch {
      alert(ta('types.deleteFailed', lang));
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
    if (selected.size === types.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(types.map((t) => t.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`${selected.size} ${ta('types.confirmBulkDelete', lang)}`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => fetch(`/api/types/${id}`, { method: 'DELETE' })));
      setSelected(new Set());
      await fetchTypes();
    } catch {
      alert(ta('types.bulkDeleteFailed', lang));
    }
    setDeleting(false);
  }

  async function handleReorder(orderedIds: number[]) {
    const prev = types;
    setTypes(orderedIds.map((id) => types.find((t) => t.id === id)!));
    try {
      await fetch('/api/reorder-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'types', ids: orderedIds }),
      });
    } catch {
      setTypes(prev);
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

    const ids = types.map((type) => type.id);
    if (!ids.includes(activeId) || !ids.includes(overId)) return;
    handleReorder(reorderIds(ids, activeId, overId));
  }

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('types.loadingTypes', lang)}</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy mb-4">{ta('types.title', lang)}</h1>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {editingId ? ta('types.editType', lang) : ta('types.addType', lang)}
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
                    checked={types.length > 0 && selected.size === types.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="w-10"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.nameEn', lang)}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.nameKo', lang)}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.actions', lang)}</th>
              </tr>
            </thead>
            <SortableContext items={types.map((type) => type.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {types.map((type) => (
                  <SortableTableRow key={type.id} id={type.id}>
                    {({ listeners, attributes }) => (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(type.id)}
                            onChange={() => toggleSelect(type.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <DragHandle listeners={listeners} attributes={attributes} />
                        </td>
                        <td className="px-4 py-3">{type.name_en}</td>
                        <td className="px-4 py-3 text-gray-600">{type.name_ko}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => startEdit(type)} className="text-brand-purple hover:text-brand-magenta text-xs mr-3">
                            {ta('common.edit', lang)}
                          </button>
                          <button onClick={() => handleDelete(type.id)} className="text-red-500 hover:text-red-700 text-xs">
                            {ta('common.delete', lang)}
                          </button>
                        </td>
                      </>
                    )}
                  </SortableTableRow>
                ))}
                {types.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                      {ta('types.noTypes', lang)}
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
