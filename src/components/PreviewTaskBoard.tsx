import { useRef } from "react";
import TimelineBar from "./TimelineBar";
import CategoryHeader from "./CategoryHeader";
import TaskItem from "./TaskItem";
import { previewCategories, previewTasksByCategory, previewKickoff, previewDeadline, previewNowMs, previewSpans, formatPreviewDate, previewNoop } from "./previewData";
import styles from "../styles/categories.module.css";

// Reuse the real visual components without drag-and-drop, database handlers, or live state.
export default function PreviewTaskBoard() {
  const inputRef = useRef<HTMLInputElement>(null);
  return <>
    <TimelineBar start={previewKickoff} end={previewDeadline} nowMs={previewNowMs} formatDate={formatPreviewDate} categorySpans={previewSpans} categoryOrder={previewCategories} tasksByCategory={previewTasksByCategory} />
    {[false, true].map(completed => <div key={String(completed)}>
      <h2>{completed ? "Completed Tasks" : "To do"}</h2>
      <div className={completed ? styles.completedCategoriesRow : styles.incompleteCategoriesRow}>
        {previewCategories.map(category => <div className={styles.categoryColumn} key={category}>
          <CategoryHeader cat={category} variant={completed ? "complete" : "incomplete"} editingCategory={null} categoryEditValue="" inputRef={inputRef} setEditingCategory={previewNoop} setCategoryEditValue={previewNoop} onDeleteCategory={previewNoop} categorySpan={previewSpans[category as keyof typeof previewSpans]} formatDate={formatPreviewDate} />
          <ul className={styles.categoryList}>
            {previewTasksByCategory[category].filter(task => task.completed === completed).map(task => <TaskItem key={task.id} task={task} allocated={task.allocatedTimeMs} />)}
          </ul>
        </div>)}
      </div>
    </div>)}
  </>;
}
