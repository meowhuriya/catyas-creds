"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { PlannerEvent } from "@/types/schemas";
import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlannerPage() {
  const { dataStore } = useDataStore();
  const [events, setEvents] = React.useState<PlannerEvent[]>([]);

  React.useEffect(() => {
    dataStore.getPlannerEvents().then(setEvents);
  }, [dataStore]);

  const handleToggle = async (id: string, current: boolean) => {
    await dataStore.togglePlannerEventDone(id, !current);
    const updated = await dataStore.getPlannerEvents();
    setEvents(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-app-border pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
            Academic Planner
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Syllabus deadlines, examination schedule, and dedicated study blocks
          </p>
        </div>
      </div>

      <div className="rounded-card border border-app-border bg-app-surface divide-y divide-app-border">
        {events.length === 0 ? (
          <div className="p-8 text-center text-xs text-app-ink-muted">
            No events scheduled.
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="flex items-center justify-between p-4 hover:bg-app-surface-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(evt.id, evt.isDone)}
                  className="text-app-ink-muted hover:text-app-accent transition-colors"
                >
                  {evt.isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-app-success" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <div>
                  <h4
                    className={cn(
                      "text-sm font-medium text-app-ink",
                      evt.isDone && "line-through text-app-ink-muted"
                    )}
                  >
                    {evt.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-app-ink-muted mt-0.5">
                    <Calendar className="h-3 w-3" />
                    <span className="font-mono tabular-nums">{evt.date}</span>
                    {evt.startTime && (
                      <>
                        <Clock className="h-3 w-3 ml-1" />
                        <span className="font-mono tabular-nums">
                          {evt.startTime} {evt.endTime && `- ${evt.endTime}`}
                        </span>
                      </>
                    )}
                    <span className="uppercase text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-app-surface-muted">
                      {evt.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
