import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./components/Login";
import UpdateProfile from "./components/UpdateProfile";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDIab5pd5vj0hSCa1AisTB1Cy1t2t-Ngbk",
    authDomain: "l2p4frontend.firebaseapp.com",
    projectId: "l2p4frontend",
    storageBucket: "l2p4frontend.appspot.com",
    messagingSenderId: "439165311953",
    appId: "1:439165311953:web:3d5465838296978009def0",
    measurementId: "G-MH08GCCV0P",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function GymTok() {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const userList = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    username: data.username || "No username",
                    email: data.email || "No email",
                    password: data.password || "No password",
                };
            });
            setUsers(userList);
        });
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            alert("Logged out!");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-black flex items-center justify-center text-white text-2xl">
                Loading...
            </div>
        );
    }

    if (showLogin && !currentUser) {
        return (
            <div className="min-h-screen bg-black text-white p-6">
                <button
                    onClick={() => setShowLogin(false)}
                    className="mb-4 bg-white text-black px-4 py-2 rounded"
                >
                    ← Back
                </button>
                <Login onLoginSuccess={() => setShowLogin(false)} />
            </div>
        );
    }

    return (
        <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black text-white">
            {/* Fixed top bar */}
            <div className="fixed top-0 w-full z-50 bg-black bg-opacity-70 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-800">
                <h1 className="text-2xl font-bold tracking-wider text-purple-400">GymTok 💪</h1>
                {currentUser ? (
                    <div className="text-right text-sm">
                        <p className="text-gray-300">👤 {currentUser.email}</p>
                        <button
                            onClick={handleSignOut}
                            className="mt-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowLogin(true)}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold"
                    >
                        Login
                    </button>
                )}
            </div>

            {/* Scrollable user feed */}
            <div className="pt-20">
                {users.length > 0 ? (
                    users.map((user, index) => (
                        <div
                            key={user.id}
                            className="snap-center h-screen flex flex-col justify-center items-center px-6 relative"
                        >
                            <div className="w-full max-w-md rounded-2xl shadow-xl p-6 bg-white/10 backdrop-blur-md border border-white/20 text-center">
                                <h2 className="text-3xl font-bold text-purple-400">@{user.username}</h2>
                                <p className="text-gray-300 mt-2">📧 {user.email}</p>
                                <p className="text-gray-400 mt-1">
                                    🔐 {user.password === "google_auth" ? "Google Auth" : user.password}
                                </p>
                                {currentUser && currentUser.uid === user.id && (
                                    <div className="mt-3 inline-block px-3 py-1 text-xs font-semibold bg-green-600 rounded-full">
                                        That's you!
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-screen flex items-center justify-center text-gray-400">
                        No users yet.
                    </div>
                )}
            </div>

            {/* Floating action buttons */}
            {!currentUser && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={() => setShowLogin(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-full shadow-lg text-lg font-semibold"
                    >
                        Join GymTok
                    </button>
                </div>
            )}

            {/* Profile Update floating panel */}
            {currentUser && (
                <div className="fixed bottom-6 left-6 z-50">
                    <UpdateProfile />
                </div>
            )}
        </div>
    );
}

export default GymTok;
