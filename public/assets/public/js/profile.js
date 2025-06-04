document.addEventListener('DOMContentLoaded', async function () {
    const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/lego/1.jpg';

    const username = getUsernameFromURL()
    const user = await fetchUser(username);
    const userPosts = await fetchUserPosts(username)
    // const isCurrentUser = fetchIsCurrentUser()

    if (!user.success && user.message === 'User Not Found') {
        this.location.assign(`/404?q=user&path=${username}`)
        return;
    } else if (!user.success && user.message === "User Account Is Private") {
        console.log("user is private")
    } else if (!user.success && user.message === "User Is Blocked") {
        console.log("user is blocked")
    } else {
        await loadUserDetails(user)
        await loadUserPosts(userPosts)

        showLoader(false)
    }

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

            onlyCurrentUser: {
                settingsBtn: document.querySelector()
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

    const fetchIsCurrentUser = () => {
        const currentUser = fetchCurrentUser()
        if ((currentUser.username === user.username) && currentUser.fullName === user.fullName) {
            return true;
        }
        return false
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

    function loadUserDetails(user) {
        const el = getElements()
        const userHeader = el.userHeader;
        const profileDetails = el.profileDetails;

        // Document Title
        document.title = `${user.fullName} - Loopin`;

        // User Headers
        userHeader.avatar.src = user.avatarUrl || DEFAULT_AVATAR;
        userHeader.fullName.textContent = user.fullName;
        userHeader.username.textContent = user.username;

        // Profile Details
        profileDetails.bio.textContent = user.bio;
        profileDetails.name.textContent = user.fullName;
        profileDetails.username.textContent = user.username;
        profileDetails.avatar.src = user.avatarUrl || DEFAULT_AVATAR;

        // profileDetails.stats.posts.textContent = user.posts.length;
        profileDetails.stats.followers.textContent = user.followers.length;
        profileDetails.stats.following.textContent = user.following.length;
    }

    function loadUserPosts(posts) {
        const el = getElements()
        const profileDetails = el.profileDetails;
        profileDetails.stats.posts.textContent = posts.length;

        console.log(posts)
    }
})
