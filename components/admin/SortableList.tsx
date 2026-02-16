'use client';

import React from 'react';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

/** Drag handle icon (6-dot grip) */
export function DragHandle({ listeners, attributes }: { listeners?: Record<string, Function>; attributes?: Record<string, unknown> }) {
  return (
    <button
      type="button"
      className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing rounded hover:bg-gray-100 touch-none"
      {...attributes}
      {...listeners}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
      </svg>
    </button>
  );
}

/** Wrapper for a sortable table row */
export function SortableTableRow({
  id,
  children,
}: {
  id: number;
  children: (props: { listeners: Record<string, Function>; attributes: Record<string, unknown> }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {children({ listeners: listeners as unknown as Record<string, Function>, attributes: attributes as unknown as Record<string, unknown> })}
    </tr>
  );
}

/** Wrapper for a sortable div item */
export function SortableItem({
  id,
  children,
}: {
  id: number;
  children: (props: { listeners: Record<string, Function>; attributes: Record<string, unknown> }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ listeners: listeners as unknown as Record<string, Function>, attributes: attributes as unknown as Record<string, unknown> })}
    </div>
  );
}

/** Reusable DnD context wrapper. Call onReorder with the new ordered array of ids. */
export function SortableList({
  items,
  onReorder,
  children,
}: {
  items: { id: number }[];
  onReorder: (orderedIds: number[]) => void;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = items.map((item) => item.id);
    const oldIndex = ids.indexOf(active.id as number);
    const newIndex = ids.indexOf(over.id as number);
    if (oldIndex === -1 || newIndex === -1) return;

    const newIds = [...ids];
    newIds.splice(oldIndex, 1);
    newIds.splice(newIndex, 0, active.id as number);
    onReorder(newIds);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
