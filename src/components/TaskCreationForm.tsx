import React from "react";

type TaskCreationFormProps = {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  newCategory: string;
  setNewCategory: (v: string) => void;
  categories: string[];
  error: string;
  onSubmit: (e: React.FormEvent) => void;
};

const TaskCreationForm: React.FC<TaskCreationFormProps> = ({
  title, setTitle, description, setDescription, category, setCategory, newCategory, setNewCategory, categories, error, onSubmit
}) => (
  <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
    <input type="text" placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} required />
    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
    <div style={{ display: "flex", gap: 8 }}>
      <select value={category} onChange={e => setCategory(e.target.value)} disabled={!!newCategory} required={!newCategory}>
        <option value="">Select Category</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <span>or</span>
      <input type="text" placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
    </div>
    <button type="submit">Add Task</button>
    {error && <p style={{ color: "red" }}>{error}</p>}
  </form>
);

export default TaskCreationForm;
