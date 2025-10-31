import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, query, onSnapshot, doc, updateDoc, onSnapshot as onDocSnapshot } from "firebase/firestore";
import { app } from "../../../firebase/config";
import TaskFlowView from "../../../components/TaskFlowView";
import { writeBatch } from "firebase/firestore";
import TaskDetailsModal from "../../../components/TaskDetailsModal";
import type { GetServerSidePropsContext } from "next";
import BackButton from "@/components/BackButton";

const db = getFirestore(app);

type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  position?: { x: number; y: number };
  allocatedTimeMs?: number;
  manualAllocation?: boolean;
};

type Edge = {
  id: string;
  source: string;
  target: string;
  // Add additional properties as needed, but avoid 'any'
  [key: string]: unknown;
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as { id: string };
  // You can fetch project data here if needed and pass as props
  return {
    props: { id },
  };
}

const TaskFlowPage: React.FC = () => {
  const router = useRouter();
  const { id: projectId } = router.query;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [kickoffDate, setKickoffDate] = useState<Date | null>(null);
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);

  // Require auth before loading tasks
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        router.replace("/");
      }
    });
    return () => unsub();
  }, [router]);

  // Listen for tasks
  useEffect(() => {
    if (!projectId || !user) return;
    const q = query(collection(db, "projects", String(projectId), "tasks"));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(
        snap.docs.map(doc => {
          const data = doc.data();
          // Ensure position is always an object if present
          return {
            id: doc.id,
            ...data,
            position: data.position ? data.position : undefined,
          } as Task;
        })
      );
    });
    return () => unsub();
  }, [projectId, user]);

  // Listen for edges in project doc
  useEffect(() => {
    if (!projectId || !user) return;
    const projectRef = doc(db, "projects", String(projectId));
    const unsub = onDocSnapshot(projectRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setEdges(Array.isArray(data.edges) ? data.edges : []);
        if (data.kickDate) setKickoffDate(data.kickDate ? new Date(data.kickDate) : null);
        if (data.deadline) setDeadlineDate(data.deadline ? new Date(data.deadline) : null);
      }
    });
    return () => unsub();
  }, [projectId, user]);

  // Update edges in Firestore when changed
  const handleSetEdges = async (newEdges: Edge[]) => {
    setEdges(newEdges);
    if (!projectId) return;
    const projectRef = doc(db, "projects", String(projectId));
    await updateDoc(projectRef, { edges: newEdges });
  };

  // Open modal when node is double-clicked in the flow
  const handleNodeDoubleClick = (taskId: string) => {
    const found = tasks.find(t => t.id === taskId);
    if (found) setSelectedTask(found);
  };

  // Update task status (mark complete/incomplete)
  const handleUpdateTaskStatus = async (taskId: string, completed: boolean) => {
    if (!projectId) return;
    try {
      const taskRef = doc(db, "projects", String(projectId), "tasks", taskId);
      await updateDoc(taskRef, { completed });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;
    try {
      const taskRef = doc(db, "projects", String(projectId), "tasks", taskId);
      await updateDoc(taskRef, { deleted: true });
      // Or deleteDoc(taskRef) if you prefer permanent deletion
      setSelectedTask(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Adjust allocation in taskflow view (same redistribution rules as main project page)
  const adjustTaskAllocation = async (taskId: string, deltaMs: number) => {
    if (!projectId || !kickoffDate || !deadlineDate) return;
    const totalMs = deadlineDate.getTime() - kickoffDate.getTime();
    const allCategories = Array.from(new Set(tasks.map(t => t.category)));
    const categoryMs = totalMs / allCategories.length;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const cat = task.category;
    const tasksInCat = tasks.filter(t => t.category === cat);
    if (tasksInCat.length === 0) return;
    const defaultPerTask = (categoryMs / tasksInCat.length);
    const getAllocated = (t: Task) => (typeof t.allocatedTimeMs === 'number' ? t.allocatedTimeMs as number : defaultPerTask);

    // Build current allocations (use persisted when present, else defaultPerTask)
    const minAlloc = 60 * 1000; // 1 minute
    const currentAlloc: { [id: string]: number } = {};
    for (const t of tasksInCat) {
      const a = typeof t.allocatedTimeMs === 'number' ? t.allocatedTimeMs as number : defaultPerTask;
      currentAlloc[t.id] = Math.max(minAlloc, a);
    }

    const desiredTarget = Math.max(minAlloc, currentAlloc[taskId] + deltaMs);
    const deltaApplied = desiredTarget - currentAlloc[taskId];
    if (Math.abs(deltaApplied) < 1) return;

    const allocations: { [id: string]: number } = { ...currentAlloc };
    allocations[taskId] = desiredTarget;

    const totalAfter = Object.values(allocations).reduce((s, v) => s + v, 0);
    let removeAmount = Math.max(0, totalAfter - categoryMs);

    const adjustableIds = tasksInCat.filter(t => t.id !== taskId && !t.manualAllocation).map(t => t.id);

    const removeFromIds = (ids: string[], amount: number) => {
      let remaining = amount;
      let candidates = [...ids];
      while (remaining > 0 && candidates.length > 0) {
        const per = remaining / candidates.length;
        let reduced = 0;
        const nextCandidates: string[] = [];
        for (const id of candidates) {
          const canReduce = Math.max(0, allocations[id] - minAlloc);
          const take = Math.min(canReduce, per);
          allocations[id] -= take;
          reduced += take;
          if (allocations[id] - minAlloc > 0.5) nextCandidates.push(id);
        }
        if (reduced === 0) break;
        remaining -= reduced;
        candidates = nextCandidates;
      }
      return remaining;
    };

    if (removeAmount > 0 && adjustableIds.length > 0) {
      removeAmount = removeFromIds(adjustableIds, removeAmount);
    }

    if (removeAmount > 0) {
      const manualIds = tasksInCat.filter(t => t.id !== taskId && t.manualAllocation).map(t => t.id);
      if (manualIds.length > 0) {
        let totalReducible = 0;
        for (const id of manualIds) totalReducible += Math.max(0, allocations[id] - minAlloc);
        const toRemove = Math.min(removeAmount, totalReducible);
        if (toRemove > 0 && totalReducible > 0) {
          for (const id of manualIds) {
            const can = Math.max(0, allocations[id] - minAlloc);
            const take = (can / totalReducible) * toRemove;
            allocations[id] -= take;
            removeAmount -= take;
          }
        }
      }
    }

    if (removeAmount > 0) {
      allocations[taskId] = Math.max(minAlloc, allocations[taskId] - removeAmount);
      removeAmount = 0;
    }

    for (const id of Object.keys(allocations)) if (!Number.isFinite(allocations[id])) allocations[id] = minAlloc;
    const finalSum = Object.values(allocations).reduce((s, v) => s + v, 0);
    if (finalSum > categoryMs) {
      const excess = finalSum - categoryMs;
      const nonTargetIds = Object.keys(allocations).filter(id => id !== taskId);
      const per = excess / nonTargetIds.length;
      for (const id of nonTargetIds) allocations[id] = Math.max(minAlloc, allocations[id] - per);
    }

    try {
      const batch = writeBatch(db);
      for (const t of tasksInCat) {
        const ref = doc(db, "projects", String(projectId), "tasks", t.id);
          const updateData: { allocatedTimeMs: number; manualAllocation?: boolean } = { allocatedTimeMs: allocations[t.id] };
          if (t.id === taskId) updateData.manualAllocation = true;
        batch.update(ref, updateData);
      }
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  // Keep selectedTask in sync with latest task data
  useEffect(() => {
    if (!selectedTask) return;
    const updated = tasks.find(t => t.id === selectedTask.id);
    if (!updated) {
      setSelectedTask(null);
      return;
    }
    if (JSON.stringify(updated) !== JSON.stringify(selectedTask)) {
      setSelectedTask(updated);
    }
  }, [tasks, selectedTask]);

  return (
    <div >
      <BackButton />
      <h1>Task Graph</h1>
      {/* Pass projectId for updating positions */}
      <TaskFlowView
        tasks={tasks}
        projectId={projectId as string}
        edges={edges}
        setEdges={handleSetEdges}
        onNodeDoubleClick={handleNodeDoubleClick}
      />

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateStatus={handleUpdateTaskStatus}
          onDeleteTask={handleDeleteTask}
          projectId={projectId as string}
          allocatedTimeMs={selectedTask.allocatedTimeMs}
          categories={Array.from(new Set(tasks.map(t => t.category)))}
          onAdjustAllocation={adjustTaskAllocation}
        />
      )}
    </div>
  );
};

export default TaskFlowPage;
