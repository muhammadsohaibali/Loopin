const cookieParser = require("cookie-parser");
const session = require("express-session");
const express = require('express');
const cors = require("cors");
const path = require('path');

require("dotenv").config();

const SERVER_ADDRESS = process.env.SERVER_ADDRESS || '192.168.100.4';
const PORT = process.env.PORT || 3000;

const app = express();

app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());

// app.use(cors({
//     origin: process.env.SERVER_ADDRESS,
//     credentials: true
// }));

app.use(
    session({
        secret: process.env.SECRET_COOKIE_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    })
);

// ===================== Middlewares =====================
const { authGate, unAuthOnlyPage } = require('./middlewares/redirect');

// ======================= Routes =======================
app.use("/api/auth/", require("./auth/user"));
app.use("/api/auth/", require("./auth/login"));
app.use("/api/auth/", require("./auth/logout"));
app.use("/api/auth/", require("./auth/register"));
app.use("/api/auth/", require("./auth/forgotpassword"));

app.use("/api/", require("./routes/homepage"));
app.use("/api/posts/", require("./routes/posts"));

// ======================= Assets =======================
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// =================== Authentication ===================
app.get('/auth', unAuthOnlyPage('login.html'));
app.get('/auth/register', unAuthOnlyPage('register.html'));
app.get('/auth/forgot-password', unAuthOnlyPage('forgot-password.html'));
app.get('/auth/verify-email', unAuthOnlyPage('email-verification.html'));
app.get('/auth/verification-email-sent', unAuthOnlyPage('verification-email-sent.html'));

// ======================= Pages =======================
app.get('/', authGate("index.html", "login.html"));
app.get('/chats', authGate("chats.html", "login.html"));
app.get('/me', authGate("my-profile.html", "login.html"));
app.get('/friends', authGate("friends.html", "login.html"));
app.get('/post/:postId', authGate("post.html", "login.html"));
app.get('/search', authGate("find-friends.html", "login.html"));

// =================== 404 Not Found ===================
app.use((req, res) => {
    res.status(404).send("Page not found");
});

// =================== Start Server ===================
app.listen(PORT, () => {
    console.log(`Server running on http://${SERVER_ADDRESS}:${PORT}`);
});
