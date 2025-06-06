// document.addEventListener('DOMContentLoaded', async function () {
//     const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/lego/1.jpg';

//     const currentUser = await fetchCurrentUser()
//     const username = getUsernameFromURL()
//     const user = await fetchUser(username);
//     const userPosts = await fetchUserPosts(username)
//     const userFollowing = await fetchUserFollowing(username)
//     const isCurrentUser = await validateIfCurrentUser()

//     if (!user.success && user.message === 'User Not Found') {
//         this.location.assign(`/404?q=user&path=${username}`)
//         return;
//     } else if (user.isPrivate) {
//         console.log("user is private")
//         await loadUserDetails(user, true)
//         populateFollowing(userFollowing, true)
//         console.log('ho')
//         handleNonCurrentUser(user, true)
//     } else if (!user.success && user.message === "User Is Blocked") {
//         console.log("user is blocked")
//     } else {
//         await loadUserDetails(user)
//         await loadUserPosts(userPosts)
//         populateFollowing(userFollowing)
//         handleNonCurrentUser(user)
//     }

document.addEventListener('DOMContentLoaded', async function () {
    const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/lego/1.jpg';

    const currentUser = await fetchCurrentUser();
    const username = getUsernameFromURL();
    const user = await fetchUser(username);
    const isCurrentUser = await validateIfCurrentUser();

    // Redirect to 404 if user not found
    if (!user.success && user.message === 'User Not Found') {
        window.location.assign(`/404?q=user&path=${username}`);
        return;
    }

    // If the user is private
    else if (user.isPrivate) {
        console.log("User is private");
        await loadUserDetails(user, true);
        populateFollowing('', true);
        handleNonCurrentUser(user, true);
    }

    // If the user is blocked
    else if (!user.success && user.message === "User Is Blocked") {
        console.log("User is blocked");
    }

    // If the user is public
    else {
        const userPosts = await fetchUserPosts(username);
        const userFollowing = await fetchUserFollowing(username);


        await loadUserDetails(user);
        await loadUserPosts(userPosts);
        populateFollowing(userFollowing);
        handleNonCurrentUser(user);
    }

    showLoader(false)

    function getElements() {
        return {
            userHeader: {
                container: document.querySelector('.user-profile'),
                avatar: document.querySelector('.currentUserAvatar'),
                fullName: document.querySelector('.username'),
                username: document.querySelector('.user-handle'),
            },

            profileDetails: {
                container: document.querySelector('.profile-info-section'),
                avatar: document.getElementById('profile-avatar-container'),
                name: document.querySelector('.profile-name'),
                username: document.querySelector('.profile-email'),
                bio: document.querySelector('.profile-bio'),
                stats: {
                    posts: document.querySelector('.stat-item:nth-child(1) .stat-number'),
                    followers: document.querySelector('.stat-item:nth-child(2) .stat-number'),
                    following: document.querySelector('.stat-item:nth-child(3) .stat-number'),
                },
            },

            profileActions: {
                editButton: document.querySelector('.btn-edit-profile'),
                shareButton: document.querySelector('.btn-share-profile'),
            },

            postElements: {
                header: {
                    avatar: document.querySelector('#postUserAvatar'),
                    status: document.querySelector('#postUserStatus'),
                    fullName: document.querySelector('#postUsername'),
                    time: document.querySelector('#postTime'),
                    visibility: document.querySelector('#postVisibility'),
                    deleteButton: document.querySelector('#postDltButton'),
                },
                content: {
                    text: document.querySelector('#postText'),
                    image: document.querySelector('#postImage'),
                    imageContainer: document.querySelector('#postImageContainer'),
                },
                stats: {
                    likes: document.querySelector('#likesCount'),
                    comments: document.querySelector('#commentsCount'),
                    shares: document.querySelector('#sharesCount'),
                },
                actions: {
                    like: document.querySelector('#likeButton'),
                    comment: document.querySelector('#commentButton'),
                    share: document.querySelector('#shareButton'),
                },
            },

            commentsSection: {
                list: document.querySelector('#commentsList'),
                input: document.querySelector('#commentInput'),
                postButton: document.querySelector('#postCommentButton'),
            },

            nonCurrentUsersDiv: {
                settingsBtn: document.querySelector('.btn-edit'),
                editProfileBtn: document.querySelector('.btn-edit-profile'),
                shareProfileBtn: document.querySelector('.btn-share-profile'),
                emptyPostsDiv: document.querySelector('.empty-posts')
            }
        };
    }

    function getUsernameFromURL(queryParamKey = null) {
        const url = new URL(window.location.href);

        if (queryParamKey) {
            return url.searchParams.get(queryParamKey);
        }

        const pathSegments = url.pathname.split('/').filter(Boolean);
        const postIndex = pathSegments.indexOf('profile');

        if (postIndex !== -1 && pathSegments.length > postIndex + 1) {
            return pathSegments[postIndex + 1];
        }

        return null;
    }

    async function validateIfCurrentUser() {
        if ((currentUser.username === user.username) && currentUser.fullName === user.fullName) {
            return true;
        }
        return false
    }

    // async function handleNonCurrentUser(user, isPrivate = false) {
    //     const el = getElements()
    //     const divEl = el.nonCurrentUsersDiv
    //     const [settingsBtn, editBtn, emptyPostsDiv, shareProfileBtn]
    //         = [divEl.settingsBtn, divEl.editProfileBtn, divEl.emptyPostsDiv, divEl.shareProfileBtn]
    //     if (!user.posts.length) {
    //         emptyPostsDiv.innerHTML = `
    //             <div class="empty-content">
    //                 <i class="fas fa-camera"></i>
    //                 <h3>No Posts Yet</h3>
    //                 <p>When ${user.fullName.split(' ')[0]} will add posts, they will appear here.</p>
    //             </div>`
    //     } else emptyPostsDiv.remove()

    //     if (isCurrentUser) return;
    //     if (isPrivate) {
    //         emptyPostsDiv.innerHTML = `
    //             <div class="empty-content">
    //                 <i class="fas fa-ban"></i>
    //                 <h3>No Posts Yet</h3>
    //                 <p>When ${user.fullName.split(' ')[0]} will add posts, they will appear here.</p>
    //             </div>`
    //     }

    //     settingsBtn.innerHTML = shareProfileBtn.innerHTML
    //     editBtn.remove()
    //     shareProfileBtn.remove()

    // }

    function handleNonCurrentUser(user, isPrivate = false) {
        const el = getElements();
        const divEl = el.nonCurrentUsersDiv;
        const [settingsBtn, editBtn, emptyPostsDiv, shareProfileBtn] = [
            divEl.settingsBtn,
            divEl.editProfileBtn,
            divEl.emptyPostsDiv,
            divEl.shareProfileBtn
        ];

        // Hide edit & share buttons
        settingsBtn.innerHTML = shareProfileBtn.innerHTML;
        editBtn.remove();
        shareProfileBtn.remove();

        if (isCurrentUser) {
            if (!user.posts.length) {
                emptyPostsDiv.innerHTML = `
                    <div class="empty-content">
                        <i class="fas fa-camera"></i>
                        <h3>Add Posts</h3>
                        <p>When you add posts, they will appear on your profile.</p>
                        <button class="btn-primary">
                            <i class="fas fa-plus"></i>
                            <span>Share your first posts</span>
                        </button>
                    </div>`;
            } else {
                emptyPostsDiv.remove();
            }
            return;
        }

        // Show private message
        if (isPrivate) {
            const postsFeed = document.querySelector('.post-detail-container');
            postsFeed.remove();
            emptyPostsDiv.innerHTML = `
            <div class="empty-content">
                <i class="fas fa-lock"></i>
                <h3>This account is private</h3>
                <p>Follow To See ${user.fullName}'s Posts</p>
            </div>`;
            return;
        }

        if (!user.posts.length) {
            const postsFeed = document.querySelector('.post-detail-container');
            postsFeed.remove();
            emptyPostsDiv.innerHTML = `
            <div class="empty-content">
                <i class="fas fa-camera"></i>
                <h3>No Posts Yet</h3>
                <p>When ${user.fullName.split(' ')[0]} adds posts, they'll show up here.</p>
            </div>`;
        } else {
            emptyPostsDiv.remove();
        }
    }

    async function fetchUser(username) {
        try {
            const response = await fetch(`/api/auth/get-user/?username=${username}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    }

    async function fetchUserFollowing(username) {
        try {
            const response = await fetch(`/api/auth/get-user-following?username=${username}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching user following:', error);
            return null;
        }
    }

    async function fetchCurrentUser() {
        try {
            const response = await fetch('/api/auth/current-user');
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    }

    async function fetchUserPosts(username) {
        try {
            const response = await fetch(`/api/auth/get-user-posts/?username=${username}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    }

    function loadUserDetails(user, isPrivate) {
        const el = getElements()
        const userHeader = el.userHeader;
        const profileDetails = el.profileDetails;

        document.title = `${user.fullName} - Loopin`;

        userHeader.avatar.src = currentUser.avatarUrl || DEFAULT_AVATAR;
        userHeader.fullName.textContent = currentUser.fullName;
        userHeader.username.textContent = currentUser.username;
        userHeader.container.onclick = () => location.assign(`/profile/${currentUser.username}`)

        profileDetails.bio.textContent = user.bio;
        profileDetails.name.textContent = user.fullName;
        profileDetails.username.textContent = user.username;
        profileDetails.avatar.src = user.avatarUrl || DEFAULT_AVATAR;

        if (!isPrivate) {
            profileDetails.stats.posts.textContent = user.posts.length;
            profileDetails.stats.followers.textContent = user.followers.length;
            profileDetails.stats.following.textContent = user.following.length;
            return;
        }

        profileDetails.stats.posts.textContent = user.posts;
        profileDetails.stats.followers.textContent = user.followers;
        profileDetails.stats.following.textContent = user.following;
    }

    function populatePosts(posts) {
        const postsFeed = document.querySelector('.post-detail-container');
        if (!postsFeed) return;

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
    function populateFollowing(following, isPrivate) {
        const followingContainer = document.querySelector('.online-friends');
        if (!followingContainer) return;

        if (isPrivate)
            followingContainer.parentElement.remove()

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
                        <img src="${user.avatarUrl || DEFAULT_AVATAR}" 
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
    * Sets up event listeners for post interactions in main feed
    */
    function setupPostInteractions() {
        const postsFeed = document.querySelector('.post-detail-container');
        if (postsFeed) {
            postsFeed.removeEventListener('click', handlePostInteraction);
            postsFeed.addEventListener('click', handlePostInteraction);
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
     * Formats large numbers into shortened strings (e.g., 1500 -> 1.5K)
     * @param {number} n - The number to format
     * @returns {string} Formatted number string
     */
    function formatCount(n) {
        if (n === 0) return n.toString();
        const units = ['', 'K', 'M', 'B', 'T', 'Q'];
        let i = 0;
        while (n >= 1e3 && i < units.length - 1) {
            n /= 1e3;
            i++;
        }
        return (+n.toFixed(1)).toString().replace(/\.0$/, '') + units[i];
    };

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
                            <img src="${post.avatar || DEFAULT_AVATAR}" 
                                 alt="${post.fullName}'s profile picture">
                            ${post.authorIsOnline ? '<span class="online-status"></span>' : ''}
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
                    <span class="likes-count">${formatCount(post.likes.length)} ${post.likes.length === 1 ? 'like' : 'likes'}</span>
                    <span onclick="location.assign('${location.href}post/${post.postId}')" class="comments-count">${formatCount(post.comments.length)} ${post.comments.length === 1 ? 'comment' : 'comments'}</span>
                    <span class="shares-count">${formatCount(post.shares.length)} ${post.shares.length === 1 ? 'share' : 'shares'}</span>
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

    function loadUserPosts(posts) {
        populatePosts(posts)

        console.log(posts)
    }
})