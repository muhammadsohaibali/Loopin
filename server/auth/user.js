const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { connectDB } = require('../config/mongo');

router.use(cookieParser());

function sanitizeUser(user, currentUser = false) {
    if (!currentUser) {
        const { _id, password, email, isVerified, isPrivate, birthdate, accountStatus,
            joinedAt, sessions, blockedUsers, Settings, phone, lastActive, ...filtered } = user;
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

    const { username } = req.query; // username = user.email

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
        return res.status(200).send({ success: false, message: "User Account Is Private" });
    }

    return res.status(200).json(sanitizeUser(user));
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
    const usersCollection = await db.collection('posts');

    const posts = await usersCollection.find({ author: username }).toArray()

    if (!posts || !posts.length) {
        return res.status(200).json([]);
    }

    const filtered = posts.map(({ _id, ...rest }) => rest);

    return res.status(200).json(filtered);
});

module.exports = router;
