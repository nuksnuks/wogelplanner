import Link from "next/link";
import styles from "../styles/projectsList.module.css";
import link from "../styles/links.module.css";

type Project = { id: string; title: string; deadline: string; owner: string };

export default function ProjectCards({ projects, completion, collaboration = false }: {
  projects: Project[];
  completion: Record<string, number>;
  collaboration?: boolean;
}) {
  return <>
    <h2>{collaboration ? "Collaboration Projects" : "My Projects"}</h2>
    <div className={styles.projectList} data-tour={collaboration ? "collaboration" : "project-list"}>
      {projects.length === 0 && <p className={styles.empty}>{collaboration
        ? "Shared projects will appear here when you join a team."
        : "Your next project starts here. Create a project to get going."}</p>}
      {projects.map(p => <div className={styles.projectItem} key={p.id}>
        <h3><Link href={`/project/${p.id}`} className={link.projectLink}>{p.title}</Link></h3>
        {collaboration && <><span>Owner: {p.owner}</span><br /></>}
        <span>Deadline: {p.deadline}</span><br />
        {typeof completion[p.id] === "number" && <div>
          <span>Completion: {completion[p.id]}%</span>
          <progress className={styles.progress} value={completion[p.id]} max={100} aria-label={`${p.title} completion`} />
        </div>}
      </div>)}
    </div>
  </>;
}
