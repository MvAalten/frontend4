// components/PrivacySettings.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, addDoc, onSnapshot, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../App';

function PrivacySettings({ currentUser, currentUserData }) {
    const [isPrivate, setIsPrivate] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('privacy');

    // Update privacy state when user data changes
    useEffect(() => {
        if (currentUserData) {
            setIsPrivate(currentUserData.isPrivate || false);
        }
    }, [currentUserData]);

    // Load blocked users and all users
    useEffect(() => {
        if (!currentUser) return;

        // Load blocked users
        const blockedQuery = query(
            collection(db, 'blockedUsers'),
            where('blockedBy', '==', currentUser.uid)
        );

        const unsubscribeBlocked = onSnapshot(blockedQuery, (snapshot) => {
            const blocked = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBlockedUsers(blocked);
        });

        // Load all users
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

            await updateDoc(userRef, {
                isPrivate: newPrivacyState
            });

            setIsPrivate(newPrivacyState);
            setMessage(newPrivacyState ? 'Profiel is nu privé' : 'Profiel is nu openbaar');

            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Privacy update error:', error);
            setMessage('Fout bij het bijwerken van privacy-instellingen');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
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

            setMessage(`${userToBlock.username} is geblokkeerd`);
            setSearchTerm('');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Block user error:', error);
            setMessage('Fout bij het blokkeren van gebruiker');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblockUser = async (blockedUserDoc) => {
        if (loading) return;

        setLoading(true);
        setMessage('');

        try {
            await deleteDoc(doc(db, 'blockedUsers', blockedUserDoc.id));
            setMessage(`${blockedUserDoc.blockedUsername} is gedeblokkeerd`);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Unblock user error:', error);
            setMessage('Fout bij het deblokkeren van gebruiker');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Filter users for blocking (exclude already blocked and current user)
    const filteredUsers = allUsers.filter(user => {
        const isAlreadyBlocked = blockedUsers.some(blocked => blocked.blockedUser === user.id);
        const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return !isAlreadyBlocked && matchesSearch && searchTerm.length > 0;
    });

    if (!currentUser) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg">
                <p className="text-gray-300">Log in om privacy-instellingen te beheren</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">Privacy & Veiligheid</h2>

            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveTab('privacy')}
                    className={`px-4 py-2 rounded transition-colors ${
                        activeTab === 'privacy'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    🔒 Privacy
                </button>
                <button
                    onClick={() => setActiveTab('blocked')}
                    className={`px-4 py-2 rounded transition-colors ${
                        activeTab === 'blocked'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    🚫 Geblokkeerd ({blockedUsers.length})
                </button>
            </div>

            {/* Privacy Settings Tab */}
            {activeTab === 'privacy' && (
                <div className="space-y-6">
                    {/* Profile Visibility */}
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-white">Profiel Zichtbaarheid</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 mb-1">
                                    {isPrivate ? '🔒 Privé Profiel' : '🌍 Openbaar Profiel'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    {isPrivate
                                        ? 'Alleen vrienden kunnen je posts en profiel zien'
                                        : 'Iedereen kan je posts en profiel zien'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={handlePrivacyToggle}
                                disabled={loading}
                                className={`px-4 py-2 rounded font-semibold transition-colors ${
                                    isPrivate
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-gray-600 hover:bg-gray-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading ? 'Bezig...' : (isPrivate ? 'Privé' : 'Openbaar')}
                            </button>
                        </div>
                    </div>

                    {/* Block Users */}
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-white">Gebruiker Blokkeren</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Zoek gebruiker om te blokkeren..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 bg-gray-600 text-white rounded border border-gray-500 focus:border-purple-500 focus:outline-none"
                            />

                            {searchTerm && (
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <div key={user.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                                                <div>
                                                    <p className="font-medium">@{user.username || 'Unknown'}</p>
                                                    <p className="text-sm text-gray-300">{user.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleBlockUser(user)}
                                                    disabled={loading}
                                                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {loading ? '...' : 'Blokkeren'}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 text-center py-2">Geen gebruikers gevonden</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Blocked Users Tab */}
            {activeTab === 'blocked' && (
                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-white">Geblokkeerde Gebruikers</h3>
                    {blockedUsers.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">Je hebt geen gebruikers geblokkeerd</p>
                    ) : (
                        <div className="space-y-3">
                            {blockedUsers.map(blockedUser => (
                                <div key={blockedUser.id} className="flex items-center justify-between bg-gray-600 p-3 rounded">
                                    <div>
                                        <p className="font-medium">@{blockedUser.blockedUsername}</p>
                                        <p className="text-sm text-gray-300">
                                            Geblokkeerd op {
                                            blockedUser.blockedAt?.seconds
                                                ? new Date(blockedUser.blockedAt.seconds * 1000).toLocaleDateString('nl-NL')
                                                : new Date(blockedUser.blockedAt).toLocaleDateString('nl-NL')
                                        }
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleUnblockUser(blockedUser)}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? '...' : 'Deblokkeren'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Status Message */}
            {message && (
                <div className={`mt-4 p-3 rounded text-white text-center ${
                    message.includes('Fout') ? 'bg-red-600' : 'bg-green-600'
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
}

export default PrivacySettings;