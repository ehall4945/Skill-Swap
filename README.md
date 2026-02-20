# Skill-Swap
This project is part of our class COMP SCI 595-001: Capstone at UW-Milwaukee.

First-Time Setup
If you are setting up the project for the first time, you must initialize the database:
1. Build & Start: `docker compose up -d --build`
2. Run Migrations:
    `docker compose exec backend python manage.py makemigrations core`
    `docker compose exec backend python manage.py migrate`
3. Create Admin User: `docker compose exec backend python manage.py createsuperuser`

Current Project Status

Skill-Swap/
├── backend/            # Django source code
│   ├── core/           # Main settings and URLs
│   └── manage.py
├── frontend/           # React source code
│   ├── src/            # Components and Logic
│   └── public/         # Static assets
└── docker-compose.yml  # Docker configuration

The core infrastructure is now Live.
Backend: Django + PostgreSQL
Frontend: React
Architecture: Containerized via Docker Compose

Container Use Cases
1. skill-swap-frontend-1: Runs the React development server.
2. skill-swap-backend-1: Runs the Django REST API.
3. skillswap_db: The PostgreSQL database.

How to activate the containers to run them all?
docker compose up -d

How to test if the containers are running 
1. Backend: Visit http://localhost:8000. You should see: {"status": "Skill-Swap Backend is Online"}.
2. Django API Bridge: Visit http://localhost:8000/api/test/. This returns the JSON message for the frontend to consume.
3. Frontend: Visit http://localhost:3000 to see the React interface.
   
    *AMEND: REACT PAGES SEEM TO NOW BE HELD AT http://localhost:5173/*

Development Shells
1. Backend (Django/DB): docker exec -it skill-swap-backend-1 /bin/bash
2. Frontend (React/NPM): docker exec -it skill-swap-frontend-1 /bin/bash

Access Points
1. Frontend: http://localhost:5173/ (Main User Interface)
2. Backend API http://localhost:8000/api/test/ (API Health Check)
3. Admin Panel http://localhost:8000/admin/ (Django Database Management)

API Documentation (Endpoints)
    Endpoint                Method  Description
1. /api/auth/register/      POST    Creates a new user account
2. /api/auth/login/         POST    Returns Access & Refresh JWT tokens
3. /api/auth/refresh/       POST    Rotates the Access token using a Refresh token
4. /api/auth/me/            GET     Returns profile data for the logged-in user

Authentication & Security
1. Custom User Model: Modified Django's default user to use Email as the unique identifier for a more modern login experience.
2. JWT Authorization: Implemented SimpleJWT for secure, stateless authentication.
3. Protected Routes: React frontend uses a ProtectedRoute component to prevent unauthorized access to the Dashboard.
4. Persistence: Auth tokens are securely managed in localStorage with automated refresh logic in the Axios interceptor.

UI/UX
1. Scoped Styling: Utilized CSS Modules to ensure styles are isolated to specific components (Login, Register, Home).
2. Responsive Forms: Authentication forms include loading states, error handling, and field validation.

The URL Map
   Page            URL
1. Dashboard       http://localhost:5173/
2. Login Page      http://localhost:5173/login
3. Register Page   http://localhost:5173/register