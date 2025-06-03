// const cookie = require("cookie");
// require("dotenv").config();

// const { connectDB } = require('../config/mongo');

// async function authMiddleware(req, res, next) {
//     const db = await connectDB();
//     const users = db.collection('users');

//     const cookies = cookie.parse(req.headers.cookie || '');
//     const sessionId = cookies.sessionId;
//     if (!sessionId) return res.status(401).json({ message: 'No session found' });

//     const user = await users.findOne({ 'sessions.sessionId': sessionId });
//     if (!user) {
//         // Clear cookie if session not found
//         res.setHeader('Set-Cookie', cookie.serialize('sessionId', '', {
//             httpOnly: true,
//             maxAge: 0,
//             path: '/'
//         }));
//         return res.status(401).json({ message: 'Session expired or invalid' });
//     }

//     // Find the actual session
//     const session = user.sessions.find(s => s.sessionId === sessionId);
//     if (session.expiresAt < new Date()) {
//         // Session expired — remove it
//         await users.updateOne(
//             { _id: user._id },
//             { $pull: { sessions: { sessionId } } }
//         );

//         res.setHeader('Set-Cookie', cookie.serialize('sessionId', '', {
//             httpOnly: true,
//             maxAge: 0,
//             path: '/'
//         }));
//         return res.status(401).json({ message: 'Session expired' });
//     }

//     req.user = user;
//     req.sessionId = sessionId;
//     next();
// }

// module.exports = authMiddleware

const cookie = require('cookie');
const crypto = require('crypto');
require('dotenv').config();
const { connectDB } = require('../config/mongo');
const rateLimit = require('express-rate-limit');

// Rate limiting to prevent brute force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many authentication attempts, please try again later'
});

// Generate signed cookie secret (do this once and store in env)
const COOKIE_SECRET = process.env.SECRET_COOKIE_KEY

function signCookie(value) {
    return crypto.createHmac('sha256', COOKIE_SECRET)
        .update(value)
        .digest('hex');
}

async function authMiddleware(req, res, next) {
    try {
        // Apply rate limiting
        await new Promise((resolve, reject) => {
            authLimiter(req, res, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        const db = await connectDB();
        const users = db.collection('users');

        // Parse and verify signed cookie
        const cookies = cookie.parse(req.headers.cookie || '');
        const sessionCookie = cookies.sessionId;

        if (!sessionCookie) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'NO_SESSION'
            });
        }

        // Verify cookie signature
        const [sessionId, signature] = sessionCookie.split('.');
        if (!sessionId || !signature || signCookie(sessionId) !== signature) {
            clearSessionCookie(res);
            return res.status(401).json({
                message: 'Invalid session',
                code: 'INVALID_SESSION'
            });
        }

        // Find user with this session
        const user = await users.findOne({
            'sessions.sessionId': sessionId
        }, {
            projection: {
                email: 1,
                name: 1,
                avatar: 1,
                sessions: { $elemMatch: { sessionId } },
                roles: 1,
                status: 1
            }
        });

        if (!user) {
            clearSessionCookie(res);
            return res.status(401).json({
                message: 'Session expired',
                code: 'SESSION_EXPIRED'
            });
        }

        const session = user.sessions[0];

        // Check session expiration
        if (new Date(session.expiresAt) < new Date()) {
            await users.updateOne(
                { _id: user._id },
                { $pull: { sessions: { sessionId } } }
            );
            clearSessionCookie(res);
            return res.status(401).json({
                message: 'Session expired',
                code: 'SESSION_EXPIRED'
            });
        }

        // Check if session was manually invalidated
        if (session.invalidated) {
            await users.updateOne(
                { _id: user._id },
                { $pull: { sessions: { sessionId } } }
            );
            clearSessionCookie(res);
            return res.status(401).json({
                message: 'Session invalidated',
                code: 'SESSION_INVALIDATED'
            });
        }

        // Check user status
        if (user.status !== 'active') {
            return res.status(403).json({
                message: 'Account suspended',
                code: 'ACCOUNT_SUSPENDED'
            });
        }

        // Attach minimal user info to request
        req.user = {
            _id: user._id,
            email: user.email,
            name: user.name,
            roles: user.roles || ['user'],
            sessionId
        };

        // Refresh session expiration (optional)
        const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await users.updateOne(
            { _id: user._id, 'sessions.sessionId': sessionId },
            { $set: { 'sessions.$.expiresAt': newExpiry } }
        );

        // Set CSRF token for sensitive operations
        const csrfToken = crypto.randomBytes(16).toString('hex');
        req.sessionCSRF = csrfToken;
        res.setHeader('X-CSRF-Token', csrfToken);

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            message: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
}

function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', cookie.serialize('sessionId', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0 // Immediately expire
    }));
}

// Helper to create new sessions
async function createUserSession(userId, res) {
    const db = await connectDB();
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.collection('users').updateOne(
        { _id: userId },
        {
            $push: {
                sessions: {
                    sessionId,
                    expiresAt,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    createdAt: new Date()
                }
            }
        }
    );

    // Set signed cookie
    res.setHeader('Set-Cookie', cookie.serialize('sessionId',
        `${sessionId}.${signCookie(sessionId)}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    }));

    return sessionId;
}

// Helper to invalidate sessions
async function invalidateSession(userId, sessionId) {
    const db = await connectDB();
    await db.collection('users').updateOne(
        { _id: userId },
        { $pull: { sessions: { sessionId } } }
    );
}

module.exports = {
    authMiddleware,
    createUserSession,
    invalidateSession,
    authLimiter
};