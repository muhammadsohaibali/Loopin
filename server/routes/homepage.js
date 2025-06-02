const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/mongo');
const cookie = require('cookie');

// Session verification middleware
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

// Fetch posts with pagination
async function fetchPosts(userEmail, limit = 10) {
    try {
        const db = await connectDB();
        const friendEmails = await getUserFollowingEmails(userEmail);
        const targetEmails = [userEmail, ...friendEmails];

        return await db.collection('posts').aggregate([
            {
                $match: {
                    author: { $in: targetEmails },
                    visibility: { $ne: 'private' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $addFields: {
                    isLiked: { $in: [userEmail, '$likes'] },
                    likesCount: { $size: '$likes' },
                    sharesCount: { $size: '$shares' },
                    commentsCount: { $size: '$comments' }
                }
            },
            {
                $project: {
                    postId: 1,
                    author: 1,
                    username: 1,
                    avatar: 1,
                    content: 1,
                    image: 1,
                    createdAt: 1,
                    visibility: 1,
                    sharesCount: 1,
                    isLiked: 1,
                    likesCount: 1,
                    commentsCount: 1
                }
            }
        ]).toArray();
    } catch (err) {
        console.error('Error fetching posts:', err);
        return [];
    }
}

// Fetch online following users (replaces fetchOnlineFriends)
async function fetchOnlineFollowing(userEmail, limit = 15) {
    try {
        const db = await connectDB();
        const followingEmails = await getUserFollowingEmails(userEmail);
        if (!followingEmails.length) return [];

        return await db.collection('users').find(
            {
                email: { $in: followingEmails },
                isOnline: true
            },
            { projection: { username: 1, avatarUrl: 1, lastActive: 1, email: 1 } }
        )
            .sort({ lastActive: -1 })
            .limit(limit)
            .toArray();
    } catch (err) {
        console.error('Error fetching online following:', err);
        return [];
    }
}

async function getUserFollowingEmails(email) {
    try {
        const db = await connectDB();
        const user = await db.collection('users').findOne(
            { email },
            { projection: { following: 1, _id: 0 } }
        );
        return user?.following || [];
    } catch (err) {
        console.error('Error fetching following emails:', err);
        return [];
    }
}

router.get("/infinite-posts", async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const user = await verifySession(req);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Please log in"
        });
    }

    const db = await connectDB();
    const postsCollection = db.collection("posts");

    try {
        // Initialize seenPostIds in session
        if (!req.session.seenPostIds) {
            req.session.seenPostIds = [];
        }

        const seenPostIds = new Set(req.session.seenPostIds);
        let finalPosts = [];

        // Try to fetch unseen posts first
        const randomPosts = await postsCollection.aggregate([
            { $match: { visibility: { $ne: 'private' } } },
            { $sample: { size: limit * 2 } }, // sample more to filter unseen
            {
                $addFields: {
                    isLiked: { $in: [user.email, '$likes'] },
                    likesCount: { $size: '$likes' },
                    sharesCount: { $size: '$shares' },
                    commentsCount: { $size: '$comments' }
                }
            },
            {
                $project: {
                    postId: 1,
                    author: 1,
                    username: 1,
                    avatar: 1,
                    content: 1,
                    image: 1,
                    createdAt: 1,
                    visibility: 1,
                    sharesCount: 1,
                    isLiked: 1,
                    likesCount: 1,
                    commentsCount: 1
                }
            }
        ]).toArray();

        for (const post of randomPosts) {
            if (!seenPostIds.has(post.postId)) {
                seenPostIds.add(post.postId);
                finalPosts.push(post);
            }
            if (finalPosts.length === limit) break;
        }

        // Not enough unique posts? Restart session memory and retry
        if (finalPosts.length < limit) {
            seenPostIds.clear(); // reset memory
            finalPosts = [];

            const freshPosts = await postsCollection.aggregate([
                { $match: { visibility: { $ne: 'private' } } },
                { $sample: { size: limit } },
                {
                    $addFields: {
                        isLiked: { $in: [user.email, '$likes'] },
                        likesCount: { $size: '$likes' },
                        sharesCount: { $size: '$shares' },
                        commentsCount: { $size: '$comments' }
                    }
                },
                {
                    $project: {
                        postId: 1,
                        author: 1,
                        username: 1,
                        avatar: 1,
                        content: 1,
                        image: 1,
                        createdAt: 1,
                        visibility: 1,
                        sharesCount: 1,
                        isLiked: 1,
                        likesCount: 1,
                        commentsCount: 1
                    }
                }
            ]).toArray();

            for (const post of freshPosts) {
                seenPostIds.add(post.postId);
                finalPosts.push(post);
            }
        }

        // Save the updated list back to session
        req.session.seenPostIds = [...seenPostIds];

        res.json(finalPosts);
    } catch (err) {
        console.error("Error in infinite-posts route:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// Then update the homepage-data route to use the new functions:
router.get("/homepage-data", async (req, res) => {
    try {
        // Verify user session
        const user = await verifySession(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Please log in"
            });
        }

        // Fetch data in parallel - now using following instead of friends
        const [posts, onlineFollowing] = await Promise.all([
            fetchPosts(user.email),
            fetchOnlineFollowing(user.email)
        ]);

        // Prepare response
        const homepageData = {
            success: true,
            data: {
                user: {
                    username: user.username,
                    email: user.email,
                    avatar: user.avatarUrl,
                    settings: user.Settings
                },
                posts: posts.map(post => ({
                    postId: post.postId,
                    author: post.author,
                    username: post.username,
                    avatar: post.avatar,
                    content: post.content,
                    image: post.image,
                    createdAt: post.createdAt,
                    visibility: post.visibility,
                    sharesCount: post.sharesCount,
                    isLiked: post.isLiked,
                    likesCount: post.likesCount,
                    commentsCount: post.commentsCount
                })),
                onlineFollowing: onlineFollowing.map(following => ({
                    email: following.email,
                    username: following.username,
                    avatar: following.avatarUrl,
                    lastActive: following.lastActive
                }))
            }
        };

        res.json(homepageData);
    } catch (err) {
        console.error('Homepage data error:', err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

module.exports = router;