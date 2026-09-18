import ProjectCards from "./ProjectCards";



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

  return <ProjectCards projects={projects} completion={completion} collaboration />;
};

export default CollaborationProjectsList;
