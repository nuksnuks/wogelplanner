import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../styles/landing.module.css";

export default function Home() {
    const router = useRouter();

    return (
        <main className={styles.container}>
            <nav className={styles.nav}>
                <div className={styles.brand}>
                    <Image
                        src="/wogelplanner-logo.svg"
                        alt="WogelPlanner"
                        width={45}
                        height={45}
                    />
                    <span>WogelPlanner</span>
                </div>

                <button
                    className={styles.loginButton}
                    onClick={() => router.push("/login")}
                >
                    Login
                </button>
            </nav>

            <section className={styles.hero}>
                <Image
                    src="/wogelplanner-logo.svg"
                    alt="WogelPlanner Logo"
                    width={140}
                    height={140}
                />

                <h1>Plan smarter.</h1>

                <h2>Prioritize better. Finish projects with confidence.</h2>

                <p>
                    WogelPlanner helps you organize projects, prioritize tasks,
                    and keep track of deadlines—all in one intuitive workspace.
                </p>

                <div className={styles.buttons}>
                    <button
                        className={styles.primary}
                        onClick={() => router.push("/signup")}
                    >
                        Get Started
                    </button>

                    <button
                        className={styles.secondary}
                        onClick={() => router.push("/login")}
                    >
                        Login
                    </button>
                </div>
            </section>

            <section className={styles.features}>
                <div className={styles.card}>
                    <h3>📁 Project Overview</h3>
                    <p>Keep every project organized in one place.</p>
                </div>

                <div className={styles.card}>
                    <h3>✅ Smart Priorities</h3>
                    <p>Focus on the most important tasks first.</p>
                </div>

                <div className={styles.card}>
                    <h3>📅 Deadlines</h3>
                    <p>Never miss important milestones again.</p>
                </div>

                <div className={styles.card}>
                    <h3>📊 Progress Tracking</h3>
                    <p>See how your projects evolve over time.</p>
                </div>
            </section>

            <section className={styles.preview}>
                <h2>Built for productivity</h2>

                <div className={styles.previewPlaceholder}>
                    App Preview
                    <br />
                    (Screenshot, Blender animation or video goes here)
                </div>
            </section>

            <footer className={styles.footer}>
                <p>Made with ❤️ using Next.js & Firebase</p>
            </footer>
        </main>
    );
}