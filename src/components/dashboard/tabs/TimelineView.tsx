'use client';

import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timelinePlugin from '@fullcalendar/timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { TaskCard } from '@/utils/sharedState';
import { Role } from '@/config/roles';

interface TimelineViewProps {
  cards: TaskCard[];
  role: Role;
  onTaskClick?: (taskId: number) => void;
  onDateChange?: (taskId: number, newDate: Date) => void;
}

export default function TimelineView({
  cards,
  role,
  onTaskClick,
  onDateChange,
}: TimelineViewProps) {
  // Convert tasks to FullCalendar events
  const events = useMemo(() => {
    return cards.map(card => {
      // Calculate start and end dates
      const createdDate = new Date(card.createdAt || Date.now());
      const dueDate = card.dueDate ? new Date(card.dueDate) : new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

      // Determine color based on category
      const colorMap: Record<TaskCard['category'], string> = {
        CUSTOMER: '#3b82f6', // blue
        SUPPLIER: '#8b5cf6', // purple
        INVOICE: '#f59e0b', // amber
        PAYMENT: '#10b981', // green
        COMPLAINT: '#ef4444', // red
        OTHER: '#6b7280', // gray
      };

      return {
        id: String(card.id),
        title: card.title,
        start: createdDate,
        end: dueDate,
        backgroundColor: colorMap[card.category],
        borderColor: colorMap[card.category],
        textColor: '#ffffff',
        extendedProps: {
          category: card.category,
          assignedTo: card.assignedTo,
          done: card.done,
          type: card.type,
        },
      };
    });
  }, [cards]);

  // Define resource lanes (by assigned user)
  const resources = useMemo(() => {
    const roles: Role[] = ['owner', 'sales', 'production', 'finance'];
    return roles.map(r => ({
      id: r,
      title: r.charAt(0).toUpperCase() + r.slice(1),
    }));
  }, []);

  const handleEventClick = (info: any) => {
    const taskId = parseInt(info.event.id);
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  const handleEventDrop = (info: any) => {
    const taskId = parseInt(info.event.id);
    const newDate = info.event.start;
    if (onDateChange && newDate) {
      onDateChange(taskId, newDate);
    }
  };

  return (
    <div className="timeline-view bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="font-logo font-black text-lg uppercase tracking-wider text-zinc-900 dark:text-white">
          Timeline View
        </h2>
        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">
          Gantt-style visualization of tasks over time
        </p>
      </div>

      <div className="timeline-calendar">
        <FullCalendar
          plugins={[timelinePlugin, interactionPlugin]}
          initialView="timelineMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timelineDay,timelineWeek,timelineMonth',
          }}
          events={events}
          resources={resources}
          resourceAreaHeaderContent="Assigned To"
          editable={true}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          height="auto"
          slotMinWidth={80}
          resourceAreaWidth="15%"
          eventContent={(arg) => {
            return (
              <div className="px-2 py-1 text-xs font-medium truncate">
                <div className="font-bold">{arg.event.title}</div>
                {arg.event.extendedProps.done && (
                  <span className="text-[10px] opacity-75">✓ Done</span>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Custom CSS for dark mode */}
      <style jsx global>{`
        .timeline-calendar .fc {
          --fc-border-color: rgb(228 228 231 / 1);
          --fc-button-bg-color: rgb(24 24 27 / 1);
          --fc-button-border-color: rgb(39 39 42 / 1);
          --fc-button-hover-bg-color: rgb(239 68 68 / 1);
          --fc-button-hover-border-color: rgb(239 68 68 / 1);
          --fc-button-active-bg-color: rgb(220 38 38 / 1);
          --fc-button-active-border-color: rgb(220 38 38 / 1);
        }

        .dark .timeline-calendar .fc {
          --fc-border-color: rgb(39 39 42 / 1);
          --fc-page-bg-color: rgb(9 9 11 / 1);
          --fc-neutral-bg-color: rgb(24 24 27 / 1);
          --fc-neutral-text-color: rgb(250 250 250 / 1);
        }

        .timeline-calendar .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 800;
          font-family: var(--font-logo);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .timeline-calendar .fc-button {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
        }

        .timeline-calendar .fc-event {
          border-radius: 0.375rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .timeline-calendar .fc-event:hover {
          opacity: 0.85;
        }

        .timeline-calendar .fc-col-header-cell {
          background-color: rgb(244 244 245 / 1);
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .timeline-calendar .fc-col-header-cell {
          background-color: rgb(24 24 27 / 1);
        }

        .timeline-calendar .fc-timeline-slot {
          background-color: rgb(255 255 255 / 1);
        }

        .dark .timeline-calendar .fc-timeline-slot {
          background-color: rgb(9 9 11 / 1);
        }

        .timeline-calendar .fc-resource-timeline-divider {
          background-color: rgb(228 228 231 / 1);
        }

        .dark .timeline-calendar .fc-resource-timeline-divider {
          background-color: rgb(39 39 42 / 1);
        }
      `}</style>
    </div>
  );
}
