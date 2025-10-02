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
  invites: Project[];
  onRespond: (projectId: string, accept: boolean) => void;
};

const InvitesList: React.FC<Props> = ({ invites, onRespond }) => (
  <>
    <h2>Invites</h2>
    <ul>
      {invites.map(p => (
        <li key={p.id}>
          {p.title} (Owner: {p.owner})
          <button onClick={() => onRespond(p.id, true)} style={{ marginLeft: 8 }}>Accept</button>
          <button onClick={() => onRespond(p.id, false)} style={{ marginLeft: 4 }}>Deny</button>
        </li>
      ))}
    </ul>
  </>
);

export default InvitesList;
