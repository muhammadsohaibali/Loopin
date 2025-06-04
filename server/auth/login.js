const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const { connectDB } = require('../config/mongo');

router.use(cookieParser());

const validatePakistaniNumber = (num) => /^(\+92|92|0)?[3][0-9]{9}$/.test(num) ? num.slice(-10).padStart(11, "0") : null;

// Login route
router.post('/login', async (req, res) => {
    let { identifier, password, deviceInfo, ip } = req.body; // Identifier = Username Or Phone

    if (!identifier || !password) {
        return res.status(400).json({ error: 'Username/phone and password required' });
    }

    identifier = identifier.trim();

    const phone = validatePakistaniNumber(identifier);
    const isUsername = !phone;

    if (!isUsername && !phone) {
        return res.status(400).json({ error: 'Invalid username or phone number' });
    }

    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');

        const query = phone ? { phone } : { username: identifier.toLowerCase() };
        const user = await usersCollection.findOne(query);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ error: 'Email Is Not Verified' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const sessionId = uuid();

        if (deviceInfo.userAgent.toLowerCase().includes("windows")) {
            deviceInfo.userAgent = "Windows"
        } else if (deviceInfo.userAgent.toLowerCase().includes("android")) {
            deviceInfo.userAgent = "Android"
        }

        const session = {
            sessionId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            ipAddress: ip,
            deviceInfo: deviceInfo
        };

        await usersCollection.updateOne(
            { _id: user._id },
            { $push: { sessions: session } }
        );

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                phone: user.phone
            },
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
