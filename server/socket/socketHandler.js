const User = require('../models/User');
const Message = require('../models/Message');


const activeUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(' User connected:', socket.id);

    socket.on('user-online', async (userId) => {
      try {
        activeUsers.set(userId, socket.id);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          socketId: socket.id
        });

        io.emit('user-status-change', {
          userId,
          isOnline: true
        });

        console.log(`User ${userId} is online`);
      } catch (error) {
        console.error('Error in user-online:', error);
      }
    });

    socket.on('typing-start', (data) => {
      const { receiverId, senderId } = data;
      const receiverSocketId = activeUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-typing', {
          userId: senderId,
          isTyping: true
        });
      }
    });

    socket.on('typing-stop', (data) => {
      const { receiverId, senderId } = data;
      const receiverSocketId = activeUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-typing', {
          userId: senderId,
          isTyping: false
        });
      }
    });

    socket.on('send-message', async (data) => {
      try {
        const { senderId, receiverId, content, messageType } = data;

        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          messageType: messageType || 'text'
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture');

        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive-message', populatedMessage);
        }

        socket.emit('message-sent', populatedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    socket.on('webrtc-offer', (data) => {
      const { to, offer, from, callerName } = data;
      console.log(` WebRTC offer from ${callerName} (${from}) to ${to}`);
      
      const receiverSocketId = activeUsers.get(to);
      console.log(` Receiver socket ID: ${receiverSocketId}`);

      if (receiverSocketId) {
        console.log(` Forwarding offer to ${receiverSocketId}`);
        io.to(receiverSocketId).emit('webrtc-offer', {
          from,
          offer,
          callerName
        });
      } else {
        console.log(` Receiver ${to} not online`);
      }
    });

    socket.on('webrtc-answer', (data) => {
      const { to, answer } = data;
      console.log(` WebRTC answer to ${to}`);
      
      const callerSocketId = activeUsers.get(to);

      if (callerSocketId) {
        console.log(` Forwarding answer to ${callerSocketId}`);
        io.to(callerSocketId).emit('webrtc-answer', { answer });
      } else {
        console.log(` Caller ${to} not online`);
      }
    });

    socket.on('webrtc-ice-candidate', (data) => {
      const { to, candidate } = data;
      console.log(`ICE candidate to ${to}`);
      
      const targetSocketId = activeUsers.get(to);

      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-ice-candidate', { candidate });
      }
    });

    socket.on('reject-call', (data) => {
      const { to } = data;
      console.log(` Call rejected, notifying ${to}`);
      const callerSocketId = activeUsers.get(to);

      if (callerSocketId) {
        io.to(callerSocketId).emit('call-rejected');
      }
    });

    socket.on('end-call', (data) => {
      const { to } = data;
      console.log(` Call ended, notifying ${to}`);
      const otherUserSocketId = activeUsers.get(to);

      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit('call-ended');
      }
    });

    
    socket.on('disconnect', async () => {
      console.log(' User disconnected:', socket.id);

     
      let disconnectedUserId;
      for (let [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          activeUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        try {
          await User.findByIdAndUpdate(disconnectedUserId, {
            isOnline: false,
            lastSeen: Date.now(),
            socketId: ''
          });

          
          io.emit('user-status-change', {
            userId: disconnectedUserId,
            isOnline: false
          });
        } catch (error) {
          console.error('Error updating user status:', error);
        }
      }
    });
  });
};

module.exports = socketHandler;