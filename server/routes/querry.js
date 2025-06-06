const express = require('express');
const { connectDB } = require('../config/mongo');
const cookie = require('cookie');
const router = express.Router();

async function verifySession(req) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionId = cookies.sessionId;
    if (!sessionId) return null;

    const db = await connectDB();
    const user = await db.collection('users').findOne({
        'sessions.sessionId': sessionId,
        'sessions.expiresAt': { $gt: new Date() }
    });

    return user;
}

function sanitizeUsers(users) {
    return users.map(user => ({
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatarUrl,
        matchScore: user.score
    }));
}

router.get("/", async (req, res) => {
    try {
        const user = await verifySession(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Please log in"
            });
        }

        const { query } = req.query;

        if (!query || typeof query !== 'string' || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Query parameter must be a string with at least 2 characters"
            });
        }

        const searchQuery = query.trim();
        const db = await connectDB();
        const usersCollection = db.collection('users');

        const usersMatched = await usersCollection.find({
            $or: [
                { username: { $regex: searchQuery, $options: 'i' } },
                { fullName: { $regex: searchQuery, $options: 'i' } }
            ]
        }, {
            projection: {
                password: 0,
            }
        }).toArray();

        const sanitizedUsers = sanitizeUsers(usersMatched);
        return res.status(200).json({
            success: true,
            users: sanitizedUsers
        });
    } catch (error) {
        console.error("Search error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

module.exports = router;
