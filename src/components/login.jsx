import React, { useState } from "react";
import {
    signInWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase"; // adjust path as needed

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Logged in successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        try {
            await signInWithPopup(auth, googleProvider);
            alert("Google sign-in successful!");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full p-2 border rounded"
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                        Login with Email
                    </button>
                </form>

                <div className="my-4 text-center">or</div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
                >
                    Login with Google
                </button>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
        </div>
    );
}

export default Login;
