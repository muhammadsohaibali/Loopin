const cookieParser = require("cookie-parser");
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
require("dotenv").config();

const { connectDB } = require('../config/mongo');
const sendNodeMail = require('../nodemailer/mailer');
const { EmailVerificationTemplate } = require('../nodemailer/mailtemplates');

router.use(cookieParser());

const rateLimit = require('express-rate-limit');

router.use(rateLimit({
    windowMs: 60 * 1000,
    max: 5
}));

// ─── Helper Functions ────────────────────────────────────────────────────────
function generateOTP(length = 6) {
    const chars = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) otp += chars.charAt(Math.floor(Math.random() * chars.length));
    return otp;
}

function validateEmail(email) {
    const emailProviders = [
        "@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@live.com", "@msn.com", "@icloud.com", "@aol.com",
        "@mail.com", "@protonmail.com", "@zoho.com", "@gmx.com", "@yandex.com", "@tutanota.com", "@fastmail.com",
        "@inbox.com", "@rediffmail.com", "@web.de", "@seznam.cz", "@mail.ru", "@naver.com", "@qq.com", "@daum.net",
    ];
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email) && emailProviders.some(domain => email.endsWith(domain));
}

const validatePakistaniNumber = (num) =>
    /^(\+92|92|0)?[3][0-9]{9}$/.test(num) ? num.slice(-10).padStart(11, "0") : null;

// // ─── Register Route ──────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
    const { username, fullName, email, phone, password, birthdate } = req.body;

    if (!username || !fullName || !email || !phone || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    if (username.length > 20) {
        return res.status(400).json({ error: "Username Can't Exceed 20 Chars" });
    }

    if (fullName.length > 25) {
        return res.status(400).json({ error: "Full Name Can't Exceed 25 Chars" });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ error: "Invalid email format or domain" });
    }

    const normalizedPhone = validatePakistaniNumber(phone);
    if (!normalizedPhone) {
        return res.status(400).json({ error: "Invalid Pakistani phone number" });
    }

    try {
        const db = await connectDB();
        const users = db.collection("users");

        const exists = await users.findOne({ $or: [{ email }, { phone: normalizedPhone }] });
        if (exists) {
            return res.status(409).json({ error: "Email or phone already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        const newUser = {
            username,
            fullName,
            email,
            phone: normalizedPhone,
            password: hashedPassword,
            birthdate,
            otp,
            isVerified: false,
            createdAt: new Date()
        };

        await users.insertOne(newUser);

        await sendNodeMail(email, "Verify Your Email - NexaEase", EmailVerificationTemplate(otp, email, fullName))

        return res.status(201).json({ message: "Verification link sent to email" });
    } catch (err) {
        console.error("Register Error:", err);
        return res.status(500).json({ error: "Server error. Try again later." });
    }
});

router.post("/send-verification-link", async (req, res) => {
    const { identifier } = req.body;

    if (!identifier) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const db = await connectDB();
        const users = db.collection("users");

        const user = await users.findOne({ email: identifier });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: "User is already verified" });
        }

        const otp = generateOTP();

        await users.updateOne({ email: identifier }, { $set: { otp } });

        await sendNodeMail(identifier, "Verify Your Email - NexaEase", EmailVerificationTemplate(otp, identifier, user.fullName));

        return res.status(200).json({
            redirect: "/auth/verification-email-sent",
            message: "Verification link sent to email"
        });

    } catch (err) {
        console.error("Resend Verification Error:", err);
        return res.status(500).json({ error: "Server error. Try again later." });
    }
});

router.get("/verify-email", async (req, res) => {
    const { email, otp } = req.query;

    if (!email || !otp) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid verification link',
            code: 'invalid-link'
        });
    }

    try {
        const db = await connectDB();
        const users = db.collection("users");

        const user = await users.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
                code: 'user-not-found'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                status: 'error',
                message: 'User already verified',
                code: 'already-verified',
                email: email
            });
        }

        if (user.otp !== otp) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired verification code',
                code: 'invalid-otp'
            });
        }

        await users.updateOne(
            { email },
            { $set: { isVerified: true }, $unset: { otp: "" } }
        );

        return res.status(200).json({
            status: 'success',
            message: 'Email verified successfully',
            email: email
        });
    } catch (err) {
        console.error("Verification error:", err);
        return res.status(500).json({
            status: 'error',
            message: 'Server error. Please try again later',
            code: 'server-error'
        });
    }
});

module.exports = router;
