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
    const [newTask, setNewTask] = useState({ title: "", content: "", deadline: "" });
    const [editingPost, setEditingPost] = useState(null);
    const [editForm, setEditForm] = useState({ title: "", content: "", deadline: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedComments, setExpandedComments] = useState(new Set());
    const [isUserDataLoading, setIsUserDataLoading] = useState(true);
    const [postType, setPostType] = useState("post"); // "post" or "task"
    const [completedTasks, setCompletedTasks] = useState(new Set());

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
                    deadline: doc.data().deadline?.toDate?.() || doc.data().deadline,
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

        const isTask = postType === "task";
        const currentData = isTask ? newTask : newPost;

        if (!currentData.title.trim() || !currentData.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        if (isTask && !currentData.deadline) {
            alert("Please set a deadline for the task");
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
                title: currentData.title.trim(),
                content: currentData.content.trim(),
                authorId: currentUser.uid,
                authorUsername,
                likes: [],
                likeCount: 0,
                createdAt: serverTimestamp(),
                type: postType,
                isCompleted: false,
            };

            if (isTask) {
                postData.deadline = new Date(currentData.deadline);
            }

            await addDoc(collection(db, "posts"), postData);

            if (isTask) {
                setNewTask({ title: "", content: "", deadline: "" });
            } else {
                setNewPost({ title: "", content: "" });
            }

            alert(`${isTask ? "Task" : "Post"} created successfully!`);
        } catch (error) {
            console.error(`Error creating ${postType}:`, error);
            alert(`Error creating ${postType}: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditPost = (post) => {
        setEditingPost(post.id);
        setEditForm({
            title: post.title,
            content: post.content,
            deadline: post.deadline ?
                (post.deadline instanceof Date ?
                        post.deadline.toISOString().slice(0, 16) :
                        new Date(post.deadline).toISOString().slice(0, 16)
                ) : ""
        });
    };

    const handleUpdatePost = async (postId) => {
        const post = posts.find(p => p.id === postId);
        const isTask = post.type === "task";

        if (!editForm.title.trim() || !editForm.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        if (isTask && !editForm.deadline) {
            alert("Please set a deadline for the task");
            return;
        }

        try {
            const updateData = {
                title: editForm.title.trim(),
                content: editForm.content.trim(),
                updatedAt: serverTimestamp(),
            };

            if (isTask) {
                updateData.deadline = new Date(editForm.deadline);
            }

            await updateDoc(doc(db, "posts", postId), updateData);
            setEditingPost(null);
            alert(`${isTask ? "Task" : "Post"} updated successfully!`);
        } catch (error) {
            console.error(`Error updating ${isTask ? "task" : "post"}:`, error);
            alert(`Error updating ${isTask ? "task" : "post"}: ${error.message}`);
        }
    };

    const handleDeletePost = async (postId) => {
        const post = posts.find(p => p.id === postId);
        const isTask = post.type === "task";

        if (window.confirm(`Are you sure you want to delete this ${isTask ? "task" : "post"}?`)) {
            try {
                await deleteDoc(doc(db, "posts", postId));
                alert(`${isTask ? "Task" : "Post"} deleted successfully!`);
            } catch (error) {
                console.error(`Error deleting ${isTask ? "task" : "post"}:`, error);
                alert(`Error deleting ${isTask ? "task" : "post"}: ${error.message}`);
            }
        }
    };

    const handleToggleTaskCompletion = async (postId) => {
        if (!currentUser) {
            alert("Please log in to mark tasks as complete");
            return;
        }

        const post = posts.find(p => p.id === postId);
        if (!post || post.type !== "task") return;

        try {
            await updateDoc(doc(db, "posts", postId), {
                isCompleted: !post.isCompleted,
                completedAt: !post.isCompleted ? serverTimestamp() : null,
            });
        } catch (error) {
            console.error("Error updating task completion:", error);
            alert(`Error updating task: ${error.message}`);
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

    const getDeadlineStatus = (deadline) => {
        if (!deadline) return null;

        const now = new Date();
        const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
        const timeDiff = deadlineDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff < 0) {
            return { status: "overdue", text: `${Math.abs(daysDiff)} days overdue`, color: "#DC2626" };
        } else if (daysDiff === 0) {
            return { status: "today", text: "Due today", color: "#FF6B6B" };
        } else if (daysDiff <= 3) {
            return { status: "soon", text: `Due in ${daysDiff} days`, color: "#F59E0B" };
        } else {
            return { status: "upcoming", text: `Due in ${daysDiff} days`, color: "#10B981" };
        }
    };

    return (
        <div className="space-y-6 mt-8">
            {/* Debug Info */}
            <div className="bg-gray-900 p-2 rounded text-xs text-gray-400">
                Debug: User: {currentUser ? "✓" : "✗"} | UserData:{" "}
                {currentUserData ? "✓" : "✗"} | Posts: {posts.length} | Loading:{" "}
                {isUserDataLoading ? "✓" : "✗"}
            </div>

            {/* Create Post/Task Form */}
            {currentUser ? (
                <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold" style={{ color: "#FF6B6B" }}>
                            Create New {postType === "task" ? "Task" : "Post"}
                        </h2>

                        {/* Post Type Toggle */}
                        <div className="flex bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setPostType("post")}
                                className={`px-4 py-2 rounded transition-all ${
                                    postType === "post"
                                        ? "bg-[#FF6B6B] text-white"
                                        : "text-gray-300 hover:text-white"
                                }`}
                            >
                                📝 Post
                            </button>
                            <button
                                onClick={() => setPostType("task")}
                                className={`px-4 py-2 rounded transition-all ${
                                    postType === "task"
                                        ? "bg-[#FF6B6B] text-white"
                                        : "text-gray-300 hover:text-white"
                                }`}
                            >
                                ✅ Task
                            </button>
                        </div>
                    </div>

                    {isUserDataLoading && (
                        <div
                            className="p-3 rounded mb-4 text-red-200"
                            style={{ backgroundColor: "#FF6B6B" }}
                        >
                            Loading user data... You can still create {postType}s!
                        </div>
                    )}

                    <form onSubmit={handleCreatePost} className="space-y-3">
                        <input
                            type="text"
                            placeholder={`${postType === "task" ? "Task" : "Post"} title...`}
                            value={postType === "task" ? newTask.title : newPost.title}
                            onChange={(e) => {
                                if (postType === "task") {
                                    setNewTask({ ...newTask, title: e.target.value });
                                } else {
                                    setNewPost({ ...newPost, title: e.target.value });
                                }
                            }}
                            className="w-full p-3 bg-gray-700 text-white rounded"
                            required
                            disabled={isSubmitting}
                        />

                        <textarea
                            placeholder={postType === "task" ? "Task description..." : "What's on your mind?"}
                            value={postType === "task" ? newTask.content : newPost.content}
                            onChange={(e) => {
                                if (postType === "task") {
                                    setNewTask({ ...newTask, content: e.target.value });
                                } else {
                                    setNewPost({ ...newPost, content: e.target.value });
                                }
                            }}
                            className="w-full p-3 bg-gray-700 text-white rounded h-24 resize-none"
                            required
                            disabled={isSubmitting}
                        />

                        {postType === "task" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newTask.deadline}
                                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                    className="w-full p-3 bg-gray-700 text-white rounded"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}

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
                            {isSubmitting ? "Creating..." : `Create ${postType === "task" ? "Task" : "Post"}`}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-gray-400">
                        Please log in to create posts and tasks. You can still view and comment on
                        existing posts!
                    </p>
                </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
                {posts.length > 0 ? (
                    posts.map((post) => {
                        const isTask = post.type === "task";
                        const deadlineStatus = isTask ? getDeadlineStatus(post.deadline) : null;

                        return (
                            <div key={post.id} className={`bg-gray-800 p-4 rounded-lg border-l-4 ${
                                isTask ? (post.isCompleted ? "border-green-500" : "border-yellow-500") : "border-blue-500"
                            }`}>
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
                                        {isTask && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Deadline
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={editForm.deadline}
                                                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                                                    className="w-full p-2 bg-gray-700 text-white rounded"
                                                    required
                                                />
                                            </div>
                                        )}
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
                                                    backgroundColor: "#6B7280",
                                                    color: "white",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-lg">
                                                            {isTask ? (post.isCompleted ? "✅" : "⏰") : "📝"}
                                                        </span>
                                                        <h3
                                                            className="font-bold"
                                                            style={{ color: "#FF6B6B" }}
                                                        >
                                                            @{post.authorUsername}
                                                        </h3>
                                                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                                                            {isTask ? "Task" : "Post"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">
                                                        {post.createdAt
                                                            ? post.createdAt.toLocaleDateString()
                                                            : "Unknown date"}
                                                    </p>
                                                </div>
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
                                                            backgroundColor: "#DC2626",
                                                            color: "white",
                                                        }}
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.backgroundColor =
                                                                "#B91C1C")
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.backgroundColor =
                                                                "#DC2626")
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h4 className={`text-lg font-semibold mb-2 ${
                                            isTask && post.isCompleted ? "line-through text-gray-500" : "text-white"
                                        }`}>
                                            {post.title}
                                        </h4>

                                        <p className={`mb-4 ${
                                            isTask && post.isCompleted ? "line-through text-gray-500" : "text-gray-200"
                                        }`}>
                                            {post.content}
                                        </p>

                                        {isTask && post.deadline && (
                                            <div className="mb-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-400">Deadline:</span>
                                                    <span
                                                        className="text-sm font-medium px-2 py-1 rounded"
                                                        style={{
                                                            backgroundColor: deadlineStatus?.color + "20",
                                                            color: deadlineStatus?.color
                                                        }}
                                                    >
                                                        {post.deadline instanceof Date
                                                            ? post.deadline.toLocaleString()
                                                            : new Date(post.deadline).toLocaleString()
                                                        }
                                                    </span>
                                                    {deadlineStatus && !post.isCompleted && (
                                                        <span
                                                            className="text-xs px-2 py-1 rounded font-medium"
                                                            style={{
                                                                backgroundColor: deadlineStatus.color,
                                                                color: "white"
                                                            }}
                                                        >
                                                            {deadlineStatus.text}
                                                        </span>
                                                    )}
                                                </div>
                                                {post.isCompleted && post.completedAt && (
                                                    <div className="text-xs text-green-400 mt-1">
                                                        ✓ Completed on {new Date(post.completedAt.seconds * 1000).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-4">
                                            {isTask && currentUser && currentUser.uid === post.authorId && (
                                                <button
                                                    onClick={() => handleToggleTaskCompletion(post.id)}
                                                    className={`flex items-center space-x-2 px-3 py-1 rounded font-medium`}
                                                    style={{
                                                        backgroundColor: post.isCompleted ? "#10B981" : "#F59E0B",
                                                        color: "white",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                            post.isCompleted ? "#059669" : "#D97706";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                            post.isCompleted ? "#10B981" : "#F59E0B";
                                                    }}
                                                >
                                                    <span>{post.isCompleted ? "✓" : "○"}</span>
                                                    <span>{post.isCompleted ? "Completed" : "Mark Complete"}</span>
                                                </button>
                                            )}

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
                        );
                    })
                ) : (
                    <div className="text-center text-gray-400 py-8">
                        No posts or tasks yet. Be the first to share something!
                    </div>
                )}
            </div>
        </div>
    );
}

export default PostCRUD;