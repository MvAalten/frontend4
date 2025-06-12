// firebaseService.js - All Firebase operations
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

// User Management
export const createOrGetUser = async (username) => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Create new user
            const docRef = await addDoc(usersRef, {
                username: username,
                name: username,
                email: '',
                bio: '',
                profilePicture: '',
                friends: [],
                blockedUsers: [],
                blockedBy: [],
                isActive: true,
                lastSeen: serverTimestamp(),
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, username, name: username };
        } else {
            // Update last seen and return existing user
            const userDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'users', userDoc.id), {
                lastSeen: serverTimestamp(),
                isActive: true
            });
            return { id: userDoc.id, ...userDoc.data() };
        }
    } catch (error) {
        console.error('Error creating/getting user:', error);
        throw error;
    }
};

export const getUserById = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
};

export const updateUserProfile = async (userId, updates) => {
    try {
        await updateDoc(doc(db, 'users', userId), {
            ...updates,
            lastSeen: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

// Friend Management
export const getAllUsers = async (currentUserId) => {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        return querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => user.id !== currentUserId && user.isActive);
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
};

export const getUserFriends = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const friendIds = userData.friends || [];

            if (friendIds.length > 0) {
                const friendsData = await Promise.all(
                    friendIds.map(async (friendId) => {
                        const friendDoc = await getDoc(doc(db, 'users', friendId));
                        return friendDoc.exists() ? { id: friendId, ...friendDoc.data() } : null;
                    })
                );
                return friendsData.filter(friend => friend && friend.isActive);
            }
        }
        return [];
    } catch (error) {
        console.error('Error loading friends:', error);
        return [];
    }
};

export const addFriend = async (currentUserId, friendId) => {
    try {
        // Update current user's friends list
        await updateDoc(doc(db, 'users', currentUserId), {
            friends: arrayUnion(friendId)
        });

        // Update friend's friends list
        await updateDoc(doc(db, 'users', friendId), {
            friends: arrayUnion(currentUserId)
        });

        // Create friendship record
        await addDoc(collection(db, 'friendships'), {
            user1: currentUserId,
            user2: friendId,
            createdAt: serverTimestamp(),
            status: 'active'
        });

    } catch (error) {
        console.error('Error adding friend:', error);
        throw error;
    }
};

export const removeFriend = async (currentUserId, friendId) => {
    try {
        // Remove from current user's friends list
        await updateDoc(doc(db, 'users', currentUserId), {
            friends: arrayRemove(friendId)
        });

        // Remove from friend's friends list
        await updateDoc(doc(db, 'users', friendId), {
            friends: arrayRemove(currentUserId)
        });

        // Update friendship record
        const friendshipsRef = collection(db, 'friendships');
        const q1 = query(friendshipsRef,
            where('user1', '==', currentUserId),
            where('user2', '==', friendId)
        );
        const q2 = query(friendshipsRef,
            where('user1', '==', friendId),
            where('user2', '==', currentUserId)
        );

        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const docs = [...snapshot1.docs, ...snapshot2.docs];

        for (const docSnapshot of docs) {
            await updateDoc(doc(db, 'friendships', docSnapshot.id), {
                status: 'removed',
                removedAt: serverTimestamp()
            });
        }

    } catch (error) {
        console.error('Error removing friend:', error);
        throw error;
    }
};

// Block User Management
export const blockUser = async (currentUserId, userToBlock) => {
    try {
        // Add to current user's blocked list
        await updateDoc(doc(db, 'users', currentUserId), {
            blockedUsers: arrayUnion(userToBlock)
        });

        // Add current user to blocked user's blockedBy list
        await updateDoc(doc(db, 'users', userToBlock), {
            blockedBy: arrayUnion(currentUserId)
        });

        // Remove friendship if exists
        await removeFriend(currentUserId, userToBlock);

        // Create block record
        await addDoc(collection(db, 'blocks'), {
            blocker: currentUserId,
            blocked: userToBlock,
            createdAt: serverTimestamp(),
            reason: 'user_blocked'
        });

    } catch (error) {
        console.error('Error blocking user:', error);
        throw error;
    }
};

