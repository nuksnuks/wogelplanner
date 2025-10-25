import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { app } from "../firebase/config";

import CreateProjectForm from "../components/CreateProjectForm";
import MyProjectsList from "../components/MyProjectsList";
import CollaborationProjectsList from "../components/CollaborationProjectsList";
import InvitesList from "../components/InvitesList";
import LogoutButton from "@/components/LogoutButton";

import overviewStyles from "../styles/overview.module.css";
import headerStyles from "../styles/header.module.css";

const db = getFirestore(app);
const auth = getAuth(app);

type Project = {
  id: string;
  title: string;
  kickDate: string;
  deadline: string;
  owner: string;
  collaborators: string[];
  pendingInvites?: { email: string; invitedAt: number }[];
};

const Overview = () => {
  const [user, setUser] = useState<ReturnType<typeof getAuth>["currentUser"] | null>(null);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [collabProjects, setCollabProjects] = useState<Project[]>([]);
  const [invites, setInvites] = useState<Project[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    // My projects (owned)
    const q1 = query(collection(db, "projects"), where("owner", "==", user.email));
    const unsub1 = onSnapshot(q1, (snap) => {
      setMyProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    // Collaboration projects (user is a collaborator)
    const q2 = query(collection(db, "projects"), where("collaborators", "array-contains", user.email));
    const unsub2 = onSnapshot(q2, (snap) => {
      setCollabProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    // Invites (user is in pendingInvites)
    const unsub3 = onSnapshot(collection(db, "projects"), (snap) => {
      const invited = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Project))
        .filter(p => Array.isArray(p.pendingInvites) && p.pendingInvites.some(inv => inv.email === user.email));
      setInvites(invited);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user]);

  const handleCreateProject = async (title: string, kickDate: string, deadline: string, projectOwner: string) => {
    setError("");
    if (!title || !kickDate || !deadline) {
      setError("All fields are required.");
      return;
    }
    try {
      await addDoc(collection(db, "projects"), {
        title,
        kickDate,
        deadline,
        owner: projectOwner, // now passing email
        collaborators: [],
        pendingInvites: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleInviteResponse = async (projectId: string, accept: boolean) => {
    try {
      const project = invites.find(p => p.id === projectId);
      if (!project) return;
      const projectRef = doc(db, "projects", projectId);
      const pending = Array.isArray(project.pendingInvites) ? project.pendingInvites : [];
      if (!user) return;
      const filtered = pending.filter(inv => inv.email !== user.email);
      if (accept) {
        await updateDoc(projectRef, {
          collaborators: [...(project.collaborators || []), user.email],
          pendingInvites: filtered,
        });
      } else {
        await updateDoc(projectRef, {
          pendingInvites: filtered,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <div className={headerStyles.header}>
        <img src="/wogelplanner-logo.svg" alt="wogelplanner logo" className={headerStyles.logo}/>
        <LogoutButton />
      </div>
      <div className={overviewStyles.main}>
        <div className={overviewStyles.createSection}>
          <CreateProjectForm 
            onCreate={handleCreateProject} 
            error={error} 
            projectOwner={user?.email || ""} />
        </div>
        <div className={overviewStyles.projectsSection}>
          <h1>Projects Overview</h1>
          <MyProjectsList projects={myProjects} />
          <CollaborationProjectsList projects={collabProjects} />
          <InvitesList invites={invites} onRespond={handleInviteResponse} />
        </div>
      </div>
  </div>
  );
};

export default Overview;
