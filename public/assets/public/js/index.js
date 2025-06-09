document.addEventListener('DOMContentLoaded', async function () {
    await fetchHomepageData();
    await setupCreatePost();

    if (getPostIdFromURL('action') === 'add-post') {
        newPost()
    }
    showLoader(false);
});

// CONSTANTS
const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/lego/1.jpg';
const POSTS_PER_LOAD = 20;
let isLoading = false;
let scrollTimeout;

/**
 * Formats large numbers into shortened strings (e.g., 1500 -> 1.5K)
 * @param {number} n - The number to format
 * @returns {string} Formatted number string
 */
const formatCount = n => {
    if (n === 0) return n.toString();
    const units = ['', 'K', 'M', 'B', 'T', 'Q'];
    let i = 0;
    while (n >= 1e3 && i < units.length - 1) {
        n /= 1e3;
        i++;
    }
    return (+n.toFixed(1)).toString().replace(/\.0$/, '') + units[i];
};

function newPost() {
    const postInput = document.querySelector('.create-post input')
    postInput.focus();
}

function getPostIdFromURL(queryParamKey = null) {
    const url = new URL(window.location.href);

    if (queryParamKey) {
        return url.searchParams.get(queryParamKey);
    }

    const pathSegments = url.pathname.split('/').filter(Boolean);
    const postIndex = pathSegments.indexOf('post');

    if (postIndex !== -1 && pathSegments.length > postIndex + 1) {
        return pathSegments[postIndex + 1];
    }

    return null;
}

/**
 * Fetches homepage data from the backend
 * @param {string} run - Which parts to run ('all', 'user', 'posts', 'following')
 */
async function fetchHomepageData(run = 'all') {
    try {
        const response = await fetch('/api/homepage-data');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const { success, data, message } = await response.json();

        if (!success) {
            throw new Error(message || 'Unknown error occurred');
        }

        switch (run) {
            case "user":
                populateUserInfo(data.user);
                break;
            case "posts":
                populatePosts(data.posts);
                break;
            case "following":
                populateFollowing(data.following);
                break;
            case "all":
            default:
                populateUserInfo(data.user);
                populatePosts(data.posts);
                populateFollowing(data.following);
        }
    } catch (error) {
        console.error('Error fetching homepage data:', error);
        notify(`Failed: ${error}`, 'error');
    }
}

/**
 * Populates user information in the sidebar
 * @param {Object} user - User data object
 */
function populateUserInfo(user) {
    if (!user) return;

    userConnectedSocket(user.username)

    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;

    userProfile.onclick = () => location.assign(`/profile/${user.username}`)

    const avatarImages = [
        userProfile.querySelector('.avatar img'),
        document.querySelector('#user-profile-img')
    ].filter(Boolean);

    avatarImages.forEach(img => {
        img.src = user.avatar || DEFAULT_AVATAR;
        img.alt = `${user.fullName}'s profile picture`;
    });

    const usernameEl = userProfile.querySelector('.username');
    const userHandleEl = userProfile.querySelector('.user-handle');

    if (usernameEl) usernameEl.textContent = user.fullName || '';
    if (userHandleEl) userHandleEl.textContent = user.username || '';
}

/**
 * Creates HTML for a single post
 * @param {Object} post - Post data object
 * @returns {string} HTML string for the post
 */
function createPostHTML(post) {
    return `
        <div class="post" data-post-id="${post.postId}">
            <div class="post-header">
                <div class="user-info" onclick="location.assign('/profile/${post.author}')">
                    <div class="avatar">
                        <img src="${post.avatar || DEFAULT_AVATAR}" alt="${post.fullName}'s profile picture">
                    </div>
                    <div class="user-details">
                        <span class="username">${post.fullName}</span>
                        <span class="post-time">${formatPostTime(post.createdAt)}</span>
                    </div>
                </div>
                <a href="/post/${post.postId}" class="show-post-button">
                    <span>View Post</span>
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>

            <div class="post-content">
                <p>${post.content}</p>
                ${post.image ? `
                <div class="post-image">
                    <img src="${post.image}" alt="Post image" loading="lazy">
                </div>` : ''}
            </div>

            <div class="post-stats">
                <span class="likes-count">${formatCount(post.likesCount)} ${post.likesCount === 1 ? 'like' : 'likes'}</span>
                <span onclick="location.assign('${location.href}post/${post.postId}')" class="comments-count">${formatCount(post.commentsCount)} ${post.commentsCount === 1 ? 'comment' : 'comments'}</span>
                <span class="shares-count">${formatCount(post.sharesCount)} ${post.sharesCount === 1 ? 'share' : 'shares'}</span>
            </div>

            <div class="post-actions">
                <button class="btn-like ${post.isLiked ? 'liked' : ''}">
                    <i class="${post.isLiked ? 'fas' : 'far'} fa-heart"></i>
                    <span>Like</span>
                </button>
                <button class="btn-comment">
                    <i class="far fa-comment"></i>
                    <span>Comment</span>
                </button>
                <button class="btn-share" data-url="${location.href}post/${post.postId}">
                    <i class="fas fa-share"></i>
                    <span>Share</span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Populates posts in the main content area
 * @param {Array} posts - Array of post objects
 */
function populatePosts(posts) {
    const postsFeed = document.querySelector('.posts-feed');
    if (!postsFeed) return;

    if (!posts || !posts.length) {
        postsFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <p>No posts to show. Connect with friends to see their posts!</p>
            </div>
        `;
        return;
    }

    postsFeed.innerHTML = '';
    posts.forEach(post => {
        postsFeed.insertAdjacentHTML('beforeend', createPostHTML(post));
    });

    setupPostInteractions();
}

