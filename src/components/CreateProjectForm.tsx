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
    <form 
        className={styles.forms}
        onSubmit={e => {
            e.preventDefault();
            onCreate(title, kickDate, deadline, projectOwner);
            setTitle(""); setKickDate(""); setDeadline("");
        }}
    >
      <input type="text" placeholder="Project Title" value={title} onChange={e => setTitle(e.target.value)} required />
      <input type="date" placeholder="Kick Date" value={kickDate} onChange={e => setKickDate(e.target.value)} required />
      <input type="date" placeholder="Deadline" value={deadline} onChange={e => setDeadline(e.target.value)} required />
      <button type="submit">Create Project</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default CreateProjectForm;
