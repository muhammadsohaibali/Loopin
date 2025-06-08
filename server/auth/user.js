const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { connectDB } = require('../config/mongo');

router.use(cookieParser());

function sanitizeUser(user, currentUser = false, isPrivateUser = false, isFollowing = false) {
    // Case 1: Current user (private or not - doesn't matter)
    if (currentUser) {
        const {
            _id, isOnline, lastActive, password, isVerified, isPrivate, sessions,
            ...filtered
        } = user;
        return filtered;
    }

    // Case 4: Not current user, private, but followed
    if (isPrivateUser && isFollowing) {
        const {
            _id, password, email, isVerified, isPrivate, birthdate, accountStatus, pendingFollowRequests,
            joinedAt, sessions, blockedUsers, Settings, phone, lastActive,
            ...filtered
        } = user;
        return filtered;
    }

    // Case 2: Not current user and private
    if (isPrivateUser) {
        const {
            _id, password, email, isVerified, birthdate, accountStatus, pendingFollowRequests, following, posts,
            followers, isOnline, joinedAt, sessions, blockedUsers, Settings, phone, lastActive,
            ...filtered
        } = user;

        filtered.following = (following || []).length;
        filtered.followers = (followers || []).length;
        filtered.posts = (posts || []).length;

        return filtered;
    }

    // Case 3: Not current user and not private (default case)
    const {
        _id, password, email, isVerified, isPrivate, birthdate, accountStatus, pendingFollowRequests,
        joinedAt, sessions, blockedUsers, Settings, phone, lastActive,
        ...filtered
    } = user;
    return filtered;
}

async function verifySession(req) {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return null;

    const db = await connectDB();
    const usersCollection = await db.collection('users');

    const user = await usersCollection.findOne({
        'sessions.sessionId': sessionId,
        'sessions.expiresAt': { $gt: new Date() }
    });

    return user;
}

function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;

    if (
        typeof obj1 !== 'object' || obj1 === null ||
        typeof obj2 !== 'object' || obj2 === null
    ) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
}

