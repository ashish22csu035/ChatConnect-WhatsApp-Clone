require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const socketHandler = require('./socket/socketHandler');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

connectDB();

const app = express();
app.set("trust proxy", 1);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});

// ✅ CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// ✅ Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Initialize Passport (NO SESSION NEEDED)
app.use(passport.initialize());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// ✅ Socket Handler
socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});