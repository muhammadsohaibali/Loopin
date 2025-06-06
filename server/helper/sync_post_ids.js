const express = require('express');
const router = express.Router();
require('dotenv').config();

const { connectDB } = require('../config/mongo');

async function fetchUsersAndPosts() {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const postsCollection = db.collection('posts');

    const users = await usersCollection.find().toArray();
    const posts = await postsCollection.find().toArray();

    return { users, posts };
}

router.post('/', async (req, res) => {
    let updatedUsers = 0;
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const { users, posts } = await fetchUsersAndPosts();

    for (const post of posts) {
        const { postId, author } = post;

        const user = users.find(u => u.username === author);
        if (user) {
            if (!Array.isArray(user.posts)) user.posts = [];

            if (!user.posts.includes(postId)) {
                user.posts.push(postId);
                updatedUsers++;

                await usersCollection.updateOne(
                    { username: user.username },
                    { $set: { posts: user.posts } }
                );
            }
        }
    }

    res.status(200).json({
        message: 'Post IDs synced with user objects successfully',
        usersUpdated: updatedUsers
    });
});

module.exports = router;
