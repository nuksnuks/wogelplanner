import React from "react";
import TaskFlow, { Task } from "./TaskFlow";


import { Edge } from "@xyflow/react";

interface TaskFlowViewProps {
  tasks: Task[];
  projectId: string;
  edges: Edge[];
  setEdges: (edges: Edge[]) => void;
  onNodeDoubleClick?: (taskId: string) => void;
}

import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { app } from "../firebase/config";

const db = getFirestore(app);

const TaskFlowView: React.FC<TaskFlowViewProps> = ({ tasks, projectId, edges, setEdges, onNodeDoubleClick }) => {
  // Handler to update a task's position in Firestore
  const handleNodePositionChange = async (taskId: string, position: { x: number; y: number }) => {
    if (!projectId) return;
    const taskRef = doc(db, "projects", projectId, "tasks", taskId);
    await updateDoc(taskRef, { position });
  };

  return (
    <div>
      <TaskFlow
        tasks={tasks}
        edges={edges}
        setEdges={setEdges}
        onNodePositionChange={handleNodePositionChange}
        onNodeDoubleClick={onNodeDoubleClick}
      />
    </div>
  );
};

export default TaskFlowView;
