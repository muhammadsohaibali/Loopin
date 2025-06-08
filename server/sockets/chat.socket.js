// Modified server code
const { connectDB } = require('../config/mongo');
const onlineUsers = new Map(); // Track connected users

module.exports = (io, socket) => {
    // console.log("Chat Socket Is Disabled")
    // const { uid } = socket.handshake.auth;
    // if (!uid) return socket.disconnect(true);

    // // Track user's socket connection
    // onlineUsers.set(uid, socket.id);
    // console.log(`User ${uid} connected`);

    // // Notify user about all their unread messages when they connect
    // socket.on('request-conversations', async () => {
    //     try {
    //         const db = await connectDB();
    //         const conversations = db.collection('conversations');
    //         const userConversations = await conversations.find({
    //             participants: uid
    //         }).toArray();

    //         console.log(userConversations)

    //         socket.emit('conversations-list', userConversations);
    //     } catch (err) {
    //         console.error('Database error:', err);
    //     }
    // });

    // // Handle joining a chat room
    // socket.on('start-chat', async (chattingWith) => {
    //     if (!chattingWith || typeof chattingWith !== 'string') {
    //         return socket.emit('error', 'Invalid participant ID');
    //     }

    //     const roomId = [uid, chattingWith].sort().join('-');

    //     // Leave any existing rooms
    //     Array.from(socket.rooms)
    //         .filter(room => room !== socket.id)
    //         .forEach(room => socket.leave(room));

    //     socket.join(roomId);
    //     console.log(`User ${uid} joined room ${roomId}`);

    //     // Mark messages as read when joining
    //     try {
    //         const db = await connectDB();
    //         const messages = db.collection('conversations');
    //         await messages.updateMany(
    //             {
    //                 roomId,
    //                 to: uid,
    //                 read: { $exists: false }
    //             },
    //             { $set: { read: true } }
    //         );
    //     } catch (err) {
    //         console.error('Database error:', err);
    //     }
    // });

    // // Handle sending a message
    // socket.on('send-msg', async ({ chattingWith, message }) => {
    //     // Basic validation
    //     if (!chattingWith || !message || typeof message !== 'string' || message.trim().length === 0) {
    //         return socket.emit('error', 'Invalid message data');
    //     }

    //     if (message.length > 1000) {
    //         return socket.emit('error', 'Message too long');
    //     }

    //     const roomId = [uid, chattingWith].sort().join('-');
    //     const timestamp = new Date();

    //     // Verify user is in the room before sending
    //     if (!socket.rooms.has(roomId)) {
    //         return socket.emit('error', 'Not in this chat room');
    //     }

    //     // Broadcast message
    //     io.to(roomId).emit('receive-msg', {
    //         from: uid,
    //         message: message.trim(),
    //         timestamp,
    //     });

    //     // Save message first (even if recipient isn't in room)
    //     try {
    //         const db = await connectDB();
    //         const messages = db.collection('messages');
    //         const messageDoc = {
    //             roomId,
    //             from: uid,
    //             to: chattingWith,
    //             message: message.trim(),
    //             timestamp,
    //             delivered: false,
    //             read: false
    //         };

    //         const result = await messages.insertOne(messageDoc);
    //         messageDoc._id = result.insertedId;

    //         // Check if recipient is online
    //         if (onlineUsers.has(chattingWith)) {
    //             // If recipient is in the room - deliver immediately
    //             if (io.sockets.adapter.rooms.get(roomId)?.has(onlineUsers.get(chattingWith))) {
    //                 io.to(roomId).emit('receive-msg', messageDoc);
    //                 await messages.updateOne(
    //                     { _id: messageDoc._id },
    //                     { $set: { delivered: true } }
    //                 );
    //             } else {
    //                 // Recipient is online but not in this chat - send notification
    //                 io.to(onlineUsers.get(chattingWith)).emit('new-message', {
    //                     from: uid,
    //                     roomId,
    //                     preview: message.trim().substring(0, 50),
    //                     timestamp
    //                 });
    //             }
    //         }
    //         // If recipient is offline - message will be delivered when they reconnect
    //     } catch (err) {
    //         console.error('Database error:', err);
    //         socket.emit('error', 'Failed to send message');
    //     }
    // });

    // socket.on('disconnect', () => {
    //     onlineUsers.delete(uid);
    //     console.log(`User ${uid} disconnected`);
    // });
};