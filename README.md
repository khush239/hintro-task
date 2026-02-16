# Real-Time Task Collaboration Platform

A Trello-like task management application built with the MERN stack (MongoDB, Express, React, Node.js) featuring real-time updates and drag-and-drop functionality.

## Features

- **Authentication**: User signup and login with JWT.
- **Boards**: Create and manage multiple boards.
- **Lists & Tasks**: Create lists and add tasks to them.
- **Drag & Drop**: Smooth drag and drop for tasks (between lists) and lists (reordering).
- **Real-Time Updates**: Changes are reflected instantly across all connected clients using Socket.io.
- **Responsive Design**: Built with Tailwind CSS for a modern, mobile-friendly UI.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, @dnd-kit, Socket.io-client, Axios.
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io, JWT.

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (Running locally or cloud)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd Hintro

# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/collab-platform
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
```

### 3. Run the Application

You need to run both backend and frontend terminals.

**Terminal 1 (Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Client):**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## API Documentation

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Boards
- `GET /api/boards` - Get user boards
- `POST /api/boards` - Create board
- `GET /api/boards/:id` - Get board details (lists included)

### Lists
- `POST /api/lists` - Create list

### Tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task (move/edit)
- `DELETE /api/tasks/:id` - Delete task

## Architecture

- **Client-Server**: REST API for data persistence, Socket.io for ephemeral/real-time events.
- **Optimistic UI**: The frontend updates state immediately on drag-drop for smoothness, while background requests sync to DB.
- **Component Structure**: `BoardView` is the smart component managing state and sockets. `List` and `TaskCard` are presentational components with internal sortable logic.

## Trade-offs & Assumptions

- **Security**: Basic JWT auth. Production would need HTTPOnly cookies and stricter CORS.
- **Scaling**: Socket.io is running on a single instance. For scaling, would need Redis Adapter.
- **Validation**: Basic validation. Production needs `joi` or `zod`.
