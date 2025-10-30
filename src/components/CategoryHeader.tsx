import React from "react";
import styles from "../styles/categories.module.css";

type Props = {
  cat: string;
  variant?: "incomplete" | "complete";
  editingCategory: string | null;
  categoryEditValue: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setEditingCategory: (s: string | null) => void;
  setCategoryEditValue: (s: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => Promise<void> | void;
  onDeleteCategory: (cat: string) => void;
  onResetCategoryAllocation?: (cat: string) => void;
  categorySpan?: { start: Date; end: Date } | null;
};

export default function CategoryHeader(props: Props) {
  const { cat, variant = "incomplete", editingCategory, categoryEditValue, inputRef, setEditingCategory, setCategoryEditValue, onRenameCategory, onDeleteCategory, onResetCategoryAllocation, categorySpan } = props;

  return (
    <div className={styles.categoryHeader}>
      {editingCategory === `${cat}::${variant}` ? (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => { e.stopPropagation(); setEditingCategory(`${cat}::${variant}`); setCategoryEditValue(cat); }}
              style={{ margin: 0 }}
            >
              {cat}
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className={`resetButton ${styles.deleteCategoryButton}`}
                title="Reset allocations"
                onClick={() => {
                  if (!onResetCategoryAllocation) return;
                  if (!window.confirm(`Reset allocations for category "${cat}"? This will set every task in the category to an equal share of the category time.`)) return;
                  onResetCategoryAllocation(cat);
                }}
              >
                🔄
              </button>
              <button
                className={`deleteButton ${styles.deleteCategoryButton}`}
                title="Delete category"
                onClick={() => onDeleteCategory(cat)}
              >
                🗑
              </button>
            </div>
          </div>
          {categorySpan && (
            <div style={{ fontSize: '0.85em', color: '#666' }}>
              {categorySpan.start.toLocaleDateString()} → {categorySpan.end.toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
