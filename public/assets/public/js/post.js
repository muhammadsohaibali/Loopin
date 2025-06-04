document.addEventListener('DOMContentLoaded', async function () {
    // DOM Elements
    const postUserDiv = document.querySelector('.user-info');
    const postUserAvatar = document.getElementById('postUserAvatar');
    const postfullName = document.getElementById('postUsername');
    const postTime = document.getElementById('postTime');
    const postVisibility = document.getElementById('postVisibility');
    const postText = document.getElementById('postText');
    const postImage = document.getElementById('postImage');
    const postImageContainer = document.getElementById('postImageContainer');
    const likesCount = document.getElementById('likesCount');
    const commentsCount = document.getElementById('commentsCount');
    const sharesCount = document.getElementById('sharesCount');
    const likeButton = document.getElementById('likeButton');
    const commentButton = document.getElementById('commentButton');
    const shareButton = document.getElementById('shareButton');
    const commentsList = document.getElementById('commentsList');
    const commentInput = document.getElementById('commentInput');
    const postCommentButton = document.getElementById('postCommentButton');
    const currentUserDiv = document.querySelectorAll('.user-profile');
    const currentUserAvatar = document.querySelectorAll('.currentUserAvatar');
    const currentUserDetails = document.getElementById('user-info-div');
    const deletePostBtn = document.getElementById('postDltButton')

    const currentUser = await fetchCurrentUser();

    const DEFAULT_AVATAR = 'https://dummyimage.com/150x150/cccccc/969696';

    // Get post ID from URL
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

    // Format date to relative time (e.g., "2 hours ago")
    function formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString();
    }

    // Fetch post data from API
    async function fetchPostData(postId) {
        try {
            const response = await fetch(`/api/posts/post/?postId=${postId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch post');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching post:', error);
            return null;
        }
    }

    // Fetch current user data (simplified - in a real app, you'd get this from your auth system)
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

    // Update like status via API
    async function updateLikeStatus(postId, isCurrentlyLiked) {
        try {
            const response = await fetch('/api/posts/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            });

            if (!response.ok) {
                throw new Error('Failed to update like status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating like status:', error);
            return null;
        }
    }

    // Delete Post
    async function deletePost(postId) {
        try {
            const response = await fetch('/api/posts/post', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            });

            if (!response.ok) {
                throw new Error('Failed to delete post');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting post:', error);
            return null;
        }
    }

    // Post a new comment via API
    async function postNewComment(postId, content) {
        try {
            const response = await fetch('/api/posts/comment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId, content })
            });

            if (!response.ok) {
                throw new Error('Failed to post comment');
            }

            return await response.json();
        } catch (error) {
            console.error('Error posting comment:', error);
            return null;
        }
    }

    // Delete a comment via API
    async function deleteComment(postId, commentContent) {
        try {
            const response = await fetch('/api/posts/comment', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId, commentContent })
            });

            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting comment:', error);
            return null;
        }
    }

    // Populate post data in the UI
    function populatePostData(post) {
        postUserAvatar.src = post.avatar || DEFAULT_AVATAR;
        postUserDiv.onclick = () => location.assign(`/profile/${post.author}`)
        postfullName.textContent = post.fullName;
        postTime.textContent = formatRelativeTime(post.createdAt);
        postText.textContent = post.content;

        let visibilityIcon, visibilityText;
        switch (post.visibility) {
            case 'private':
                visibilityIcon = 'fas fa-lock';
                visibilityText = 'Only you can see this';
                break;
            case 'Friends':
                visibilityIcon = 'fas fa-user-friends';
                visibilityText = 'Visible to friends';
                break;
            default:
                visibilityIcon = 'fas fa-globe';
                visibilityText = 'Public';
        }
        postVisibility.innerHTML = `<i class="${visibilityIcon}"></i> ${visibilityText}`;

        if (post.image) {
            postImage.src = post.image;
            postImageContainer.style.display = 'flex';
        } else {
            postImageContainer.style.display = 'none';
        }

        deletePostBtn.style.display = currentUser.email === post.author ? 'flex' : 'none'

        likesCount.textContent = `${post.likes.length} likes`;
        commentsCount.textContent = `${post.comments.length} comments`;
        sharesCount.textContent = `${post.shares.length} ${post.shares.length <= 1 ? 'share' : 'shares'}`;

        if (post.isLiked) {
            likeButton.classList.add('active');
            likeButton.querySelector('i').classList.replace('far', 'fas');
        } else {
            likeButton.classList.remove('active');
            likeButton.querySelector('i').classList.replace('fas', 'far');
        }

        commentsList.innerHTML = '';
        const sortedComments = post.comments.slice().sort((a, b) => {
            const isAUser = a.username === currentUser.username;
            const isBUser = b.username === currentUser.username;

            if (isAUser && !isBUser) return -1;
            if (!isAUser && isBUser) return 1;

            if (isAUser && isBUser) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }

            return 0;
        });


        sortedComments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <div class="comment-avatar">
                    <img src="${comment.avatar || DEFAULT_AVATAR}" alt="Profile Picture">
                </div>
                <div class="comment-content">
                    <div class="comment-user">${comment.fullName}</div>
                    <p class="comment-text">${comment.content}</p>
                    <div class="comment-time">${formatRelativeTime(comment.createdAt)}</div>
                    ${comment.username === currentUser.username ? `
                        <div class="comment-actions">
                            <button class="comment-action delete-comment" data-content="${comment.content}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            commentsList.appendChild(commentElement);
        });
    }

    // Initialize the page
    async function initPage() {
        const postId = getPostIdFromURL();
        const doComment = getPostIdFromURL('a') === 'c';

        if (doComment)
            commentInput.focus();

        if (!postId) {
            location.assign('/');
            return;
        }

        if (currentUser && currentUser.avatarUrl && currentUser.username && currentUser.fullName) {
            currentUserAvatar.forEach(avatar => avatar.src = currentUser.avatarUrl)

            currentUserDiv[0].onclick = () => location.assign(`/profile/${currentUser.username}`)

            currentUserDetails.children[0].textContent = currentUser.fullName
            currentUserDetails.children[1].textContent = currentUser.username
        } else {
            currentUserAvatar.src = DEFAULT_AVATAR;
        }

        const postData = await fetchPostData(postId);
        if (!postData) {
            location.assign('/');
            return;
        }

        populatePostData(postData);

        deletePostBtn.addEventListener('click', async () => {
            if (!currentUser) {
                notify("Please login to delete posts", "error");
                return;
            }

            const confirmed = await showConfirmationBox(
                'Are you sure you want to delete this post? This action cannot be undone.',
                {
                    confirmText: 'Delete',
                    cancelText: 'Cancel',
                    confirmColor: '#ef233c',
                    cancelColor: '#4361ee'
                }
            );

            if (!confirmed) return;

            try {
                const data = await deletePost(postId);

                if (!data) {
                    throw new Error("No response from server");
                }

                if (data.error) {
                    notify(data.error, "error");
                } else {
                    notify(data.message || "Post deleted successfully", "success");
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            } catch (error) {
                console.error("Delete post error:", error);
                notify("Failed to delete post. Please try again.", "error");
            }
        });

        commentButton.addEventListener('click', () => {
            commentInput.focus()
        })

        likeButton.addEventListener('click', async () => {
            if (!currentUser) {
                return;
            }

            const isCurrentlyLiked = likeButton.classList.contains('active');
            const result = await updateLikeStatus(postId, isCurrentlyLiked);

            if (result) {
                likeButton.classList.toggle('active');
                const icon = likeButton.querySelector('i');
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
                likesCount.textContent = `${result.likeCount} likes`;
            }
        });

        shareButton.addEventListener('click', async () => {
            const originalHTML = shareButton.innerHTML;
            const url = location.href;

            try {
                // Copy link to clipboard
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

                shareButton.innerHTML = `<i class="fas fa-check"></i><span>Copied Link</span>`;
                setTimeout(() => shareButton.innerHTML = originalHTML, 2000);

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
        });

        async function handlePostComment() {
            const content = commentInput.value.trim();
            if (!content) return;

            if (!currentUser) {
                return;
            }

            const result = await postNewComment(postId, content);
            if (result) {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <div class="comment-avatar">
                        <img src="${currentUser.avatarUrl || DEFAULT_AVATAR}" alt="Profile Picture">
                    </div>
                    <div class="comment-content">
                        <div class="comment-user">You</div>
                        <p class="comment-text">${content}</p>
                        <div class="comment-time">Just now</div>
                        <div class="comment-actions">
                            <button class="comment-action delete-comment" data-content="${content}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                commentsList.prepend(commentElement);
                commentInput.value = '';

                const currentComments = parseInt(commentsCount.textContent);
                commentsCount.textContent = `${currentComments + 1} comments`;

                commentElement.scrollIntoView({ behavior: 'smooth' });
            }
        }

        postCommentButton.addEventListener('click', handlePostComment);
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handlePostComment();
            }
        });

        commentsList.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-comment')) {
                if (!currentUser) {
                    return;
                }

                const commentContent = e.target.closest('.delete-comment').dataset.content;

                const confirmed = await showConfirmationBox(
                    'Are you sure you want to delete this Comment?',
                    {
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        confirmColor: '#ef233c',
                        cancelColor: '#4361ee'
                    }
                );

                if (!confirmed) {
                    return
                }

                const result = await deleteComment(postId, commentContent);
                if (result) {
                    const commentElement = e.target.closest('.comment');
                    commentElement.remove();

                    const currentComments = parseInt(commentsCount.textContent);
                    commentsCount.textContent = `${currentComments - 1} comments`;
                }
            }
        });

        showLoader(false);
    }

    // Initialize the page
    initPage();
});