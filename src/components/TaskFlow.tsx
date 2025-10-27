import React, { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  OnConnect,
  useNodesState,
  MarkerType,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Task type should match your app
export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  position?: { x: number; y: number };
};

// Edge type with color
export type ColoredEdge = Edge & { color?: string };

interface TaskFlowProps {
  tasks: Task[];
  edges: Edge[];
  setEdges: (edges: Edge[]) => void;
  onNodeDoubleClick?: (taskId: string) => void;
  onNodePositionChange?: (taskId: string, position: { x: number; y: number }) => void;
}

const nodeWidth = 180;
const nodeHeight = 60;

export const TaskFlow: React.FC<TaskFlowProps> = ({ tasks, edges, setEdges, onNodeDoubleClick, onNodePositionChange }) => {
  // Map tasks to nodes

  // Build initial nodes from tasks
  const initialNodes: Node[] = useMemo(
    () =>
      tasks.map((task, idx) => ({
        id: task.id,
        data: { label: task.title, completed: task.completed },
        position: task.position ?? { x: (idx % 5) * (nodeWidth + 40), y: Math.floor(idx / 5) * (nodeHeight + 60) },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          color: task.completed ? "#4caf50" : "#e74c3c",
          background: "#72727250",
          border: task.completed ? "2px solid #4caf50" : "2px solid #e74c3c"
        },
      })),
    [tasks]
  );

  // Use ReactFlow's state for smooth dragging
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Keep nodes in sync with tasks (when tasks change, update nodes)
  useEffect(() => {
    setNodes(initialNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tasks)]);

  // Color edges based on source node completion
  const coloredEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => {
      const sourceTask = tasks.find((t) => t.id === edge.source);
      const color = sourceTask?.completed ? "#4caf50" : "#e74c3c";
      return {
        ...edge,
        style: { stroke: color, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
        },
      };
    });
  }, [edges, tasks]);

  // Edge state
  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges(addEdge(params, edges)),
    [edges, setEdges]
  );

  // Handle node drag stop

  // Only persist to Firestore on drag stop
  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      if (typeof node.id === "string" && node.position && onNodePositionChange) {
        onNodePositionChange(node.id, node.position);
      }
    },
    [onNodePositionChange]
  );

  return (
    <div style={{ width: "100%", height: 680 }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        edges={coloredEdges}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={(event, node) => {
          if (node && typeof node.id === 'string' && onNodeDoubleClick) {
            onNodeDoubleClick(String(node.id));
          }
        }}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >

        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
};

export default TaskFlow;
