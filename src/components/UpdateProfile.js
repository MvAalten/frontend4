import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase config (unchanged)
const firebaseConfig = {
    apiKey: "AIzaSyDIab5pd5vj0hSCa1AisTB1Cy1t2t-Ngbk",
    authDomain: "l2p4frontend.firebaseapp.com",
    projectId: "l2p4frontend",
    storageBucket: "l2p4frontend.appspot.com",
    messagingSenderId: "439165311953",
    appId: "1:439165311953:web:3d5465838296978009def0",
    measurementId: "G-MH08GCCV0P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function UpdateProfile() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        setCurrentUserData(userData);
                        setUsername(userData.username || '');
                        setEmail(userData.email || '');
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                }
            } else {
                setCurrentUser(null);
                setCurrentUserData(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (!currentUser) {
            setError('You must be logged in to update your profile');
            setLoading(false);
            return;
        }

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const updateData = {};

            if (username && username !== currentUserData?.username) {
                updateData.username = username;
            }
            if (email && email !== currentUserData?.email) {
                updateData.email = email;
            }
            if (password) {
                updateData.password = password;
            }

            if (Object.keys(updateData).length === 0) {
                setError('Please provide at least one field to update');
                setLoading(false);
                return;
            }

            await updateDoc(userRef, updateData);
            setMessage('Profile updated successfully!');
            setPassword('');

            const updatedUserSnap = await getDoc(userRef);
            if (updatedUserSnap.exists()) {
                setCurrentUserData(updatedUserSnap.data());
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="text-center p-8 rounded-lg bg-[#40434E] text-white">
                <h2 className="text-xl font-bold mb-4 text-[#B9CFD4]">Update Profile</h2>
                <p className="text-[#B9CFD4]">Please log in to update your profile</p>
            </div>
        );
    }

    return (
        <div className="bg-[#40434E] p-6 rounded-lg text-white max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-[#B9CFD4]">Update Profile</h2>

            {currentUserData && (
                <div className="mb-6 p-4 bg-[#1E1E1E] rounded">
                    <h3 className="font-semibold text-sm text-[#B9CFD4] mb-2">Current Info</h3>
                    <p className="text-sm text-white"><strong>Username:</strong> {currentUserData.username}</p>
                    <p className="text-sm text-white"><strong>Email:</strong> {currentUserData.email}</p>
                    <p className="text-sm text-white"><strong>Password:</strong> {currentUserData.password === 'google_auth' ? 'Google Auth' : '••••••••'}</p>
                </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-[#B9CFD4] mb-1">
                        Username
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="New Username"
                        className="w-full p-2 bg-[#B9CFD4] text-black rounded border border-[#B9CFD4] focus:outline-none focus:ring-2 focus:ring-[#B9CFD4]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#B9CFD4] mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="New Email"
                        className="w-full p-2 bg-[#B9CFD4] text-black rounded border border-[#B9CFD4] focus:outline-none focus:ring-2 focus:ring-[#B9CFD4]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#B9CFD4] mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New Password"
                        className="w-full p-2 bg-[#B9CFD4] text-black rounded border border-[#B9CFD4] focus:outline-none focus:ring-2 focus:ring-[#B9CFD4]"
                    />
                    <p className="text-xs text-[#B9CFD4] mt-1">
                        Leave blank to keep current password
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF6B6B] hover:bg-[#E55A5A] disabled:bg-[#40434E] text-white py-2 rounded font-semibold transition"
                >
                    {loading ? "Updating..." : "Update Profile"}
                </button>
            </form>

            {message && (
                <p className="text-[#B9CFD4] text-sm mt-4 text-center">{message}</p>
            )}
            {error && (
                <p className="text-[#FF6B6B] text-sm mt-4 text-center">{error}</p>
            )}
        </div>
    );
}

export default UpdateProfile;
