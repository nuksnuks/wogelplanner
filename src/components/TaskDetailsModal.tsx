import React from "react";
import styles from "../styles/modal.module.css";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
};

type TaskDetailsModalProps = {
  task: Task;
  onClose: () => void;
  onUpdateStatus?: (taskId: string, completed: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
  allocatedTimeMs?: number;
  projectId: string;
  categories?: string[];
  onAdjustAllocation?: (taskId: string, deltaMs: number) => void;
};



const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose, onUpdateStatus, onDeleteTask, allocatedTimeMs, projectId, categories, onAdjustAllocation }) => {
  const [editField, setEditField] = React.useState<null | "title" | "description" | "category">(null);
  const [editValue, setEditValue] = React.useState("");
  // Local displayed allocation for smooth UI while wheel-scrolling
  const [displayAllocatedMs, setDisplayAllocatedMs] = React.useState<number | undefined>(allocatedTimeMs);
  const pendingDeltaRef = React.useRef<number>(0);
  const commitTimerRef = React.useRef<number | null>(null);
  const MIN_ALLOC = 60 * 1000; // 1 minute

  // Keep local display in sync when prop changes (e.g., from Firestore updates)
  React.useEffect(() => {
    setDisplayAllocatedMs(allocatedTimeMs);
  }, [allocatedTimeMs]);

  // Flush any pending delta to parent
  const flushPending = () => {
    if (commitTimerRef.current) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    const pending = pendingDeltaRef.current;
    if (pending !== 0 && onAdjustAllocation) {
      // send accumulated delta to parent
      onAdjustAllocation(task.id, pending);
    }
    pendingDeltaRef.current = 0;
  };

  // ensure flush on unmount
  React.useEffect(() => {
    return () => {
      flushPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inline edit state for allocated time (hours input)
  const [editingAllocated, setEditingAllocated] = React.useState(false);
  const [allocatedInput, setAllocatedInput] = React.useState<string>("");
  const [allocatedUnit, setAllocatedUnit] = React.useState<'hours' | 'days'>('hours');

  const startAllocatedEdit = () => {
    flushPending();
    const baseMs = typeof displayAllocatedMs === 'number' ? displayAllocatedMs : (allocatedTimeMs ?? MIN_ALLOC);
    const dayMs = 24 * 60 * 60 * 1000;
    if (baseMs < dayMs) {
      const hours = baseMs / (60 * 60 * 1000);
      setAllocatedUnit('hours');
      setAllocatedInput(String(Number(hours.toFixed(2))));
    } else {
      const days = baseMs / dayMs;
      setAllocatedUnit('days');
      setAllocatedInput(String(Number(days.toFixed(2))));
    }
    setEditingAllocated(true);
  };

  const commitAllocatedEdit = async () => {
    setEditingAllocated(false);
    const parsed = Number(allocatedInput);
    if (Number.isNaN(parsed)) return;
    const dayMs = 24 * 60 * 60 * 1000;
    const newMs = Math.max(MIN_ALLOC, Math.round(parsed * (allocatedUnit === 'hours' ? 60 * 60 * 1000 : dayMs)));
    const currentMs = typeof displayAllocatedMs === 'number' ? displayAllocatedMs : (allocatedTimeMs ?? MIN_ALLOC);
    const delta = newMs - currentMs;
    if (delta === 0) {
      // just refresh display
      setDisplayAllocatedMs(newMs);
      return;
    }
    if (onAdjustAllocation) {
      onAdjustAllocation(task.id, delta);
    } else {
      // fallback: write absolute value and mark manual (best-effort)
      try {
        const ref = doc(db, "projects", projectId, "tasks", task.id);
        await updateDoc(ref, { allocatedTimeMs: newMs, manualAllocation: true });
      } catch (err) {
        console.error('failed to write allocation fallback', err);
      }
    }
    setDisplayAllocatedMs(newMs);
  };

  // Helper to format ms to days/hours
  function formatDuration(ms: number) {
    if (ms >= 24 * 60 * 60 * 1000) {
      return (ms / (24 * 60 * 60 * 1000)).toFixed(1) + ' days';
    } else if (ms >= 60 * 60 * 1000) {
      return (ms / (60 * 60 * 1000)).toFixed(1) + ' hours';
    } else if (ms >= 60 * 1000) {
      return (ms / (60 * 1000)).toFixed(1) + ' min';
    }
    return ms + ' ms';
  }

  const handleToggleStatus = () => {
    if (onUpdateStatus) {
      onUpdateStatus(task.id, !task.completed);
      onClose();
    }
  };
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      if (onDeleteTask) {
        onDeleteTask(task.id);
      }
    }
  };

  // Start editing a field
  const startEdit = (field: "title" | "description" | "category", value: string) => {
    setEditField(field);
    setEditValue(value);
  };

  // Save edit to Firestore
  const saveEdit = async () => {
    if (!editField) return;
    const ref = doc(db, "projects", projectId, "tasks", task.id);
  await updateDoc(ref, { [editField]: editValue });
  // Do not mutate the task prop. Wait for Firestore and parent to update.
  setEditField(null);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      saveEdit();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        onWheel={(e) => {
          // Smooth UI: update local display immediately and debounce commits to Firestore
          if (!onAdjustAllocation) return;
          e.preventDefault();
          const stepMs = 5 * 60 * 1000; // 5 minutes per wheel step for smoother control
          const direction = e.deltaY < 0 ? 1 : -1;
          const deltaMs = direction * stepMs;

          // update local display
          setDisplayAllocatedMs(prev => {
            const base = typeof prev === 'number' ? prev : (allocatedTimeMs ?? MIN_ALLOC);
            return Math.max(MIN_ALLOC, base + deltaMs);
          });

          // accumulate pending delta and debounce commit
          pendingDeltaRef.current += deltaMs;
          if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
          // commit after short pause in scrolling
          commitTimerRef.current = window.setTimeout(() => {
            if (pendingDeltaRef.current !== 0) {
              onAdjustAllocation(task.id, pendingDeltaRef.current);
              pendingDeltaRef.current = 0;
            }
            commitTimerRef.current = null;
          }, 250) as unknown as number;
        }}
      >
        <h2 onDoubleClick={() => startEdit("title", task.title)}>
          {editField === "title" ? (
            <input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            task.title
          )}
        </h2>
        <p onDoubleClick={() => startEdit("description", task.description)}>
          <strong>Description:</strong> {editField === "description" ? (
            <textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            task.description || <em>No description</em>
          )}
        </p>
        <p onDoubleClick={() => startEdit("category", task.category)}>
          <strong>Category:</strong> {editField === "category" ? (
            categories && categories.length > 0 ? (
              <select
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit}
                autoFocus
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            )
          ) : (
            task.category
          )}
        </p>
        <p><strong>Status:</strong> {task.completed ? "Completed ✅" : "Incomplete"}</p>
        {typeof (displayAllocatedMs ?? allocatedTimeMs) === 'number' && !task.completed && (
          <p onDoubleClick={startAllocatedEdit} style={{ cursor: 'pointer' }}>
            <strong>Allocated time:</strong>{' '}
            {editingAllocated ? (
              <input
                type="number"
                step={0.25}
                value={allocatedInput}
                onChange={(e) => setAllocatedInput(e.target.value)}
                onBlur={commitAllocatedEdit}
                onKeyDown={(e) => { if (e.key === 'Enter') commitAllocatedEdit(); if (e.key === 'Escape') { setEditingAllocated(false); setAllocatedInput(''); } }}
                autoFocus
                style={{ width: 120 }}
              />
            ) : (
              `${formatDuration(displayAllocatedMs ?? allocatedTimeMs as number)}`
            )}
          </p>
        )}
        {onUpdateStatus && (
          <button className={styles.toggleButton} onClick={handleToggleStatus}>
            {task.completed ? "Mark as Incomplete" : "Mark as Complete"}
          </button>
        )}
        <button onClick={onClose}>Close</button>
        {onDeleteTask && (
          <button onClick={handleDelete} className="deleteButton">
            Delete Task
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsModal;