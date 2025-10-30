import React from "react";
import projectStyles from "../styles/project.module.css";

type Props = {
  projectTitle: string;
  editingProjectField: null | "title" | "kickoff" | "deadline";
  projectEditValue: string;
  setProjectEditValue: (s: string) => void;
  startEditProjectField: (field: "title" | "kickoff" | "deadline", currentVal: string) => void;
  saveProjectField: () => void;
  kickoffDate?: Date | null;
  deadlineDate?: Date | null;
};

export default function ProjectHeader(props: Props) {
  const { projectTitle, editingProjectField, projectEditValue, setProjectEditValue, startEditProjectField, saveProjectField, kickoffDate, deadlineDate } = props;

  return (
    <div style={{ marginBottom: 12 }}>
      <h1 onDoubleClick={() => startEditProjectField("title", projectTitle)}>
        Project: {editingProjectField === "title" ? (
          <input
            value={projectEditValue}
            onChange={(e) => setProjectEditValue(e.target.value)}
            onBlur={saveProjectField}
            onKeyDown={(e) => e.key === "Enter" && saveProjectField()}
            autoFocus
          />
        ) : (
          projectTitle || "Untitled Project"
        )}
      </h1>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 4 }}>
        <div onDoubleClick={() => startEditProjectField("kickoff", kickoffDate ? kickoffDate.toISOString().slice(0,10) : "") }>
          <strong>Kickoff:</strong> {editingProjectField === "kickoff" ? (
            <input type="date" value={projectEditValue} onChange={(e) => setProjectEditValue(e.target.value)} onBlur={saveProjectField} autoFocus />
          ) : kickoffDate ? kickoffDate.toLocaleDateString() : <em>—</em>}
        </div>

        <div onDoubleClick={() => startEditProjectField("deadline", deadlineDate ? deadlineDate.toISOString().slice(0,10) : "") }>
          <strong>Deadline:</strong> {editingProjectField === "deadline" ? (
            <input type="date" value={projectEditValue} onChange={(e) => setProjectEditValue(e.target.value)} onBlur={saveProjectField} autoFocus />
          ) : deadlineDate ? deadlineDate.toLocaleDateString() : <em>—</em>}
        </div>
      </div>
    </div>
  );
}
