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
            setMessage(newPrivacyState ? 'Profiel is nu privé' : 'Profiel is nu openbaar');

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

    const filteredUsers = allUsers.filter(user => {
        const isAlreadyBlocked = blockedUsers.some(blocked => blocked.blockedUser === user.id);
        const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return !isAlreadyBlocked && matchesSearch && searchTerm.length > 0;
    });

    if (!currentUser) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1E1E1E',
                    padding: '1rem',
                }}
            >
                <div
                    style={{
                        backgroundColor: '#40434E',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        maxWidth: '28rem',
                        width: '100%',
                        color: '#B9CFD4',
                        textAlign: 'center',
                        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                    }}
                >
                    <p>Log in om privacy-instellingen te beheren</p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1E1E1E',
                padding: '1rem',
            }}
        >
            <div
                style={{
                    backgroundColor: '#40434E',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    maxWidth: '32rem',
                    width: '100%',
                    color: '#B9CFD4',
                    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                }}
            >
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem' }}>
                    Privacy & Veiligheid
                </h2>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        style={{
                            flex: 1,
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'privacy' ? '#60636B' : '#40434E',
                            color: '#B9CFD4',
                            border: 'none',
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseEnter={e => {
                            if (activeTab !== 'privacy') e.currentTarget.style.backgroundColor = '#797d8a';
                        }}
                        onMouseLeave={e => {
                            if (activeTab !== 'privacy') e.currentTarget.style.backgroundColor = '#40434E';
                        }}
                    >
                        🔒 Privacy
                    </button>
                    <button
                        onClick={() => setActiveTab('blocked')}
                        style={{
                            flex: 1,
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'blocked' ? '#60636B' : '#40434E',
                            color: '#B9CFD4',
                            border: 'none',
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseEnter={e => {
                            if (activeTab !== 'blocked') e.currentTarget.style.backgroundColor = '#797d8a';
                        }}
                        onMouseLeave={e => {
                            if (activeTab !== 'blocked') e.currentTarget.style.backgroundColor = '#40434E';
                        }}
                    >
                        🚫 Geblokkeerd ({blockedUsers.length})
                    </button>
                </div>

                {/* Privacy Settings Tab */}
                {activeTab === 'privacy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Profile Visibility */}
                        <div
                            style={{
                                backgroundColor: '#60636B',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                color: '#B9CFD4',
                            }}
                        >
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                                Profiel Zichtbaarheid
                            </h3>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <p style={{ marginBottom: '0.25rem' }}>
                                        {isPrivate ? '🔒 Privé Profiel' : '🌍 Openbaar Profiel'}
                                    </p>
                                    <p style={{ fontSize: '0.875rem', color: '#B9CFD4' }}>
                                        {isPrivate
                                            ? 'Alleen vrienden kunnen je posts en profiel zien'
                                            : 'Iedereen kan je posts en profiel zien'}
                                    </p>
                                </div>
                                <button
                                    onClick={handlePrivacyToggle}
                                    disabled={loading}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: '600',
                                        backgroundColor: '#60636B',
                                        color: '#B9CFD4',
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.6 : 1,
                                        transition: 'background-color 0.3s ease',
                                    }}
                                    onMouseEnter={e => {
                                        if (!loading) e.currentTarget.style.backgroundColor = '#797d8a';
                                    }}
                                    onMouseLeave={e => {
                                        if (!loading) e.currentTarget.style.backgroundColor = '#60636B';
                                    }}
                                >
                                    {loading ? 'Bezig...' : (isPrivate ? 'Privé' : 'Openbaar')}
                                </button>
                            </div>
                        </div>

                        {/* Block Users */}
                        <div
                            style={{
                                backgroundColor: '#60636B',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                color: '#B9CFD4',
                            }}
                        >
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                                Gebruiker Blokkeren
                            </h3>
                            <input
                                type="text"
                                placeholder="Zoek gebruiker om te blokkeren..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #797D8A',
                                    backgroundColor: '#50525A',
                                    color: '#B9CFD4',
                                    fontSize: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            />
                            {searchTerm && (
                                <div
                                    style={{
                                        maxHeight: '160px',
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <div
                                                key={user.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    backgroundColor: '#50525A',
                                                    padding: '0.5rem',
                                                    borderRadius: '0.5rem',
                                                }}
                                            >
                                                <div>
                                                    <p style={{ fontWeight: '600' }}>@{user.username || 'Unknown'}</p>
                                                    <p style={{ fontSize: '0.875rem', color: '#B9CFD4' }}>{user.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleBlockUser(user)}
                                                    disabled={loading}
                                                    style={{
                                                        backgroundColor: '#60636B',
                                                        color: '#B9CFD4',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '0.5rem',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600',
                                                        border: 'none',
                                                        cursor: loading ? 'not-allowed' : 'pointer',
                                                        opacity: loading ? 0.6 : 1,
                                                        transition: 'background-color 0.3s ease',
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (!loading) e.currentTarget.style.backgroundColor = '#797d8a';
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (!loading) e.currentTarget.style.backgroundColor = '#60636B';
                                                    }}
                                                >
                                                    {loading ? '...' : 'Blokkeren'}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ color: '#B9CFD4', textAlign: 'center', padding: '0.5rem' }}>
                                            Geen gebruikers gevonden
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Blocked Users Tab */}
                {activeTab === 'blocked' && (
                    <div
                        style={{
                            backgroundColor: '#60636B',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            color: '#B9CFD4',
                        }}
                    >
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                            Geblokkeerde Gebruikers
                        </h3>
                        {blockedUsers.length === 0 ? (
                            <p style={{ color: '#B9CFD4', textAlign: 'center', padding: '1rem 0' }}>
                                Je hebt geen gebruikers geblokkeerd
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {blockedUsers.map(blockedUser => (
                                    <div
                                        key={blockedUser.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            backgroundColor: '#50525A',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontWeight: '600' }}>@{blockedUser.blockedUsername}</p>
                                            <p style={{ fontSize: '0.875rem', color: '#B9CFD4' }}>
                                                Geblokkeerd op{' '}
                                                {blockedUser.blockedAt?.seconds
                                                    ? new Date(blockedUser.blockedAt.seconds * 1000).toLocaleDateString('nl-NL')
                                                    : new Date(blockedUser.blockedAt).toLocaleDateString('nl-NL')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleUnblockUser(blockedUser)}
                                            disabled={loading}
                                            style={{
                                                backgroundColor: '#60636B',
                                                color: '#B9CFD4',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                border: 'none',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                opacity: loading ? 0.6 : 1,
                                                transition: 'background-color 0.3s ease',
                                            }}
                                            onMouseEnter={e => {
                                                if (!loading) e.currentTarget.style.backgroundColor = '#797d8a';
                                            }}
                                            onMouseLeave={e => {
                                                if (!loading) e.currentTarget.style.backgroundColor = '#60636B';
                                            }}
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
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            color: '#B9CFD4',
                            textAlign: 'center',
                            backgroundColor: message.includes('Fout') ? '#922B21' : '#2E8B57',
                        }}
                    >
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PrivacySettings;
