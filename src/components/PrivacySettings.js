import React, { useState, useEffect } from 'react';
import {
    doc,
    updateDoc,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    query,
    where,
} from 'firebase/firestore';
import { db } from '../App';

function PrivacySettings({ currentUser, currentUserData }) {
    const [isPrivate, setIsPrivate] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('privacy');

    useEffect(() => {
        if (currentUserData) {
            setIsPrivate(currentUserData.isPrivate || false);
        }
    }, [currentUserData]);

    useEffect(() => {
        if (!currentUser) return;

        const blockedQuery = query(
            collection(db, 'blockedUsers'),
            where('blockedBy', '==', currentUser.uid)
        );

        const unsubscribeBlocked = onSnapshot(blockedQuery, (snapshot) => {
            const blocked = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBlockedUsers(blocked);
        });

        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const users = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user => user.id !== currentUser.uid);
            setAllUsers(users);
        });

        return () => {
            unsubscribeBlocked();
            unsubscribeUsers();
        };
    }, [currentUser]);

    const handlePrivacyToggle = async () => {
        if (!currentUser || loading) return;
        setLoading(true);
        setMessage('');
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const newPrivacyState = !isPrivate;
            await updateDoc(userRef, { isPrivate: newPrivacyState });
            setIsPrivate(newPrivacyState);
            setMessage(newPrivacyState ? 'Your profile is now private' : 'Your profile is now public');
        } catch (error) {
            console.error('Privacy update error:', error);
            setMessage('Failed to update privacy settings');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleBlockUser = async (userToBlock) => {
        if (!currentUser || loading) return;
        setLoading(true);
        setMessage('');
        try {
            await addDoc(collection(db, 'blockedUsers'), {
                blockedBy: currentUser.uid,
                blockedUser: userToBlock.id,
                blockedUsername: userToBlock.username || 'Unknown',
                blockedAt: new Date()
            });
            setMessage(`${userToBlock.username} has been blocked`);
            setSearchTerm('');
        } catch (error) {
            console.error('Block user error:', error);
            setMessage('Failed to block user');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleUnblockUser = async (blockedUserDoc) => {
        if (loading) return;
        setLoading(true);
        setMessage('');
        try {
            await deleteDoc(doc(db, 'blockedUsers', blockedUserDoc.id));
            setMessage(`${blockedUserDoc.blockedUsername} has been unblocked`);
        } catch (error) {
            console.error('Unblock user error:', error);
            setMessage('Failed to unblock user');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const filteredUsers = allUsers.filter(user => {
        const isBlocked = blockedUsers.some(blocked => blocked.blockedUser === user.id);
        const match = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return !isBlocked && match && searchTerm.length > 0;
    });

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-gray-800 text-white p-6 rounded-lg max-w-md w-full text-center">
                    <p>Please log in to manage privacy settings</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-gray-800 text-white p-6 rounded-lg max-w-2xl w-full space-y-6">
                <h2 className="text-2xl font-bold">Privacy & Safety</h2>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`flex-1 px-4 py-2 rounded font-semibold ${activeTab === 'privacy' ? 'bg-[#FF6B6B]' : 'bg-gray-700'}`}
                    >
                        Privacy
                    </button>
                    <button
                        onClick={() => setActiveTab('blocked')}
                        className={`flex-1 px-4 py-2 rounded font-semibold ${activeTab === 'blocked' ? 'bg-[#FF6B6B]' : 'bg-gray-700'}`}
                    >
                        Blocked ({blockedUsers.length})
                    </button>
                </div>

                {activeTab === 'privacy' && (
                    <>
                        {/* Profile Visibility */}
                        <div className="bg-gray-700 p-4 rounded">
                            <h3 className="text-lg font-semibold mb-2">Profile Visibility</h3>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p>{isPrivate ? 'Private Profile' : 'Public Profile'}</p>
                                    <p className="text-sm text-gray-300">
                                        {isPrivate ? 'Only friends can view your posts and profile' : 'Everyone can see your posts and profile'}
                                    </p>
                                </div>
                                <button
                                    onClick={handlePrivacyToggle}
                                    disabled={loading}
                                    className="px-4 py-2 rounded bg-[#FF6B6B] hover:bg-[#E55A5A] disabled:bg-gray-500 font-semibold"
                                >
                                    {loading ? 'Loading...' : isPrivate ? 'Private' : 'Public'}
                                </button>
                            </div>
                        </div>

                        {/* Block Users */}
                        <div className="bg-gray-700 p-4 rounded">
                            <h3 className="text-lg font-semibold mb-2">Block User</h3>
                            <input
                                type="text"
                                placeholder="Search user to block..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full mb-3 px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
                            />
                            {searchTerm && (
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <div key={user.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                                                <div>
                                                    <p className="font-semibold">@{user.username || 'Unknown'}</p>
                                                    <p className="text-sm text-gray-300">{user.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleBlockUser(user)}
                                                    disabled={loading}
                                                    className="bg-[#FF6B6B] hover:bg-[#E55A5A] text-white px-3 py-1 text-sm rounded font-semibold"
                                                >
                                                    {loading ? '...' : 'Block'}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center">No users found</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'blocked' && (
                    <div className="bg-gray-700 p-4 rounded">
                        <h3 className="text-lg font-semibold mb-2">Blocked Users</h3>
                        {blockedUsers.length === 0 ? (
                            <p className="text-center">You have not blocked any users</p>
                        ) : (
                            <div className="space-y-3">
                                {blockedUsers.map(user => (
                                    <div key={user.id} className="flex justify-between items-center bg-gray-800 p-3 rounded">
                                        <div>
                                            <p className="font-semibold">@{user.blockedUsername}</p>
                                            <p className="text-sm text-gray-300">
                                                Blocked on{' '}
                                                {user.blockedAt?.seconds
                                                    ? new Date(user.blockedAt.seconds * 1000).toLocaleDateString()
                                                    : new Date(user.blockedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleUnblockUser(user)}
                                            disabled={loading}
                                            className="bg-[#FF6B6B] hover:bg-[#E55A5A] text-white px-3 py-1 text-sm rounded font-semibold"
                                        >
                                            {loading ? '...' : 'Unblock'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {message && (
                    <div className={`mt-4 p-3 text-center rounded ${message.includes('Failed') ? 'bg-red-700' : 'bg-green-700'} text-white`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PrivacySettings;
