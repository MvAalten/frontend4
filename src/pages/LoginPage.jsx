import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebase/firebase.jsx"; // adjust the path if needed

const auth = getAuth(app);

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in successfully!");
            // Redirect or show a message
        } catch (err) {
            setError(err.message || "Login failed");
        }
    };

    return (
        <div className="flex flex-col items-center w-full min-h-screen p-6 bg-[#1E1E24] text-white">
            <div className="text-center mb-6 mt-10">
                <h2 className="text-4xl font-bold">Welcome Back</h2>
                <p className="text-gray-400">Log in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="w-full max-w-md bg-[#2D2F36] p-8 rounded-lg shadow-lg">
                <div className="mb-4">
                    <label className="block mb-2 font-semibold text-lg">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded bg-[#40434E] text-white focus:outline-none"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-semibold text-lg">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded bg-[#40434E] text-white focus:outline-none"
                        required
                    />
                </div>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-[#FF6B6B] text-white py-2 px-6 rounded-full font-semibold hover:bg-[#FF4F4F] transition"
                >
                    Log In
                </button>
            </form>

            <p className="mt-4 text-gray-400">Don't have an account? <span className="text-[#FF6B6B] cursor-pointer">Sign up</span></p>
        </div>
    );
};

export default LoginPage;
