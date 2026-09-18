import { useRouter } from "next/router";
import Image from "next/image";
import AppPreview from "../components/AppPreview";
import { FiArrowUpRight, FiArrowRight, FiLayers, FiCheckCircle, FiCalendar, FiTrendingUp } from "react-icons/fi";
import styles from "../styles/landing.module.css";
export default function Home() {
 const router = useRouter();
 return <main className={styles.container}>
  <nav className={styles.nav} aria-label="Main navigation">
   <div className={styles.brand}><Image src="/wogelplanner-logo.svg" alt="" width={36} height={36} /><span>WogelPlanner<span className={styles.brandDot}>.</span></span></div>
   <button className={styles.loginButton} onClick={() => router.push("/login")}>Log in <FiArrowUpRight /></button>
  </nav>
  <section className={styles.hero}>
   <div className={styles.heroCopy}>
    <div className={styles.eyebrow}><span /> A little structure. A lot of possibility.</div>
    <h1>Big ideas.<br />Clear plans.<br /><span>Real progress.</span></h1>
    <p>Your projects, priorities, and people. All in one calm workspace, so you can spend less time keeping track and more time moving forward.</p>
    <div className={styles.buttons}>
     <button className={styles.primary} onClick={() => router.push("/signup")}>Get started <FiArrowRight /></button>
     <button className={styles.secondary} onClick={() => router.push("/login")}>Back to your workspace <FiArrowUpRight /></button>
    </div>
    <div className={styles.heroNote}><span /> Make room for your best work.</div>
   </div>
   <AppPreview />
  </section>
  <section className={styles.featureSection}>
   <div className={styles.sectionHeading}><p className={styles.eyebrow}>BUILT FOR YOUR EVERYDAY</p><h2>Everything in its place.<br />You, in your flow.</h2><p>From the first idea to the final checkmark,<br />keep the whole picture in view.</p></div>
   <div className={styles.features}>
    <div className={styles.card}><FiLayers /><h3>A clearer overview</h3><p>Give every project a home. See what happens without losing the bigger picture.</p><span>01 / ORGANIZE</span></div>
    <div className={styles.card}><FiCheckCircle /><h3>Focus on the next step</h3><p>Turn big plans into manageable tasks, organized into categories that work for you.</p><span>02 / PRIORITIZE</span></div>
    <div className={styles.card}><FiCalendar /><h3>Keep your rhythm</h3><p>Bring kickoff dates, deadlines, and task timelines together in one clear view.</p><span>03 / PLAN</span></div>
    <div className={styles.card}><FiTrendingUp /><h3>See your progress</h3><p>Follow your projects as they move forward. Every completed task counts.</p><span>04 / GROW</span></div>
   </div>
  </section>
  <section className={styles.showcase} aria-labelledby="showcase-title">
   <div className={styles.showcaseHeading}>
    <p className={styles.eyebrow}>TAKE A CLOSER LOOK</p>
    <h2 id="showcase-title">From the big picture to the next task.</h2>
    <p>Explore the views that bring your projects into focus.</p>
   </div>
   <div className={styles.showcaseRow}>
    <div className={styles.showcaseCopy}>
     <FiLayers aria-hidden="true" />
     <h3>A place for every task.</h3>
     <p>Organize tasks by category, see your timeline, and keep completed work in view. Your project details and collaborators sit right alongside your plan.</p>
    </div>
    <AppPreview view="project" />
   </div>
   <div className={styles.showcaseRow}>
    <div className={styles.showcaseCopy}>
     <FiTrendingUp aria-hidden="true" />
     <h3>See how the work connects.</h3>
     <p>The task graph gives your plan another perspective. Follow the connections between tasks and see which steps are already complete.</p>
    </div>
    <AppPreview view="graph" />
   </div>
  </section>
  <footer className={styles.footer}><span>WogelPlanner.</span><p>Less keeping track. More moving forward.</p><span>Made for a little more clarity.</span></footer>
 </main>;
}
