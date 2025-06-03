const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { connectDB } = require('../config/mongo');

router.use(cookieParser());

async function verifySession(req) {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return null;

    const db = await connectDB();
    const user = await db.collection('users').findOne({
        'sessions.sessionId': sessionId,
        'sessions.expiresAt': { $gt: new Date() }
    });

    return user;
}

router.get('/current-user', async (req, res) => {
    const user = await verifySession(req);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Please log in"
        });
    }

    const { _id, password, isVerified, sessions, posts, friends, ...filteredUser } = user;
    return res.status(200).json(filteredUser);
});

module.exports = router;
