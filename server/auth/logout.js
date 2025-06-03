const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const cookie = require("cookie"); // Needed for clearing cookie manually
const bcrypt = require("bcrypt");
require("dotenv").config();

const { connectDB } = require('../config/mongo');
const { authMiddleware } = require('../middlewares/auth');

router.use(cookieParser());

// Helper: Generate numeric OTP
function generateOTP(length = 6) {
    const chars = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) otp += chars.charAt(Math.floor(Math.random() * chars.length));
    return otp;
}

// Helper: Validate common email providers
function validateEmail(email) {
    const emailProviders = [
        "@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@live.com", "@msn.com", "@icloud.com", "@aol.com",
        "@mail.com", "@protonmail.com", "@zoho.com", "@gmx.com", "@yandex.com", "@tutanota.com", "@fastmail.com",
        "@inbox.com", "@rediffmail.com", "@web.de", "@seznam.cz", "@mail.ru", "@naver.com", "@qq.com", "@daum.net",
    ];
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email) && emailProviders.some(domain => email.endsWith(domain));
}

// Logout from current device
router.post('/logout', authMiddleware, async (req, res) => {
    const db = await connectDB();
    const users = db.collection('users');

    await users.updateOne(
        { _id: req.user._id },
        { $pull: { sessions: { sessionId: req.sessionId } } }
    );

    res.setHeader('Set-Cookie', cookie.serialize('sessionId', '', {
        httpOnly: true,
        maxAge: 0,
        path: '/',
    }));

    res.json({ msg: 'Logged out from this device' });
});

// Logout from all devices
router.post('/logout-all', authMiddleware, async (req, res) => {
    const db = await connectDB();
    const users = db.collection('users');

    await users.updateOne(
        { _id: req.user._id },
        { $set: { sessions: [] } }
    );

    res.setHeader('Set-Cookie', cookie.serialize('sessionId', '', {
        httpOnly: true,
        maxAge: 0,
        path: '/',
    }));

    res.json({ msg: 'Logged out from all devices' });
});

module.exports = router;
