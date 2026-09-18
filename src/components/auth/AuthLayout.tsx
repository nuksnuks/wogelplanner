import Image from "next/image";
import styles from "../../styles/forms.module.css";

interface AuthLayoutProps {
    title: string;
    children: React.ReactNode;
    error?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
    title,
    children,
    error,
}) => {
    return (
        <div className={`${styles.forms} ${styles.auth}`}>
            <div className={styles.logoCircle}>
                <Image
                    src="/wogelplanner-logo.svg"
                    alt="WogelPlanner Logo"
                    width={64}
                    height={64}
                    priority
                />
            </div>

            <h1>{title}</h1>

            <p>A little clarity. A lot of progress.</p>
            {children}

            {error && (
                <p style={{ color: "var(--danger)", marginTop: "1rem" }}>
                    {error}
                </p>
            )}
        </div>
    );
};

export default AuthLayout;