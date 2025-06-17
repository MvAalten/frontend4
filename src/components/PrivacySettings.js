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
            const blocked = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Privacy update error:', error);
            setMessage('Failed to update privacy settings');
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

            setMessage(`${userToBlock.username} has been blocked`);
            setSearchTerm('');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Block user error:', error);
            setMessage('Failed to block user');
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
            setMessage(`${blockedUserDoc.blockedUsername} has been unblocked`);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Unblock user error:', error);
            setMessage('Failed to unblock user');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = allUsers.filter(user => {
        const isAlreadyBlocked = blockedUsers.some(blocked => blocked.blockedUser === user.id);
        const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return !isAlreadyBlocked && matchesSearch && searchTerm.length > 0;
    });

    const colors = {
        bg: '#1e1e1e',
        card: '#2c2f36',
        text: '#f4f4f5',
        red: '#FF6B6B',
        redHover: '#E55A5A',
    };

    if (!currentUser) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                <div style={{ backgroundColor: colors.card, padding: '1.5rem', borderRadius: '0.5rem', maxWidth: '28rem', width: '100%', color: colors.text, textAlign: 'center' }}>
                    <p>Please log in to manage privacy settings</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: colors.card, padding: '1.5rem', borderRadius: '0.5rem', maxWidth: '32rem', width: '100%', color: colors.text, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Privacy & Safety</h2>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            backgroundColor: activeTab === 'privacy' ? colors.red : colors.card,
                            color: colors.text,
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Privacy
                    </button>
                    <button
                        onClick={() => setActiveTab('blocked')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            backgroundColor: activeTab === 'blocked' ? colors.red : colors.card,
                            color: colors.text,
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Blocked ({blockedUsers.length})
                    </button>
                </div>

                {activeTab === 'privacy' && (
                    <>
                        <div style={{ backgroundColor: '#3a3d46', padding: '1rem', borderRadius: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Profile Visibility</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p>{isPrivate ? 'Private Profile' : 'Public Profile'}</p>
                                    <p style={{ fontSize: '0.875rem' }}>
                                        {isPrivate ? 'Only friends can view your posts and profile' : 'Everyone can see your posts and profile'}
                                    </p>
                                </div>
                                <button
                                    onClick={handlePrivacyToggle}
                                    disabled={loading}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: '600',
                                        backgroundColor: colors.red,
                                        color: 'white',
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.redHover}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = colors.red}
                                >
                                    {loading ? 'Loading...' : isPrivate ? 'Private' : 'Public'}
                                </button>
                            </div>
                        </div>

                        {/* Block Users */}
                        <div style={{ backgroundColor: '#3a3d46', padding: '1rem', borderRadius: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Block User</h3>
                            <input
                                type="text"
                                placeholder="Search user to block..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #555',
                                    backgroundColor: '#2c2f36',
                                    color: colors.text,
                                    fontSize: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            />
                            {searchTerm && (
                                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c2f36', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                                <div>
                                                    <p style={{ fontWeight: '600' }}>@{user.username || 'Unknown'}</p>
                                                    <p style={{ fontSize: '0.875rem' }}>{user.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleBlockUser(user)}
                                                    disabled={loading}
                                                    style={{
                                                        backgroundColor: colors.red,
                                                        color: 'white',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '0.5rem',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600',
                                                        border: 'none',
                                                        cursor: loading ? 'not-allowed' : 'pointer',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.redHover}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = colors.red}
                                                >
                                                    {loading ? '...' : 'Block'}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ textAlign: 'center' }}>No users found</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'blocked' && (
                    <div style={{ backgroundColor: '#3a3d46', padding: '1rem', borderRadius: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Blocked Users</h3>
                        {blockedUsers.length === 0 ? (
                            <p style={{ textAlign: 'center' }}>You have not blocked any users</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {blockedUsers.map(user => (
                                    <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c2f36', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                        <div>
                                            <p style={{ fontWeight: '600' }}>@{user.blockedUsername}</p>
                                            <p style={{ fontSize: '0.875rem' }}>
                                                Blocked on {user.blockedAt?.seconds ? new Date(user.blockedAt.seconds * 1000).toLocaleDateString() : new Date(user.blockedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleUnblockUser(user)}
                                            disabled={loading}
                                            style={{
                                                backgroundColor: colors.red,
                                                color: 'white',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                border: 'none',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.redHover}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = colors.red}
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
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        backgroundColor: message.includes('Failed') ? '#922B21' : '#2E8B57',
                        color: '#fff',
                    }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PrivacySettings;
