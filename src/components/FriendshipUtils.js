import { collection, query, where, getDocs, or, and } from 'firebase/firestore';
import { db } from '../App';

/**
 * Check if two users are friends (status 'accepted')
 * @param {string} user1Id
 * @param {string} user2Id
 * @returns {Promise<boolean>}
 */
export const areFriends = async (user1Id, user2Id) => {
    if (!user1Id || !user2Id || user1Id === user2Id) return false;

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
 * @param {string} blockedUserId
 * @param {string} blockerUserId
 * @returns {Promise<boolean>}
 */
export const isUserBlocked = async (blockedUserId, blockerUserId) => {
    if (!blockedUserId || !blockerUserId) return false;

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
 * Determine if current user can view another user's content based on privacy & block
 * @param {Object} contentOwner - user object with { id, isPrivate }
 * @param {string} currentUserId
 * @returns {Promise<boolean>}
 */
export const canViewUserContent = async (contentOwner, currentUserId) => {
    if (!currentUserId) return !contentOwner.isPrivate;

    if (contentOwner.id === currentUserId) return true;

    const isBlocked = await isUserBlocked(currentUserId, contentOwner.id);
    if (isBlocked) return false;

    if (!contentOwner.isPrivate) return true;

    return await areFriends(contentOwner.id, currentUserId);
};

/**
 * Get all friend IDs for a user
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export const getUserFriends = async (userId) => {
    if (!userId) return [];

    try {
        const friendsQuery = query(
            collection(db, 'friendships'),
            and(
                or(where('user1', '==', userId), where('user2', '==', userId)),
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
 * Possible return values:
 * - 'friends' (accepted)
 * - 'pending_sent' (user1 sent a request to user2)
 * - 'pending_received' (user1 received a request from user2)
 * - 'none' (no friendship or request)
 * @param {string} user1Id
 * @param {string} user2Id
 * @returns {Promise<string>}
 */
export const getFriendshipStatus = async (user1Id, user2Id) => {
    if (!user1Id || !user2Id || user1Id === user2Id) return 'none';

    try {
        const friendshipQuery = query(
            collection(db, 'friendships'),
            or(
                and(where('user1', '==', user1Id), where('user2', '==', user2Id)),
                and(where('user1', '==', user2Id), where('user2', '==', user1Id))
            )
        );

        const snapshot = await getDocs(friendshipQuery);
        if (snapshot.empty) return 'none';

        const friendship = snapshot.docs[0].data();

        if (friendship.status === 'accepted') return 'friends';

        if (friendship.status === 'pending') {
            return friendship.user1 === user1Id ? 'pending_sent' : 'pending_received';
        }

        return 'none';
    } catch (error) {
        console.error('Error getting friendship status:', error);
        return 'none';
    }
};

/**
 * Filter posts by privacy settings and friendships
 * @param {Array} posts - Array of posts with at least userId and userIsPrivate properties
 * @param {string} currentUserId
 * @returns {Promise<Array>} - Filtered posts array
 */
export const filterPostsByPrivacy = async (posts, currentUserId) => {
    if (!posts || posts.length === 0) return [];

    const filteredPosts = [];

    for (const post of posts) {
        if (post.userId === currentUserId) {
            filteredPosts.push(post);
            continue;
        }

        if (currentUserId) {
            const isBlocked = await isUserBlocked(currentUserId, post.userId);
            if (isBlocked) continue; // skip blocked users' posts
        }

        if (post.userIsPrivate) {
            if (!currentUserId) continue; // skip private posts for guests

            const friends = await areFriends(post.userId, currentUserId);
            if (friends) filteredPosts.push(post);
        } else {
            filteredPosts.push(post);
        }
    }

    return filteredPosts;
};
