// utils/friendshipUtils.js
import { collection, query, where, getDocs, or, and } from 'firebase/firestore';
import { db } from '../App';

/**
 * Check if two users are friends
 * @param {string} user1Id - First user's ID
 * @param {string} user2Id - Second user's ID
 * @returns {Promise<boolean>} - True if users are friends, false otherwise
 */
export const areFriends = async (user1Id, user2Id) => {
    if (!user1Id || !user2Id || user1Id === user2Id) {
        return false;
    }

    try {
        const friendshipQuery = query(
            collection(db, 'friendships'),
            and(
                or(
                    and(where('user1', '==', user1Id), where('user2', '==', user2Id)),
                    and(where('user1', '==', user2Id), where('user2', '==', user1Id))
                ),
                where('status', '==', 'accepted')
            )
        );

        const snapshot = await getDocs(friendshipQuery);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking friendship:', error);
        return false;
    }
};

/**
 * Check if a user is blocked by another user
 * @param {string} blockedUserId - ID of potentially blocked user
 * @param {string} blockerUserId - ID of user who might have blocked
 * @returns {Promise<boolean>} - True if user is blocked, false otherwise
 */
export const isUserBlocked = async (blockedUserId, blockerUserId) => {
    if (!blockedUserId || !blockerUserId) {
        return false;
    }

    try {
        const blockQuery = query(
            collection(db, 'blockedUsers'),
            and(
                where('blockedUser', '==', blockedUserId),
                where('blockedBy', '==', blockerUserId)
            )
        );

        const snapshot = await getDocs(blockQuery);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking if user is blocked:', error);
        return false;
    }
};

/**
 * Check if current user can view another user's content
 * @param {Object} contentOwner - The user who owns the content
 * @param {string} currentUserId - Current user's ID
 * @returns {Promise<boolean>} - True if content can be viewed, false otherwise
 */
export const canViewUserContent = async (contentOwner, currentUserId) => {
    // If no current user, can only view public content
    if (!currentUserId) {
        return !contentOwner.isPrivate;
    }

    // User can always view their own content
    if (contentOwner.id === currentUserId) {
        return true;
    }

    // Check if current user is blocked
    const isBlocked = await isUserBlocked(currentUserId, contentOwner.id);
    if (isBlocked) {
        return false;
    }

    // If profile is not private, anyone can view
    if (!contentOwner.isPrivate) {
        return true;
    }

    // If profile is private, only friends can view
    return await areFriends(contentOwner.id, currentUserId);
};

/**
 * Get all friend IDs for a user
 * @param {string} userId - User's ID
 * @returns {Promise<string[]>} - Array of friend IDs
 */
export const getUserFriends = async (userId) => {
    if (!userId) {
        return [];
    }

    try {
        const friendsQuery = query(
            collection(db, 'friendships'),
            and(
                or(
                    where('user1', '==', userId),
                    where('user2', '==', userId)
                ),
                where('status', '==', 'accepted')
            )
        );

        const snapshot = await getDocs(friendsQuery);
        const friendIds = [];

        snapshot.docs.forEach(doc => {
            const friendship = doc.data();
            const friendId = friendship.user1 === userId ? friendship.user2 : friendship.user1;
            friendIds.push(friendId);
        });

        return friendIds;
    } catch (error) {
        console.error('Error getting user friends:', error);
        return [];
    }
};

/**
 * Get friendship status between two users
 * @param {string} user1Id - First user's ID
 * @param {string} user2Id - Second user's ID
 * @returns {Promise<string>} - 'friends', 'pending_sent', 'pending_received', or 'none'
 */
export const getFriendshipStatus = async (user1Id, user2Id) => {
    if (!user1Id || !user2Id || user1Id === user2Id) {
        return 'none';
    }

    try {
        const friendshipQuery = query(
            collection(db, 'friendships'),
            or(
                and(where('user1', '==', user1Id), where('user2', '==', user2Id)),
                and(where('user1', '==', user2Id), where('user2', '==', user1Id))
            )
        );

        const snapshot = await getDocs(friendshipQuery);

        if (snapshot.empty) {
            return 'none';
        }

        const friendship = snapshot.docs[0].data();

        if (friendship.status === 'accepted') {
            return 'friends';
        }

        if (friendship.status === 'pending') {
            // Check who sent the request
            if (friendship.user1 === user1Id) {
                return 'pending_sent';
            } else {
                return 'pending_received';
            }
        }

        return 'none';
    } catch (error) {
        console.error('Error getting friendship status:', error);
        return 'none';
    }
};

/**
 * Filter posts based on privacy settings and friendships
 * @param {Array} posts - Array of posts to filter
 * @param {string} currentUserId - Current user's ID
 * @returns {Promise<Array>} - Filtered posts array
 */
export const filterPostsByPrivacy = async (posts, currentUserId) => {
    if (!posts || posts.length === 0) {
        return [];
    }

    const filteredPosts = [];

    for (const post of posts) {
        // Always show current user's posts
        if (post.userId === currentUserId) {
            filteredPosts.push(post);
            continue;
        }

        // Check if current user is blocked
        if (currentUserId) {
            const isBlocked = await isUserBlocked(currentUserId, post.userId);
            if (isBlocked) {
                continue; // Skip blocked user's posts
            }
        }

        // Check if post owner has private profile
        if (post.userIsPrivate) {
            if (!currentUserId) {
                continue; // Skip private posts if not logged in
            }

            const areFriendsResult = await areFriends(post.userId, currentUserId);
            if (areFriendsResult) {
                filteredPosts.push(post);
            }
        } else {
            // Public post, add it
            filteredPosts.push(post);
        }
    }

    return filteredPosts;
};