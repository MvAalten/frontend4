import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase"; // db must be initialized with getFirestore()

function Register() {
    // State for form input and error handling
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Handle form submission and user registration
    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        try {
            // Create user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user data to Firestore under 'users' collection with UID as document ID
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                createdAt: new Date()
            });

            alert("Registered and saved to Firestore");
        } catch (err) {
            // Display any error messages
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* Email input */}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="w-full p-2 border rounded"
                    />
                    {/* Password input */}
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full p-2 border rounded"
                    />
                    {/* Submit button */}
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                        Register
                    </button>
                </form>
                {/* Error display */}
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
        </div>
    );
}

export default Register;
