import React, { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../App";
import CommentCRUD from "./CommentCRUD";

function PostCRUD({ currentUser, currentUserData }) {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [editingPost, setEditingPost] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', content: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedComments, setExpandedComments] = useState(new Set());
    const [isUserDataLoading, setIsUserDataLoading] = useState(true);

    // Add a loading state tracker for user data
    useEffect(() => {
        if (currentUser !== null) {
            // If we have a user, wait a bit for user data to load
            const timer = setTimeout(() => {
                setIsUserDataLoading(false);
            }, 1000); // Give it 1 second to load user data

            return () => clearTimeout(timer);
        } else {
            // If no user, we're not loading user data
            setIsUserDataLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
            const postList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            // Sort by creation date (newest first)
            postList.sort((a, b) => b.createdAt - a.createdAt);
            setPosts(postList);
        }, (error) => {
            console.error("Error fetching posts:", error);
        });
        return () => unsubscribe();
    }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();

        // Debug logging
        console.log("Creating post...");
        console.log("Current User:", currentUser);
        console.log("Current User Data:", currentUserData);
        console.log("New Post:", newPost);

        if (!currentUser) {
            alert("Please log in to create a post");
            return;
        }

        if (!newPost.title.trim() || !newPost.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        setIsSubmitting(true);

        try {
            // Use fallback values if currentUserData is not available
            const authorUsername = currentUserData?.username ||
                currentUser.displayName ||
                currentUser.email ||
                "Anonymous User";

            const postData = {
                title: newPost.title.trim(),
                content: newPost.content.trim(),
                authorId: currentUser.uid,
                authorUsername: authorUsername,
                likes: [],
                likeCount: 0,
                createdAt: serverTimestamp()
            };

            console.log("Post data to be saved:", postData);

            const docRef = await addDoc(collection(db, "posts"), postData);
            console.log("Post created with ID:", docRef.id);

            setNewPost({ title: '', content: '' });
            alert("Post created successfully!");
        } catch (error) {
            console.error("Error creating post:", error);
            console.error("Error details:", error.message);
            alert(`Error creating post: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditPost = (post) => {
        setEditingPost(post.id);
        setEditForm({ title: post.title, content: post.content });
    };

    const handleUpdatePost = async (postId) => {
        if (!editForm.title.trim() || !editForm.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        try {
            await updateDoc(doc(db, "posts", postId), {
                title: editForm.title.trim(),
                content: editForm.content.trim(),
                updatedAt: serverTimestamp()
            });
            setEditingPost(null);
            alert("Post updated successfully!");
        } catch (error) {
            console.error("Error updating post:", error);
            alert(`Error updating post: ${error.message}`);
        }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await deleteDoc(doc(db, "posts", postId));
                alert("Post deleted successfully!");
            } catch (error) {
                console.error("Error deleting post:", error);
                alert(`Error deleting post: ${error.message}`);
            }
        }
    };

    const handleLikePost = async (postId) => {
        if (!currentUser) {
            alert("Please log in to like posts");
            return;
        }

        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (!postSnap.exists()) {
                alert("Post not found");
                return;
            }

            const postData = postSnap.data();
            const likes = postData.likes || [];

            if (likes.includes(currentUser.uid)) {
                // Unlike the post
                await updateDoc(postRef, {
                    likes: arrayRemove(currentUser.uid),
                    likeCount: Math.max(0, (postData.likeCount || 0) - 1)
                });
            } else {
                // Like the post
                await updateDoc(postRef, {
                    likes: arrayUnion(currentUser.uid),
                    likeCount: (postData.likeCount || 0) + 1
                });
            }
        } catch (error) {
            console.error("Error liking post:", error);
            alert(`Error liking post: ${error.message}`);
        }
    };

    const toggleComments = (postId) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-6">
            {/* Debug Info - Remove this in production */}
            <div className="bg-gray-900 p-2 rounded text-xs text-gray-400">
                Debug: User: {currentUser ? "✓" : "✗"} | UserData: {currentUserData ? "✓" : "✗"} | Posts: {posts.length} | Loading: {isUserDataLoading ? "✓" : "✗"}
            </div>

            {/* Create Post Form */}
            {currentUser && (
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-4 text-purple-400">Create New Post</h2>

                    {/* Show loading state if user data is still loading */}
                    {isUserDataLoading && (
                        <div className="bg-blue-900 p-3 rounded mb-4 text-blue-200">
                            Loading user data... You can still create posts!
                        </div>
                    )}

                    <form onSubmit={handleCreatePost} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Post title..."
                            value={newPost.title}
                            onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                            className="w-full p-3 bg-gray-700 text-white rounded"
                            required
                            disabled={isSubmitting}
                        />
                        <textarea
                            placeholder="What's on your mind?"
                            value={newPost.content}
                            onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                            className="w-full p-3 bg-gray-700 text-white rounded h-24 resize-none"
                            required
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Posting..." : "Post"}
                        </button>
                    </form>
                </div>
            )}

            {!currentUser && (
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-gray-400">Please log in to create posts. You can still view and comment on existing posts!</p>
                </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <div key={post.id} className="bg-gray-800 p-4 rounded-lg">
                            {editingPost === post.id ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                        className="w-full p-2 bg-gray-700 text-white rounded"
                                        required
                                    />
                                    <textarea
                                        value={editForm.content}
                                        onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                                        className="w-full p-2 bg-gray-700 text-white rounded h-20 resize-none"
                                        required
                                    />
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleUpdatePost(post.id)}
                                            className="bg-green-600 px-3 py-1 rounded text-sm"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingPost(null)}
                                            className="bg-gray-600 px-3 py-1 rounded text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-purple-400">@{post.authorUsername}</h3>
                                            <p className="text-sm text-gray-400">
                                                {post.createdAt ? post.createdAt.toLocaleDateString() : "Unknown date"}
                                            </p>
                                        </div>
                                        {currentUser && currentUser.uid === post.authorId && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditPost(post)}
                                                    className="bg-blue-600 px-3 py-1 rounded text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="bg-red-600 px-3 py-1 rounded text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="text-lg font-semibold mb-2">{post.title}</h4>
                                    <p className="text-gray-200 mb-4">{post.content}</p>

                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => handleLikePost(post.id)}
                                            className={`flex items-center space-x-2 px-3 py-1 rounded ${
                                                currentUser && post.likes?.includes(currentUser.uid)
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                            disabled={!currentUser}
                                        >
                                            <span>❤️</span>
                                            <span>{post.likeCount || 0}</span>
                                        </button>

                                        <button
                                            onClick={() => toggleComments(post.id)}
                                            className="flex items-center space-x-2 px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                                        >
                                            <span>💬</span>
                                            <span>
                                                {expandedComments.has(post.id) ? 'Hide Comments' : 'Show Comments'}
                                            </span>
                                        </button>

                                        {post.updatedAt && (
                                            <span className="text-xs text-gray-500">
                                                (edited {post.updatedAt.toDate ? post.updatedAt.toDate().toLocaleString() : "Unknown"})
                                            </span>
                                        )}
                                    </div>

                                    {/* Comments Section - Fixed to ensure proper postId passing */}
                                    {expandedComments.has(post.id) && (
                                        <div key={`comments-${post.id}`}>
                                            <CommentCRUD
                                                currentUser={currentUser}
                                                currentUserData={currentUserData}
                                                postId={post.id}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400 py-8">
                        No posts yet. Be the first to share something!
                    </div>
                )}
            </div>
        </div>
    );
}

export default PostCRUD;