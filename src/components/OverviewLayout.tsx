import type { ReactNode } from "react";
import Image from "next/image";
import styles from "../styles/overview.module.css";
import headerStyles from "../styles/header.module.css";

export default function OverviewLayout({ accountAction, createForm, children }: {
  accountAction: ReactNode;
  createForm: ReactNode;
  children: ReactNode;
}) {
  return <div>
    <div className={headerStyles.header}>
      <div className={headerStyles.brand}>
        <Image src="/wogelplanner-logo.svg" alt="wogelplanner logo" className={headerStyles.logo} width={100} height={100} />
        <span>WogelPlanner</span>
      </div>
      {accountAction}
    </div>
    <div className={styles.main}>
      <div className={styles.createSection}>{createForm}</div>
      <div className={styles.projectsSection}>
        <p className={styles.eyebrow}>Your workspace</p>
        <h1>Projects overview</h1>
        <p className={styles.subtitle}>A clear view of what’s happening. More space to focus on what’s next.</p>
        {children}
      </div>
    </div>
  </div>;
}