router.post('/follow', async (req, res) => {
    try {
        const currentUser = await verifySession(req);
        if (!currentUser) {
            return res.status(401).json({ success: false, message: "Unauthorized - Please log in" });
        }

        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, message: "Username is required" });
        }

        const db = await connectDB();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User Not Found" });
        }
        if (user.accountStatus !== 'active') {
            return res.status(403).json({ success: false, message: "Cannot follow inactive user" });
        }

        if (user.username === currentUser.username) {
            return res.status(400).json({ success: false, message: "You can't follow yourself" });
        }

        if (currentUser.blockedUsers?.includes(user.username)) {
            return res.status(403).json({ success: false, message: "You can't follow a blocked user" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: "You can't follow an unverified user" });
        }

        if (currentUser.following?.includes(user.username)) {
            return res.status(400).json({ success: false, message: "You are already following this user" });
        }

        if (user.isPrivate) {
            await usersCollection.updateOne(
                { username: user.username },
                { $addToSet: { pendingFollowRequests: currentUser.username } }
            );

            return res.status(200).json({ success: true, message: "Follow request sent to user" });
        }

        await Promise.all([
            usersCollection.updateOne(
                { username: currentUser.username },
                { $addToSet: { following: user.username } }
            ),
            usersCollection.updateOne(
                { username: user.username },
                { $addToSet: { followers: currentUser.username } }
            )
        ]);

        return res.status(200).json({ success: true, message: "Followed user successfully" });
    } catch (error) {
        console.error("Follow error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.post('/unfollow', async (req, res) => {
    try {
        const currentUser = await verifySession(req);
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Please log in"
            });
        }

        const { username } = req.body;
        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        const db = await connectDB();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const hasPendingRequest = user.pendingFollowRequests?.includes(currentUser.username);

        if (!currentUser.following?.includes(user.username)) {
            if (hasPendingRequest) {
                await usersCollection.updateOne(
                    { username: user.username },
                    { $pull: { pendingFollowRequests: currentUser.username } }
                );
                return res.status(200).json({
                    success: true,
                    message: "Request canceled"
                });
            }
            return res.status(400).json({
                success: false,
                message: "You're not following this user"
            });
        }

        await Promise.all([
            usersCollection.updateOne(
                { username: currentUser.username },
                { $pull: { following: user.username } }
            ),
            usersCollection.updateOne(
                { username: user.username },
                { $pull: { followers: currentUser.username } }
            )
        ]);

        return res.status(200).json({
            success: true,
            message: "Unfollowed user successfully"
        });

    } catch (error) {
        console.error("Unfollow error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

router.post('/accept-follow-request', async (req, res) => {
    try {
        const currentUser = await verifySession(req);
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Please log in"
            });
        }

        const { username } = req.body;
        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        const db = await connectDB();
        const usersCollection = db.collection('users');

        const requestingUser = await usersCollection.findOne({ username });
        if (!requestingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!currentUser.pendingFollowRequests?.includes(username)) {
            return res.status(400).json({
                success: false,
                message: "No pending follow request from this user"
            });
        }

        const session = db.startSession();
        try {
            await session.withTransaction(async () => {
                await usersCollection.updateOne(
                    { username: currentUser.username },
                    { $pull: { pendingFollowRequests: username } },
                    { session }
                );

                await usersCollection.updateOne(
                    { username: currentUser.username },
                    { $addToSet: { followers: username } },
                    { session }
                );

                await usersCollection.updateOne(
                    { username: username },
                    { $addToSet: { following: currentUser.username } },
                    { session }
                );
            });
        } finally {
            await session.endSession();
        }

        return res.status(200).json({
            success: true,
            message: "Follow request accepted successfully"
        });

    } catch (error) {
        console.error("Accept follow request error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Block a user
router.post('/block', async (req, res) => {
    const currentUser = await verifySession(req);

    if (!currentUser) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Please log in"
        });
    }

    const { username } = req.body;

    if (!username) {
        return res.status(400).json({
            success: false,
            message: "Username is required"
        });
    }

    if (currentUser.username === username) {
        return res.status(400).json({
            success: false,
            message: "You cannot block yourself"
        });
    }

    const db = await connectDB();
    const usersCollection = db.collection('users');

    try {
        // Check if user exists
        const userToBlock = await usersCollection.findOne({ username });
        if (!userToBlock) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update current user's blocked list
        await usersCollection.updateOne(
            { username: currentUser.username },
            {
                $addToSet: { blockedUsers: username },
                $pull: {
                    following: username,
                    followers: username
                }
            }
        );

        // Remove from the blocked user's followers/following if they exist
        await usersCollection.updateOne(
            { username },
            {
                $pull: {
                    followers: currentUser.username,
                    following: currentUser.username
                }
            }
        );

        // Remove any pending follow requests
        await usersCollection.updateOne(
            { username },
            { $pull: { pendingFollowRequests: currentUser.username } }
        );

        return res.status(200).json({
            success: true,
            message: "User blocked successfully"
        });
    } catch (error) {
        console.error("Error blocking user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Unblock a user
router.post('/unblock', async (req, res) => {
    const currentUser = await verifySession(req);

    if (!currentUser) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Please log in"
        });
    }

    const { username } = req.body;

    if (!username) {
        return res.status(400).json({
            success: false,
            message: "Username is required"
        });
    }

    const db = await connectDB();
    const usersCollection = db.collection('users');

    try {
        // Check if user is actually blocked
        const currentUserData = await usersCollection.findOne({
            username: currentUser.username
        });

        if (!currentUserData.blockedUsers.includes(username)) {
            return res.status(400).json({
                success: false,
                message: "User is not blocked"
            });
        }

        // Remove from blocked list
        await usersCollection.updateOne(
            { username: currentUser.username },
            { $pull: { blockedUsers: username } }
        );

        return res.status(200).json({
            success: true,
            message: "User unblocked successfully"
        });
    } catch (error) {
        console.error("Error unblocking user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

router.get('/get-user', async (req, res) => {
    const currentUser = await verifySession(req);

    if (!currentUser) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Please log in"
        });
    }

    const { username } = req.query;

    const db = await connectDB();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username: username });

    if (!user || user.accountStatus !== 'active') {
        return res.status(200).send({ success: false, message: "User Not Found" });
    }

    if (deepEqual(user, currentUser)) {
        return res.status(200).json(sanitizeUser(user, true));
    }

    if (currentUser.blockedUsers.includes(user.username)) {
        return res.status(200).send({ success: false, message: "User Is Blocked" });
    }

    if (!user.isVerified) {
        return res.status(200).send({ success: false, message: "User Is Not Verified" });
    }

    let sanitizedUser;
    if (user.isPrivate) {
        const isFollowing = currentUser.following.includes(user.username);
        const isRequested = user.pendingFollowRequests?.includes(currentUser.username) || false;

        sanitizedUser = sanitizeUser(user, false, true, isFollowing);

        if (!isFollowing) {
            sanitizedUser = {
                ...sanitizedUser,
                isRequested
            };
        }
    } else {
        sanitizedUser = sanitizeUser(user);
    }

    return res.status(200).json(sanitizedUser);
});

