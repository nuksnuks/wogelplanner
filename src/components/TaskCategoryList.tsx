import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import TaskDetailsModal from "./TaskDetailsModal";
import styles from "../styles/categories.module.css";

type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  position?: { x: number; y: number };
};

type TaskCategoryListProps = {
  tasksByCategory: { [cat: string]: Task[] };
  categoryOrder: string[];
  onCategoryOrderChange: (newOrder: string[]) => void;
  onRenameCategory?: (oldName: string, newName: string) => Promise<void> | void;
  onUpdateTaskStatus?: (taskId: string, completed: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
  taskDurations?: { [cat: string]: { [taskId: string]: number } };
  projectId: string;
};

import { getFirestore, writeBatch, doc } from "firebase/firestore";


const TaskCategoryList: React.FC<TaskCategoryListProps> = (props) => {
  const { tasksByCategory, categoryOrder, onCategoryOrderChange, onUpdateTaskStatus, onDeleteTask, taskDurations, projectId, onRenameCategory } = props;
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryEditValue, setCategoryEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus the inline edit input when editing starts
  useEffect(() => {
    if (editingCategory && inputRef.current) {
      // small timeout to ensure the input is mounted
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [editingCategory]);

  // Delete a category and all its tasks, with confirmation
  const handleDeleteCategory = async (cat: string) => {
    const tasks = tasksByCategory[cat] || [];
    const taskCount = tasks.length;
    const confirmMsg = `Are you sure you want to delete the category \"${cat}\" and all its ${taskCount} task(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    // Delete all tasks in this category from Firestore
    const db = getFirestore();
    const batch = writeBatch(db);
    for (const task of tasks) {
      const ref = doc(db, "projects", projectId, "tasks", task.id);
      batch.delete(ref);
    }
    try {
      await batch.commit();
    } catch (err) {
      alert("Failed to delete tasks from Firestore: " + (err instanceof Error ? err.message : String(err)));
      return;
    }

    // Update the UI by removing the category
    const newOrder = categoryOrder.filter(c => c !== cat);
    onCategoryOrderChange(newOrder);
    // Optionally, you could also notify parent to remove tasks from tasksByCategory if needed
  };

  // Handle drag end for category reordering
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceIdx = result.source.index;
    const destIdx = result.destination.index;
    if (sourceIdx === destIdx) return;
    const newOrder = [...categoryOrder];
    const [removed] = newOrder.splice(sourceIdx, 1);
    newOrder.splice(destIdx, 0, removed);
    onCategoryOrderChange(newOrder);
  };

  // When a task is updated, update selectedTask if it's the same task
  const handleUpdateStatus = (taskId: string, completed: boolean) => {
    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, completed);
    }
    // Optimistically update selectedTask for immediate UI feedback
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, completed });
    }
  };

  // When a task is deleted, close the modal if it's the selected one
  const handleDeleteTask = (taskId: string) => {
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(null);
    }
    if (typeof onDeleteTask === 'function') {
      onDeleteTask(taskId);
    }
  };

  // Split tasks by completion
  const incompleteByCategory: { [cat: string]: Task[] } = {};
  const completeByCategory: { [cat: string]: Task[] } = {};
  for (const cat of categoryOrder) {
    incompleteByCategory[cat] = (tasksByCategory[cat] || []).filter(t => !t.completed);
    completeByCategory[cat] = (tasksByCategory[cat] || []).filter(t => t.completed);
  }

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

  // Keep selectedTask in sync with updated tasks from props.
  // If the task was edited elsewhere (e.g. saved in Firestore), update the modal's task prop.
  useEffect(() => {
    if (!selectedTask) return;
    // Find updated task across all categories
    let updated: Task | undefined;
    for (const cat of Object.keys(tasksByCategory)) {
      const found = tasksByCategory[cat].find(t => t.id === selectedTask.id);
      if (found) {
        updated = found;
        break;
      }
    }
    if (!updated) {
      // task removed/deleted -> close modal
      setSelectedTask(null);
      return;
    }
    // Only set if any relevant fields changed
    if (
      updated.title !== selectedTask.title ||
      updated.description !== selectedTask.description ||
      updated.category !== selectedTask.category ||
      updated.completed !== selectedTask.completed ||
      JSON.stringify(updated.position) !== JSON.stringify(selectedTask.position)
    ) {
      setSelectedTask(updated);
    }
  }, [tasksByCategory, selectedTask]);

  return (
    <>
      <h2>To do</h2>
      {categoryOrder.length === 0 && <p>No tasks yet.</p>}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories-incomplete" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={styles.incompleteCategoriesRow}
            >
              {categoryOrder.map((cat: string, idx: number) => (
                <Draggable key={cat} draggableId={cat} index={idx}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={[
                        styles.categoryColumn,
                        dragSnapshot.isDragging ? styles.categoryColumnDragging : ""
                      ].join(" ")}
                      style={dragProvided.draggableProps.style}
                    >
                      <div className={styles.categoryHeader}>
                        {/* drag handle placed on a small target so double-click on the title still works */}
                        <span {...dragProvided.dragHandleProps} className={styles.dragHandle} aria-hidden>
                          ☰
                        </span>

                        {editingCategory === `${cat}::incomplete` ? (
                          <input
                            ref={inputRef}
                            className={styles.categoryEditInput}
                            value={categoryEditValue}
                            onChange={(e) => setCategoryEditValue(e.target.value)}
                            onBlur={async () => {
                              const newName = categoryEditValue.trim();
                              setEditingCategory(null);
                              if (newName && newName !== cat && onRenameCategory) {
                                await onRenameCategory(cat, newName);
                              }
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                const newName = categoryEditValue.trim();
                                setEditingCategory(null);
                                if (newName && newName !== cat && onRenameCategory) {
                                  await onRenameCategory(cat, newName);
                                }
                              }
                              if (e.key === "Escape") {
                                setEditingCategory(null);
                              }
                            }}
                          />
                        ) : (
                          <h3 onDoubleClick={() => { setEditingCategory(`${cat}::incomplete`); setCategoryEditValue(cat); }}>{cat}</h3>
                        )}
                        <button
                          className={`deleteButton ${styles.deleteCategoryButton}`}
                          title="Delete category"
                          onClick={() => handleDeleteCategory(cat)}
                        >
                          🗑
                        </button>
                      </div>
                      <ul className={styles.categoryList}>
                        {incompleteByCategory[cat]?.map(task => (
                          <div 
                            key={task.id} 
                            className={styles.categoryTaskItem} 
                            onClick={() => setSelectedTask(task)}
                          >
                            <strong>{task.title}</strong>
                            {taskDurations && taskDurations[cat] && typeof taskDurations[cat][task.id] === 'number' && (
                              <div className={styles.timeAllocated}>
                                max time for task: {formatDuration(taskDurations[cat][task.id])}
                              </div>
                            )}
                          </div>
                        ))}
                      </ul>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <h2>Completed Tasks</h2>
      <div className={styles.completedCategoriesRow}>
        {categoryOrder.map((cat: string) => (
          <div key={cat} className={styles.categoryColumn}>
            <div className={styles.categoryHeader}>
              {editingCategory === `${cat}::complete` ? (
                <input
                  ref={inputRef}
                  className={styles.categoryEditInput}
                  value={categoryEditValue}
                  onChange={(e) => setCategoryEditValue(e.target.value)}
                  onBlur={async () => {
                    const newName = categoryEditValue.trim();
                    setEditingCategory(null);
                    if (newName && newName !== cat && onRenameCategory) {
                      await onRenameCategory(cat, newName);
                    }
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      const newName = categoryEditValue.trim();
                      setEditingCategory(null);
                      if (newName && newName !== cat && onRenameCategory) {
                        await onRenameCategory(cat, newName);
                      }
                    }
                    if (e.key === "Escape") {
                      setEditingCategory(null);
                    }
                  }}
                />
              ) : (
                <h3 onDoubleClick={() => { setEditingCategory(`${cat}::complete`); setCategoryEditValue(cat); }}>{cat}</h3>
              )}
            </div>
            <ul className={styles.categoryList}>
              {completeByCategory[cat]?.map(task => (
                <li key={task.id} className={styles.categoryTaskItem} onClick={() => setSelectedTask(task)}>
                  <strong>{task.title}</strong>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateStatus={handleUpdateStatus}
          onDeleteTask={handleDeleteTask}
          allocatedTimeMs={
            taskDurations && selectedTask.category && taskDurations[selectedTask.category]?.[selectedTask.id]
              ? taskDurations[selectedTask.category][selectedTask.id]
              : undefined
          }
          projectId={props.projectId}
          categories={categoryOrder}
        />
      )}
    </>
  );
};

export default TaskCategoryList;
