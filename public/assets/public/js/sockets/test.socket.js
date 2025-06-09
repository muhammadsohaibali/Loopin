const socket = io();
let savedUsername = null;

function userConnectedSocket(username) {
    savedUsername = username;
    if (socket.connected) {
        socket.emit('user-connected', username);
    }
}

socket.on('connect', () => {
    if (savedUsername) {
        socket.emit('user-connected', savedUsername);
    }
});
