// import React, { useState, useEffect } from 'react';
// import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
// import { db } from '../App';
//
// function SearchBar({ currentUser, currentUserData }) {
//     const [searchQuery, setSearchQuery] = useState('');
//     const [searchType, setSearchType] = useState('all'); // 'all', 'users', 'posts'
//     const [users, setUsers] = useState([]);
//     const [posts, setPosts] = useState([]);
//     const [filteredResults, setFilteredResults] = useState({ users: [], posts: [] });
//     const [showResults, setShowResults] = useState(false);
//     const [userFriends, setUserFriends] = useState([]);
//
//     // Fetch users and posts
//     useEffect(() => {
//         const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
//             const userList = snapshot.docs.map((doc) => ({
//                 id: doc.id,
//                 ...doc.data()
//             }));
//             setUsers(userList);
//         });
//
//         // Check if posts collection exists, if not create empty array
//         const unsubscribePosts = onSnapshot(
//             collection(db, "posts"),
//             (snapshot) => {
//                 const postList = snapshot.docs.map((doc) => ({
//                     id: doc.id,
//                     ...doc.data(),
//                     createdAt: doc.data().createdAt?.toDate() || new Date()
//                 }));
//                 setPosts(postList);
//             },
//             (error) => {
//                 console.log("Posts collection doesn't exist yet:", error);
//                 setPosts([]); // Set empty array if collection doesn't exist
//             }
//         );
//
//         return () => {
//             unsubscribeUsers();
//             unsubscribePosts();
//         };
//     }, []);
//
//     // Fetch current user's friends
//     useEffect(() => {
//         if (currentUser) {
//             const fetchUserFriends = async () => {
//                 try {
//                     const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
//                     if (userDoc.exists()) {
//                         const userData = userDoc.data();
//                         setUserFriends(userData.friends || []);
//                     }
//                 } catch (error) {
//                     console.error("Error fetching user friends:", error);
//                 }
//             };
//             fetchUserFriends();
//         }
//     }, [currentUser]);
//
//     // Filter results based on search query
//     useEffect(() => {
//         if (!searchQuery.trim()) {
//             setFilteredResults({ users: [], posts: [] });
//             setShowResults(false);
//             return;
//         }
//
//         const query = searchQuery.toLowerCase();
//
//         // Filter users - Updated to match your database structure
//         const filteredUsers = users.filter(user =>
//             user.username?.toLowerCase().includes(query) ||
//             user.email?.toLowerCase().includes(query)
//         ).filter(user => user.id !== currentUser?.uid); // Exclude current user
//
//         // Filter posts - Updated field names based on common post structures
//         const filteredPosts = posts.filter(post =>
//             post.title?.toLowerCase().includes(query) ||
//             post.content?.toLowerCase().includes(query) ||
//             post.description?.toLowerCase().includes(query) ||
//             post.authorUsername?.toLowerCase().includes(query) ||
//             post.author?.toLowerCase().includes(query)
//         );
//
//         // Apply search type filter
//         let results = { users: [], posts: [] };
//
//         if (searchType === 'all' || searchType === 'users') {
//             results.users = filteredUsers;
//         }
//         if (searchType === 'all' || searchType === 'posts') {
//             results.posts = filteredPosts;
//         }
//
//         setFilteredResults(results);
//         setShowResults(true);
//     }, [searchQuery, searchType, users, posts, currentUser]);
//
//     const handleAddFriend = async (userId) => {
//         if (!currentUser) {
//             alert("Please log in to add friends");
//             return;
//         }
//
//         try {
//             const currentUserRef = doc(db, 'users', currentUser.uid);
//             const targetUserRef = doc(db, 'users', userId);
//
//             // Initialize friends array if it doesn't exist
//             const currentUserDoc = await getDoc(currentUserRef);
//             const targetUserDoc = await getDoc(targetUserRef);
//
//             if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
//                 alert("User not found");
//                 return;
//             }
//
//             // Add friend to current user's friends list
//             await updateDoc(currentUserRef, {
//                 friends: arrayUnion(userId)
//             });
//
//             // Add current user to target user's friends list (mutual friendship)
//             await updateDoc(targetUserRef, {
//                 friends: arrayUnion(currentUser.uid)
//             });
//
//             // Update local state
//             setUserFriends(prev => [...prev, userId]);
//
//             alert("Friend added successfully!");
//         } catch (error) {
//             console.error("Error adding friend:", error);
//             alert("Error adding friend: " + error.message);
//         }
//     };
//
//     const handleRemoveFriend = async (userId) => {
//         if (!currentUser) return;
//
//         if (window.confirm("Are you sure you want to remove this friend?")) {
//             try {
//                 const currentUserRef = doc(db, 'users', currentUser.uid);
//                 const targetUserRef = doc(db, 'users', userId);
//
//                 // Remove friend from current user's friends list
//                 await updateDoc(currentUserRef, {
//                     friends: arrayRemove(userId)
//                 });
//
//                 // Remove current user from target user's friends list
//                 await updateDoc(targetUserRef, {
//                     friends: arrayRemove(currentUser.uid)
//                 });
//
//                 // Update local state
//                 setUserFriends(prev => prev.filter(id => id !== userId));
//
//                 alert("Friend removed successfully!");
//             } catch (error) {
//                 console.error("Error removing friend:", error);
//                 alert("Error removing friend: " + error.message);
//             }
//         }
//     };
//
//     const clearSearch = () => {
//         setSearchQuery('');
//         setShowResults(false);
//     };
//
//     return (
//         <div className="relative mb-6">
//             {/* Search Input */}
//             <div className="bg-gray-800 p-4 rounded-lg">
//                 <div className="flex flex-col space-y-3">
//                     {/* Search Type Selector */}
//                     <div className="flex space-x-2">
//                         <button
//                             onClick={() => setSearchType('all')}
//                             className={`px-3 py-1 rounded text-sm ${
//                                 searchType === 'all'
//                                     ? 'bg-purple-600 text-white'
//                                     : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
//                             }`}
//                         >
//                             All
//                         </button>
//                         <button
//                             onClick={() => setSearchType('users')}
//                             className={`px-3 py-1 rounded text-sm ${
//                                 searchType === 'users'
//                                     ? 'bg-blue-600 text-white'
//                                     : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
//                             }`}
//                         >
//                             Users
//                         </button>
//                         <button
//                             onClick={() => setSearchType('posts')}
//                             className={`px-3 py-1 rounded text-sm ${
//                                 searchType === 'posts'
//                                     ? 'bg-green-600 text-white'
//                                     : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
//                             }`}
//                         >
//                             Posts
//                         </button>
//                     </div>
//
//                     {/* Search Input */}
//                     <div className="relative">
//                         <input
//                             type="text"
//                             placeholder="Search for users or posts..."
//                             value={searchQuery}
//                             onChange={(e) => setSearchQuery(e.target.value)}
//                             className="w-full p-3 bg-gray-700 text-white rounded pl-10 pr-10"
//                         />
//                         <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                             🔍
//                         </div>
//                         {searchQuery && (
//                             <button
//                                 onClick={clearSearch}
//                                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
//                             >
//                                 ✕
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             </div>
//
//             {/* Search Results */}
//             {showResults && (
//                 <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto border border-gray-700">
//                     {/* Users Results */}
//                     {filteredResults.users.length > 0 && (
//                         <div className="p-4 border-b border-gray-700">
//                             <h3 className="text-lg font-semibold text-blue-400 mb-3">
//                                 👥 Users ({filteredResults.users.length})
//                             </h3>
//                             <div className="space-y-2">
//                                 {filteredResults.users.map((user) => (
//                                     <div key={user.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
//                                         <div className="flex items-center space-x-3">
//                                             <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
//                                                 {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
//                                             </div>
//                                             <div>
//                                                 <p className="font-semibold">@{user.username || 'No username'}</p>
//                                                 <p className="text-sm text-gray-400">{user.email}</p>
//                                             </div>
//                                         </div>
//                                         {currentUser && (
//                                             <div className="flex items-center space-x-2">
//                                                 {userFriends.includes(user.id) ? (
//                                                     <>
//                                                         <span className="text-green-400 text-sm">✓ Friends</span>
//                                                         <button
//                                                             onClick={() => handleRemoveFriend(user.id)}
//                                                             className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
//                                                         >
//                                                             Remove
//                                                         </button>
//                                                     </>
//                                                 ) : (
//                                                     <button
//                                                         onClick={() => handleAddFriend(user.id)}
//                                                         className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
//                                                     >
//                                                         Add Friend
//                                                     </button>
//                                                 )}
//                                             </div>
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}
//
//                     {/* Posts Results */}
//                     {filteredResults.posts.length > 0 && (
//                         <div className="p-4">
//                             <h3 className="text-lg font-semibold text-green-400 mb-3">
//                                 📝 Posts ({filteredResults.posts.length})
//                             </h3>
//                             <div className="space-y-2">
//                                 {filteredResults.posts.map((post) => (
//                                     <div key={post.id} className="p-3 bg-gray-700 rounded">
//                                         <div className="flex justify-between items-start mb-2">
//                                             <div>
//                                                 <p className="text-sm text-purple-400">@{post.authorUsername || post.author || 'Anonymous'}</p>
//                                                 <p className="text-xs text-gray-400">
//                                                     {post.createdAt ? post.createdAt.toLocaleDateString() : 'Unknown date'}
//                                                 </p>
//                                             </div>
//                                             <div className="flex items-center space-x-2 text-sm text-gray-400">
//                                                 <span>❤️ {post.likeCount || post.likes || 0}</span>
//                                             </div>
//                                         </div>
//                                         <h4 className="font-semibold mb-1">{post.title || 'Untitled Post'}</h4>
//                                         <p className="text-sm text-gray-300 line-clamp-2">
//                                             {(post.content || post.description || 'No content').length > 100
//                                                 ? (post.content || post.description || 'No content').substring(0, 100) + '...'
//                                                 : (post.content || post.description || 'No content')
//                                             }
//                                         </p>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}
//
//                     {/* No Results */}
//                     {filteredResults.users.length === 0 && filteredResults.posts.length === 0 && (
//                         <div className="p-6 text-center text-gray-400">
//                             <p>No results found for "{searchQuery}"</p>
//                             <p className="text-sm mt-1">Try searching for users or posts with different keywords</p>
//                         </div>
//                     )}
//                 </div>
//             )}
//
//             {/* Friends Count Display */}
//             {currentUser && userFriends.length > 0 && (
//                 <div className="mt-2 text-center">
//                     <span className="text-sm text-gray-400">
//                         👥 You have {userFriends.length} friend{userFriends.length !== 1 ? 's' : ''}
//                     </span>
//                 </div>
//             )}
//         </div>
//     );
// }
//
// export default SearchBar;