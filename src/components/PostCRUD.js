import React, { useEffect, useState } from "react";
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../App";
import CommentCRUD from "./CommentCRUD";

function PostCRUD({ currentUser, currentUserData }) {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({ title: "", content: "" });
    const [editingPost, setEditingPost] = useState(null);
    const [editForm, setEditForm] = useState({ title: "", content: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedComments, setExpandedComments] = useState(new Set());
    const [isUserDataLoading, setIsUserDataLoading] = useState(true);

    useEffect(() => {
        if (currentUser !== null) {
            const timer = setTimeout(() => {
                setIsUserDataLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setIsUserDataLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, "posts"),
            (snapshot) => {
                const postList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                }));
                postList.sort((a, b) => b.createdAt - a.createdAt);
                setPosts(postList);
            },
            (error) => {
                console.error("Error fetching posts:", error);
            }
        );
        return () => unsubscribe();
    }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();

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
            const authorUsername =
                currentUserData?.username ||
                currentUser.displayName ||
                currentUser.email ||
                "Anonymous User";

            const postData = {
                title: newPost.title.trim(),
                content: newPost.content.trim(),
                authorId: currentUser.uid,
                authorUsername,
                likes: [],
                likeCount: 0,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "posts"), postData);

            setNewPost({ title: "", content: "" });
            alert("Post created successfully!");
        } catch (error) {
            console.error("Error creating post:", error);
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
                updatedAt: serverTimestamp(),
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
                await updateDoc(postRef, {
                    likes: arrayRemove(currentUser.uid),
                    likeCount: Math.max(0, (postData.likeCount || 0) - 1),
                });
            } else {
                await updateDoc(postRef, {
                    likes: arrayUnion(currentUser.uid),
                    likeCount: (postData.likeCount || 0) + 1,
                });
            }
        } catch (error) {
            console.error("Error liking post:", error);
            alert(`Error liking post: ${error.message}`);
        }
    };

    const toggleComments = (postId) => {
        setExpandedComments((prev) => {
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
            {/* Debug Info */}
            <div className="bg-gray-900 p-2 rounded text-xs text-gray-400">
                Debug: User: {currentUser ? "✓" : "✗"} | UserData:{" "}
                {currentUserData ? "✓" : "✗"} | Posts: {posts.length} | Loading:{" "}
                {isUserDataLoading ? "✓" : "✗"}
            </div>

            {/* Create Post Form */}
            {currentUser ? (
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-4" style={{ color: "#FF6B6B" }}>
                        Create New Post
                    </h2>

                    {isUserDataLoading && (
                        <div
                            className="p-3 rounded mb-4 text-red-200"
                            style={{ backgroundColor: "#FF6B6B" }}
                        >
                            Loading user data... You can still create posts!
                        </div>
                    )}

                    <form onSubmit={handleCreatePost} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Post title..."
                            value={newPost.title}
                            onChange={(e) =>
                                setNewPost({ ...newPost, title: e.target.value })
                            }
                            className="w-full p-3 bg-gray-700 text-white rounded"
                            required
                            disabled={isSubmitting}
                        />
                        <textarea
                            placeholder="What's on your mind?"
                            value={newPost.content}
                            onChange={(e) =>
                                setNewPost({ ...newPost, content: e.target.value })
                            }
                            className="w-full p-3 bg-gray-700 text-white rounded h-24 resize-none"
                            required
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 rounded font-semibold disabled:opacity-50"
                            style={{
                                backgroundColor: "#FF6B6B",
                                color: "white",
                            }}
                            disabled={isSubmitting}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = "#E55A5A")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = "#FF6B6B")
                            }
                        >
                            {isSubmitting ? "Posting..." : "Post"}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-gray-400">
                        Please log in to create posts. You can still view and comment on
                        existing posts!
                    </p>
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
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, title: e.target.value })
                                        }
                                        className="w-full p-2 bg-gray-700 text-white rounded"
                                        required
                                    />
                                    <textarea
                                        value={editForm.content}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, content: e.target.value })
                                        }
                                        className="w-full p-2 bg-gray-700 text-white rounded h-20 resize-none"
                                        required
                                    />
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleUpdatePost(post.id)}
                                            className="px-3 py-1 rounded text-sm"
                                            style={{
                                                backgroundColor: "#FF6B6B",
                                                color: "white",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#E55A5A")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#FF6B6B")
                                            }
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingPost(null)}
                                            className="px-3 py-1 rounded text-sm"
                                            style={{
                                                backgroundColor: "#FF6B6B",
                                                color: "white",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#E55A5A")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#FF6B6B")
                                            }
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3
                                                className="font-bold"
                                                style={{ color: "#FF6B6B" }}
                                            >
                                                @{post.authorUsername}
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                {post.createdAt
                                                    ? post.createdAt.toLocaleDateString()
                                                    : "Unknown date"}
                                            </p>
                                        </div>
                                        {currentUser && currentUser.uid === post.authorId && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditPost(post)}
                                                    className="px-3 py-1 rounded text-sm"
                                                    style={{
                                                        backgroundColor: "#FF6B6B",
                                                        color: "white",
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.backgroundColor =
                                                            "#E55A5A")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.backgroundColor =
                                                            "#FF6B6B")
                                                    }
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="px-3 py-1 rounded text-sm"
                                                    style={{
                                                        backgroundColor: "#FF6B6B",
                                                        color: "white",
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.backgroundColor =
                                                            "#E55A5A")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.backgroundColor =
                                                            "#FF6B6B")
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="text-lg font-semibold mb-2 text-white">
                                        {post.title}
                                    </h4>
                                    <p className="text-gray-200 mb-4">{post.content}</p>

                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => handleLikePost(post.id)}
                                            className={`flex items-center space-x-2 px-3 py-1 rounded`}
                                            style={{
                                                backgroundColor:
                                                    currentUser && post.likes?.includes(currentUser.uid)
                                                        ? "#FF6B6B"
                                                        : "#4B5563",
                                                color:
                                                    currentUser && post.likes?.includes(currentUser.uid)
                                                        ? "white"
                                                        : "#D1D5DB",
                                            }}
                                            disabled={!currentUser}
                                            onMouseEnter={(e) => {
                                                if (
                                                    currentUser &&
                                                    post.likes?.includes(currentUser.uid)
                                                ) {
                                                    e.currentTarget.style.backgroundColor =
                                                        "#E55A5A";
                                                } else {
                                                    e.currentTarget.style.backgroundColor =
                                                        "#6B7280";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (
                                                    currentUser &&
                                                    post.likes?.includes(currentUser.uid)
                                                ) {
                                                    e.currentTarget.style.backgroundColor =
                                                        "#FF6B6B";
                                                } else {
                                                    e.currentTarget.style.backgroundColor =
                                                        "#4B5563";
                                                }
                                            }}
                                        >
                                            <span>❤️</span>
                                            <span>{post.likeCount || 0}</span>
                                        </button>

                                        <button
                                            onClick={() => toggleComments(post.id)}
                                            className="flex items-center space-x-2 px-3 py-1 rounded text-white"
                                            style={{ backgroundColor: "#FF6B6B" }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#E55A5A")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#FF6B6B")
                                            }
                                        >
                                            <span>💬</span>
                                            <span>
                                                {expandedComments.has(post.id)
                                                    ? "Hide Comments"
                                                    : "Show Comments"}
                                            </span>
                                        </button>

                                        {post.updatedAt && (
                                            <span className="text-xs text-gray-500">
                                                (edited{" "}
                                                {post.updatedAt.toDate
                                                    ? post.updatedAt.toDate().toLocaleString()
                                                    : "Unknown"}
                                                )
                                            </span>
                                        )}
                                    </div>

                                    {expandedComments.has(post.id) && (
                                        <CommentCRUD
                                            currentUser={currentUser}
                                            currentUserData={currentUserData}
                                            postId={post.id}
                                        />
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
