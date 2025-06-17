import React, { useState, useEffect } from 'react';
import {
    doc,
    updateDoc,
    getDoc,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    query,
    where,
    or,
    and,
    serverTimestamp,
    getDocs,
} from 'firebase/firestore';
import { db } from '../App';

function FriendsManager({ currentUser }) {
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('friends'); // friends, requests, search
    const [blockedUsers, setBlockedUsers] = useState([]);

    // Load blocked users
    useEffect(() => {
        if (!currentUser) return;
        const blockedQ = query(
            collection(db, 'blockedUsers'),
            where('blockedBy', '==', currentUser.uid)
        );
        const unsub = onSnapshot(blockedQ, (snapshot) => {
            const blocked = snapshot.docs.map((doc) => doc.data().blockedUser);
            setBlockedUsers(blocked);
        });
        return () => unsub();
    }, [currentUser]);

    // Load friends
    useEffect(() => {
        if (!currentUser) return;

        const friendsQ = query(
            collection(db, 'friendships'),
            or(
                and(where('user1', '==', currentUser.uid), where('status', '==', 'accepted')),
                and(where('user2', '==', currentUser.uid), where('status', '==', 'accepted'))
            )
        );

        const unsub = onSnapshot(friendsQ, async (snapshot) => {
            const data = [];
            for (const docSnap of snapshot.docs) {
                const friendship = docSnap.data();
                const friendId = friendship.user1 === currentUser.uid ? friendship.user2 : friendship.user1;
                try {
                    const friendDoc = await getDoc(doc(db, 'users', friendId));
                    if (friendDoc.exists()) {
                        data.push({
                            id: docSnap.id,
                            friendId,
                            friendData: friendDoc.data(),
                            ...friendship,
                        });
                    }
                } catch (e) {
                    console.error('Error fetching friend data:', e);
                }
            }
            setFriends(data);
        });

        return () => unsub();
    }, [currentUser]);

    // Load incoming friend requests
    useEffect(() => {
        if (!currentUser) return;

        const requestsQ = query(
            collection(db, 'friendships'),
            and(where('user2', '==', currentUser.uid), where('status', '==', 'pending'))
        );

        const unsub = onSnapshot(requestsQ, async (snapshot) => {
            const requests = [];
            for (const docSnap of snapshot.docs) {
                const req = docSnap.data();
                try {
                    const requesterDoc = await getDoc(doc(db, 'users', req.user1));
                    if (requesterDoc.exists()) {
                        requests.push({
                            id: docSnap.id,
                            requesterId: req.user1,
                            requesterData: requesterDoc.data(),
                            ...req,
                        });
                    }
                } catch (e) {
                    console.error('Error fetching requester data:', e);
                }
            }
            setFriendRequests(requests);
        });

        return () => unsub();
    }, [currentUser]);

    // Load sent friend requests
    useEffect(() => {
        if (!currentUser) return;

        const sentQ = query(
            collection(db, 'friendships'),
            and(where('user1', '==', currentUser.uid), where('status', '==', 'pending'))
        );

        const unsub = onSnapshot(sentQ, async (snapshot) => {
            const sent = [];
            for (const docSnap of snapshot.docs) {
                const req = docSnap.data();
                try {
                    const receiverDoc = await getDoc(doc(db, 'users', req.user2));
                    if (receiverDoc.exists()) {
                        sent.push({
                            id: docSnap.id,
                            receiverId: req.user2,
                            receiverData: receiverDoc.data(),
                            ...req,
                        });
                    }
                } catch (e) {
                    console.error('Error fetching receiver data:', e);
                }
            }
            setSentRequests(sent);
        });

        return () => unsub();
    }, [currentUser]);

    // Load all users (exclude current user and blocked)
    useEffect(() => {
        if (!currentUser) return;

        const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
            const users = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((user) => user.id !== currentUser.uid && !blockedUsers.includes(user.id));
            setAllUsers(users);
        });

        return () => unsub();
    }, [currentUser, blockedUsers]);

    // Send friend request
    const sendFriendRequest = async (targetUser) => {
        if (!currentUser) return;
        setLoading(true);
        setMessage('');
        try {
            const existingQ = query(
                collection(db, 'friendships'),
                or(
                    and(where('user1', '==', currentUser.uid), where('user2', '==', targetUser.id)),
                    and(where('user1', '==', targetUser.id), where('user2', '==', currentUser.uid))
                )
            );
            const existingSnap = await getDocs(existingQ);
            if (!existingSnap.empty) {
                setMessage('Er bestaat al een vriendschap of verzoek met deze gebruiker');
                setLoading(false);
                return;
            }

            await addDoc(collection(db, 'friendships'), {
                user1: currentUser.uid,
                user2: targetUser.id,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setMessage(`Vriendschapsverzoek verzonden naar ${targetUser.username}`);
            setSearchTerm('');
        } catch (e) {
            console.error('Error sending friend request:', e);
            setMessage('Fout bij het verzenden van vriendschapsverzoek');
        } finally {
            setLoading(false);
        }
    };

    // Accept friend request
    const acceptFriendRequest = async (requestId) => {
        setLoading(true);
        setMessage('');
        try {
            await updateDoc(doc(db, 'friendships', requestId), {
                status: 'accepted',
                updatedAt: serverTimestamp(),
            });
            setMessage('Vriendschapsverzoek geaccepteerd!');
        } catch (e) {
            console.error('Error accepting friend request:', e);
            setMessage('Fout bij het accepteren van vriendschapsverzoek');
        } finally {
            setLoading(false);
        }
    };

    // Reject friend request
    const rejectFriendRequest = async (requestId, requesterName) => {
        setLoading(true);
        setMessage('');
        try {
            await deleteDoc(doc(db, 'friendships', requestId));
            setMessage(`Vriendschapsverzoek van ${requesterName} afgewezen`);
        } catch (e) {
            console.error('Error rejecting friend request:', e);
            setMessage('Fout bij het afwijzen van vriendschapsverzoek');
        } finally {
            setLoading(false);
        }
    };

    // Cancel sent friend request
    const cancelFriendRequest = async (requestId, receiverName) => {
        setLoading(true);
        setMessage('');
        try {
            await deleteDoc(doc(db, 'friendships', requestId));
            setMessage(`Vriendschapsverzoek naar ${receiverName} ingetrokken`);
        } catch (e) {
            console.error('Error canceling friend request:', e);
            setMessage('Fout bij het intrekken van vriendschapsverzoek');
        } finally {
            setLoading(false);
        }
    };

    // Remove friend
    const removeFriend = async (friendshipId, friendName) => {
        if (!window.confirm(`Weet je zeker dat je ${friendName} als vriend wilt verwijderen?`)) return;
        setLoading(true);
        setMessage('');
        try {
            await deleteDoc(doc(db, 'friendships', friendshipId));
            setMessage(`${friendName} verwijderd als vriend`);
        } catch (e) {
            console.error('Error removing friend:', e);
            setMessage('Fout bij het verwijderen van vriend');
        } finally {
            setLoading(false);
        }
    };

    // Get relationship status for search filtering
    const getRelationshipStatus = (userId) => {
        if (friends.some((f) => f.friendId === userId)) return 'friends';
        if (sentRequests.some((s) => s.receiverId === userId)) return 'sent';
        if (friendRequests.some((r) => r.requesterId === userId)) return 'received';
        return 'none';
    }

    // Filter users for search tab
    const filteredUsers = allUsers.filter((user) => {
        const matchesSearch =
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch && getRelationshipStatus(user.id) === 'none';
    });

    if (!currentUser) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg">
                <p className="text-gray-300">Log in om vrienden te beheren</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-[#FF6B6B]">Vrienden Beheren</h2>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`px-4 py-2 rounded ${
                        activeTab === 'friends'
                            ? 'bg-[#FF6B6B] text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    Vrienden ({friends.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded ${
                        activeTab === 'requests'
                            ? 'bg-[#FF6B6B] text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    Verzoeken ({friendRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`px-4 py-2 rounded ${
                        activeTab === 'search'
                            ? 'bg-[#FF6B6B] text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    Zoeken
                </button>
            </div>

            {message && (
                <div className="mb-4 p-2 bg-[#FF6B6B]/20 text-[#FF6B6B] rounded">{message}</div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
                <div className="space-y-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-white">Mijn Vrienden</h3>
                        {friends.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">Je hebt nog geen vrienden toegevoegd</p>
                        ) : (
                            <div className="space-y-3">
                                {friends.map((friend) => {
                                    return (
                                        <div
                                            key={friend.id}
                                            className="flex items-center justify-between bg-gray-600 p-3 rounded"
                                        >
                                            <div>
                                                <p className="font-medium">@{friend.friendData.username}</p>
                                                <p className="text-sm text-gray-300">{friend.friendData.email}</p>
                                                <p className="text-xs text-gray-400">
                                                    Vrienden sinds{' '}
                                                    {new Date(friend.updatedAt?.seconds * 1000).toLocaleDateString('nl-NL')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFriend(friend.id, friend.friendData.username)}
                                                disabled={loading}
                                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                                            >
                                                Verwijderen
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
                <div className="space-y-6">
                    {/* Incoming requests */}
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-white">Ontvangen Verzoeken</h3>
                        {friendRequests.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">Geen nieuwe vriendschapsverzoeken</p>
                        ) : (
                            <div className="space-y-3">
                                {friendRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="flex items-center justify-between bg-gray-600 p-3 rounded"
                                    >
                                        <div>
                                            <p className="font-medium">@{req.requesterData.username}</p>
                                            <p className="text-sm text-gray-300">{req.requesterData.email}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => acceptFriendRequest(req.id)}
                                                disabled={loading}
                                                className="bg-[#FF6B6B] hover:bg-[#e85b5b] px-3 py-1 rounded text-sm disabled:opacity-50"
                                            >
                                                Accepteer
                                            </button>
                                            <button
                                                onClick={() => rejectFriendRequest(req.id, req.requesterData.username)}
                                                disabled={loading}
                                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                                            >
                                                Weiger
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sent requests */}
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-white">Verzonden Verzoeken</h3>
                        {sentRequests.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">Geen verzonden vriendschapsverzoeken</p>
                        ) : (
                            <div className="space-y-3">
                                {sentRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="flex items-center justify-between bg-gray-600 p-3 rounded"
                                    >
                                        <div>
                                            <p className="font-medium">@{req.receiverData.username}</p>
                                            <p className="text-sm text-gray-300">{req.receiverData.email}</p>
                                        </div>
                                        <button
                                            onClick={() => cancelFriendRequest(req.id, req.receiverData.username)}
                                            disabled={loading}
                                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                                        >
                                            Intrekken
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
                <div>
                    <input
                        type="text"
                        placeholder="Zoek gebruikers op naam of email"
                        className="w-full p-2 rounded mb-4 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-[#FF6B6B]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                    />
                    {filteredUsers.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">Geen gebruikers gevonden</p>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between bg-gray-600 p-3 rounded"
                                >
                                    <div>
                                        <p className="font-medium">@{user.username}</p>
                                        <p className="text-sm text-gray-300">{user.email}</p>
                                    </div>
                                    <button
                                        onClick={() => sendFriendRequest(user)}
                                        disabled={loading}
                                        className="bg-[#FF6B6B] hover:bg-[#e85b5b] px-3 py-1 rounded text-sm disabled:opacity-50"
                                    >
                                        Voeg toe
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default FriendsManager;