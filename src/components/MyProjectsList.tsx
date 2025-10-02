type Project = {
  id: string;
  title: string;
  kickDate: string;
  deadline: string;
  owner: string;
  collaborators: string[];
  pendingInvites?: { email: string; invitedAt: number }[];
};

type Props = {
  projects: Project[];
};


import Link from "next/link";


import { useEffect, useState } from "react";
import { getProjectCompletion } from "../utils/getProjectCompletion";

const MyProjectsList: React.FC<Props> = ({ projects }) => {
  const [completion, setCompletion] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    projects.forEach((p) => {
      getProjectCompletion(p.id).then((res) => {
        setCompletion((prev) => ({ ...prev, [p.id]: res.percent }));
      });
    });
  }, [projects]);

  return (
    <>
      <h2>My Projects</h2>
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            <Link href={`/project/${p.id}`}>{p.title}</Link> (Kick: {p.kickDate}, Deadline: {p.deadline})
            {typeof completion[p.id] === 'number' && (
              <> — Completion: {completion[p.id]}%</>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

export default MyProjectsList;
