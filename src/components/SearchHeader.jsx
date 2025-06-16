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

            if (searchType === 'all' || searchType === 'posts') {
                const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
                const postsSnapshot = await getDocs(postsQuery);

                const filteredPosts = postsSnapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data(), type: 'post' }))
                    .filter(
                        (post) =>
                            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.authorUsername.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                results.push(...filteredPosts);
            }

            if (searchType === 'all' || searchType === 'users') {
                const usersQuery = query(collection(db, 'users'));
                const usersSnapshot = await getDocs(usersQuery);

                const filteredUsers = usersSnapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data(), type: 'user' }))
                    .filter(
                        (user) =>
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
            <div className="fixed top-0 w-full z-50 bg-[#1E1E1E] border-b border-[#B9CFD4] backdrop-blur-md">
                {/* Top Row - Brand and Auth */}
                <div className="px-4 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-wider text-[#FF6B6B]">GymTok</h1>
                    {currentUser ? (
                        <div className="text-right text-sm">
                            <p className="text-[#B9CFD4]">👤 {currentUserData?.username || currentUser.email}</p>
                            <button
                                onClick={onSignOut}
                                className="mt-1 bg-[#40434E] text-white px-3 py-1 rounded hover:bg-[#333B44]"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onShowLogin}
                            className="bg-[#FF6B6B] hover:bg-[#E55A5A] px-4 py-2 rounded font-semibold text-white"
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
                                className="w-full px-4 py-2 bg-[#B9CFD4] text-black rounded-lg border border-[#B9CFD4] focus:border-[#B9CFD4] focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-700"
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="px-3 py-2 bg-[#B9CFD4] text-black rounded-lg border border-[#B9CFD4] focus:border-[#B9CFD4] focus:outline-none"
                        >
                            <option value="all">All</option>
                            <option value="posts">Posts</option>
                            <option value="users">Users</option>
                        </select>

                        <button
                            type="submit"
                            disabled={isSearching}
                            className="px-6 py-2 bg-[#FF6B6B] hover:bg-[#E55A5A] disabled:bg-[#40434E] text-white rounded-lg font-semibold"
                        >
                            {isSearching ? '🔍' : 'Search'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Search Results Overlay */}
            {showResults && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-start justify-center pt-32">
                    <div className="bg-[#40434E] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">
                                Search Results for "{searchQuery}"
                            </h3>
                            <button
                                onClick={() => setShowResults(false)}
                                className="text-[#B9CFD4] hover:text-white text-2xl"
                                aria-label="Close search results"
                            >
                                ✕
                            </button>
                        </div>

                        {isSearching ? (
                            <div className="text-center py-8">
                                <div className="text-[#B9CFD4] text-lg">Searching...</div>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-4">
                                {searchResults.map((result) => (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        className="bg-[#1E1E1E] p-4 rounded-lg"
                                    >
                                        {result.type === 'post' ? (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs bg-[#FF6B6B] px-2 py-1 rounded text-white">POST</span>
                                                    <span className="text-[#B9CFD4] text-sm">
                            {formatDate(result.createdAt)}
                          </span>
                                                </div>
                                                <h4 className="font-bold text-white mb-1">{result.title}</h4>
                                                <p className="text-[#B9CFD4] text-sm mb-2">
                                                    By @{result.authorUsername}
                                                </p>
                                                <p className="text-[#B9CFD4] text-sm line-clamp-2">
                                                    {result.content.substring(0, 100)}...
                                                </p>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <span className="text-[#FF6B6B]">❤️ {result.likeCount || 0}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs bg-[#B9CFD4] px-2 py-1 rounded text-black">USER</span>
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded ${
                                                            result.role === 'admin' ? 'bg-[#FF6B6B] text-white' : 'bg-[#40434E] text-white'
                                                        }`}
                                                    >
                            {result.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                                                </div>
                                                <h4 className="font-bold text-white mb-1">@{result.username}</h4>
                                                <p className="text-[#B9CFD4] text-sm">{result.email}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-[#B9CFD4]">
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
