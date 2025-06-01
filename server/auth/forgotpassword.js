const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
require("dotenv").config();

const { connectDB } = require('../config/mongo');
const sendNodeMail = require('../nodemailer/mailer');
const { otpTemplate } = require('../nodemailer/mailtemplates');

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

// Helper: Validate Pakistani phone numbers
const validatePakistaniNumber = (num) => /^(\+92|92|0)?[3][0-9]{9}$/.test(num) ? num.slice(-10).padStart(11, "0") : null;

// ROUTE: Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ error: "Valid email is required" });
    }

    try {
        const db = await connectDB();
        const users = db.collection('users');

        const user = await users.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "Email not found" });
        }

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        await users.updateOne(
            { email },
            {
                $set: {
                    resetCode: hashedOTP,
                    resetCodeExpires: Date.now() + 10 * 60 * 1000 // 10 min
                }
            }
        );

        // Send OTP email using your custom mailer
        await sendNodeMail(email, 'Reset Your Password', otpTemplate(otp));

        console.log(`OTP sent to ${email}: ${otp}`); // For dev only
        res.status(200).json({ message: 'Verification code sent' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ROUTE: Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
    }

    try {
        const db = await connectDB();
        const users = db.collection('users');

        const user = await users.findOne({ email });
        if (!user || !user.resetCode || !user.resetCodeExpires) {
            return res.status(404).json({ error: "No reset request found for this email" });
        }

        if (Date.now() > user.resetCodeExpires) {
            return res.status(410).json({ error: "OTP expired" });
        }

        const isMatch = await bcrypt.compare(otp, user.resetCode);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid OTP" });
        }

        await users.updateOne(
            { email },
            {
                $unset: { resetCode: "", resetCodeExpires: "" },
                $set: { resetVerified: true }
            }
        );

        res.status(200).json({ message: "OTP verified. You can now reset your password." });
    } catch (err) {
        console.error("OTP verification error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ROUTE: Reset Password
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ error: "Email and new password are required" });
    }

    try {
        const db = await connectDB();
        const users = db.collection('users');

        const user = await users.findOne({ email });
        if (!user || !user.resetVerified) {
            return res.status(403).json({ error: "OTP not verified or invalid reset flow" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await users.updateOne(
            { email },
            {
                $set: { password: hashedPassword },
                $unset: { resetVerified: "" }
            }
        );

        res.status(200).json({ message: "Password has been reset successfully" });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
