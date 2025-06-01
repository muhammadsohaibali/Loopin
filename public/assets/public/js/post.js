document.addEventListener('DOMContentLoaded', async function () {
    // DOM Elements
    const postUserAvatar = document.getElementById('postUserAvatar');
    const postUsername = document.getElementById('postUsername');
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
    const currentUserAvatar = document.querySelectorAll('.currentUserAvatar');
    const currentUserDetails = document.getElementById('user-info-div');

    const currentUser = await fetchCurrentUser();

    // Get post ID from URL
    function getPostIdFromURL(queryParamKey = null) {
        const url = new URL(window.location.href);

        if (queryParamKey) {
            return url.searchParams.get(queryParamKey); // e.g. 'a' => 'c'
        }

        const pathSegments = url.pathname.split('/').filter(Boolean);
        const postIndex = pathSegments.indexOf('post');

        if (postIndex !== -1 && pathSegments.length > postIndex + 1) {
            return pathSegments[postIndex + 1]; // normal postId
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
            // This is a placeholder - replace with your actual user fetching logic
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
            const response = await fetch('/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
        postUserAvatar.src = post.avatar || 'https://dummyimage.com/150x150/cccccc/969696';
        postUsername.textContent = post.username;
        postTime.textContent = formatRelativeTime(post.createdAt);
        postText.textContent = post.content;

        // Set visibility indicator
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
            default: // Public
                visibilityIcon = 'fas fa-globe';
                visibilityText = 'Public';
        }
        postVisibility.innerHTML = `<i class="${visibilityIcon}"></i> ${visibilityText}`;

        // Set post image
        if (post.image) {
            postImage.src = post.image;
            postImageContainer.style.display = 'flex';
        } else {
            postImageContainer.style.display = 'none';
        }

        // Set post stats
        likesCount.textContent = `${post.likes.length} likes`;
        commentsCount.textContent = `${post.comments.length} comments`;
        sharesCount.textContent = `${post.sharesCount} shares`;

        // Set like button state
        if (post.isLiked) {
            likeButton.classList.add('active');
            likeButton.querySelector('i').classList.replace('far', 'fas');
        } else {
            likeButton.classList.remove('active');
            likeButton.querySelector('i').classList.replace('fas', 'far');
        }

        // Populate comments
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
                    <img src="${comment.avatar || 'https://dummyimage.com/150x150/cccccc/969696'}" alt="Profile Picture">
                </div>
                <div class="comment-content">
                    <div class="comment-user">${comment.username}</div>
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
            console.log('Invalid post URL');
            location.assign('/');
            return;
        }

        // const currentUser = await fetchCurrentUser();
        console.log(currentUser)
        if (currentUser && currentUser.avatarUrl && currentUser.username && currentUser.email) {

            currentUserAvatar.forEach(avatar => avatar.src = currentUser.avatarUrl)

            currentUserDetails.children[0].textContent = currentUser.username
            currentUserDetails.children[1].textContent = currentUser.email
        } else {
            currentUserAvatar.src = 'https://dummyimage.com/150x150/cccccc/969696';
        }

        const postData = await fetchPostData(postId);
        if (!postData) {
            console.log('Failed to load post');
            location.assign('/');
            return;
        }

        populatePostData(postData);

        // Set up event listeners
        likeButton.addEventListener('click', async () => {
            if (!currentUser) {
                console.log('Please log in to like posts');
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

        // Share button
        shareButton.addEventListener('click', () => {
            // In a real app, you would use the Web Share API or implement a custom share dialog
            const postUrl = window.location.href;
            navigator.clipboard.writeText(postUrl).then(() => {
                console.log('Post link copied to clipboard!');

                // Increment share count in UI (in a real app, this would come from the API)
                const currentShares = parseInt(sharesCount.textContent);
                sharesCount.textContent = `${currentShares + 1} shares`;
            }).catch(err => {
                console.error('Failed to copy link:', err);
                console.log('Failed to copy link. Please try again.');
            });
        });

        // Post comment
        async function handlePostComment() {
            const content = commentInput.value.trim();
            if (!content) return;

            if (!currentUser) {
                console.log('Please log in to comment');
                return;
            }

            const result = await postNewComment(postId, content);
            if (result) {
                // Add new comment to the UI
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <div class="comment-avatar">
                        <img src="${currentUser.avatarUrl || 'https://dummyimage.com/150x150/cccccc/969696'}" alt="Profile Picture">
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

                // Update comments count
                const currentComments = parseInt(commentsCount.textContent);
                commentsCount.textContent = `${currentComments + 1} comments`;

                // Scroll to the new comment
                commentElement.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Post comment on button click or Enter key
        postCommentButton.addEventListener('click', handlePostComment);
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handlePostComment();
            }
        });

        // Delete comment (event delegation)
        commentsList.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-comment')) {
                if (!currentUser) {
                    console.log('Please log in to delete comments');
                    return;
                }

                const commentContent = e.target.closest('.delete-comment').dataset.content;
                if (confirm('Are you sure you want to delete this comment?')) {
                    const result = await deleteComment(postId, commentContent);
                    if (result) {
                        // Remove comment from UI
                        const commentElement = e.target.closest('.comment');
                        commentElement.remove();

                        // Update comments count
                        const currentComments = parseInt(commentsCount.textContent);
                        commentsCount.textContent = `${currentComments - 1} comments`;
                    }
                }
            }
        });

        showLoader(false);
    }

    // Initialize the page
    initPage();
});