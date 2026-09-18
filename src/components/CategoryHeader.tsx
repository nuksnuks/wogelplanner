import React from "react";
import { FiRotateCcw, FiTrash2, FiArrowRight } from "react-icons/fi";
import styles from "../styles/categories.module.css";

type Props = {
  formatDate?: (date: Date) => string;
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

const localDate = (date: Date) => date.toLocaleDateString();

export default function CategoryHeader(props: Props) {
  const { formatDate = localDate, cat, variant = "incomplete", editingCategory, categoryEditValue, inputRef, setEditingCategory, setCategoryEditValue, onRenameCategory, onDeleteCategory, onResetCategoryAllocation, categorySpan } = props;

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
                aria-label="Reset allocations"
                onClick={() => {
                  if (!onResetCategoryAllocation) return;
                  if (!window.confirm(`Reset allocations for category "${cat}"? This will set every task in the category to an equal share of the category time.`)) return;
                  onResetCategoryAllocation(cat);
                }}
              >
                <FiRotateCcw aria-hidden="true" />
              </button>
              <button
                className={`deleteButton ${styles.deleteCategoryButton}`}
                title="Delete category"
                aria-label="Delete category"
                onClick={() => onDeleteCategory(cat)}
              >
                <FiTrash2 aria-hidden="true" />
              </button>
            </div>
          </div>
          {categorySpan && (
            <div style={{ fontSize: '0.85em', color: 'var(--muted)' }}>
              {formatDate(categorySpan.start)} <FiArrowRight aria-label="to" role="img" className="inlineIcon" /> {formatDate(categorySpan.end)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
