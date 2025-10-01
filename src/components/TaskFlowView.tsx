import React, { useState } from "react";
import TaskFlow, { Task, ColoredEdge } from "./TaskFlow";


import { Edge } from "@xyflow/react";

interface TaskFlowViewProps {
  tasks: Task[];
  projectId: string;
  edges: Edge[];
  setEdges: (edges: Edge[]) => void;
}

import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { app } from "../firebase/config";

const db = getFirestore(app);

const TaskFlowView: React.FC<TaskFlowViewProps> = ({ tasks, projectId, edges, setEdges }) => {
  // Handler to update a task's position in Firestore
  const handleNodePositionChange = async (taskId: string, position: { x: number; y: number }) => {
    if (!projectId) return;
    const taskRef = doc(db, "projects", projectId, "tasks", taskId);
    await updateDoc(taskRef, { position });
  };

  return (
    <div>
      <h2>Task Graph</h2>
      <TaskFlow
        tasks={tasks}
        edges={edges}
        setEdges={setEdges}
        onNodePositionChange={handleNodePositionChange}
      />
    </div>
  );
};

export default TaskFlowView;
