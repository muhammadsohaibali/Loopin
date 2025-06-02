const cookieParser = require("cookie-parser");
const session = require('express-session');
const MongoStore = require('connect-mongo')
const express = require('express');
const cors = require("cors");
const path = require('path');

require("dotenv").config();

let SERVER_ADDRESS, PORT;

if (process.env.NODE_ENV === 'development') {
    SERVER_ADDRESS = '192.168.100.4';
    PORT = 3000;
} else {
    SERVER_ADDRESS = process.env.SERVER_ADDRESS;
    PORT = process.env.PORT;
}

const app = express();

app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.SERVER_ADDRESS,
    credentials: true
}));

app.use(session({
    secret: process.env.SECRET_COOKIE_KEY,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60
    }),
    resave: false,
    saveUninitialized: false
}));

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

// ======================= SEO =======================
app.get('/google91c20151428a7824.html', (req, res) => {
    res.send('google-site-verification: google91c20151428a7824.html');
});

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
        Allow: /
            Sitemap: https://loopin-xha8.onrender.com/sitemap.xml`);
});

app.get('/sitemap.xml', require('./services/sitemap'))

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
app.use((req, res, next) => {
    if (req.path === '/404.html')
        return res.status(404).sendFile(path.join(__dirname, '../public', '404.html'));

    const isHtmlRequest = req.path.endsWith('.html');
    const errorType = isHtmlRequest ? 'html' : 'page';

    res.status(404).redirect(`/404.html?q=${errorType}&path=${encodeURIComponent(req.path)}`);
});

// =================== Start Server ===================
app.listen(PORT, () => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`Server running on ${SERVER_ADDRESS}:${PORT}`);
    } else {
        console.log(`Server running on ${PORT}`);
    }
});
