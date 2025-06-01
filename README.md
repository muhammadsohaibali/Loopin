# Loopin: A Minimal Social Network (Full-Stack Project)

*A clean and modern social networking platform built to master full-stack web development*

## Project Overview

Loopin is a feature-rich social media platform built from scratch as part of my journey to master full-stack web development. Designed for users aged 13+, it implements core social networking functionalities with robust security measures.

## Key Features

- **Secure Authentication**:
  - Age verification (13+ only)
  - 2FA + Email/Mobile verification
  - Bcrypt password hashing
  - Rate limiting & IP blocking

- **Core Social Features**:
  - User profiles with Cloudinary avatar hosting
  - Post creation with image/video uploads
  - Like/comment/share interactions
  - Real-time chat via Socket.io

- **Performance Optimizations**:
  - Cloudinary CDN for all media
  - SessionStorage caching
  - Lightweight vanilla JS frontend

## Tech Stack

### Frontend
- **Pure Vanilla JavaScript**
- Semantic HTML5
- Modern CSS3 (Flexbox/Grid)
- Responsive design

### Backend
- **Node.js** with **Express.js**
- **MongoDB Atlas** database
- **Socket.io** for real-time features
- **Cloudinary** for media management

### Security
- Bcrypt password hashing
- Rate limiting middleware
- IP-based abuse prevention
- Session management

## Project Structure

```
/Loopin
├── .env
├── .gitignore
├── Loopin Folder Structure.txt
├── package-lock.json
├── package.json
├── README.md
├── /public
│   ├── /assets
│   │   ├── /auth
│   │   │   ├── /css
│   │   │   │   ├── email-verification.css
│   │   │   │   ├── forgot-password.css
│   │   │   │   ├── login.css
│   │   │   │   ├── notifier.css
│   │   │   │   ├── register.css
│   │   │   │   ├── verification-email-sent.css
│   │   │   ├── /js
│   │   │   │   ├── email-verification.js
│   │   │   │   ├── forgot-password.js
│   │   │   │   ├── login.js
│   │   │   │   ├── notifier.js
│   │   │   │   ├── register.js
│   │   ├── /imgs
│   │   │   └── icon.png
│   │   ├── /public
│   │   │   ├── /css
│   │   │   │   ├── chats.css
│   │   │   │   ├── index.css
│   │   │   │   ├── post.css
│   │   │   │   └── /components
│   │   │   │       ├── loader.css
│   │   │   │       └── notifier.css
│   │   │   ├── /js
│   │   │   │   ├── chats.js
│   │   │   │   ├── index.js
│   │   │   │   ├── post.js
│   │   │   │   └── /components
│   │   │   │       ├── loader.js
│   │   │   │       └── notifier.js
│   ├── /auth
│   │   ├── email-verification.html
│   │   ├── forgot-password.html
│   │   ├── login.html
│   │   ├── register.html
│   │   └── verification-email-sent.html
│   └── /pages
│       ├── chats.html
│       ├── index.html
│       └── post.html
├── /server
│   ├── app.js
│   ├── /auth
│   │   ├── forgotpassword.js
│   │   ├── login.js
│   │   ├── logout.js
│   │   ├── register.js
│   │   └── user.js
│   ├── /config
│   │   └── mongo.js
│   ├── /middlewares
│   │   ├── auth.js
│   │   └── redirect.js
│   ├── /nodemailer
│   │   ├── mailer.js
│   │   └── mailtemplates.js
│   └── /routes
│       ├── homepage.js
│       └── posts.js
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/muhammadsohaibali/loopin.git
cd loopin
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the root directory and fill in the required credentials:

```env
# Server Configuration
SERVER_ADDRESS=
PORT=

# MongoDB Configuration
MONGO_URI=
appName=

# Session Secret
SECRET_COOKIE_KEY=

# NodeMailer Credentials
EMAIL=
PASSWORD=

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Node Environment
NODE_ENV=development
```

---

### 4. Start the Development Server

```bash
nodemon
```

---

## Security Highlights

- **Brute Force Protection**: 5 login attempts/hour per IP
- **Strong Passwords**: Minimum 8 characters, includes special characters
- **Session Security**: Secure, HttpOnly cookies

---

**Loopin** represents my journey into full-stack development. While not intended for production use yet, it demonstrates comprehensive understanding of modern web application development.

*Crafted with passion — built to learn, grow, and share.*