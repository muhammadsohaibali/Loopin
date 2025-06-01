const path = require('path');
const cookie = require('cookie');
const { connectDB } = require('../config/mongo'); // Adjust path if needed

async function verifySession(req) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionId = cookies.sessionId;
    if (!sessionId) return null;

    const db = await connectDB();
    const users = db.collection('users');
    const user = await users.findOne({ 'sessions.sessionId': sessionId });

    if (!user) return null;

    const session = user.sessions.find(s => s.sessionId === sessionId);
    if (!session || session.expiresAt < new Date()) return null;

    return user;
}

function authGate(successPage, fallbackPage = 'login.html') {
    return async function (req, res) {
        try {
            const user = await verifySession(req);
            const basePath = path.resolve(__dirname, '../../public');
            return res.sendFile(user
                ? path.join(basePath, 'pages', successPage)
                : path.join(basePath, 'auth', fallbackPage)
            );
        } catch (err) {
            console.error('AuthGate error:', err);
            return res.status(500).send('Internal Server Error');
        }
    };
}

function unAuthOnlyPage(pageName) {
    return (req, res) => {
        const cookies = cookie.parse(req.headers.cookie || '');
        const sessionId = cookies.sessionId;

        if (sessionId) {
            return res.redirect('/');
        }

        const basePath = path.resolve(__dirname, '../../public/auth');
        return res.sendFile(path.join(basePath, pageName));
    };
}


module.exports = { authGate, unAuthOnlyPage };
