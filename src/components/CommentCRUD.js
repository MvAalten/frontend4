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
            <div className="text-gray-400 p-4 bg-[#FF6B6B] rounded">
                Error: No post ID provided for comments
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-4 border-t border-gray-700 pt-4">
            <h4 className="text-lg font-semibold text-[#FF6B6B]">
                Comments ({comments.length})
            </h4>

            <form onSubmit={handleCreateComment} className="flex space-x-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={currentUser ? "Write a comment..." : "Write a comment as Anonymous..."}
                    disabled={loading}
                    className="flex-1 p-2 bg-gray-700 text-white rounded text-sm placeholder-gray-400"
                />
                <button
                    type="submit"
                    disabled={loading || !newComment.trim()}
                    className="bg-[#FF6B6B] hover:bg-[#e05a5a] disabled:bg-gray-600 px-3 py-2 rounded text-sm font-semibold"
                >
                    {loading ? "Posting..." : "Send"}
                </button>
            </form>

            {!currentUser && (
                <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
                    💡 You're posting anonymously. Log in to like comments and have a username.
                </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-800 rounded">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className={`text-sm font-medium ${
                                        comment.isAnonymous ? 'text-gray-400' : 'text-[#FF6B6B]'
                                    }`}>
                                        @{comment.authorUsername}
                                        {comment.isAnonymous && ' 👤'}
                                    </span>
                                    <p className="text-xs text-gray-500">
                                        {comment.createdAt instanceof Date
                                            ? comment.createdAt.toLocaleString()
                                            : 'Just now'
                                        }
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleLike(comment.id)}
                                    disabled={!currentUser}
                                    className={`text-xs px-2 py-1 rounded flex items-center space-x-1 transition-colors ${
                                        currentUser && comment.likes?.includes(currentUser.uid)
                                            ? "bg-[#FF6B6B] text-white"
                                            : currentUser
                                                ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                                : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    }`}
                                    title={!currentUser ? "Log in to like comments" : ""}
                                >
                                    <span>❤️</span>
                                    <span>{comment.likeCount || 0}</span>
                                </button>
                            </div>

                            <p className="text-white text-sm">{comment.content}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400 py-4">
                        No comments yet. Be the first to comment!
                    </div>
                )}
            </div>
        </div>
    );
}

export default CommentCRUD;
