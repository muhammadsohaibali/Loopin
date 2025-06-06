const socket = io({
    auth: { uid: 'USER123' }  // Replace with logged-in user's ID
});

// Start chat with another user
function startChat(otherUserId) {
    socket.emit('join_private_chat', otherUserId);
}

// Send message
function sendMsg(msg) {
    socket.emit('send-msg', msg);
}

// Receive messages
socket.on('private_message', (msg) => {
    const messages = document.querySelector('#messages');
    messages.innerHTML += `<li><strong>${msg.from}:</strong> ${msg.text}</li>`;
});

// Error handling
socket.on('error', (err) => alert(`Error: ${err}`));