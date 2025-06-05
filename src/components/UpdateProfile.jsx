import React, { useState } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function UpdateProfile() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (!currentUser) {
                setError('You must be logged in to update your profile');
                return;
            }

            const db = getFirestore();
            const userRef = doc(db, 'users', currentUser.uid);

            const updateData = {};
            if (username) updateData.username = username;
            if (password) updateData.password = password;

            if (Object.keys(updateData).length === 0) {
                setError('Please provide at least one field to update');
                return;
            }

            await updateDoc(userRef, updateData);
            setMessage('Profile updated successfully!');
            setUsername('');
            setPassword('');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4 text-center">Update Profile</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="New Username"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="New Password"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                        Update Profile
                    </button>
                </form>

                {message && (
                    <p className="text-green-500 text-sm mt-4 text-center">{message}</p>
                )}
                {error && (
                    <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
                )}
            </div>
        </div>
    );
}

export default UpdateProfile; 