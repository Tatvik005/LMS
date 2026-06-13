# Learning Management System (LMS)

This is the central repository for our 3-person LMS project.
The project uses a modular monolith architecture for the backend and a standard Vite+React setup for the frontend.

## Tech Stack
- **Backend:** Node.js, Express, PostgreSQL, Prisma, Socket.io, JWT
- **Frontend:** React, Vite, Tailwind CSS (v4)

## Folder Structure
- `backend/` - Contains the Express API and Prisma schema.
  - `src/core/` - Shared DB connection, socket initialization.
  - `src/middlewares/` - Auth & RBAC logic.
  - `src/modules/` - Modular business logic (auth, admin, notifications, courses, quizzes).
- `frontend/` - Contains the Vite React app.
  - `src/modules/` - Corresponding frontend components for each module.

## Getting Started

1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   - Create a `.env` file in the `backend/` directory with your PostgreSQL connection string:
     `DATABASE_URL="postgresql://user:password@localhost:5432/lms"`
   - Run `npx prisma migrate dev --name init` to apply the database schema.
   - Run `npm run dev` to start the server.

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Happy coding!
