'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, ArrowRight, ArrowLeft, Tag, User } from 'lucide-react';
import { TaskCard } from '@/utils/sharedState';
import { Role } from '@/config/roles';
import { NewTaskInput } from '@/components/ui/TaskCalendarFeed';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNotifications } from '@/contexts/NotificationContext';

interface KanbanBoardProps {
  cards: TaskCard[];
  role: Role;
  onMarkDone: (id: number) => void;
  onDismiss: (id: number) => void;
  onAddTask?: (input: NewTaskInput) => Promise<void> | void;
}

type KanbanColumnId = 'todo' | 'in_progress' | 'review' | 'done';

interface ColumnDef {
  id: KanbanColumnId;
  title: string;
  badgeBg: string;
  borderColor: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'todo', title: 'To Do', badgeBg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300', borderColor: 'border-zinc-300 dark:border-zinc-700' },
  { id: 'in_progress', title: 'In Progress', badgeBg: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300', borderColor: 'border-blue-500/40' },
  { id: 'review', title: 'Review / Handoff', badgeBg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300', borderColor: 'border-amber-500/40' },
  { id: 'done', title: 'Completed', badgeBg: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300', borderColor: 'border-green-500/40' },
];

// Draggable card component
function DraggableCard({
  card,
  column,
  onMoveTask,
}: {
  card: TaskCard;
  column: ColumnDef;
  onMoveTask: (cardId: number, targetCol: KanbanColumnId) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `card-${card.id}`,
    data: {
      type: 'card',
      card,
      columnId: column.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow group flex flex-col gap-2 ${
        isDragging ? 'ring-2 ring-brand-red ring-offset-2' : ''
      }`}
    >
      {/* Drag Handle & Card Content */}
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to move task"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
              card.category === 'CUSTOMER' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900' :
              card.category === 'INVOICE' || card.category === 'PAYMENT' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900' :
              card.category === 'COMPLAINT' ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900' :
              'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}>
              {card.category}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
              <User size={10} /> {card.assignedTo}
            </span>
          </div>

          <div className="font-heading font-bold text-sm text-zinc-900 dark:text-white leading-snug">
            {card.title}
          </div>

          {card.subtext && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mt-1">
              {card.subtext}
            </div>
          )}
        </div>
      </div>

      {/* Quick mover buttons */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-zinc-100 dark:border-zinc-900 gap-1">
        {column.id !== 'todo' && (
          <button
            onClick={() => onMoveTask(card.id, column.id === 'done' ? 'review' : column.id === 'review' ? 'in_progress' : 'todo')}
            title="Move back"
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-[10px] font-mono flex items-center gap-0.5"
          >
            <ArrowLeft size={12} />
          </button>
        )}
        <div className="flex-1" />
        {column.id !== 'done' && (
          <button
            onClick={() => onMoveTask(card.id, column.id === 'todo' ? 'in_progress' : column.id === 'in_progress' ? 'review' : 'done')}
            title="Move forward"
            className="p-1 px-2 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer text-[10px] font-mono font-bold uppercase flex items-center gap-1"
          >
            <span>Next</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({
  cards,
  role,
  onMarkDone,
  onDismiss,
  onAddTask,
}: KanbanBoardProps) {
  const { showSuccess, showInfo } = useNotifications();

  // Column placement state: overrides default derivation if user moves tasks
  const [taskStatusOverrides, setTaskStatusOverrides] = useState<Record<number, KanbanColumnId>>({});
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [activeCard, setActiveCard] = useState<TaskCard | null>(null);

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Derive which column a card belongs to
  const getCardColumn = (card: TaskCard): KanbanColumnId => {
    if (taskStatusOverrides[card.id]) {
      return taskStatusOverrides[card.id];
    }
    if (card.done) return 'done';
    if (card.type === 'APPROVAL' || card.category === 'COMPLAINT') return 'review';
    if (card.type === 'TASK') return 'in_progress';
    return 'todo';
  };

  const moveTask = (cardId: number, targetCol: KanbanColumnId) => {
    const card = cards.find(c => c.id === cardId);
    setTaskStatusOverrides(prev => ({ ...prev, [cardId]: targetCol }));
    if (targetCol === 'done') {
      onMarkDone(cardId);
    }

    // Show notification
    const columnName = COLUMNS.find(c => c.id === targetCol)?.title;
    if (card && columnName) {
      showInfo('Task Moved', `"${card.title}" → ${columnName}`);
    }
  };

  // Drag event handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const cardData = active.data.current;
    if (cardData?.type === 'card') {
      setActiveCard(cardData.card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    const activeColumnId = activeData.columnId;
    const overColumnId = overData.columnId || over.id.toString().replace('column-', '');

    // If dragging over a different column, update the override
    if (activeData.type === 'card' && activeColumnId !== overColumnId) {
      const cardId = activeData.card.id;
      const targetCol = overColumnId as KanbanColumnId;
      setTaskStatusOverrides(prev => ({ ...prev, [cardId]: targetCol }));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'card') return;

    const card = activeData.card;
    const targetColumnId = overData?.columnId || over.id.toString().replace('column-', '');

    if (targetColumnId) {
      moveTask(card.id, targetColumnId as KanbanColumnId);
    }
  };

  // Filter cards by category
  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      if (activeCategoryFilter === 'ALL') return true;
      return c.category === activeCategoryFilter;
    });
  }, [cards, activeCategoryFilter]);

  const categories: Array<TaskCard['category'] | 'ALL'> = ['ALL', 'CUSTOMER', 'SUPPLIER', 'INVOICE', 'PAYMENT', 'COMPLAINT', 'OTHER'];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
          <span className="text-xs font-mono font-bold uppercase text-zinc-400 dark:text-zinc-500 mr-1 shrink-0 flex items-center gap-1">
            <Tag size={12} /> Filter:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 border ${
                activeCategoryFilter === cat
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Kanban Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 items-start overflow-y-auto">
          {COLUMNS.map(col => {
            const colCards = filteredCards.filter(c => getCardColumn(c) === col.id);
            const cardIds = colCards.map(c => `card-${c.id}`);

            return (
              <div
                key={col.id}
                id={`column-${col.id}`}
                data-column-id={col.id}
                className={`flex flex-col bg-zinc-50/80 dark:bg-zinc-900/60 border ${col.borderColor} rounded-2xl p-3 min-h-[300px] shadow-sm`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="font-logo font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-white">
                      {col.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${col.badgeBg}`}>
                      {colCards.length}
                    </span>
                  </div>
                </div>

                {/* Cards in Column */}
                <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2.5 flex-1">
                    {colCards.length === 0 ? (
                      <div
                        data-column-id={col.id}
                        className="py-8 text-center text-xs font-mono text-zinc-400 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl"
                      >
                        Drop tasks here
                      </div>
                    ) : (
                      colCards.map(card => (
                        <DraggableCard
                          key={card.id}
                          card={card}
                          column={col}
                          onMoveTask={moveTask}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeCard ? (
          <div className="bg-white dark:bg-zinc-950 border-2 border-brand-red rounded-xl p-3.5 shadow-2xl opacity-90 rotate-3 scale-105">
            <div className="font-heading font-bold text-sm text-zinc-900 dark:text-white">
              {activeCard.title}
            </div>
            <div className={`mt-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase inline-block ${
              activeCard.category === 'CUSTOMER' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
              'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}>
              {activeCard.category}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
