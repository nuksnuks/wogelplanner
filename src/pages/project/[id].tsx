import React from "react";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/router";
import { getFirestore, collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, writeBatch } from "firebase/firestore";
import { app } from "../../firebase/config";
import TaskCreationForm from "../../components/TaskCreationForm";
import TaskCategoryList from "../../components/TaskCategoryList";
import PendingInvitesList from "../../components/PendingInvitesList";
import CollaboratorsList from "../../components/CollaboratorsList";
import InviteForm from "../../components/InviteForm";
import BackButton from "@/components/BackButton";

import headerStyles from "../../styles/header.module.css";
import styles from "../../styles/overview.module.css";
import projectStyles from "../../styles/project.module.css";

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

const ProjectPage: React.FC = () => {
  const router = useRouter();
  const { id: projectId } = router.query;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");
  const [projectTitle, setProjectTitle] = useState<string>("");
  // Inline editing state for project metadata
  const [editingProjectField, setEditingProjectField] = useState<null | "title" | "kickoff" | "deadline">(null);
  const [projectEditValue, setProjectEditValue] = useState<string>("");

  // Category rename state (handled inside TaskCategoryList)

  const [pendingInvites, setPendingInvites] = useState<{email: string, invitedAt: number}[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);
  // projectOwner is the owner's UID
  const [projectOwner, setProjectOwner] = useState<string>("");
  // Track authenticated user
  const [user, setUser] = useState<User | null>(null);
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

  // Fetch project title, pendingInvites, collaborators, owner (only if user is authenticated)
  useEffect(() => {
    if (!projectId || !user) return;
    const projectRef = doc(db, "projects", String(projectId));
    const unsub = onSnapshot(projectRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProjectTitle(data.title || "Untitled Project");
  setPendingInvites(Array.isArray(data.pendingInvites) ? data.pendingInvites : []);
        setCollaborators(Array.isArray(data.collaborators) ? data.collaborators : []);
        setProjectOwner(data.owner || "");
        // Redirect if user is no longer a collaborator and not the owner
        if (
          Array.isArray(data.collaborators) &&
          user.email &&
          data.owner &&
          !data.collaborators.includes(user.email) &&
          user.email.trim().toLowerCase() !== data.owner.trim().toLowerCase()
        ) {
          router.replace("/overview");
        }
        // Auto-clear invites older than 30 days
        if (Array.isArray(data.pendingInvites)) {
          const now = Date.now();
          type PendingInvite = { email: string; invitedAt: number };
          const filtered = (data.pendingInvites as PendingInvite[]).filter((inv) => inv.invitedAt && now - inv.invitedAt < 30 * 24 * 60 * 60 * 1000);
          if (filtered.length !== data.pendingInvites.length) {
            // Remove expired invites from Firestore
            updateDoc(projectRef, { pendingInvites: filtered });
          }
        }
      } else {
        setProjectTitle("Project not found");
        setPendingInvites([]);
        setCollaborators([]);
        setProjectOwner("");
      }
    });
    return () => unsub();
  }, [projectId, user, router]);
  // Kick collaborator (owner only)
  const handleKickCollaborator = async (email: string) => {
    if (!projectId) return;
    try {
      const projectRef = doc(db, "projects", String(projectId));
      await updateDoc(projectRef, {
        collaborators: collaborators.filter(e => e !== email),
      });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };

  // Collaborator leaves project
  const handleLeaveProject = async () => {
    if (!projectId || !user) return;
    try {
      const projectRef = doc(db, "projects", String(projectId));
      await updateDoc(projectRef, {
        collaborators: collaborators.filter(e => e !== user.email),
      });
      router.replace("/overview");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };
  // Invite user by email
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!inviteEmail) return;
    const emailToInvite = inviteEmail.trim().toLowerCase();
    // Prevent inviting owner
    if (projectOwner && emailToInvite === projectOwner.trim().toLowerCase()) {
      setError("You cannot invite the project owner.");
      return;
    }
    // Prevent duplicate invites
    if (pendingInvites.some(inv => inv.email.trim().toLowerCase() === emailToInvite) || collaborators.some(e => e.trim().toLowerCase() === emailToInvite)) {
      setError("This user is already invited or is a collaborator.");
      return;
    }
    try {
      const projectRef = doc(db, "projects", String(projectId));
      const now = Date.now();
      await updateDoc(projectRef, {
        pendingInvites: [...pendingInvites, { email: inviteEmail, invitedAt: now }],
      });
      setInviteEmail("");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };

  // Fetch tasks for this project (only if user is authenticated)
  useEffect(() => {
    if (!projectId || !user) return;
    const q = query(collection(db, "projects", String(projectId), "tasks"));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(
        snap.docs
          .map(doc => {
            const data = doc.data();
            // Defensive: ensure category is always present
            if (!data.category) return null;
            return {
              id: doc.id,
              ...data,
              position: data.position ? data.position : undefined,
            } as Task;
          })
          .filter(Boolean) as Task[] // Remove nulls (tasks without category)
      );
    });
    return () => unsub();
  }, [projectId, user]);

  // Compute all categories from tasks
  const allCategories = Array.from(new Set(tasks.map(t => t.category)));
  // Category order state
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);

  // Ensure categoryOrder always includes all categories (fallback to allCategories if empty)
  const effectiveCategoryOrder = categoryOrder.length > 0 ? categoryOrder.filter(cat => allCategories.includes(cat)).concat(allCategories.filter(cat => !categoryOrder.includes(cat))) : allCategories;
 
  // Keep local categoryOrder in sync with the project document's saved order (if any)
  useEffect(() => {
    if (!projectId) return;
    const projectRef = doc(db, "projects", String(projectId));
    const unsub = onSnapshot(projectRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.categoryOrder)) {
          setCategoryOrder(data.categoryOrder as string[]);
        }
      }
    });
    return () => unsub();
  }, [projectId]);
 
  // Helpers: start editing project metadata
  const startEditProjectField = (field: "title" | "kickoff" | "deadline", currentVal: string) => {
    setEditingProjectField(field);
    setProjectEditValue(currentVal || "");
  };

  const saveProjectField = async () => {
    if (!editingProjectField || !projectId) {
      setEditingProjectField(null);
      return;
    }
    const projectRef = doc(db, "projects", String(projectId));
    try {
      if (editingProjectField === "title") {
        await updateDoc(projectRef, { title: projectEditValue });
        setProjectTitle(projectEditValue);
      } else if (editingProjectField === "kickoff") {
        // save as ISO string (if valid)
        const iso = projectEditValue ? new Date(projectEditValue).toISOString() : null;
        await updateDoc(projectRef, { kickDate: iso });
        setKickoffDate(projectEditValue ? new Date(projectEditValue) : null);
      } else if (editingProjectField === "deadline") {
        const iso = projectEditValue ? new Date(projectEditValue).toISOString() : null;
        await updateDoc(projectRef, { deadline: iso });
        setDeadlineDate(projectEditValue ? new Date(projectEditValue) : null);
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setEditingProjectField(null);
    }
  };

  // Rename a category across tasks and update stored categoryOrder
  const renameCategory = async (oldName: string, newName: string) => {
    if (!projectId || !oldName || !newName || oldName === newName) {
      return;
    }
    try {
      const tasksRef = collection(db, "projects", String(projectId), "tasks");
      const q = query(tasksRef, where("category", "==", oldName));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.update(doc(db, "projects", String(projectId), "tasks", d.id), { category: newName });
      });
  // update categoryOrder based on the displayed order (effectiveCategoryOrder)
  // This ensures we update the order users see, even if `categoryOrder` state is empty.
  const newOrder = effectiveCategoryOrder.map(c => c === oldName ? newName : c);
      const projectRef = doc(db, "projects", String(projectId));
      batch.update(projectRef, { categoryOrder: newOrder });
      await batch.commit();
      // update local state to reflect rename immediately
      setCategoryOrder(newOrder);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };
  
  // Handler to update category order in Firestore
  const handleCategoryOrderChange = async (newOrder: string[]) => {
    setCategoryOrder(newOrder);
    if (!projectId) return;
    try {
      const projectRef = doc(db, "projects", String(projectId));
      await updateDoc(projectRef, { categoryOrder: newOrder });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };

  // Adjust allocation for a task by deltaMs (positive increases allocation)
  const adjustTaskAllocation = async (taskId: string, deltaMs: number) => {
    if (!projectId || !kickoffDate || !deadlineDate) return;
    // compute category total ms
    const totalMs = deadlineDate.getTime() - kickoffDate.getTime();
    const categoryMs = totalMs / allCategories.length;

    // find task and tasks in same category
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const cat = task.category;
    const tasksInCat = tasks.filter(t => t.category === cat);
    if (tasksInCat.length === 0) return;

    // helper to get current allocated (fallback to computed default)
    const defaultPerTask = (categoryMs / tasksInCat.length);
    const getAllocated = (t: Task) => (typeof t.allocatedTimeMs === 'number' ? t.allocatedTimeMs as number : defaultPerTask);

    // Build current allocations (use persisted when present, else defaultPerTask)
    const minAlloc = 60 * 1000; // 1 minute
    const currentAlloc: { [id: string]: number } = {};
    let sumCurrent = 0;
    for (const t of tasksInCat) {
      const a = typeof t.allocatedTimeMs === 'number' ? t.allocatedTimeMs : defaultPerTask;
      currentAlloc[t.id] = Math.max(minAlloc, a);
      sumCurrent += currentAlloc[t.id];
    }

    // Desired target allocation
    const desiredTarget = Math.max(minAlloc, currentAlloc[taskId] + deltaMs);
    const deltaApplied = desiredTarget - currentAlloc[taskId];

    // If no change, bail
    if (Math.abs(deltaApplied) < 1) return;

    // Start from currentAlloc and apply desiredTarget to target
    const allocations: { [id: string]: number } = { ...currentAlloc };
    allocations[taskId] = desiredTarget;

    // Compute how much we need to remove from others to fit categoryMs
    const totalAfter = Object.values(allocations).reduce((s, v) => s + v, 0);
    let removeAmount = Math.max(0, totalAfter - categoryMs);

    // Prefer to remove from non-manual tasks first (excluding target)
    const adjustableIds = tasksInCat.filter(t => t.id !== taskId && !t.manualAllocation).map(t => t.id);

    // Helper: attempt to remove `amount` from ids array, respecting minAlloc
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

    // Remove from adjustable non-manual tasks
    if (removeAmount > 0 && adjustableIds.length > 0) {
      removeAmount = removeFromIds(adjustableIds, removeAmount);
    }

    // If still need to remove, take from other manual tasks (excluding target) proportionally down to minAlloc
    if (removeAmount > 0) {
      const manualIds = tasksInCat.filter(t => t.id !== taskId && t.manualAllocation).map(t => t.id);
      if (manualIds.length > 0) {
        // total reducible from manual
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

    // If still need to remove, clamp the target down
    if (removeAmount > 0) {
      allocations[taskId] = Math.max(minAlloc, allocations[taskId] - removeAmount);
      removeAmount = 0;
    }

    // As a safety, ensure no allocations are NaN and sum does not exceed categoryMs (fix minor float diffs)
    for (const id of Object.keys(allocations)) if (!Number.isFinite(allocations[id])) allocations[id] = minAlloc;
    const finalSum = Object.values(allocations).reduce((s, v) => s + v, 0);
    if (finalSum > categoryMs) {
      // scale non-target allocations slightly to fit
      const excess = finalSum - categoryMs;
      const nonTargetIds = Object.keys(allocations).filter(id => id !== taskId);
      const per = excess / nonTargetIds.length;
      for (const id of nonTargetIds) allocations[id] = Math.max(minAlloc, allocations[id] - per);
    }

    // Commit batch
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
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };
  
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cat = newCategory.trim() ? newCategory.trim() : category;
    if (!title || !cat) {
      setError("Task title and category are required.");
      return;
    }
    try {
      await addDoc(collection(db, "projects", String(projectId), "tasks"), {
        title,
        description,
        category: cat,
        completed: false,
      });
      setTitle("");
      setDescription("");
      setCategory("");
      setNewCategory("");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };


  // Group tasks by category, skip tasks with missing/empty category
  const tasksByCategory: { [cat: string]: Task[] } = {};
  tasks.forEach(task => {
    if (!task.category) return;
    if (!tasksByCategory[task.category]) tasksByCategory[task.category] = [];
    tasksByCategory[task.category].push(task);
  });

  // Store kickoff and deadline in state
  const [kickoffDate, setKickoffDate] = useState<Date | null>(null);
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  useEffect(() => {
    if (!projectId) return;
    const projectRef = doc(db, "projects", String(projectId));
    const unsub = onSnapshot(projectRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.kickDate && data.deadline) {
          setKickoffDate(new Date(data.kickDate));
          setDeadlineDate(new Date(data.deadline));
        }
      }
    });
    return () => unsub();
  }, [projectId]);

  // Keep a ref of previous counts so we can detect when a new task is added to a category
  const prevCategoryCountsRef = React.useRef<Record<string, number>>({});

  // Recalculate allocations for a category when tasks are added
  const recalcCategoryAllocations = async (cat: string) => {
    if (!projectId || !kickoffDate || !deadlineDate) return;
    const tasksInCat = tasksByCategory[cat] || [];
    const totalMs = deadlineDate.getTime() - kickoffDate.getTime();
    const categoryMs = totalMs / allCategories.length;
    const minAlloc = 60 * 1000;

    // Determine manual tasks and their allocations
    const manualTasks = tasksInCat.filter(t => t.manualAllocation);
    let sumManual = 0;
    const manualMap: { [id: string]: number } = {};
    for (const t of manualTasks) {
      const a = typeof t.allocatedTimeMs === 'number' ? t.allocatedTimeMs as number : Math.max(minAlloc, categoryMs / tasksInCat.length);
      manualMap[t.id] = Math.max(minAlloc, a);
      sumManual += manualMap[t.id];
    }

    const allocations: { [id: string]: number } = {};

    // If manual allocations already exceed category pool, scale them down proportionally (respecting minAlloc)
    if (sumManual >= categoryMs) {
      const reducibleTotal = Math.max(0, sumManual - (minAlloc * manualTasks.length));
      if (reducibleTotal <= 0) {
        // fallback: set everyone to minAlloc evenly (edge case)
        for (const t of tasksInCat) allocations[t.id] = minAlloc;
      } else {
        const scale = (categoryMs - (minAlloc * manualTasks.length)) / (sumManual - (minAlloc * manualTasks.length) || 1);
        for (const t of tasksInCat) {
          if (t.manualAllocation) {
            const raw = manualMap[t.id];
            const scaled = Math.max(minAlloc, minAlloc + (raw - minAlloc) * scale);
            allocations[t.id] = scaled;
          }
        }
        // If any non-manual tasks exist, give them minAlloc
        for (const t of tasksInCat) if (!allocations[t.id]) allocations[t.id] = minAlloc;
      }
    } else {
      // Normal case: preserve manual allocations, distribute remaining evenly among non-manual tasks
      const remaining = Math.max(0, categoryMs - sumManual);
      const nonManual = tasksInCat.filter(t => !t.manualAllocation);
      const per = nonManual.length > 0 ? remaining / nonManual.length : 0;
      for (const t of tasksInCat) {
        if (t.manualAllocation) allocations[t.id] = manualMap[t.id];
        else allocations[t.id] = Math.max(minAlloc, per);
      }
    }

    // Commit allocations in a batch
    try {
      const batch = writeBatch(db);
      for (const t of tasksInCat) {
        const ref = doc(db, "projects", String(projectId), "tasks", t.id);
        batch.update(ref, { allocatedTimeMs: allocations[t.id] });
      }
      await batch.commit();
    } catch (err) {
      console.error('recalcCategoryAllocations commit failed', err);
    }
  };

  // Reset allocations for a category: evenly divide the category time among all tasks and clear manualAllocation
  const resetCategoryAllocation = async (cat: string) => {
    if (!projectId || !kickoffDate || !deadlineDate) return;
    const tasksInCat = tasksByCategory[cat] || [];
    if (tasksInCat.length === 0) return;
    const totalMs = deadlineDate.getTime() - kickoffDate.getTime();
    const categoryMs = totalMs / allCategories.length;
    const minAlloc = 60 * 1000;
    const perTask = Math.max(minAlloc, categoryMs / tasksInCat.length);

    try {
      const batch = writeBatch(db);
      for (const t of tasksInCat) {
        const ref = doc(db, "projects", String(projectId), "tasks", t.id);
        batch.update(ref, { allocatedTimeMs: perTask, manualAllocation: false });
      }
      await batch.commit();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };

  // Detect when task counts per category change (new tasks added) and trigger recalculation
  useEffect(() => {
    const currentCounts: Record<string, number> = {};
    for (const cat of Object.keys(tasksByCategory)) currentCounts[cat] = tasksByCategory[cat].length;
    const prev = prevCategoryCountsRef.current || {};
    for (const cat of Object.keys(currentCounts)) {
      const prevCount = prev[cat] || 0;
      const curCount = currentCounts[cat];
      if (curCount > prevCount) {
        // new task(s) added to this category -> recalc
        recalcCategoryAllocations(cat);
      }
    }
    prevCategoryCountsRef.current = currentCounts;
  }, [tasksByCategory, kickoffDate, deadlineDate, allCategories, projectId]);

  // Calculate durations with useMemo
  const taskDurations = React.useMemo(() => {
    if (!kickoffDate || !deadlineDate || allCategories.length === 0) return {};
    const totalMs = deadlineDate.getTime() - kickoffDate.getTime();
    const categoryMs = totalMs / allCategories.length;
    const result: { [cat: string]: { [taskId: string]: number } } = {};
    allCategories.forEach(cat => {
      const tasksInCat = tasksByCategory[cat] || [];
      if (tasksInCat.length > 0) {
        const perTaskMs = categoryMs / tasksInCat.length;
        result[cat] = {};
        tasksInCat.forEach(task => {
          result[cat][task.id] = perTaskMs;
        });
      }
    });
    return result;
  }, [kickoffDate, deadlineDate, allCategories, tasksByCategory]);

  // Compute sequential category date spans (categories executed in sequence)
  const categorySpans = React.useMemo(() => {
    if (!kickoffDate || !deadlineDate || effectiveCategoryOrder.length === 0) return {} as Record<string, { start: Date; end: Date }>;
    const totalMs = deadlineDate.getTime() - kickoffDate.getTime();
    const per = totalMs / effectiveCategoryOrder.length;
    const result: Record<string, { start: Date; end: Date }> = {};
    effectiveCategoryOrder.forEach((cat, i) => {
      const start = new Date(kickoffDate.getTime() + Math.round(i * per));
      const end = new Date(kickoffDate.getTime() + Math.round((i + 1) * per));
      result[cat] = { start, end };
    });
    return result;
  }, [kickoffDate, deadlineDate, effectiveCategoryOrder]);

  // Handler to update task status (e.g., mark as complete)
  const handleUpdateTaskStatus = async (taskId: string, completed: boolean) => {
    if (!projectId) return;
    try {
      const taskRef = doc(db, "projects", String(projectId), "tasks", taskId);
      await updateDoc(taskRef, { completed });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };

  // Handler to delete a task
  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;
    try {
      const taskRef = doc(db, "projects", String(projectId), "tasks", taskId);
      await deleteDoc(taskRef);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };

  return (
    <>
      <div className={headerStyles.header}>
        <BackButton />
        <InviteForm
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          onInvite={handleInvite}
          error={error}
        />
        <button type="button" onClick={() => router.push(`/project/${projectId}/taskflow`)}>
          View Task Graph
        </button>
      </div>
 
       <div className={styles.main}>
         <div className={styles.createSection}>
           <TaskCreationForm
             title={title}
             setTitle={setTitle}
             description={description}
             setDescription={setDescription}
             category={category}
             setCategory={setCategory}
             newCategory={newCategory}
             setNewCategory={setNewCategory}
             categories={allCategories}
             error={error}
             onSubmit={handleCreateTask}
           />
           <CollaboratorsList
             collaborators={collaborators}
             projectOwner={projectOwner}
             userEmail={user?.email}
             onKick={handleKickCollaborator}
             onLeave={handleLeaveProject}
           />
           <PendingInvitesList
             pendingInvites={pendingInvites}
             isOwner={!!(user?.email && projectOwner && user.email.trim().toLowerCase() === projectOwner.trim().toLowerCase())}
             onRemove={async (email) => {
               try {
                 const projectRef = doc(db, "projects", String(projectId));
                 await updateDoc(projectRef, {
                   pendingInvites: pendingInvites.filter(e => e.email !== email),
                 });
               } catch (err) {
                 if (err instanceof Error) setError(err.message);
                 else setError(String(err));
               }
             }}
           />
         </div>
 
         <div className={styles.projectsSection}>
          <div style={{ marginBottom: 12 }}>
            <h1 onDoubleClick={() => startEditProjectField("title", projectTitle)}>
              Project:{" "}
              {editingProjectField === "title" ? (
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

            <div className={projectStyles.metadata}>
              <div onDoubleClick={() => startEditProjectField("kickoff", kickoffDate ? kickoffDate.toISOString().slice(0,10) : "")}>
                <strong>Kickoff:</strong>{" "}
                {editingProjectField === "kickoff" ? (
                  <input
                    type="date"
                    value={projectEditValue}
                    onChange={(e) => setProjectEditValue(e.target.value)}
                    onBlur={saveProjectField}
                    autoFocus
                  />
                ) : kickoffDate ? kickoffDate.toLocaleDateString() : <em>—</em>}
              </div>

              <div onDoubleClick={() => startEditProjectField("deadline", deadlineDate ? deadlineDate.toISOString().slice(0,10) : "")}>
                <strong>Deadline:</strong>{" "}
                {editingProjectField === "deadline" ? (
                  <input
                    type="date"
                    value={projectEditValue}
                    onChange={(e) => setProjectEditValue(e.target.value)}
                    onBlur={saveProjectField}
                    autoFocus
                  />
                ) : deadlineDate ? deadlineDate.toLocaleDateString() : <em>—</em>}
              </div>
            </div>

            {/* Categories are editable from the draggable columns in TaskCategoryList now. */}
          </div>
 
           <TaskCategoryList
             tasksByCategory={tasksByCategory}
             categoryOrder={effectiveCategoryOrder}
             onCategoryOrderChange={handleCategoryOrderChange}
             onRenameCategory={renameCategory}
             onUpdateTaskStatus={handleUpdateTaskStatus}
             onDeleteTask={handleDeleteTask}
             onAdjustAllocation={adjustTaskAllocation}
              onResetCategoryAllocation={resetCategoryAllocation}
              categorySpans={categorySpans}
              kickoffDate={kickoffDate}
              deadlineDate={deadlineDate}
             taskDurations={taskDurations}
             projectId={String(projectId)}
 
           />
         </div>
       </div>
     </>
   );
 };

import type { GetServerSidePropsContext } from "next";
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as { id: string };
  // You can fetch project data here if needed and pass as props
  return {
    props: { id },
  };
 }

 export default ProjectPage;
