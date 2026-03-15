"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { POI } from "@/types/poi";

interface ItemProps {
  poi: POI;
  index: number;
  onRemove: (placeId: string) => void;
}

function SortableItem({ poi, index, onRemove }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: poi.placeId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
      {...attributes}
    >
      {/* Index number */}
      <span
        className="w-4 text-center text-xs font-semibold flex-shrink-0"
        style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}
      >
        {index + 1}
      </span>

      {/* Drag handle */}
      <button
        className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
        style={{ color: "var(--border)", padding: "2px" }}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
          <rect x="1" y="1" width="3" height="3" rx="1" />
          <rect x="8" y="1" width="3" height="3" rx="1" />
          <rect x="1" y="5.5" width="3" height="3" rx="1" />
          <rect x="8" y="5.5" width="3" height="3" rx="1" />
          <rect x="1" y="10" width="3" height="3" rx="1" />
          <rect x="8" y="10" width="3" height="3" rx="1" />
        </svg>
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate leading-tight"
          style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
        >
          {poi.name}
        </p>
        <p
          className="text-xs"
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "10px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {poi.category}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(poi.placeId)}
        className="w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
        style={{ color: "var(--muted)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--border)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
        }}
        aria-label={`Remove ${poi.name}`}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M1 1L7 7M7 1L1 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

interface Props {
  shortlist: POI[];
  onRemove: (placeId: string) => void;
  onReorder: (newList: POI[]) => void;
}

export default function MyListSection({ shortlist, onRemove, onReorder }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = shortlist.findIndex((p) => p.placeId === active.id);
    const newIndex = shortlist.findIndex((p) => p.placeId === over.id);
    onReorder(arrayMove(shortlist, oldIndex, newIndex));
  };

  if (shortlist.length === 0) {
    return (
      <p
        className="text-xs py-4 text-center rounded-lg"
        style={{
          color: "var(--muted)",
          background: "var(--input-bg)",
          border: "1px dashed var(--border)",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        Add spots to build your route
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={shortlist.map((p) => p.placeId)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--input-bg)" }}
        >
          {shortlist.map((poi, i) => (
            <div
              key={poi.placeId}
              style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
            >
              <SortableItem poi={poi} index={i} onRemove={onRemove} />
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
