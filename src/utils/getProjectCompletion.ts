import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../firebase/config";

const db = getFirestore(app);

export async function getProjectCompletion(projectId: string): Promise<{ completed: number; total: number; percent: number }> {
  const tasksCol = collection(db, "projects", projectId, "tasks");
  const snap = await getDocs(tasksCol);
  const total = snap.size;
  let completed = 0;
  snap.forEach(doc => {
    const data = doc.data();
    if (data.completed) completed++;
  });
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
