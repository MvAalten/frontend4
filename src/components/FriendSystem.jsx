// FriendSystem.jsx - Main friend system component
import React, { useState, useEffect } from 'react';
import {
    Search,
    UserPlus,
    MessageCircle,
    ArrowLeft,
    Send,
    Users,
    UserX,
    Shield,
    MoreVertical,
    UserMinus
} from 'lucide-react';
import {
    createOrGetUser,
    getAllUsers,
    getUserFriends,
    addFriend,
    removeFriend,
    blockUser,
    unblockUser,
    getBlockedUsers,
    sendMessage,
    getMessagesListener
} from './firebaseService';

function FriendSystem() {
    const [currentUser, setCurrentUser] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [view, setView] = useState('login'); // login, friends, search, chat, blocked
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [users, setUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(null);

    const handleLogin = async () => {
        if (!currentUser.trim()) return;
        setLoading(true);
        try {
            const user = await createOrGetUser(currentUser);
            setCurrentUserId(user.id);
            setIsLoggedIn(true);
            setView('friends');
            await loadFriends(user.id);
        } catch (error) {
            console.error('Error during login:', error);
            alert('Login failed. Please try again.');
        }
        setLoading(false);
    };

    const loadUsers = async () => {
        try {
            const userList = await getAllUsers(currentUserId);
            setUsers(userList);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadFriends = async (userId) => {
        try {
            const friendsList = await getUserFriends(userId);
            setFriends(friendsList);
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    };

    const loadBlockedUsers = async () => {
        try {
            const blocked = await getBlockedUsers(currentUserId);
            setBlockedUsers(blocked);
        } catch (error) {
            console.error('Error loading blocked users:', error);
        }
    };

    const handleAddFriend = async (friendUser) => {
        try {
            await addFriend(currentUserId, friendUser.id);
            await loadFriends(currentUserId);
            setShowUserMenu(null);
        } catch (error) {
            console.error('Error adding friend:', error);
            alert('Failed to add friend. Please try again.');
        }
    };

    const handleRemoveFriend = async (friendId) => {
        try {
            await removeFriend(currentUserId, friendId);
            await loadFriends(currentUserId);
            setShowUserMenu(null);
        } catch (error) {
            console.error('Error removing friend:', error);
            alert('Failed to remove friend. Please try again.');
        }
    };

    const handleBlockUser = async (userId) => {
        try {
            await blockUser(currentUserId, userId);
            await loadFriends(currentUserId);
            await loadBlockedUsers();
            setShowUserMenu(null);
            if (selectedFriend && selectedFriend.id === userId) {
                setView('friends');
                setSelectedFriend(null);
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            alert('Failed to block user. Please try again.');
        }
    };

    const handleUnblockUser = async (userId) => {
        try {
            await unblockUser(currentUserId, userId);
            await loadBlockedUsers();
        } catch (error) {
            console.error('Error unblocking user:', error);
            alert('Failed to unblock user. Please try again.');
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedFriend) return;
        try {
            await sendMessage(currentUserId, currentUser, selectedFriend.id, messageText);
            setMessageText('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    useEffect(() => {
        if (view === 'search' && users.length === 0) {
            loadUsers();
        }
    }, [view]);

    useEffect(() => {
        if (view === 'blocked') {
            loadBlockedUsers();
        }
    }, [view]);

    useEffect(() => {
        let unsubscribe;
        if (selectedFriend) {
            const conversationId = [currentUserId, selectedFriend.id].sort().join('_');
            unsubscribe = getMessagesListener(conversationId, setMessages);
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selectedFriend]);

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const unfriendedUsers = filteredUsers.filter(user =>
        !friends.find(f => f.id === user.id) &&
        !blockedUsers.find(b => b.id === user.id)
    );

    const UserCard = ({ user, actions, showMenu = false }) => (
        <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                            {user.name?.charAt(0) || user.username?.charAt(0)}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-800">{user.name || user.username}</h3>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {actions}
                    {showMenu && (
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(showUserMenu === user.id ? null : user.id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                            {showUserMenu === user.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={() => handleRemoveFriend(user.id)}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <UserMinus className="w-4 h-4 inline mr-2" />
                                            Remove Friend
                                        </button>
                                        <button
                                            onClick={() => handleBlockUser(user.id)}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <UserX className="w-4 h-4 inline mr-2" />
                                            Block User
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Friend Connect</h1>
                        <p className="text-gray-600 mt-2">Connect with friends and chat privately</p>
                    </div>
                    <div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter your username
                            </label>
                            <input
                                type="text"
                                value={currentUser}
                                onChange={(e) => setCurrentUser(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Your username"
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                disabled={loading}
                            />
                        </div>
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Continue'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {view !== 'friends' && (
                                <button
                                    onClick={() => {
                                        setView('friends');
                                        setSelectedFriend(null);
                                        setShowUserMenu(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <h1 className="text-xl font-bold text-gray-800">
                                {view === 'friends' && 'Your Friends'}
                                {view === 'search' && 'Find Friends'}
                                {view === 'blocked' && 'Blocked Users'}
                                {view === 'chat' && selectedFriend?.name}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">@{currentUser}</span>
                            <button
                                onClick={() => {
                                    setIsLoggedIn(false);
                                    setView('login');
                                    setCurrentUser('');
                                    setCurrentUserId('');
                                    setFriends([]);
                                    setUsers([]);
                                    setBlockedUsers([]);
                                }}
                                className="text-sm text-blue-500 hover:text-blue-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4">
                {view === 'friends' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-700">
                                Friends ({friends.length})
                            </h2>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setView('blocked')}
                                    className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                                >
                                    <Shield className="w-4 h-4" />
                                    <span>Blocked</span>
                                </button>
                                <button
                                    onClick={() => setView('search')}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>Find Friends</span>
                                </button>
                            </div>
                        </div>

                        {friends.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-500 mb-2">No friends yet</h3>
                                <p className="text-gray-400 mb-4">Start by searching for people to add as friends</p>
                                <button
                                    onClick={() => setView('search')}
                                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Find Friends
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {friends.map(friend => (
                                    <UserCard
                                        key={friend.id}
                                        user={friend}
                                        showMenu={true}
                                        actions={
                                            <button
                                                onClick={() => {
                                                    setSelectedFriend(friend);
                                                    setView('chat');
                                                }}
                                                className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {view === 'search' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users..."
                                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        {unfriendedUsers.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                No users found.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {unfriendedUsers.map(user => (
                                    <UserCard
                                        key={user.id}
                                        user={user}
                                        actions={
                                            <button
                                                onClick={() => handleAddFriend(user)}
                                                className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                <span>Add</span>
                                            </button>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {view === 'blocked' && (
                    <div className="space-y-4">
                        {blockedUsers.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                You have not blocked any users.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {blockedUsers.map(user => (
                                    <UserCard
                                        key={user.id}
                                        user={user}
                                        actions={
                                            <button
                                                onClick={() => handleUnblockUser(user.id)}
                                                className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                                            >
                                                Unblock
                                            </button>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {view === 'chat' && selectedFriend && (
                    <div className="flex flex-col h-[70vh]">
                        <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-white rounded-lg border">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`p-2 rounded-lg max-w-xs ${
                                        msg.senderId === currentUserId
                                            ? 'bg-blue-500 text-white self-end ml-auto'
                                            : 'bg-gray-200 text-gray-800 self-start mr-auto'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center space-x-2">
                            <input
                                type="text"
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FriendSystem;
