import React, { useEffect, useRef } from "react";
import styles from "../styles/categories.module.css";

type CategorySpan = { start: Date; end: Date };
type TaskLike = { id: string; title?: string; allocatedTimeMs?: number; completed?: boolean };
type Props = {
  start?: Date | null;
  end?: Date | null;
  categorySpans?: Record<string, CategorySpan | null>;
  categoryOrder?: string[];
  tasksByCategory?: Record<string, TaskLike[]>;
  // optional precomputed durations to use as fallback when task.allocatedTimeMs is missing
  taskDurations?: Record<string, Record<string, number>>;
  // callbacks: open task details and adjust allocation (delta in ms)
  onOpenTask?: (taskId: string) => void;
  onAdjustAllocation?: (taskId: string, deltaMs: number) => void;
};

export default function TimelineBar({ start, end, categorySpans, categoryOrder, tasksByCategory, taskDurations, onOpenTask, onAdjustAllocation }: Props) {
  // hooks must be called unconditionally
  const allocationBarRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!onAdjustAllocation) return;
    const el = allocationBarRef.current;
    if (!el) return;
    const handler = (ev: WheelEvent) => {
      try {
        // find closest task segment with data-taskid
        const target = (ev.target as HTMLElement).closest('[data-taskid]') as HTMLElement | null;
        if (!target) return;
        const taskId = target.getAttribute('data-taskid');
        if (!taskId) return;
        // prevent default scroll
        ev.preventDefault();
        ev.stopPropagation();
        const baseStep = 15 * 60 * 1000; // 15 minutes
        let step = baseStep;
        if (ev.shiftKey) step = 60 * 60 * 1000; // 1 hour
        if (ev.ctrlKey || ev.metaKey) step = 60 * 1000; // 1 minute
        if (ev.altKey) step = 24 * 60 * 60 * 1000; // 1 day
        const deltaMs = -Math.sign(ev.deltaY) * (step * 20);
        onAdjustAllocation(taskId, deltaMs);
      } catch (err) {
        // swallow
      }
    };
    // usePassive: false to allow preventDefault
    el.addEventListener('wheel', handler as EventListener, { passive: false });
    return () => el.removeEventListener('wheel', handler as EventListener);
  }, [onAdjustAllocation]);

  if (!start || !end) return null;
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (!(startMs < endMs)) return null;

  const now = Date.now();
  const total = endMs - startMs;
  const clampedNow = Math.min(Math.max(now, startMs), endMs);
  const todayPct = ((clampedNow - startMs) / total) * 100;

  // Build marker positions for categories
  const markers: { id: string; pct: number }[] = [];
  const labels: { id: string; pct: number; completed?: boolean }[] = [];
  if (categoryOrder && categoryOrder.length > 0 && categorySpans) {
    for (const id of categoryOrder) {
      const span = categorySpans[id];
      if (!span) continue;
      const s = (span.start.getTime() - startMs) / total * 100;
      const e = (span.end.getTime() - startMs) / total * 100;
      // marker at the start of the category
      markers.push({ id, pct: Math.max(0, Math.min(100, s)) });
      // label centered between start and end
      const mid = Math.max(0, Math.min(100, (s + e) / 2));
      // determine completion: category considered complete if it has tasks and all are completed
      let completed = false;
      if (tasksByCategory && tasksByCategory[id] && tasksByCategory[id].length > 0) {
        completed = tasksByCategory[id].every((t: { completed?: boolean }) => !!t.completed);
      }
      labels.push({ id, pct: mid, completed });
    }
  }

  return (
    <>
      <div className={styles.timelineContainer} aria-hidden>
        <div className={styles.timelineRange}>{start.toLocaleDateString()}</div>
        <div className={styles.timelineBarWrap}>
          <div className={styles.timelineBar}>
          {/* progress fill */}
          <div className={styles.timelineProgress} style={{ width: `${todayPct}%` }} />

          {/* category dashed markers */}
          {markers.map(m => (
            <div key={`m-${m.id}`} className={styles.categoryMarker} style={{ left: `${m.pct}%` }} />
          ))}

          {/* labels centered per category */}
          {labels.map(l => (
            <div key={`l-${l.id}`} className={styles.categoryLabel} style={{ left: `${l.pct}%` }}>
              {l.id} {l.completed ? <span className={styles.categoryCompletedCheck} title="Category complete" aria-label={`Category ${l.id} complete`}>✔</span> : null}
            </div>
          ))}

          {/* today marker and label */}
          <div className={styles.todayMarkerWrap} style={{ left: `${todayPct}%` }}>
            <div className={styles.todayLabel}>Today</div>
            <div className={styles.todayMarker} title="Today" />
          </div>
          </div>
        </div>
        <div className={styles.timelineRange}>{end.toLocaleDateString()}</div>
      </div>

      {/* Allocation bar: shows per-task allocation within each category span */}
      <div className={styles.timelineContainer} aria-hidden style={{ marginTop: 8 }}>
        <div className={styles.timelineRange} />
      <div className={styles.timelineBarWrap}>
        <div className={styles.allocationBar} ref={allocationBarRef}>
            {categoryOrder && categoryOrder.length > 0 && categorySpans && categoryOrder.map(id => {
              const span = categorySpans[id];
              if (!span) return null;
              const s = (span.start.getTime() - startMs) / total * 100;
              const e = (span.end.getTime() - startMs) / total * 100;
              const widthPct = Math.max(0, Math.min(100, e - s));
              const tasks = tasksByCategory && tasksByCategory[id] ? tasksByCategory[id] : [];
              // compute allocations per task (ms)
              const allocs = tasks.map(t => {
                const a = typeof t.allocatedTimeMs === 'number' ? t.allocatedTimeMs : (taskDurations && taskDurations[id] && taskDurations[id][t.id] ? taskDurations[id][t.id] : 0);
                return { id: t.id, title: t.title, ms: a };
              });
              let sum = allocs.reduce((s, a) => s + Math.max(0, a.ms), 0);
              // fallback: if no allocations present, distribute evenly
              if (sum <= 0 && allocs.length > 0) {
                const even = 1;
                allocs.forEach(a => a.ms = even);
                sum = allocs.length * even;
              }

              return (
                <div key={`alloc-${id}`} className={styles.allocationCategorySegment} style={{ left: `${s}%`, width: `${widthPct}%` }}>
                  <div className={styles.allocationCategoryInner}>
                    {allocs.map((a, idx) => {
                      const pct = sum > 0 ? (a.ms / sum) * 100 : 0;
                      // color per-task
                      const hue = (idx * 47 + (id.length * 13)) % 360;
                      const bg = `hsl(${hue} 70% 65% / 0.95)`;
                      return (
                        <div
                          key={a.id}
                          data-taskid={a.id}
                          className={styles.allocationTaskSegment}
                          style={{ width: `${pct}%`, background: bg }}
                          title={`${a.title || a.id}: ${a.ms ? msToHuman(a.ms) : '—'}`}
                          onDoubleClick={() => onOpenTask && onOpenTask(a.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.timelineRange} />
      </div>
    </>
  );
}

function msToHuman(ms: number) {
  if (!ms || ms <= 0) return "0";
  if (ms >= 24 * 60 * 60 * 1000) return (ms / (24 * 60 * 60 * 1000)).toFixed(1) + 'd';
  if (ms >= 60 * 60 * 1000) return (ms / (60 * 60 * 1000)).toFixed(1) + 'h';
  if (ms >= 60 * 1000) return (ms / (60 * 1000)).toFixed(1) + 'm';
  return Math.round(ms / 1000) + 's';
}
