import React, { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./components/Login";
import UpdateProfile from "./components/UpdateProfile";
import UserCRUD from "./components/UserCRUD";
import PostCRUD from "./components/PostCRUD";
import ReportCRUD from "./components/ReportCRUD";

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
export const db = getFirestore(app);
export const auth = getAuth(app);

function GymTok() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'users', or 'reports'

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Fetch user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        (userDoc.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setCurrentUserData(null);
            }
            setLoading(false);
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
        <div className="min-h-screen bg-black text-white">
            {/* Fixed top bar */}
            <div className="fixed top-0 w-full z-50 bg-black bg-opacity-90 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-800">
                <h1 className="text-2xl font-bold tracking-wider text-purple-400">GymTok 💪</h1>
                {currentUser ? (
                    <div className="text-right text-sm">
                        <p className="text-gray-300">👤 {currentUserData?.username || currentUser.email}</p>
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

            {/* Tab Navigation */}
            <div className="fixed top-16 w-full z-40 bg-black bg-opacity-80 backdrop-blur-md p-2 flex justify-center border-b border-gray-800">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`px-4 py-2 rounded ${
                            activeTab === 'posts'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded ${
                            activeTab === 'users'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-4 py-2 rounded ${
                            activeTab === 'reports'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        🚨 Reports
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="pt-28 px-4 pb-6 max-w-4xl mx-auto">
                {activeTab === 'posts' && (
                    <PostCRUD currentUser={currentUser} currentUserData={currentUserData} />
                )}
                {activeTab === 'users' && (
                    <UserCRUD currentUser={currentUser} />
                )}
                {activeTab === 'reports' && (
                    <ReportCRUD currentUser={currentUser} currentUserData={currentUserData} />
                )}
            </div>

            {/* Floating action button */}
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
                <div className="fixed bottom-6 left-6 z-50 bg-gray-800 p-4 rounded-lg max-w-sm">
                    <UpdateProfile />
                </div>
            )}
        </div>
    );
}

export default GymTok;