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
};

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose, onUpdateStatus, onDeleteTask }) => {
  const handleToggleStatus = () => {
    if (onUpdateStatus) {
      onUpdateStatus(task.id, !task.completed);
    }
  };
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      if (onDeleteTask) {
        onDeleteTask(task.id);
      }
    }
  };
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          minWidth: 300,
          maxWidth: 400,
          boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2>{task.title}</h2>
        <p><strong>Description:</strong> {task.description || <em>No description</em>}</p>
        <p><strong>Category:</strong> {task.category}</p>
        <p><strong>Status:</strong> {task.completed ? "Completed ✅" : "Incomplete"}</p>
        {onUpdateStatus && (
          <button style={{ marginTop: 8, marginBottom: 8 }} onClick={handleToggleStatus}>
            {task.completed ? "Mark as Incomplete" : "Mark as Complete"}
          </button>
        )}
        <button style={{ marginTop: 16, marginRight: 8 }} onClick={onClose}>Close</button>
        {onDeleteTask && (
          <button style={{ marginTop: 16, background: '#e74c3c', color: '#fff' }} onClick={handleDelete}>
            Delete Task
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsModal;