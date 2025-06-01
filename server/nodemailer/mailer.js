const cookieParser = require("cookie-parser");
const nodemailer = require('nodemailer');
const express = require("express");
const router = express.Router();

router.use(cookieParser());

function validateEmail(email) {
    const emailProviders = [
        "@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@live.com", "@msn.com", "@icloud.com", "@aol.com",
        "@mail.com", "@protonmail.com", "@zoho.com", "@gmx.com", "@yandex.com", "@tutanota.com", "@fastmail.com",
        "@inbox.com", "@rediffmail.com", "@web.de", "@seznam.cz", "@mail.ru", "@naver.com", "@qq.com", "@daum.net",
    ];
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return (re.test(email) && emailProviders.some((domain) => email.endsWith(domain)));
}

// ============================================================================================

const transporter = nodemailer.createTransport({
    service: 'gmail', auth: { user: process.env.EMAIL, pass: process.env.PASSWORD }
});

async function sendNodeMail(email, subject, template) {
    if (!email || !template) throw { status: 400, message: "Invalid request parameters" };
    if (!validateEmail(email)) throw { status: 400, message: "Invalid Email" };

    const mailOptions = {
        to: email,
        subject: subject,
        html: template
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
}

module.exports = sendNodeMail;

// --------------------------------------------------------