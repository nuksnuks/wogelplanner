import { useState } from "react";
import { useRouter } from "next/router";
import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";
import { app } from "../firebase/config";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail } from "react-icons/hi";
import AuthLayout from "../components/auth/AuthLayout";

export default function Login() {
    const auth = getAuth(app);
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
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

    return (
        <AuthLayout title="Login" error={error}>
            <form onSubmit={handleLogin}>
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
                    <HiOutlineMail style={{ marginRight: 8 }} />
                    Login with Email
                </button>

                <hr />

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    style={{ width: "100%" }}
                >
                    <FcGoogle style={{ marginRight: 8 }} />
                    Continue with Google
                </button>

                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    Don&apos;t have an account?{" "}
                    <button
                        type="button"
                        onClick={() => router.push("/signup")}
                        style={{
                            color: "blue",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        Sign Up
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
}