module.exports = (io, socket) => {
    socket.on('test', async (...args) => {
        console.log(`Device Resolution ${args[1]} ${args[0]}`)
    })
};