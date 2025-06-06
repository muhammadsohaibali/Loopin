const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { connectDB } = require('../config/mongo');

router.use(cookieParser());

function sanitizeUser(user, currentUser = false, isPrivateUser = false) {
    if (!currentUser && !isPrivateUser) {
        const { _id, password, email, isVerified, isPrivate, birthdate, accountStatus, pendingFollowRequests,
            joinedAt, sessions, blockedUsers, Settings, phone, lastActive, ...filtered } = user;
        return filtered;
    }

    if (!currentUser && isPrivateUser) {
        const { _id, password, email, isVerified, birthdate, accountStatus, pendingFollowRequests, following, posts,
            followers, isOnline, joinedAt, sessions, blockedUsers, Settings, phone, lastActive, ...filtered } = user;
        filtered['following'] = user.following.length
        filtered['followers'] = user.followers.length
        filtered['posts'] = user.posts.length
        return filtered;
    }

    const { _id, isOnline, lastActive, password, isVerified, isPrivate, sessions, ...filtered } = user;
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
    const usersCollection = await db.collection('users');

    const user = await usersCollection.findOne({ username: username })

    if (!user) {
        return res.status(200).send({ success: false, message: "User Not Found" });
    }

    if (deepEqual(user, currentUser)) {
        const { _id, password, isVerified, sessions, ...filteredUser } = user;
        return res.status(200).json(filteredUser);
    }

    if (currentUser.blockedUsers.includes(user.email)) {
        return res.status(200).send({ success: false, message: "User Is Blocked" });
    }

    if (!user.isVerified) {
        return res.status(200).send({ success: false, message: "User Is Not Verified" });
    }

    if (user.accountStatus !== 'active') {
        return res.status(200).send({ success: false, message: "User Not Found" });
    }

    if (user.isPrivate && currentUser.following.includes(user.username)) {
        return res.status(200).json(sanitizeUser(user));
    }

    if (user.isPrivate) {
        const isCurrentUser = false
        return res.status(200).json(sanitizeUser(user, isCurrentUser, user.isPrivate));
    }

    return res.status(200).json(sanitizeUser(user));
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

    if (currentUser.blockedUsers.includes(user.username))
        return res.status(403).json({ message: "User Is Blocked" });

    if (!currentUser.following.includes(user.username) && user.isPrivate)
        return res.status(403).json({ message: "User Account Is Private" });

    const followingUsers = await usersCollection
        .find({ username: { $in: user.following } })
        .project({ _id: 0, username: 1, fullName: 1, avatarUrl: 1, isOnline: 1, lastActive: 1 })
        .toArray();

    return res.status(200).json(followingUsers);
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

    if (currentUser.blockedUsers.includes(user.username))
        return res.status(403).json({ message: "User Is Blocked" });

    if (!currentUser.following.includes(user.username) && user.isPrivate)
        return res.status(403).json({ message: "User Account Is Private" });

    const posts = await postsCollection
        .find({ author: username })
        .sort({ createdAt: -1 }) // Optional: newest first
        .toArray();

    const filtered = posts.map(({ _id, ...rest }) => rest);

    return res.status(200).json(filtered);
});


module.exports = router;
