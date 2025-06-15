// components/FriendsManager.js
import React, { useState, useEffect } from 'react';
import {doc, updateDoc, getDoc, collection, addDoc, onSnapshot, deleteDoc, query, where, or, and, serverTimestamp, getDocs} from 'firebase/firestore';
import { db } from '../App';
import FriendChat from './FriendChat';

function FriendsManager({ currentUser, currentUserData }) {
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'search'
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null); // For chat

    // Load blocked users to filter them out
    useEffect(() => {
        if (!currentUser) return;

        const blockedQuery = query(
            collection(db, 'blockedUsers'),
            where('blockedBy', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(blockedQuery, (snapshot) => {
            const blocked = snapshot.docs.map(doc => doc.data().blockedUser);
            setBlockedUsers(blocked);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Load friends
    useEffect(() => {
        if (!currentUser) return;

        const friendsQuery = query(
            collection(db, 'friendships'),
            or(
                and(where('user1', '==', currentUser.uid), where('status', '==', 'accepted')),
                and(where('user2', '==', currentUser.uid), where('status', '==', 'accepted'))
            )
        );

        const unsubscribe = onSnapshot(friendsQuery, async (snapshot) => {
            const friendsData = [];

            for (const docSnap of snapshot.docs) {
                const friendship = docSnap.data();
                const friendId = friendship.user1 === currentUser.uid ? friendship.user2 : friendship.user1;

                try {
                    const friendDoc = await getDoc(doc(db, 'users', friendId));
                    if (friendDoc.exists()) {
                        friendsData.push({
                            id: docSnap.id,
                            friendId: friendId,
                            friendData: friendDoc.data(),
                            ...friendship
                        });
                    }
                } catch (error) {
                    console.error('Error fetching friend data:', error);
                }
            }

            setFriends(friendsData);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Load friend requests (incoming)
    useEffect(() => {
        if (!currentUser) return;

        const requestsQuery = query(
            collection(db, 'friendships'),
            and(
                where('user2', '==', currentUser.uid),
                where('status', '==', 'pending')
            )
        );

        const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
            const requestsData = [];

            for (const docSnap of snapshot.docs) {
                const request = docSnap.data();

                try {
                    const requesterDoc = await getDoc(doc(db, 'users', request.user1));
                    if (requesterDoc.exists()) {
                        requestsData.push({
                            id: docSnap.id,
                            requesterId: request.user1,
                            requesterData: requesterDoc.data(),
                            ...request
                        });
                    }
                } catch (error) {
                    console.error('Error fetching requester data:', error);
                }
            }

            setFriendRequests(requestsData);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Load sent requests
    useEffect(() => {
        if (!currentUser) return;

        const sentQuery = query(
            collection(db, 'friendships'),
            and(
                where('user1', '==', currentUser.uid),
                where('status', '==', 'pending')
            )
        );

        const unsubscribe = onSnapshot(sentQuery, async (snapshot) => {
            const sentData = [];

            for (const docSnap of snapshot.docs) {
                const request = docSnap.data();

                try {
                    const receiverDoc = await getDoc(doc(db, 'users', request.user2));
                    if (receiverDoc.exists()) {
                        sentData.push({
                            id: docSnap.id,
                            receiverId: request.user2,
                            receiverData: receiverDoc.data(),
                            ...request
                        });
                    }
                } catch (error) {
                    console.error('Error fetching receiver data:', error);
                }
            }

            setSentRequests(sentData);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Load all users for search
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const users = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user =>
                    user.id !== currentUser.uid && // Exclude current user
                    !blockedUsers.includes(user.id) // Exclude blocked users
                );
            setAllUsers(users);
        });

        return () => unsubscribe();
    }, [currentUser, blockedUsers]);

    const sendFriendRequest = async (targetUser) => {
        if (!currentUser) return;

        setLoading(true);
        try {
            // Check if friendship already exists
            const existingQuery = query(
                collection(db, 'friendships'),
                or(
                    and(where('user1', '==', currentUser.uid), where('user2', '==', targetUser.id)),
                    and(where('user1', '==', targetUser.id), where('user2', '==', currentUser.uid))
                )
            );

            const existingSnapshot = await getDocs(existingQuery);

            if (!existingSnapshot.empty) {
                setMessage('Er bestaat al een vriendschap of verzoek met deze gebruiker');
                return;
            }

            await addDoc(collection(db, 'friendships'), {
                user1: currentUser.uid,
                user2: targetUser.id,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            setMessage(`Vriendschapsverzoek verzonden naar ${targetUser.username}`);
            setSearchTerm('');
        } catch (error) {
            console.error('Error sending friend request:', error);
            setMessage('Fout bij het verzenden van vriendschapsverzoek');
        } finally {
            setLoading(false);
        }
    };

    const acceptFriendRequest = async (requestId) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'friendships', requestId), {
                status: 'accepted',
                updatedAt: serverTimestamp()
            });
            setMessage('Vriendschapsverzoek geaccepteerd!');
        } catch (error) {
            console.error('Error accepting friend request:', error);
            setMessage('Fout bij het accepteren van vriendschapsverzoek');
        } finally {
            setLoading(false);
        }
    };

    const rejectFriendRequest = async (requestId, requesterName) => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'friendships', requestId));
            setMessage(`Vriendschapsverzoek van ${requesterName} afgewezen`);
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            setMessage('Fout bij het afwijzen van vriendschapsverzoek');
        } finally {
            setLoading(false);
        }
    };

    const cancelFriendRequest = async (requestId, receiverName) => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'friendships', requestId));
            setMessage(`Vriendschapsverzoek naar ${receiverName} ingetrokken`);
        } catch (error) {
            console.error('Error canceling friend request:', error);
            setMessage('Fout bij het intrekken van vriendschapsverzoek');
        } finally {
            setLoading(false);
        }
    };

    const removeFriend = async (friendshipId, friendName) => {
        if (!window.confirm(`Weet je zeker dat je ${friendName} als vriend wilt verwijderen?`)) {
            return;
        }

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'friendships', friendshipId));
            setMessage(`${friendName} verwijderd als vriend`);
        } catch (error) {
            console.error('Error removing friend:', error);
            setMessage('Fout bij het verwijderen van vriend');
        } finally {
            setLoading(false);
        }
    };

    const getRelationshipStatus = (userId) => {
        // Check if already friends
        if (friends.some(friend => friend.friendId === userId)) {
            return 'friends';
        }

        // Check if request was sent
        if (sentRequests.some(request => request.receiverId === userId)) {
            return 'sent';
        }

        // Check if request was received
        if (friendRequests.some(request => request.requesterId === userId)) {
            return 'received';
        }

        return 'none';
    };

    const openChat = (friend) => {
        setSelectedFriend(friend);
    };

    const closeChat = () => {
        setSelectedFriend(null);
    };

    const filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">Vrienden Beheren</h2>

            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`px-4 py-2 rounded ${
                        activeTab === 'friends'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    👥 Vrienden ({friends.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded ${
                        activeTab === 'requests'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    📬 Verzoeken ({friendRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`px-4 py-2 rounded ${
                        activeTab === 'search'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    🔍 Zoeken
                </button>
            </div>

            {/* Friends Tab */}
            {activeTab === 'friends' && (
                <div className="space-y-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-white">Mijn Vrienden</h3>
                        {friends.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">Je hebt nog geen vrienden toegevoegd</p>
                        ) : (
                            <div className="space-y-3">
                                {friends.map(friend => (
                                    <div key={friend.id} className="flex items-center justify-between bg-gray-600 p-3 rounded">
                                        <div>
                                            <p className="font-medium">@{friend.friendData.username}</p>
                                            <p className="text-sm text-gray-300">{friend.friendData.email}</p>
                                            <p className="text-xs text-gray-400">
                                                Vrienden sinds {new Date(friend.updatedAt?.seconds * 1000).toLocaleDateString('nl-NL')}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openChat(friend)}
                                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                                            >
                                                💬 Chat
                                            </button>
                                            <button
                                                onClick={() => removeFriend(friend.id, friend.friendData.username)}
                                                disabled={loading}
                                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                                            >
                                                Verwijderen
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sent Requests */}
                    {sentRequests.length > 0 && (
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 text-white">Verzonden Verzoeken</h3>
                            <div className="space-y-3">
                                {sentRequests.map(request => (
                                    <div key={request.id} className="flex items-center justify-between bg-gray-600 p-3 rounded">
                                        <div>
                                            <p className="font-medium">@{request.receiverData.username}</p>
                                            <p className="text-sm text-gray-300">Verzoek verzonden</p>
                                        </div>
                                        <button
                                            onClick={() => cancelFriendRequest(request.id, request.receiverData.username)}
                                            disabled={loading}
                                            className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                                        >
                                            Intrekken
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Friend Requests Tab */}
            {activeTab === 'requests' && (
                <div className="space-y-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-white">Vriendschapsverzoeken</h3>
                        {friendRequests.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">Geen openstaande vriendschapsverzoeken</p>
                        ) : (
                            <div className="space-y-3">
                                {friendRequests.map(request => (
                                    <div key={request.id} className="flex items-center justify-between bg-gray-600 p-3 rounded">
                                        <div>
                                            <p className="font-medium">@{request.requesterData.username}</p>
                                            <p className="text-sm text-gray-300">{request.requesterData.email}</p>
                                            <p className="text-xs text-gray-400">
                                                Verzoek ontvangen op {new Date(request.createdAt?.seconds * 1000).toLocaleDateString('nl-NL')}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => acceptFriendRequest(request.id)}
                                                disabled={loading}
                                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                                            >
                                                Accepteren
                                            </button>
                                            <button
                                                onClick={() => rejectFriendRequest(request.id, request.requesterData.username)}
                                                disabled={loading}
                                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                                            >
                                                Afwijzen
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
                <div className="space-y-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-white">Nieuwe Vrienden Zoeken</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Zoek gebruikers om vrienden mee te worden..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 bg-gray-600 text-white rounded"
                            />

                            {searchTerm && (
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {filteredUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                                            <div>
                                                <p className="font-medium">@{user.username}</p>
                                                <p className="text-sm text-gray-300">{user.email}</p>
                                                {user.isPrivate && (
                                                    <p className="text-xs text-yellow-400">🔒 Privé profiel</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => sendFriendRequest(user)}
                                                disabled={loading}
                                                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                                            >
                                                Vriend toevoegen
                                            </button>
                                        </div>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <p className="text-gray-400 text-center py-2">Geen gebruikers gevonden</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Message */}
            {message && (
                <div className="mt-4 p-3 bg-gray-700 rounded text-white text-center">
                    {message}
                </div>
            )}

            {/* Chat Modal */}
            {selectedFriend && (
                <FriendChat
                    currentUser={currentUser}
                    friend={selectedFriend}
                    onClose={closeChat}
                />
            )}
        </div>
    );
}

export default FriendsManager;