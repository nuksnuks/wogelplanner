import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, query, onSnapshot, doc, updateDoc, onSnapshot as onDocSnapshot } from "firebase/firestore";
import { app } from "../../../firebase/config";
import TaskFlowView from "../../../components/TaskFlowView";
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
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <div >
      <BackButton />
      <h1>Task Graph</h1>
      {/* Pass projectId for updating positions */}
      <TaskFlowView tasks={tasks} projectId={projectId as string} edges={edges} setEdges={handleSetEdges} />
    </div>
  );
};

export default TaskFlowPage;
