import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/router";
import { getFirestore, collection, addDoc, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { app } from "../../firebase/config";
import TaskCreationForm from "../../components/TaskCreationForm";
import TaskCategoryList from "../../components/TaskCategoryList";
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
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
    return () => unsub();
  }, [projectId, user]);

  // Get unique categories from tasks
  const categories = Array.from(new Set(tasks.map(t => t.category)));

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

  // Group tasks by category
  const tasksByCategory: { [cat: string]: Task[] } = {};
  tasks.forEach(task => {
    if (!tasksByCategory[task.category]) tasksByCategory[task.category] = [];
    tasksByCategory[task.category].push(task);
  });

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
        categories={categories}
        error={error}
        onSubmit={handleCreateTask}
      />
      <TaskCategoryList tasksByCategory={tasksByCategory} categories={categories} />
    </div>
  );
};

export default ProjectPage;
