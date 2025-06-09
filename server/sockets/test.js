module.exports = (io, socket) => {
    socket.on('user-connected', (username) => {
        const dateNow = new Date().toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace(',', '');

        socket.username = username;
        console.log(`[Connect] <${username}> connected at ${dateNow}`);
    });

    socket.on('disconnect', () => {
        console.log(`[Disconnect] <${socket.username ?? 'Unknown User'}> disconnected`);
    });
};
