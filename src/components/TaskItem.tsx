import React from "react";
import styles from "../styles/categories.module.css";

type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  position?: { x: number; y: number };
  allocatedTimeMs?: number;
  manualAllocation?: boolean;
};

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

type Props = {
  task: Task;
  allocated?: number;
  onClick?: () => void;
};

export default function TaskItem({ task, allocated, onClick }: Props) {
  return (
    <div key={task.id} className={styles.categoryTaskItem} onClick={onClick}>
      <strong>{task.title}</strong>
      {typeof allocated === 'number' && (
        <div className={styles.timeAllocated}>
          Allocated: {formatDuration(allocated)}{task.manualAllocation ? ' (manual)' : ''}
        </div>
      )}
    </div>
  );
}
