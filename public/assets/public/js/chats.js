document.addEventListener('DOMContentLoaded', function () {
    // Select conversation
    const conversations = document.querySelectorAll('.conversation');
    conversations.forEach(conversation => {
        conversation.addEventListener('click', function () {
            // Remove active class from all conversations
            conversations.forEach(c => c.classList.remove('active'));

            // Add active class to clicked conversation
            this.classList.add('active');

            // In a real app, you would load the conversation from the server
            // For demo purposes, we'll just show the active chat on mobile
            if (window.innerWidth <= 768) {
                document.querySelector('.active-chat').classList.add('visible');
            }
        });
    });

    // Send message functionality
    const chatInput = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.btn-send');

    if (chatInput && sendButton) {
        function sendMessage() {
            const messageText = chatInput.value.trim();
            if (messageText) {
                // Create new message element
                const messagesContainer = document.querySelector('.chat-messages');
                const newMessage = document.createElement('div');
                newMessage.className = 'message sent';
                newMessage.innerHTML = `
                    <div class="message-content">
                        <p>${messageText}</p>
                        <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                `;

                // Add to messages container
                messagesContainer.appendChild(newMessage);

                // Clear input
                chatInput.value = '';

                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                // In a real app, you would send the message to the server
                console.log('Message sent:', messageText);

                // Simulate reply after 1 second
                setTimeout(() => {
                    const replyMessage = document.createElement('div');
                    replyMessage.className = 'message received';
                    replyMessage.innerHTML = `
                        <div class="avatar">
                            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Profile Picture">
                        </div>
                        <div class="message-content">
                            <p>Thanks for your message! I'll get back to you soon.</p>
                            <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    `;
                    messagesContainer.appendChild(replyMessage);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }, 1000);
            }
        }

        // Send on button click
        sendButton.addEventListener('click', sendMessage);

        // Send on Enter key
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Back button for mobile
    const backButton = document.createElement('button');
    backButton.className = 'back-to-conversations';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to conversations';
    backButton.style.display = 'none';
    document.querySelector('.active-chat .chat-header').prepend(backButton);

    backButton.addEventListener('click', function () {
        document.querySelector('.active-chat').classList.remove('visible');
    });

    // Show/hide back button based on screen size
    function handleResize() {
        if (window.innerWidth <= 768) {
            backButton.style.display = 'flex';
        } else {
            backButton.style.display = 'none';
            document.querySelector('.active-chat').classList.remove('visible');
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    // Scroll to bottom of messages initially
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // New chat button functionality
    const newChatButton = document.querySelector('.btn-new-chat');
    if (newChatButton) {
        newChatButton.addEventListener('click', function () {
            alert('New chat functionality would open a friend list to select from');
        });
    }
});