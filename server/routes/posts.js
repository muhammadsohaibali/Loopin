const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/mongo');
const cookie = require('cookie');
const bcrypt = require('bcrypt')

async function verifySession(req) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionId = cookies.sessionId;
    if (!sessionId) return null;

    const db = await connectDB();
    const user = await db.collection('users').findOne({
        'sessions.sessionId': sessionId,
        'sessions.expiresAt': { $gt: new Date() }
    });

    return user;
}

// Create a new post
router.post("/post", async (req, res) => {
    try {
        const user = await verifySession(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized - Please log in" });
        }

        const { content, image, visibility = "Public" } = req.body;
        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }

        const db = await connectDB();
        const postsCollection = db.collection('posts');
        const usersCollection = db.collection('users');

        async function generatePostId(email) {
            const username = email.split('@')[0];
            const hash = await bcrypt.hash(username, 4);
            return Date.now().toString(36) + hash.replace(/\W/g, '').slice(-10);
        }

        const postId = await generatePostId(user.email)

        const newPost = {
            postId,
            author: user.email,
            username: user.username,
            avatar: user.avatarUrl,
            content,
            image: image || null,
            createdAt: new Date(),
            visibility,
            sharesCount: 0,
            isLiked: false,
            likes: [],
            comments: []
        };

        await postsCollection.insertOne(newPost);

        await usersCollection.updateOne(
            { email: user.email },
            { $push: { posts: postId } }
        );

        res.status(201).json({
            message: "Post created successfully"
        });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get post by ID
router.get("/post", async (req, res) => {
    try {
        const { postId } = req.query; // Using query parameter instead of body for GET request

        if (!postId) {
            return res.status(400).json({ error: "Post ID is required" });
        }

        const db = await connectDB();
        const post = await db.collection('posts').findOne({ postId });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Check if current user has liked the post
        const user = await verifySession(req);
        if (user) {
            post.isLiked = post.likes.includes(user.email);
        } else {
            post.isLiked = false;
        }

        res.status(200).json(post);
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete post
router.delete("/post", async (req, res) => {
    try {
        const user = await verifySession(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized - Please log in" });
        }

        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ error: "Post ID is required" });
        }

        const db = await connectDB();
        const post = await db.collection('posts').findOne({ postId });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.author !== user.email) {
            return res.status(403).json({ error: "Forbidden - You can only delete your own posts" });
        }

        await db.collection('posts').deleteOne({ postId });

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Like/unlike a post
router.post("/like", async (req, res) => {
    try {
        const user = await verifySession(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized - Please log in" });
        }

        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ error: "Post ID is required" });
        }

        const db = await connectDB();
        const post = await db.collection('posts').findOne({ postId });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const likes = post.likes || [];
        const userIndex = likes.indexOf(user.email);
        let updatedLikes;

        if (userIndex === -1) {
            // Add like
            updatedLikes = [...likes, user.email];
        } else {
            // Remove like
            updatedLikes = likes.filter(email => email !== user.email);
        }

        await db.collection('posts').updateOne(
            { postId },
            { $set: { likes: updatedLikes } }
        );

        res.status(200).json({
            message: "Like status updated",
            isLiked: userIndex === -1,
            likeCount: updatedLikes.length
        });
    } catch (error) {
        console.error("Error updating like status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add comment to a post
router.post("/comment", async (req, res) => {
    try {
        const user = await verifySession(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized - Please log in" });
        }

        const { postId, content } = req.body;
        if (!postId || !content) {
            return res.status(400).json({ error: "Post ID and content are required" });
        }

        const db = await connectDB();
        const post = await db.collection('posts').findOne({ postId });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const newComment = {
            email: user.email,
            username: user.username,
            avatar: user.avatarUrl,
            content,
            createdAt: new Date()
        };

        await db.collection('posts').updateOne(
            { postId },
            { $push: { comments: newComment } }
        );

        res.status(201).json({
            message: "Comment added successfully",
            comment: newComment
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Remove comment from a post
router.delete("/comment", async (req, res) => {
    try {
        const user = await verifySession(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized - Please log in" });
        }

        const { postId, commentContent } = req.body;
        if (!postId || !commentContent) {
            return res.status(400).json({ error: "Post ID and comment content are required" });
        }

        const db = await connectDB();
        const post = await db.collection('posts').findOne({ postId });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Find the comment to remove
        const commentIndex = post.comments.findIndex(
            comment => comment.email === user.email && comment.content === commentContent
        );

        if (commentIndex === -1) {
            return res.status(404).json({ error: "Comment not found or you don't have permission to delete it" });
        }

        // Remove the comment
        const updatedComments = [...post.comments];
        updatedComments.splice(commentIndex, 1);

        await db.collection('posts').updateOne(
            { postId },
            { $set: { comments: updatedComments } }
        );

        res.status(200).json({ message: "Comment removed successfully" });
    } catch (error) {
        console.error("Error removing comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;