/**
 * Populates online following users in the right sidebar
 * @param {Array} following - Array of following user objects
 */
function populateFollowing(following) {
    const followingContainer = document.querySelector('.online-friends');
    if (!followingContainer) return;

    if (!following || !following.length) {
        followingContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <p>No one you follow is online right now</p>
            </div>
        `;
        return;
    }

    followingContainer.innerHTML = '';
    following.sort((a, b) => {
        if (b.isOnline !== a.isOnline) return b.isOnline - a.isOnline;

        if (!a.isOnline && !b.isOnline) {
            const dateA = new Date(a.lastActive || 0);
            const dateB = new Date(b.lastActive || 0);
            return dateB - dateA;
        }

        return 0;
    });

    following.forEach(user => {
        const userEl = document.createElement('div');
        userEl.className = 'following-user';
        userEl.dataset.username = user.username;

        userEl.innerHTML = `
            <div class="friend">
                <div class="avatar">
                    <img src="${user.avatar || DEFAULT_AVATAR}" 
                        alt="${user.fullName}'s profile picture">
                    <span style="background-color: ${user.isOnline ? '#4bb543' : '#adb5bd'}" class="online-status"></span>
                </div>
                <div class="friend-info">
                    <span class="username">${user.fullName}</span>
                    <span class="status">${user.isOnline ? 'Online' : formatLastActive(user.lastActive)}</span>
                </div>
            </div>
        `;

        userEl.addEventListener('click', () => {
            location.assign(`/profile/${encodeURIComponent(user.username)}`);
        });

        followingContainer.appendChild(userEl);
    });
}

/**
 * Sets up the create post functionality
 */
function setupCreatePost() {
    const postInput = document.querySelector('.create-post input');
    const postButton = document.querySelector('.btn-post');

    if (!postInput || !postButton) return;

    postInput.addEventListener('input', function () {
        postButton.disabled = this.value.trim() === '';
    });

    postButton.addEventListener('click', async function () {
        const content = postInput.value.trim();
        if (!content) return;

        const originalButtonHTML = postButton.innerHTML;
        postButton.disabled = true;
        postButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

        try {
            const response = await fetch('/api/posts/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            const result = await response.json();
            if (result.message !== "Post created successfully") {
                throw new Error(result.error);
            }

            postInput.value = '';
            postButton.disabled = true;
            postButton.innerHTML = originalButtonHTML;
            fetchHomepageData('posts');
        } catch (error) {
            console.error('Error creating post:', error);
            postButton.disabled = false;
            postButton.innerHTML = originalButtonHTML;
            notify(error, 'error');
        }
    });

    postInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !postButton.disabled) {
            postButton.click();
        }
    });
}

/**
 * Formats timestamp into relative time (e.g., "2 hours ago")
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted relative time string
 */
function formatPostTime(timestamp) {
    const now = new Date();
    const postDate = new Date(timestamp);
    const seconds = Math.floor((now - postDate) / 1000);

    const intervals = [
        { unit: 'year', seconds: 31536000 },
        { unit: 'month', seconds: 2592000 },
        { unit: 'day', seconds: 86400 },
        { unit: 'hour', seconds: 3600 },
        { unit: 'minute', seconds: 60 }
    ];

    for (const { unit, seconds: divisor } of intervals) {
        const interval = Math.floor(seconds / divisor);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }

    return 'Just now';
}

/**
 * Formats last active time for friends list
 * @param {string|Date} lastActive - The last active timestamp
 * @returns {string} Formatted active status string
 */
function formatLastActive(lastActive) {
    if (!lastActive) return 'Active now';

    const now = new Date();
    const then = new Date(lastActive);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 5) return 'Active now';
    if (diffInSeconds < 60) return `Active ${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `Active ${minutes} minute${minutes === 1 ? '' : 's'} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Active ${hours} hour${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `Active ${days} day${days === 1 ? '' : 's'} ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `Active ${weeks} week${weeks === 1 ? '' : 's'} ago`;

    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const thenYear = then.getFullYear();
    const thenMonth = then.getMonth();

    const monthDiff = (nowYear - thenYear) * 12 + (nowMonth - thenMonth);
    if (monthDiff < 12) return `Active ${monthDiff} month${monthDiff === 1 ? '' : 's'} ago`;

    const yearDiff = nowYear - thenYear;
    return `Active ${yearDiff} year${yearDiff === 1 ? '' : 's'} ago`;
}

/**
 * Logs out user from all devices
 */
async function logoutAll() {
    try {
        await fetch('/api/auth/logout-all', {
            method: 'POST',
            credentials: 'include'
        });
        location.assign('/auth');
    } catch (err) {
        console.error('Logout failed:', err);
        notify(`Failed: ${error}`, 'error');
    }
}

/**
 * Fetches additional posts for infinite scroll
 */
async function fetchPosts() {
    if (isLoading) return;
    isLoading = true;

    const loader = document.getElementById("infinite-post-loader");
    if (loader) loader.style.display = "block";

    try {
        const response = await fetch(`/api/infinite-posts?limit=${POSTS_PER_LOAD}`);
        if (!response.ok) throw new Error('Failed to fetch posts');

        const posts = await response.json();
        const postContainer = document.getElementById('post-container');

        if (posts.length && postContainer) {
            posts.forEach(post => {
                postContainer.insertAdjacentHTML('beforeend', createPostHTML(post));
            });
            setupInfinitePostsInteractions();
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    } finally {
        isLoading = false;
        const loader = document.getElementById("infinite-post-loader");
        if (loader) loader.style.display = "none";
    }
}

/**
 * Sets up event listeners for post interactions in main feed
 */
function setupPostInteractions() {
    const postsFeed = document.querySelector('.posts-feed');
    if (postsFeed) {
        postsFeed.removeEventListener('click', handlePostInteraction);
        postsFeed.addEventListener('click', handlePostInteraction);
    }
}

/**
 * Sets up event listeners for post interactions in infinite scroll container
 */
function setupInfinitePostsInteractions() {
    const postContainer = document.getElementById('post-container');
    if (postContainer) {
        postContainer.removeEventListener('click', handlePostInteraction);
        postContainer.addEventListener('click', handlePostInteraction);
    }
}

/**
 * Handles all post interaction events (likes, comments, shares)
 * @param {Event} e - The click event
 */
async function handlePostInteraction(e) {
    const likeBtn = e.target.closest('.btn-like');
    const commentBtn = e.target.closest('.btn-comment');
    const shareBtn = e.target.closest('.btn-share');

    if (likeBtn) {
        await handleLikeAction(likeBtn);
    } else if (commentBtn) {
        handleCommentAction(commentBtn);
    } else if (shareBtn) {
        await handleShareAction(shareBtn);
    }
}

/**
 * Handles post like/unlike action
 * @param {HTMLElement} likeBtn - The like button element
 */
async function handleLikeAction(likeBtn) {
    const post = likeBtn.closest('.post');
    const postId = post.dataset.postId;
    const likeIcon = likeBtn.querySelector('i');
    const likesCountEl = post.querySelector('.likes-count');

    const isLiked = likeBtn.classList.toggle('liked');
    likeIcon.classList.toggle('far');
    likeIcon.classList.toggle('fas');

    let likesCount = parseInt(likesCountEl.textContent) || 0;
    likesCount = isLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    likesCountEl.textContent = `${likesCount} ${likesCount === 1 ? 'like' : 'likes'}`;

    try {
        const response = await fetch('/api/posts/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId })
        });

        const result = await response.json();
        if (!response.ok || result.message !== "Like status updated") {
            throw new Error(result.message);
        }
    } catch (err) {
        console.error(err);
        likeBtn.classList.toggle('liked');
        likeIcon.classList.toggle('far');
        likeIcon.classList.toggle('fas');
        likesCountEl.textContent = `${isLiked ? likesCount - 1 : likesCount + 1} ${likesCount === 1 ? 'like' : 'likes'}`;
        notify(`Failed: ${error}`, 'error');
    }
}

/**
 * Handles comment button click
 * @param {HTMLElement} commentBtn - The comment button element
 */
function handleCommentAction(commentBtn) {
    const post = commentBtn.closest('.post');
    const postId = post.dataset.postId;
    location.assign(`/post/${postId}/?a=c`);
}

/**
 * Handles post share action
 * @param {HTMLElement} shareBtn - The share button element
 */
async function handleShareAction(shareBtn) {
    const url = shareBtn.getAttribute('data-url');
    const originalHTML = shareBtn.innerHTML;

    const post = shareBtn.closest('.post');
    const postId = post.dataset.postId;

    const sharesCount = post.querySelector('.shares-count');

    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(url);
        } else {
            const textarea = document.createElement("textarea");
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }

        shareBtn.innerHTML = `<i class="fas fa-check"></i><span>Copied Link</span>`;
        setTimeout(() => shareBtn.innerHTML = originalHTML, 2000);

        const res = await fetch('/api/posts/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId })
        });

        if (res.ok) {
            const data = await res.json()
            const addS = parseInt(sharesCount.textContent) <= 1 ? 'share' : 'shares'
            if (data.message !== "You Already Shared.") {
                sharesCount.textContent = `${parseInt(sharesCount.textContent) + 1} ${addS}`
            }
        }

    } catch (err) {
        console.error('Error sharing post:', err);
        notify('Failed to copy the link.', 'error');
    }
}

window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.body.offsetHeight;
        const threshold = 200;

        if (scrollPosition >= documentHeight - threshold) {
            fetchPosts();
        }
    }, 100);
});
