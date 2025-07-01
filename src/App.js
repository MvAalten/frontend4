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
import SearchHeader from "./components/SearchHeader";
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
            <div className="h-screen bg-[#1E1E1E] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF6B6B] border-t-transparent mx-auto mb-4"></div>
                    <div className="text-[#F5F7FA] text-2xl font-bold tracking-wide animate-pulse">
                        Loading GymTok...
                    </div>
                </div>
            </div>
        );
    }

    if (showLogin && !currentUser) {
        return (
            <div className="min-h-screen bg-[#1E1E1E] text-[#F5F7FA] p-6">
                <button
                    onClick={() => setShowLogin(false)}
                    className="mb-4 bg-[#FF6B6B] text-white px-6 py-3 rounded-xl font-semibold hover:brightness-110 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                    ← Back to GymTok
                </button>
                <Login onLoginSuccess={() => setShowLogin(false)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1E1E1E] text-[#F5F7FA] relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-[#B9CFD4]/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/3 -right-8 w-96 h-96 bg-[#FF6B6B]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute -bottom-8 left-1/3 w-80 h-80 bg-[#B9CFD4]/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            <SearchHeader
                currentUser={currentUser}
                currentUserData={currentUserData}
                onSignOut={handleSignOut}
                onShowLogin={handleShowLogin}
            />

            <div className="fixed top-32 w-full z-40 bg-[#1E1E1E] p-2 flex justify-center border-b border-[#B9CFD4]/30">
                <div className="flex space-x-2 max-w-full overflow-x-visible no-scrollbar">
                    {[
                        { label: "Manage Quotes", tab: "manage-quotes", auth: true },
                        { label: "Agenda", tab: "posts" },
                        { label: "Quotes", tab: "quotes" }
                    ].map(({ label, tab, auth }) => {
                        if (auth && !currentUser) return null;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 rounded-xl whitespace-nowrap font-semibold transition-all duration-300 transform hover:scale-105 ${
                                    activeTab === tab
                                        ? "bg-[#FF6B6B] text-white shadow-lg"
                                        : "bg-[#40434E] text-[#F5F7FA] hover:bg-[#FF6B6B]/80 hover:text-white"
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="pt-32 px-4 pb-6 max-w-6xl mx-auto relative z-10">
                {activeTab === "manage-quotes" && (
                    <QuoteCRUD currentUser={currentUser} currentUserData={currentUserData} />
                )}
                {activeTab === "posts" && (
                    <PostCRUD currentUser={currentUser} currentUserData={currentUserData} />
                )}
                {activeTab === "quotes" && <RandomQuote />}
                {activeTab === "friends" && (
                    <FriendsManager currentUser={currentUser} currentUserData={currentUserData} />
                )}
                {activeTab === "privacy" && (
                    <PrivacySettings currentUser={currentUser} currentUserData={currentUserData} />
                )}
                {activeTab === "users" && <UserCRUD currentUser={currentUser} />}
                {activeTab === "reports" && (
                    <div className="fixed inset-0 flex justify-center items-center bg-[#1E1E1E] z-20 px-4">
                        <div className="max-w-full w-auto">
                            <ReportCRUD currentUser={currentUser} currentUserData={currentUserData} />
                        </div>
                    </div>
                )}
            </div>

            {!currentUser && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={handleShowLogin}
                        className="bg-[#FF6B6B] hover:brightness-110 text-white px-8 py-4 rounded-full shadow-2xl text-lg font-bold transform hover:scale-110 transition-all duration-300 animate-pulse"
                    >
                        Join GymTok
                    </button>
                </div>
            )}

            {currentUser && (
                <>
                    <button
                        onClick={() => setShowUpdateProfile((prev) => !prev)}
                        className="fixed bottom-8 right-8 z-50 bg-[#FF6B6B] hover:brightness-110 text-white px-6 py-3 rounded-full shadow-md text-base font-semibold transform hover:scale-105 transition-all duration-200
"
                        aria-label={showUpdateProfile ? "Close Profile" : "Open Profile"}
                    >
                        {showUpdateProfile ? "Close" : "Update Profile"}
                    </button>

                    {showUpdateProfile && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
                            <div
                                ref={modalRef}
                                className="bg-[#40434E]/90 backdrop-blur-xl border border-[#B9CFD4]/30 p-6 rounded-2xl max-w-sm shadow-2xl relative"
                            >
                                <button
                                    onClick={() => setShowUpdateProfile(false)}
                                    className="absolute top-3 right-3 text-white text-xl font-bold hover:text-red-400"
                                    aria-label="Close profile popup"
                                >
                                    ×
                                </button>
                                <UpdateProfile />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default GymTok;
