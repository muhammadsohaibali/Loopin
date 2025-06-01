const cookie = require("cookie");
require("dotenv").config();

const { connectDB } = require('../config/mongo');

async function authMiddleware(req, res, next) {
    const db = await connectDB();
    const users = db.collection('users');

    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionId = cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: 'No session found' });

    const user = await users.findOne({ 'sessions.sessionId': sessionId });
    if (!user) {
        // Clear cookie if session not found
        res.setHeader('Set-Cookie', cookie.serialize('sessionId', '', {
            httpOnly: true,
            maxAge: 0,
            path: '/'
        }));
        return res.status(401).json({ message: 'Session expired or invalid' });
    }

    // Find the actual session
    const session = user.sessions.find(s => s.sessionId === sessionId);
    if (session.expiresAt < new Date()) {
        // Session expired — remove it
        await users.updateOne(
            { _id: user._id },
            { $pull: { sessions: { sessionId } } }
        );

        res.setHeader('Set-Cookie', cookie.serialize('sessionId', '', {
            httpOnly: true,
            maxAge: 0,
            path: '/'
        }));
        return res.status(401).json({ message: 'Session expired' });
    }

    req.user = user;
    req.sessionId = sessionId;
    next();
}

module.exports = authMiddleware