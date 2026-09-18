import Head from "next/head";
import BackButton from "../components/BackButton";
import InviteForm from "../components/InviteForm";
import TaskCreationForm from "../components/TaskCreationForm";
import CollaboratorsList from "../components/CollaboratorsList";
import PendingInvitesList from "../components/PendingInvitesList";
import PreviewTaskBoard from "../components/PreviewTaskBoard";
import { previewCategories, previewKickoff as kickoff, previewDeadline as deadline, formatPreviewDate, previewNoop as noop } from "../components/previewData";
import styles from "../styles/overview.module.css";
import headerStyles from "../styles/header.module.css";
import projectStyles from "../styles/project.module.css";

export default function ProjectPreview() {
  return <>
    <Head><title>WogelPlanner project board preview</title><meta name="robots" content="noindex" /></Head>
    <div inert>
      <div className={headerStyles.header}>
        <BackButton />
        <InviteForm inviteEmail="" setInviteEmail={noop} onInvite={noop} />
        <button type="button">View Task Graph</button>
      </div>
      <div className={styles.main}>
        <div className={styles.createSection}>
          <TaskCreationForm title="" setTitle={noop} description="" setDescription={noop} category="" setCategory={noop} newCategory="" setNewCategory={noop} categories={previewCategories} error="" onSubmit={noop} />
          <CollaboratorsList collaborators={["alex@example.com"]} projectOwner="you@example.com" userEmail="you@example.com" onKick={noop} onLeave={noop} />
          <PendingInvitesList pendingInvites={[]} isOwner onRemove={noop} />
        </div>
        <div className={styles.projectsSection}>
          <div style={{ marginBottom: 12 }}>
            <h1>Project: Website redesign</h1>
            <div className={projectStyles.metadata}>
              <div><strong>Kickoff:</strong> {formatPreviewDate(kickoff)}</div>
              <div><strong>Deadline:</strong> {formatPreviewDate(deadline)}</div>
            </div>
          </div>
          <PreviewTaskBoard />
        </div>
      </div>
    </div>
  </>;
}
