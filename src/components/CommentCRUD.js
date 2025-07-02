import React, { useState, useEffect } from "react";
import {
    collection,
    addDoc,
    onSnapshot,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove,
    getDoc,
    serverTimestamp,
    query,
    where
} from "firebase/firestore";
import { db } from "../App";

function CommentCRUD({ currentUser, postId, currentUserData }) {
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [comments, setComments] = useState([]);

    useEffect(() => {
        if (!postId) {
            console.warn("No postId provided for CommentCRUD");
            return;
        }

        const q = query(
            collection(db, "comments"),
            where("postId", "==", postId)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const commentsList = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date()
                    };
                });

                commentsList.sort((a, b) => b.createdAt - a.createdAt);

                setComments(commentsList);
            },
            (error) => {
                console.error("Error listening to comments:", error);
            }
        );

        return () => unsubscribe();
    }, [postId]);

    const handleCreateComment = async (e) => {
        e.preventDefault();

        if (!newComment.trim()) {
            alert("Please enter a comment");
            return;
        }

        if (!postId) {
            alert("Post ID is required to comment");
            return;
        }

        setLoading(true);
        try {
            const authorUsername = currentUser
                ? (currentUserData?.username || currentUser.displayName || currentUser.email?.split('@')[0] || "User")
                : "Anonymous";

            const commentData = {
                content: newComment.trim(),
                postId,
                authorId: currentUser?.uid || null,
                authorUsername,
                isAnonymous: !currentUser,
                createdAt: serverTimestamp(),
                likes: [],
                likeCount: 0
            };

            const docRef = await addDoc(collection(db, "comments"), commentData);
            console.log("Comment created with ID:", docRef.id);

            setNewComment('');
        } catch (err) {
            console.error("Error adding comment:", err);
            alert(`Failed to add comment: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (commentId) => {
        if (!currentUser) {
            alert("Please log in to like comments");
            return;
        }

        try {
            const ref = doc(db, "comments", commentId);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                alert("Comment not found");
                return;
            }

            const data = snap.data();
            const likes = data.likes || [];

            if (likes.includes(currentUser.uid)) {
                await updateDoc(ref, {
                    likes: arrayRemove(currentUser.uid),
                    likeCount: Math.max((data.likeCount || 1) - 1, 0)
                });
                console.log("Comment unliked");
            } else {
                await updateDoc(ref, {
                    likes: arrayUnion(currentUser.uid),
                    likeCount: (data.likeCount || 0) + 1
                });
                console.log("Comment liked");
            }
        } catch (err) {
            console.error("Error liking comment:", err);
            alert(`Error liking comment: ${err.message}`);
        }
    };

    if (!postId) {
        return (
            <div className="bg-gradient-to-r from-red-400 to-red-500 text-white p-6 rounded-3xl border border-red-300 shadow-xl">
                <div className="text-center">
                    <span className="text-2xl">⚠️</span>
                    <p className="font-bold mt-2">Error: No post ID provided for comments</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-8 pt-8 border-t border-sky-200">
            <h4 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                💬 Comments ({comments.length})
            </h4>

            <form onSubmit={handleCreateComment} className="flex gap-4">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={currentUser ? "Write a comment..." : "Write a comment as Anonymous..."}
                    disabled={loading}
                    className="flex-1 p-4 bg-white/70 backdrop-blur-lg text-slate-700 rounded-2xl border border-sky-200 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300 focus:border-sky-400 transition-all duration-300 shadow-lg"
                />
                <button
                    type="submit"
                    disabled={loading || !newComment.trim()}
                    className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-400 px-8 py-4 rounded-2xl font-bold text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Posting...
                        </div>
                    ) : (
                        "✨ Send"
                    )}
                </button>
            </form>

            {!currentUser && (
                <div className="bg-gradient-to-r from-cyan-50 to-sky-50 p-4 rounded-2xl border border-sky-200 shadow-lg">
                    <div className="flex items-center gap-2 text-sky-700">
                        <span className="text-lg">👤</span>
                        <p className="font-medium">You're posting anonymously. Log in to like comments and have a username.</p>
                    </div>
                </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl border border-sky-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`font-bold text-lg ${
                                        comment.isAnonymous
                                            ? 'text-slate-500'
                                            : 'bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent'
                                    }`}>
                                        {comment.isAnonymous ? '👤' : '🌟'} @{comment.authorUsername}
                                    </span>
                                    <p className="text-slate-500 text-sm mt-1">
                                        {comment.createdAt instanceof Date
                                            ? comment.createdAt.toLocaleString()
                                            : 'Just now'
                                        }
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleLike(comment.id)}
                                    disabled={!currentUser}
                                    className={`px-4 py-2 rounded-full flex items-center gap-2 font-bold transition-all duration-300 transform hover:scale-110 ${
                                        currentUser && comment.likes?.includes(currentUser.uid)
                                            ? "bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg"
                                            : currentUser
                                                ? "bg-white/80 text-slate-600 hover:bg-gradient-to-r hover:from-red-400 hover:to-pink-500 hover:text-white border border-sky-200 shadow-lg"
                                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    }`}
                                    title={!currentUser ? "Log in to like comments" : ""}
                                >
                                    <span className="text-lg">❤️</span>
                                    <span>{comment.likeCount || 0}</span>
                                </button>
                            </div>

                            <p className="text-slate-700 text-lg leading-relaxed">{comment.content}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gradient-to-r from-slate-50 to-sky-50 rounded-3xl border border-sky-200 shadow-lg">
                        <div className="text-6xl mb-4">💭</div>
                        <p className="text-slate-500 text-xl font-medium mb-2">No comments yet</p>
                        <p className="text-sky-600 text-lg">Be the first to share your thoughts! ✨</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CommentCRUD;