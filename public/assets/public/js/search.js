document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const searchResults = document.getElementById('searchResults');
    const loadingIndicator = document.getElementById('loadingIndicator');

    let debounceTimer;
    const DEBOUNCE_DELAY = 500; // 500ms delay

    // Debounce function to limit API calls
    function debounce(func, delay) {
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Clear search input
    clearSearch.addEventListener('click', function () {
        searchInput.value = '';
        clearSearch.classList.remove('visible');
        showEmptyState();
    });

    // Toggle clear button visibility
    searchInput.addEventListener('input', function () {
        if (searchInput.value.trim().length > 0) {
            clearSearch.classList.add('visible');
        } else {
            clearSearch.classList.remove('visible');
            showEmptyState();
        }
    });

    // Search function with debounce
    searchInput.addEventListener('input', debounce(function (e) {
        const query = e.target.value.trim();

        if (query.length === 0) {
            showEmptyState();
            return;
        }

        performSearch(query);
    }, DEBOUNCE_DELAY));

    // Perform the actual search
    async function performSearch(query) {
        try {
            loadingIndicator.classList.add('active');
            searchResults.innerHTML = '';

            const users = await searchUsers(query);

            if (users.length === 0) {
                showNoResults();
            } else {
                displayResults(users);
            }
        } catch (error) {
            showError(error.message);
        } finally {
            loadingIndicator.classList.remove('active');
        }
    }

    // API call to search users
    async function searchUsers(query) {
        const response = await fetch(`/api/search/?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Search failed");
        }

        return data.users;
    }

    // Display search results
    function displayResults(users) {
        searchResults.innerHTML = '';

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <img src="${user.avatar}" alt="${user.fullName}" class="user-avatar">
                <div class="user-info-search">
                    <div class="user-name">${user.fullName}</div>
                    <div class="user-username">@${user.username}</div>
                </div>
            `;

            // Add click handler (you can implement navigation to user profile)
            userCard.addEventListener('click', () => {
                console.log('Navigating to user:', user.username);
                location.assign(`/profile/${user.username}`)
            });

            searchResults.appendChild(userCard);
        });
    }

    // Show empty state
    function showEmptyState() {
        searchResults.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Search for users by username or name</p>
            </div>
        `;
    }

    // Show no results state
    function showNoResults() {
        searchResults.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <p>No users found</p>
            </div>
        `;
    }

    // Show error state
    function showError(message) {
        searchResults.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
});