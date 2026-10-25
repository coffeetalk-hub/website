"use client";
import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { moveDeal } from "../actions";

export type BoardDeal = {
  id: string;
  title: string;
  value: number;
  currency: string;
  stageId: string;
  companyName: string | null;
  ownerName: string;
  expectedCloseDate: string | null;
};
export type BoardColumn = { id: string; name: string; kind: string; probability: number };

const group = (deals: BoardDeal[], columns: BoardColumn[]) => {
  const out: Record<string, BoardDeal[]> = {};
  for (const c of columns) out[c.id] = [];
  for (const d of deals) (out[d.stageId] ??= []).push(d);
  return out;
};

function DealCard({ deal, overlay }: { deal: BoardDeal; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const overdue = deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date();
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : { transform: CSS.Transform.toString(transform), transition }}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={cn(
        "cursor-grab touch-manipulation rounded-md border bg-card p-3 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40",
        overlay && "rotate-2 shadow-lg",
      )}
    >
      <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
        {deal.title}
      </Link>
      {deal.companyName && <div className="mt-0.5 text-xs text-muted-foreground">{deal.companyName}</div>}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-semibold">{formatMoney(deal.value, deal.currency)}</span>
        <span className="text-xs text-muted-foreground">{deal.ownerName.split(" ")[0]}</span>
      </div>
      {deal.expectedCloseDate && (
        <div className={cn("mt-1 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>Close: {formatDate(deal.expectedCloseDate)}</div>
      )}
    </div>
  );
}

function Column({ column, deals }: { column: BoardColumn; deals: BoardDeal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const total = deals.reduce((s, d) => s + d.value, 0);
  return (
    <section className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/60 p-2 md:w-auto md:min-w-[230px] md:flex-1">
      <header className="mb-2 flex items-start justify-between gap-2 px-1">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span
              className={cn("h-2 w-2 rounded-full", column.kind === "WON" ? "bg-green-500" : column.kind === "LOST" ? "bg-red-500" : "bg-primary")}
            />
            {column.name}
            <span className="rounded-full bg-background px-1.5 text-xs font-normal text-muted-foreground">{deals.length}</span>
          </h2>
          <p className="text-xs text-muted-foreground">{formatMoney(total)}</p>
        </div>
        <Link href={`/deals/new?stageId=${column.id}`} aria-label={`New deal in ${column.name}`} className="rounded p-1 text-muted-foreground hover:bg-background">
          <Plus className="h-4 w-4" />
        </Link>
      </header>
      <div ref={setNodeRef} className={cn("flex min-h-[120px] flex-1 flex-col gap-2 rounded-md p-1 transition-colors", isOver && "bg-primary/10")}>
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}

export function Board({ columns, deals }: { columns: BoardColumn[]; deals: BoardDeal[] }) {
  const [items, setItems] = useState(() => group(deals, columns));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const origin = useRef<{ container: string; index: number } | null>(null);

  // Re-sync with server data after a revalidation.
  useEffect(() => setItems(group(deals, columns)), [deals, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findContainer = (id: string) => (id in items ? id : Object.keys(items).find((k) => items[k].some((d) => d.id === id)));
  const active = activeId ? Object.values(items).flat().find((d) => d.id === activeId) : null;

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);
    setError(null);
    const container = findContainer(id)!;
    origin.current = { container, index: items[container].findIndex((d) => d.id === id) };
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findContainer(String(active.id));
    const to = findContainer(String(over.id));
    if (!from || !to || from === to) return;
    setItems((prev) => {
      const moving = prev[from].find((d) => d.id === active.id)!;
      const overIndex = prev[to].findIndex((d) => d.id === over.id);
      const at = overIndex >= 0 ? overIndex : prev[to].length;
      return {
        ...prev,
        [from]: prev[from].filter((d) => d.id !== active.id),
        [to]: [...prev[to].slice(0, at), { ...moving, stageId: to }, ...prev[to].slice(at)],
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    const start = origin.current;
    origin.current = null;
    if (!over || !start) return;
    const id = String(active.id);
    const container = findContainer(id);
    if (!container) return;
    let list = items[container];
    const oldIndex = list.findIndex((d) => d.id === id);
    const overIndex = list.findIndex((d) => d.id === over.id);
    if (overIndex >= 0 && oldIndex !== overIndex) {
      list = arrayMove(list, oldIndex, overIndex);
      setItems((prev) => ({ ...prev, [container]: list }));
    }
    const index = list.findIndex((d) => d.id === id);
    if (container === start.container && index === start.index) return;
    startTransition(async () => {
      const res = await moveDeal(id, container, index);
      if (res.error) {
        setError(res.error);
        setItems(group(deals, columns)); // revert
      }
    });
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <DndContext id="deals-board" sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
          {columns.map((c) => (
            <Column key={c.id} column={c} deals={items[c.id] ?? []} />
          ))}
        </div>
        <DragOverlay>{active ? <DealCard deal={active} overlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
