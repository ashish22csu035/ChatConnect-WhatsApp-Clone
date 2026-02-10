require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
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

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  name: "chatconnect.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

socketHandler(io);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
