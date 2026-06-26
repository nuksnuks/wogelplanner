import { useState } from "react";
import { useRouter } from "next/router";
import {
    getAuth,
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";
import { app } from "../firebase/config";
import { FcGoogle } from "react-icons/fc";
import AuthLayout from "../components/auth/AuthLayout";

export default function Signup() {
    const auth = getAuth(app);
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await createUserWithEmailAndPassword(auth, email, password);

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: username,
                });
            }

            router.push("/overview");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const handleGoogleSignup = async () => {
        setError("");

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push("/overview");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    return (
        <AuthLayout title="Create Account" error={error}>
            <form onSubmit={handleSignup}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit" style={{ width: "100%" }}>
                    Create Account
                </button>

                <hr />

                <button
                    type="button"
                    onClick={handleGoogleSignup}
                    style={{ width: "100%" }}
                >
                    <FcGoogle style={{ marginRight: 8 }} />
                    Continue with Google
                </button>

                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() => router.push("/login")}
                        style={{
                            color: "blue",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        Login
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
}