export const unblockUser = async (currentUserId, userToUnblock) => {
    try {
        // Remove from current user's blocked list
        await updateDoc(doc(db, 'users', currentUserId), {
            blockedUsers: arrayRemove(userToUnblock)
        });

        // Remove current user from unblocked user's blockedBy list
        await updateDoc(doc(db, 'users', userToUnblock), {
            blockedBy: arrayRemove(currentUserId)
        });

        // Update block record
        const blocksRef = collection(db, 'blocks');
        const q = query(blocksRef,
            where('blocker', '==', currentUserId),
            where('blocked', '==', userToUnblock)
        );
        const snapshot = await getDocs(q);

        for (const docSnapshot of snapshot.docs) {
            await updateDoc(doc(db, 'blocks', docSnapshot.id), {
                status: 'unblocked',
                unblockedAt: serverTimestamp()
            });
        }

    } catch (error) {
        console.error('Error unblocking user:', error);
        throw error;
    }
};

export const getBlockedUsers = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const blockedIds = userData.blockedUsers || [];

            if (blockedIds.length > 0) {
                const blockedData = await Promise.all(
                    blockedIds.map(async (blockedId) => {
                        const blockedDoc = await getDoc(doc(db, 'users', blockedId));
                        return blockedDoc.exists() ? { id: blockedId, ...blockedDoc.data() } : null;
                    })
                );
                return blockedData.filter(user => user);
            }
        }
        return [];
    } catch (error) {
        console.error('Error loading blocked users:', error);
        return [];
    }
};

// Messaging
export const sendMessage = async (senderId, senderName, receiverId, messageText) => {
    try {
        const conversationId = [senderId, receiverId].sort().join('_');
        const messageRef = await addDoc(collection(db, 'messages'), {
            conversationId,
            senderId,
            senderName,
            receiverId,
            text: messageText,
            timestamp: serverTimestamp(),
            isRead: false,
            isEdited: false,
            isDeleted: false
        });

        // Update conversation metadata
        await updateConversationMetadata(conversationId, senderId, receiverId, messageText);

        return messageRef.id;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const getMessagesListener = (conversationId, callback) => {
    const messagesRef = collection(db, 'messages');
    const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('isDeleted', '==', false),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};

export const markMessageAsRead = async (messageId) => {
    try {
        await updateDoc(doc(db, 'messages', messageId), {
            isRead: true,
            readAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
};

// Conversation Management
const updateConversationMetadata = async (conversationId, senderId, receiverId, lastMessage) => {
    try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);

        const conversationData = {
            participants: [senderId, receiverId],
            lastMessage: lastMessage.substring(0, 100), // Truncate for preview
            lastMessageAt: serverTimestamp(),
            lastMessageBy: senderId,
            updatedAt: serverTimestamp()
        };

        if (!conversationDoc.exists()) {
            conversationData.createdAt = serverTimestamp();
        }

        await updateDoc(conversationRef, conversationData);
    } catch (error) {
        console.error('Error updating conversation metadata:', error);
    }
};

export const getUserConversations = async (userId) => {
    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', userId),
            orderBy('lastMessageAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting conversations:', error);
        return [];
    }
};

// Posts Management (for filtering blocked users)
export const createPost = async (userId, username, content, imageUrl = null) => {
    try {
        const postRef = await addDoc(collection(db, 'posts'), {
            authorId: userId,
            authorName: username,
            content,
            imageUrl,
            likes: [],
            comments: [],
            shares: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDeleted: false,
            visibility: 'public' // public, friends, private
        });
        return postRef.id;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

export const getPostsListener = (userId, callback) => {
    const postsRef = collection(db, 'posts');
    const q = query(
        postsRef,
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, async (querySnapshot) => {
        const posts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filter out posts from blocked users
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const blockedUsers = userData.blockedUsers || [];
            const blockedBy = userData.blockedBy || [];

            const filteredPosts = posts.filter(post =>
                !blockedUsers.includes(post.authorId) &&
                !blockedBy.includes(post.authorId)
            );

            callback(filteredPosts);
        } else {
            callback(posts);
        }
    });
};

export const likePost = async (postId, userId) => {
    try {
        await updateDoc(doc(db, 'posts', postId), {
            likes: arrayUnion(userId),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error liking post:', error);
        throw error;
    }
};

export const unlikePost = async (postId, userId) => {
    try {
        await updateDoc(doc(db, 'posts', postId), {
            likes: arrayRemove(userId),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error unliking post:', error);
        throw error;
    }
};
