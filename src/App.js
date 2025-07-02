import React, { useEffect, useState, useRef } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./components/Login";
import UpdateProfile from "./components/UpdateProfile";
import UserCRUD from "./components/UserCRUD";
import PostCRUD from "./components/PostCRUD";
import ReportCRUD from "./components/ReportCRUD";
import RandomQuote from "./components/RandomQuote";
import PrivacySettings from "./components/PrivacySettings";
import FriendsManager from "./components/FriendsManager";
import QuoteCRUD from "./components/QuoteCRUD";

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
    const [activeTab, setActiveTab] = useState("posts");
    const [showUpdateProfile, setShowUpdateProfile] = useState(false);

    const modalRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        setCurrentUserData(userDoc.data());
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

    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowUpdateProfile(false);
            }
        }

        if (showUpdateProfile) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUpdateProfile]);

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            alert("Logged out!");
            setShowUpdateProfile(false);
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    const handleShowLogin = () => {
        setShowLogin(true);
    };

    if (loading) {
        return (
            <div className="h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-sky-400 border-t-transparent mx-auto mb-6 shadow-lg"></div>
                    <div className="text-slate-700 text-3xl font-bold tracking-wide animate-pulse drop-shadow-sm">
                        Loading Motivated...
                    </div>
                    <div className="mt-2 text-sky-600 text-lg">Get ready to be inspired! ✨</div>
                </div>
            </div>
        );
    }

    if (showLogin && !currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-100 to-blue-200 p-6">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={() => setShowLogin(false)}
                        className="mb-6 bg-gradient-to-r from-sky-400 to-blue-500 text-white px-8 py-4 rounded-full font-bold hover:from-sky-500 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                    >
                        ← Back to Motivated
                    </button>
                    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-sky-200">
                        <Login onLoginSuccess={() => setShowLogin(false)} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 text-slate-700 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-10 -left-10 w-96 h-96 bg-gradient-to-br from-sky-200/40 to-blue-300/30 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-1/4 -right-12 w-80 h-80 bg-gradient-to-bl from-cyan-200/30 to-sky-300/40 rounded-full blur-3xl animate-float-delayed"></div>
                <div className="absolute -bottom-12 left-1/4 w-72 h-72 bg-gradient-to-tr from-indigo-200/30 to-blue-200/40 rounded-full blur-3xl animate-float-slow"></div>
                <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-gradient-to-r from-slate-200/20 to-sky-200/30 rounded-full blur-3xl animate-pulse"></div>
            </div>

            {/* Top Welcome Section */}
            <div className="relative z-10 text-center py-16">
                <h1 className="text-7xl font-extrabold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg mb-6 tracking-tight">
                    ✨ Motivated 💫
                </h1>
                <p className="text-2xl text-slate-600 font-medium mb-4">
                    Your inspiring journey starts here
                </p>
                <div className="flex justify-center space-x-2 text-3xl animate-bounce">
                    <span>🌟</span>
                    <span>💪</span>
                    <span>🚀</span>
                    <span>✨</span>
                </div>

                {/* User Info Section */}
                {currentUser && (
                    <div className="mt-8 bg-white/70 backdrop-blur-lg rounded-3xl p-6 max-w-lg mx-auto border border-sky-200 shadow-xl">
                        <p className="text-xl font-bold text-slate-700 mb-2">
                            Welcome back, {currentUserData?.username || currentUser.email}! 🎉
                        </p>
                        <p className="text-sky-600 mb-4">Ready to achieve your goals today?</p>
                        <button
                            onClick={handleSignOut}
                            className="bg-gradient-to-r from-slate-400 to-slate-500 text-white px-6 py-3 rounded-full hover:from-slate-500 hover:to-slate-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Tabs - Fixed scrolling issue */}
            <div className="relative z-40 mx-4 mb-8">
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 border border-sky-200 shadow-2xl">
                    <div className="flex justify-center">
                        <div className="flex space-x-4 flex-wrap justify-center gap-y-4">
                            {[
                                {
                                    label: "📝 Manage Quotes",
                                    tab: "manage-quotes",
                                    auth: true,
                                    colors: "from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
                                },
                                {
                                    label: "📋 Agenda",
                                    tab: "posts",
                                    colors: "from-cyan-400 to-sky-500 hover:from-cyan-500 hover:to-sky-600"
                                },
                                {
                                    label: "💭 Quotes",
                                    tab: "quotes",
                                    colors: "from-indigo-400 to-blue-500 hover:from-indigo-500 hover:to-blue-600"
                                }
                            ].map(({ label, tab, auth, colors }) => {
                                if (auth && !currentUser) return null;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                                            activeTab === tab
                                                ? `bg-gradient-to-r ${colors} text-white ring-4 ring-sky-200`
                                                : "bg-white/80 text-slate-700 hover:bg-white border border-sky-200 hover:border-sky-300"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-6 pb-12 max-w-6xl mx-auto relative z-10">
                <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-8 border border-sky-200 shadow-2xl">
                    {activeTab === "manage-quotes" && (
                        <div className="text-slate-700">
                            <QuoteCRUD currentUser={currentUser} currentUserData={currentUserData} />
                        </div>
                    )}
                    {activeTab === "posts" && (
                        <div className="text-slate-700">
                            <PostCRUD currentUser={currentUser} currentUserData={currentUserData} />
                        </div>
                    )}
                    {activeTab === "quotes" && (
                        <div className="text-slate-700">
                            <RandomQuote />
                        </div>
                    )}
                    {activeTab === "friends" && (
                        <div className="text-slate-700">
                            <FriendsManager currentUser={currentUser} currentUserData={currentUserData} />
                        </div>
                    )}
                    {activeTab === "privacy" && (
                        <div className="text-slate-700">
                            <PrivacySettings currentUser={currentUser} currentUserData={currentUserData} />
                        </div>
                    )}
                    {activeTab === "users" && (
                        <div className="text-slate-700">
                            <UserCRUD currentUser={currentUser} />
                        </div>
                    )}
                    {activeTab === "reports" && (
                        <div className="fixed inset-0 flex justify-center items-center bg-slate-900/20 backdrop-blur-lg z-50 px-4">
                            <div className="max-w-full w-auto bg-white/80 rounded-3xl p-8 border border-sky-200 shadow-2xl">
                                <ReportCRUD currentUser={currentUser} currentUserData={currentUserData} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Buttons */}
            {!currentUser && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={handleShowLogin}
                        className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-12 py-6 rounded-full shadow-2xl text-xl font-bold transform hover:scale-110 transition-all duration-300 ring-4 ring-sky-200 hover:ring-sky-300"
                    >
                        🌟 Join Motivated
                    </button>
                </div>
            )}

            {currentUser && (
                <>
                    <button
                        onClick={() => setShowUpdateProfile((prev) => !prev)}
                        className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-indigo-400 to-blue-500 hover:from-indigo-500 hover:to-blue-600 text-white px-8 py-4 rounded-full shadow-2xl text-lg font-bold transform hover:scale-110 transition-all duration-300 ring-4 ring-indigo-200"
                        aria-label={showUpdateProfile ? "Close Profile" : "Open Profile"}
                    >
                        {showUpdateProfile ? "❌ Close" : "⚙️ Profile"}
                    </button>

                    {showUpdateProfile && (
                        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex justify-center items-center z-50 px-4">
                            <div
                                ref={modalRef}
                                className="bg-white/90 backdrop-blur-xl border border-sky-200 p-8 rounded-3xl max-w-md shadow-2xl relative"
                            >
                                <button
                                    onClick={() => setShowUpdateProfile(false)}
                                    className="absolute top-4 right-4 text-slate-600 text-2xl font-bold hover:text-slate-800 bg-sky-100 hover:bg-sky-200 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                                    aria-label="Close profile popup"
                                >
                                    ×
                                </button>
                                <div className="text-slate-700">
                                    <UpdateProfile />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(-3deg); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 8s ease-in-out infinite;
                    animation-delay: -2s;
                }
                .animate-float-slow {
                    animation: float-slow 10s ease-in-out infinite;
                    animation-delay: -4s;
                }
            `}</style>
        </div>
    );
}

export default GymTok;