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

const CollaborationProjectsList: React.FC<Props> = ({ projects }) => (
  <>
    <h2>Collaboration Projects</h2>
    <ul>
      {projects.map(p => (
        <li key={p.id}>
          <Link href={`/project/${p.id}`}>{p.title}</Link> (Owner: {p.owner}, Kick: {p.kickDate}, Deadline: {p.deadline})
        </li>
      ))}
    </ul>
  </>
);

export default CollaborationProjectsList;
