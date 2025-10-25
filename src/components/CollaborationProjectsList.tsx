import styles from "../styles/projectsList.module.css"
import link from "../styles/links.module.css";

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

const CollaborationProjectsList: React.FC<Props> = ({ projects }) => {
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
      <h2>Collaboration Projects</h2>
      <div className={styles.projectList}>
        {projects.map((p) => (
          <div key={p.id} className={styles.projectItem}>
            <h3>
              <Link href={`/project/${p.id}`} className={link.projectLink}>
                {p.title}
              </Link>
            </h3>
            <span>Owner: {p.owner}</span>
            <br />
            <span>Deadline: {p.deadline}</span>
            <br />
            {typeof completion[p.id] === "number" && (
              <span>Completion: {completion[p.id]}%</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default CollaborationProjectsList;
