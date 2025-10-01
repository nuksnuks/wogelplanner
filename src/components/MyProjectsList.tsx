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

const MyProjectsList: React.FC<Props> = ({ projects }) => (
  <>
    <h2>My Projects</h2>
    <ul>
      {projects.map(p => (
        <li key={p.id}>
          <Link href={`/project/${p.id}`}>{p.title}</Link> (Kick: {p.kickDate}, Deadline: {p.deadline})
        </li>
      ))}
    </ul>
  </>
);

export default MyProjectsList;
