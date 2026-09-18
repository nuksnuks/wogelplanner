import { useState } from "react";
import styles from "../styles/forms.module.css";

type Props = {
  onCreate: (title: string, kickDate: string, deadline: string, projectOwner: string) => void;
  error: string;
  projectOwner: string;
};

const CreateProjectForm: React.FC<Props> = ({ onCreate, error, projectOwner }) => {
  
  const [title, setTitle] = useState("");
  const [kickDate, setKickDate] = useState("");
  const [deadline, setDeadline] = useState("");

  return (
    <div className={styles.forms} data-tour="create-project">
    <form 
        
        onSubmit={e => {
            e.preventDefault();
            onCreate(title, kickDate, deadline, projectOwner);
            setTitle(""); setKickDate(""); setDeadline("");
        }}
    >
      <h2>New project</h2>
      <label>Project name<input type="text" placeholder="Project Title" value={title} onChange={e => setTitle(e.target.value)} required /></label>
      <label>Kickoff date<input type="date" placeholder="Kick Date" value={kickDate} onChange={e => setKickDate(e.target.value)} required /></label>
      <label>Deadline<input type="date" placeholder="Deadline" value={deadline} onChange={e => setDeadline(e.target.value)} required /></label>
      <button type="submit">Create Project</button>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
    </form>
    </div>
  );
};

export default CreateProjectForm;
