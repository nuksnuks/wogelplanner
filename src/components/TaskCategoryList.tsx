import React from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
};

type TaskCategoryListProps = {
  tasksByCategory: { [cat: string]: Task[] };
  categories: string[];
};

const TaskCategoryList: React.FC<TaskCategoryListProps> = ({ tasksByCategory, categories }) => (
  <>
    <h2>Tasks by Category</h2>
    {categories.length === 0 && <p>No tasks yet.</p>}
    {categories.map(cat => (
      <div key={cat} style={{ marginBottom: 16 }}>
        <h3>{cat}</h3>
        <ul>
          {tasksByCategory[cat].map(task => (
            <li key={task.id}>
              <strong>{task.title}</strong> - {task.description} {task.completed ? "✅" : ""}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </>
);

export default TaskCategoryList;
