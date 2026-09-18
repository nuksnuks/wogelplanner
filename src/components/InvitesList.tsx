import styles from "../styles/projectsList.module.css";

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
    <div className={styles.projectList}>
        {invites.length === 0 && <p className={styles.empty}>You’re all caught up. No project invitations right now.</p>}
      {invites.map((p) => (
        <div key={p.id} className={styles.projectItem}>
          <h3>
            {p.title} 
          </h3>
          <span>By {p.owner}</span>
          <br />
          <button onClick={() => onRespond(p.id, true)} style={{ marginLeft: 8 }}>
            Accept
          </button>
          <button onClick={() => onRespond(p.id, false)} className="deleteButton">
            Deny
          </button>
        </div>
      ))}
    </div>
  </>
);

export default InvitesList;
