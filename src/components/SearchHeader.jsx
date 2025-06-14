import React, { useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../App';

const SearchHeader = ({ currentUser, currentUserData, onSignOut, onShowLogin }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [searchType, setSearchType] = useState('all'); // 'all', 'posts', 'users'

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchQuery.trim()) {
            alert('Please enter a search term');
            return;
        }

        setIsSearching(true);
        setShowResults(true);

        try {
            const results = [];

            // Search posts by title and author username
            if (searchType === 'all' || searchType === 'posts') {
                const postsQuery = query(
                    collection(db, 'posts'),
                    orderBy('createdAt', 'desc')
                );
                const postsSnapshot = await getDocs(postsQuery);

                const filteredPosts = postsSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data(), type: 'post' }))
                    .filter(post =>
                        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        post.authorUsername.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                results.push(...filteredPosts);
            }

            // Search users by username and email
            if (searchType === 'all' || searchType === 'users') {
                const usersQuery = query(collection(db, 'users'));
                const usersSnapshot = await getDocs(usersQuery);

                const filteredUsers = usersSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data(), type: 'user' }))
                    .filter(user =>
                        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                results.push(...filteredUsers);
            }

            setSearchResults(results);

        } catch (error) {
            console.error('Search error:', error);
            alert('Search failed. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Fixed Header */}
            <div className="fixed top-0 w-full z-50 bg-black bg-opacity-95 backdrop-blur-md border-b border-gray-800">
                {/* Top Row - Brand and Auth */}
                <div className="px-4 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-wider text-purple-400">GymTok 💪</h1>
                    {currentUser ? (
                        <div className="text-right text-sm">
                            <p className="text-gray-300">👤 {currentUserData?.username || currentUser.email}</p>
                            <button
                                onClick={onSignOut}
                                className="mt-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onShowLogin}
                            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold"
                        >
                            Login
                        </button>
                    )}
                </div>

                {/* Search Bar Row */}
                <div className="px-4 pb-3">
                    <form onSubmit={handleSearch} className="flex items-center space-x-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search posts by title, users by username..."
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none"
                        >
                            <option value="all">All</option>
                            <option value="posts">Posts</option>
                            <option value="users">Users</option>
                        </select>

                        <button
                            type="submit"
                            disabled={isSearching}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-semibold"
                        >
                            {isSearching ? '🔍' : 'Search'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Search Results Overlay */}
            {showResults && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-start justify-center pt-32">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">
                                Search Results for "{searchQuery}"
                            </h3>
                            <button
                                onClick={() => setShowResults(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        {isSearching ? (
                            <div className="text-center py-8">
                                <div className="text-purple-400 text-lg">Searching...</div>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-4">
                                {searchResults.map((result) => (
                                    <div key={`${result.type}-${result.id}`} className="bg-gray-800 p-4 rounded-lg">
                                        {result.type === 'post' ? (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">POST</span>
                                                    <span className="text-gray-400 text-sm">
                                                        {formatDate(result.createdAt)}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-white mb-1">{result.title}</h4>
                                                <p className="text-gray-300 text-sm mb-2">
                                                    By @{result.authorUsername}
                                                </p>
                                                <p className="text-gray-400 text-sm line-clamp-2">
                                                    {result.content.substring(0, 100)}...
                                                </p>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <span className="text-red-400">❤️ {result.likeCount || 0}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs bg-green-600 px-2 py-1 rounded">USER</span>
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        result.role === 'admin' ? 'bg-red-600' : 'bg-gray-600'
                                                    }`}>
                                                        {result.role === 'admin' ? 'Admin' : 'User'}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-white mb-1">@{result.username}</h4>
                                                <p className="text-gray-400 text-sm">{result.email}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                No results found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default SearchHeader;