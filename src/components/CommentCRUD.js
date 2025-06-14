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

    // Debug logging
    useEffect(() => {
        console.log("CommentCRUD - postId:", postId);
        console.log("CommentCRUD - currentUser:", currentUser);
        console.log("CommentCRUD - currentUserData:", currentUserData);
    }, [postId, currentUser, currentUserData]);

    // Realtime listener for comments specific to this post
    useEffect(() => {
        if (!postId) {
            console.log("No postId provided to CommentCRUD");
            return;
        }

        console.log("Setting up comment listener for postId:", postId);

        // Simplified query - removed orderBy to avoid composite index requirement
        const q = query(
            collection(db, "comments"),
            where("postId", "==", postId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("Comments snapshot received:", snapshot.docs.length, "comments");
            const list = snapshot.docs.map((doc) => {
                const data = doc.data();
                console.log("Comment data:", data);
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                };
            });

            // Sort comments on the client side instead of in the query
            list.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return b.createdAt - a.createdAt; // newest first
                }
                return 0;
            });

            setComments(list);
        }, (error) => {
            console.error("Error fetching comments:", error);
        });

        return () => unsubscribe();
    }, [postId]);

    const handleCreateComment = async (e) => {
        e.preventDefault();

        console.log("Creating comment...");
        console.log("New comment content:", newComment);
        console.log("Post ID:", postId);
        console.log("Current user:", currentUser);

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
            // Determine username with better fallback logic
            const authorUsername = currentUser ?
                (currentUserData?.username ||
                    currentUser.displayName ||
                    currentUser.email?.split('@')[0] ||
                    "User") :
                "Anonymous";

            const commentData = {
                content: newComment.trim(),
                postId: postId, // Ensure this matches exactly
                authorId: currentUser?.uid || null,
                authorUsername: authorUsername,
                isAnonymous: !currentUser,
                createdAt: serverTimestamp(),
                likes: [],
                likeCount: 0
            };

            console.log("Comment data to be saved:", commentData);

            const docRef = await addDoc(collection(db, "comments"), commentData);
            console.log("Comment created with ID:", docRef.id);

            setNewComment('');
            // Optional: Show success message
            // alert("Comment added successfully!");
        } catch (err) {
            console.error("Error adding comment:", err);
            console.error("Error details:", err.message);
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

        console.log("Liking comment:", commentId);

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
                // Unlike the comment
                await updateDoc(ref, {
                    likes: arrayRemove(currentUser.uid),
                    likeCount: Math.max((data.likeCount || 1) - 1, 0)
                });
                console.log("Comment unliked");
            } else {
                // Like the comment
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
            <div className="text-gray-400 p-4 bg-red-900 rounded">
                Error: No post ID provided for comments
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-4 border-t border-gray-700 pt-4">
            {/* Debug info */}
            <div className="bg-gray-900 p-2 rounded text-xs text-gray-400">
                Comments Debug: PostID: {postId} | Comments: {comments.length} | User: {currentUser ? "✓" : "✗"}
            </div>

            <h4 className="text-lg font-semibold text-purple-400">
                Comments ({comments.length})
            </h4>

            {/* Comment Form */}
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
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm font-semibold"
                >
                    {loading ? "Posting..." : "Send"}
                </button>
            </form>

            {/* Login status indicator */}
            {!currentUser && (
                <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
                    💡 You're posting anonymously. Log in to like comments and have a username.
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-800 rounded">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className={`text-sm font-medium ${
                                        comment.isAnonymous ? 'text-gray-400' : 'text-purple-400'
                                    }`}>
                                        @{comment.authorUsername}
                                        {comment.isAnonymous && ' 👤'}
                                    </span>
                                    <p className="text-xs text-gray-500">
                                        {comment.createdAt instanceof Date ?
                                            comment.createdAt.toLocaleString() :
                                            'Just now'
                                        }
                                    </p>
                                </div>

                                {/* Like button - show for all users but only functional for logged in */}
                                <button
                                    onClick={() => handleLike(comment.id)}
                                    disabled={!currentUser}
                                    className={`text-xs px-2 py-1 rounded flex items-center space-x-1 transition-colors ${
                                        currentUser && comment.likes?.includes(currentUser.uid)
                                            ? "bg-red-600 text-white"
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