import React from "react";

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
};


import styles from "../styles/modal.module.css";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
const db = getFirestore();

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose, onUpdateStatus, onDeleteTask, allocatedTimeMs, projectId, categories }) => {
  const [editField, setEditField] = React.useState<null | "title" | "description" | "category">(null);
  const [editValue, setEditValue] = React.useState("");

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
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
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
        {typeof allocatedTimeMs === 'number' && !task.completed && (
          <p><strong>Allocated time:</strong> {formatDuration(allocatedTimeMs)}</p>
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