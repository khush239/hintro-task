# Hintro Project Documentation

## 🏗️ Architecture Explanation

The Hintro platform is built using the **MERN** stack (MongoDB, Express, React, Node.js) and features real-time collaborative capabilities.

### Backend (Node.js & Express)
- **Framework**: Express.js handles the RESTful API routes.
- **Database**: MongoDB (via Mongoose) stores users, boards, lists, tasks, and activity logs.
- **Authentication**: JWT-based authentication with password hashing using `bcryptjs`.
- **Real-time**: Socket.io enables real-time updates for board changes (presence, task moves, etc.).

### Frontend (React & Vite)
- **Framework**: React with Vite for fast development and building.
- **State Management**: React Hooks and Context API (`AuthContext`) for user session management.
- **Real-time Integration**: `socket.io-client` syncs frontend state with backend events in real-time.
- **Styling**: Tailwind CSS for modern, responsive UI.
- **Drag & Drop**: `@dnd-kit` for intuitive task and list management.

---

## 🔌 API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Authenticate user and return token.
- `GET /api/auth/me`: Get current user details (Private).

### Boards (`/api/boards`)
- `GET /api/boards`: Get all boards for the current user (Private).
- `POST /api/boards`: Create a new board (Private).
- `GET /api/boards/:id`: Fetch board details, including lists, tasks, and activity (Private).
- `PUT /api/boards/:id`: Update board title (Private, Owner only).
- `DELETE /api/boards/:id`: Delete board and its contents (Private, Owner only).

### Lists & Tasks (`/api/lists`, `/api/tasks`)
- `POST /api/lists`: Create a new column in a board.
- `PUT /api/lists/:id`: Update column title or position.
- `DELETE /api/lists/:id`: Remove a column.
- `POST /api/tasks`: Create a new task.
- `PUT /api/tasks/:id`: Update task details or move across columns.
- `DELETE /api/tasks/:id`: Remove a task.

---

## ⚖️ Assumptions and Trade-offs

### Assumptions
- **Single Server Instance**: The application is designed to run on a single server instance with local MongoDB for simplicity in development.
- **Modern Browsers**: Assumes users are on modern browsers that support WebSockets and CSS Grid/Flexbox.

### Trade-offs
- **Simplistic Auth**: Uses JWT stored in `localStorage` for ease of use. For high-security production apps, HttpOnly cookies and refresh tokens would be preferred.
- **Monolithic Structure**: Both backend and frontend follow a monolithic pattern suitable for MVPs, rather than microservices or specialized state handling (like Redux/Zustand), to maintain speed of development.
- **Local MongoDB**: Configured for `localhost` connections to minimize external dependencies during the trial/demo phase.

---

## 🔑 Demo Credentials

You can use the following credentials to explore the platform:

| Field | Value |
| :--- | :--- |
| **Email** | `demo@hintro.com` |
| **Password** | `demo1234` |

> [!NOTE]
> If these credentials haven't been created yet, you can easily register a new account on the landing page!
