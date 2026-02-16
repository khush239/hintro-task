const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/collab-platform', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

const boardUsers = new Map(); // boardId -> Set of userId

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_board', ({ boardId, user }) => {
        socket.join(boardId);

        if (!boardUsers.has(boardId)) {
            boardUsers.set(boardId, new Map());
        }
        const usersInBoard = boardUsers.get(boardId);
        usersInBoard.set(socket.id, user);

        io.to(boardId).emit('presence_update', Array.from(usersInBoard.values()));
        console.log(`User ${user?.username} joined board: ${boardId}`);

        socket.on('disconnect', () => {
            if (boardUsers.has(boardId)) {
                const users = boardUsers.get(boardId);
                users.delete(socket.id);
                if (users.size === 0) {
                    boardUsers.delete(boardId);
                } else {
                    io.to(boardId).emit('presence_update', Array.from(users.values()));
                }
            }
            console.log('User disconnected:', socket.id);
        });
    });

    socket.on('leave_board', (boardId) => {
        socket.leave(boardId);
        if (boardUsers.has(boardId)) {
            const users = boardUsers.get(boardId);
            users.delete(socket.id);
            io.to(boardId).emit('presence_update', Array.from(users.values()));
        }
        console.log(`User ${socket.id} left board: ${boardId}`);
    });
});

// Make io accessible in routes
app.set('socketio', io);

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Import Routes (to be created)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/tasks', require('./routes/tasks'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
