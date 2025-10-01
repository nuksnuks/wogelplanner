import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/router";
import { getFirestore, collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { app } from "../../firebase/config";
import TaskCreationForm from "../../components/TaskCreationForm";
import TaskCategoryList from "../../components/TaskCategoryList";
import TaskFlowView from "../../components/TaskFlowView";
import PendingInvitesList from "../../components/PendingInvitesList";
import CollaboratorsList from "../../components/CollaboratorsList";
import InviteForm from "../../components/InviteForm";

const db = getFirestore(app);

type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  position?: { x: number; y: number };
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
          const filtered = data.pendingInvites.filter((inv: any) => inv.invitedAt && now - inv.invitedAt < 30 * 24 * 60 * 60 * 1000);
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
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
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

  // Listen for categoryOrder in Firestore (sync only on Firestore change, not allCategories change)
  useEffect(() => {
    if (!projectId || !user) return;
    const projectRef = doc(db, "projects", String(projectId));
    const unsub = onSnapshot(projectRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // If order exists, use it, else fallback to allCategories
        if (Array.isArray(data.categoryOrder)) {
          const firestoreOrder = data.categoryOrder.filter((cat: string) => allCategories.includes(cat)).concat(allCategories.filter(cat => !data.categoryOrder.includes(cat)));
          setCategoryOrder(firestoreOrder);
        } else {
          setCategoryOrder(allCategories);
        }
      }
    });
    return () => unsub();
  }, [projectId, user, allCategories]);

  // Handler to update category order in Firestore
  const handleCategoryOrderChange = async (newOrder: string[]) => {
    setCategoryOrder(newOrder);
    if (!projectId) return;
    try {
      const projectRef = doc(db, "projects", String(projectId));
      await updateDoc(projectRef, { categoryOrder: newOrder });
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Group tasks by category, skip tasks with missing/empty category
  const tasksByCategory: { [cat: string]: Task[] } = {};
  tasks.forEach(task => {
    if (!task.category) return;
    if (!tasksByCategory[task.category]) tasksByCategory[task.category] = [];
    tasksByCategory[task.category].push(task);
  });

  // Handler to update task status (e.g., mark as complete)
  const handleUpdateTaskStatus = async (taskId: string, completed: boolean) => {
    if (!projectId) return;
    try {
      const taskRef = doc(db, "projects", String(projectId), "tasks", taskId);
      await updateDoc(taskRef, { completed });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handler to delete a task
  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;
    try {
      const taskRef = doc(db, "projects", String(projectId), "tasks", taskId);
      await deleteDoc(taskRef);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24 }}>
      <h1>Project: {projectTitle}</h1>
      <InviteForm
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        onInvite={handleInvite}
        error={error}
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
          } catch (err: any) {
            setError(err.message);
          }
        }}
      />
      <CollaboratorsList
        collaborators={collaborators}
        projectOwner={projectOwner}
        userEmail={user?.email}
        onKick={handleKickCollaborator}
        onLeave={handleLeaveProject}
      />
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
      <TaskCategoryList
        tasksByCategory={tasksByCategory}
        categories={allCategories}
        categoryOrder={effectiveCategoryOrder}
        onCategoryOrderChange={handleCategoryOrderChange}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};

export default ProjectPage;
