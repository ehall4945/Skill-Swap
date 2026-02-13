# Skill-Swap
This project is part of our class COMP SCI 595-001: Capstone at UW-Milwaukee.

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
