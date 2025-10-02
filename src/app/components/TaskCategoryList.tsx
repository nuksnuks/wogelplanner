import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import TaskDetailsModal from "./TaskDetailsModal";

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
  onUpdateTaskStatus?: (taskId: string, completed: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
};

import { useState } from "react";

const TaskCategoryList: React.FC<TaskCategoryListProps> = (props) => {
  const { tasksByCategory, categoryOrder, onCategoryOrderChange, onUpdateTaskStatus, onDeleteTask } = props;
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  return (
    <>
      <h2>Incomplete Tasks by Category</h2>
      {categoryOrder.length === 0 && <p>No tasks yet.</p>}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories-incomplete" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ display: "flex", flexDirection: "row", gap: 24, overflowX: "auto" }}
            >
              {categoryOrder.map((cat: string, idx: number) => (
                <Draggable key={cat} draggableId={cat} index={idx}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      style={{
                        minWidth: 200,
                        marginBottom: 16,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: 8,
                        background: dragSnapshot.isDragging ? "#e3f2fd" : "#fafbfc",
                        boxShadow: dragSnapshot.isDragging ? "0 2px 8px rgba(0,0,0,0.15)" : undefined,
                        ...dragProvided.draggableProps.style,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h3 style={{ margin: 0 }}>{cat}</h3>
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {incompleteByCategory[cat]?.map(task => (
                          <li key={task.id} style={{ cursor: "pointer", padding: "4px 0" }} onClick={() => setSelectedTask(task)}>
                            <strong>{task.title}</strong>
                          </li>
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

      <h2 style={{ marginTop: 32 }}>Completed Tasks by Category</h2>
      <div style={{ display: "flex", flexDirection: "row", gap: 24, overflowX: "auto" }}>
        {categoryOrder.map((cat: string) => (
          <div key={cat} style={{ minWidth: 200, marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 8, background: "#f4f4f4" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{cat}</h3>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {completeByCategory[cat]?.map(task => (
                <li key={task.id} style={{ cursor: "pointer", padding: "4px 0" }} onClick={() => setSelectedTask(task)}>
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
        />
      )}
    </>
  );
};

export default TaskCategoryList;
