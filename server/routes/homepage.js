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
async function fetchPosts(username, limit = 10) {
    try {
        const db = await connectDB();
        const followingUsername = await getUserFollowingUsernames(username);
        const targetUsername = [username, ...followingUsername];

        return await db.collection('posts').aggregate([
            {
                $match: {
                    author: { $in: targetUsername },
                    visibility: { $ne: 'private' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $addFields: {
                    isLiked: { $in: [username, '$likes'] },
                    likesCount: { $size: '$likes' },
                    sharesCount: { $size: '$shares' },
                    commentsCount: { $size: '$comments' }
                }
            },
            {
                $project: {
                    postId: 1,
                    author: 1,
                    fullName: 1,
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
async function fetchFollowing(username, limit = 35) {
    try {
        const db = await connectDB();
        const followingUsername = await getUserFollowingUsernames(username);
        if (!followingUsername.length) return [];

        return await db.collection('users').find(
            {
                username: { $in: followingUsername },
            },
            { projection: { username: 1, fullName: 1, avatarUrl: 1, lastActive: 1 } }
        )
            .sort({ lastActive: -1 })
            .limit(limit)
            .toArray();
    } catch (err) {
        console.error('Error fetching online following:', err);
        return [];
    }
}

async function getUserFollowingUsernames(username) {
    try {
        const db = await connectDB();
        const user = await db.collection('users').findOne(
            { username },
            { projection: { following: 1, _id: 0 } }
        );
        return user?.following || [];
    } catch (err) {
        console.error('Error fetching following username:', err);
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
                    isLiked: { $in: [user.username, '$likes'] },
                    likesCount: { $size: '$likes' },
                    sharesCount: { $size: '$shares' },
                    commentsCount: { $size: '$comments' }
                }
            },
            {
                $project: {
                    postId: 1,
                    author: 1,
                    fullName: 1,
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
                        isLiked: { $in: [user.username, '$likes'] },
                        likesCount: { $size: '$likes' },
                        sharesCount: { $size: '$shares' },
                        commentsCount: { $size: '$comments' }
                    }
                },
                {
                    $project: {
                        postId: 1,
                        author: 1,
                        fullName: 1,
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
            fetchPosts(user.username),
            fetchFollowing(user.username)
        ]);

        // Prepare response
        const homepageData = {
            success: true,
            data: {
                user: {
                    username: user.username,
                    fullName: user.fullName,
                    avatar: user.avatarUrl,
                    settings: user.Settings
                },
                posts: posts.map(post => ({
                    postId: post.postId,
                    author: post.author,
                    fullName: post.fullName,
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
                    username: following.username,
                    fullName: following.fullName,
                    following: following.following,
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