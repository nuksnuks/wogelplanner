
import { useState } from "react";
import { useRouter } from "next/router";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { app } from "../firebase/config";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail } from "react-icons/hi";
import styles from "../styles/forms.module.css";
import Image from "next/image";

const Index: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const auth = getAuth(app);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/overview");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push("/overview");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: username });
            }
            router.push("/overview");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    return (
        <div className={styles.forms}>
            <form 
                onSubmit={isSignup ? handleSignup : handleEmailLogin} 
                >
                <div style={{ backgroundColor: "#ffffffff;", borderRadius: "100pc" , padding: "1rem" }}>
                    <Image src="/wogelplanner-logo.svg" alt="Wogelplanner Logo" width={100} height={100} />
                </div>
                <h1>{isSignup ? "Sign Up" : "Login"}</h1>
                {isSignup && (
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button 
                    type="submit"
                    style={{ width: "100%" }}
                >
                {isSignup ? "Sign Up" : <> 
                    <HiOutlineMail style={{ marginRight: 8 }} /> 
                    Login with Email
                    </>}
                </button>
                <hr />
                <button 
                    onClick={handleGoogleLogin} 
                    style={{ width: "100%" }}
                >
                    <FcGoogle style={{ marginRight: 8 }} />
                    Login with Google
                </button>
                <div style={{ textAlign: "center" }}>
                    {isSignup ? (
                        <>
                            Already have an account?&nbsp;
                            <button 
                                type="button" 
                                onClick={() => setIsSignup(false)} 
                                style={{ color: "blue", background: "none", border: "none", cursor: "pointer"}}
                            >
                            Login
                            </button>
                        </>
                    ) : (
                        <>
                            Don&apos;t have an account?&nbsp;
                            <button 
                                type="button" 
                                onClick={() => setIsSignup(true)} 
                                style={{ color: "blue", background: "none", border: "none", cursor: "pointer" }}>
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default Index;