router.get('/current-user', async (req, res) => {
    const user = await verifySession(req);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Please log in"
        });
    }

    return res.status(200).json(sanitizeUser(user, true));
});

router.get('/get-user-following', async (req, res) => {
    const currentUser = await verifySession(req);

    if (!currentUser) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Please log in"
        });
    }

    const { username } = req.query;

    const db = await connectDB();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });

    if (!user)
        return res.status(404).json({ message: "User Not Found" });

    if (deepEqual(user, currentUser)) {
        const followingUsers = await getFollowingUsers(user, usersCollection);
        return res.status(200).json(followingUsers);
    }

    if (currentUser.blockedUsers.includes(user.username))
        return res.status(403).json({ message: "User Is Blocked" });

    if (!currentUser.following.includes(user.username) && user.isPrivate)
        return res.status(403).json({ message: "User Account Is Private" });

    async function getFollowingUsers(user, usersCollection) {
        if (!user || !Array.isArray(user.following)) {
            throw new Error("Invalid user or following list.");
        }

        const followingUsers = await usersCollection
            .find({ username: { $in: user.following } })
            .project({
                _id: 0,
                username: 1,
                fullName: 1,
                avatarUrl: 1,
                isOnline: 1,
                lastActive: 1,
            })
            .toArray();

        return followingUsers;
    }

    const followingUsers = await getFollowingUsers(user, usersCollection);
    return res.status(200).json(followingUsers);
});



router.get('/get-user-posts', async (req, res) => {
    const currentUser = await verifySession(req);

    if (!currentUser) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Please log in"
        });
    }

    const { username } = req.query;

    const db = await connectDB();
    const usersCollection = db.collection('users');
    const postsCollection = db.collection('posts');

    const user = await usersCollection.findOne({ username });

    if (!user)
        return res.status(404).json({ message: "User Not Found" });

    if (deepEqual(user, currentUser)) {
        const userPosts = await getPostsByUsername(username, postsCollection);
        return res.status(200).json(userPosts);
    }

    if (currentUser.blockedUsers.includes(user.username))
        return res.status(403).json({ message: "User Is Blocked" });

    if (!currentUser.following.includes(user.username) && user.isPrivate)
        return res.status(403).json({ message: "User Account Is Private" });

    async function getPostsByUsername(username, postsCollection) {
        if (!username || typeof username !== 'string') {
            throw new Error("Invalid username.");
        }

        const posts = await postsCollection
            .find({ author: username })
            .sort({ createdAt: -1 })
            .toArray();

        const filtered = posts.map(({ _id, ...rest }) => rest);

        return filtered;
    }

    const userPosts = await getPostsByUsername(username, postsCollection);
    return res.status(200).json(userPosts);
});

module.exports = router;
