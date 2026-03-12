# User-to-User Chat Feature

Real-time 1-to-1 chat built with **Django Channels** (WebSockets) + **React**.

## Features
- ✅ Real-time messaging via WebSockets
- ✅ Chat history persistence (PostgreSQL)
- ✅ Multiple conversations / inbox
- ✅ Message read receipts (✓ / ✓✓)
- ✅ JWT authentication (reuses your existing SimpleJWT setup)
- ✅ Auto-reconnect on connection drop
- ✅ Responsive dark-mode UI

---

## Backend Setup

### 1. Install dependencies
```bash
pip install channels channels-redis daphne
```

### 2. Register the `chat` app and `channels`
In `core/settings.py`, add to `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    ...
    'channels',
    'chat',          # ← add these two
]
```

### 3. Paste the Channel Layer config into `settings.py`
Copy the contents of `settings_additions.py` (the `ASGI_APPLICATION` and
`CHANNEL_LAYERS` blocks) into your real `settings.py`.

### 4. Wire up URLs
In `core/urls.py`:
```python
from django.urls import path, include

urlpatterns = [
    ...
    path('api/chat/', include('chat.urls')),
]
```

### 5. Update `core/asgi.py`
Replace the default Django ASGI file with the one provided in
`backend/asgi.py` (or merge the `ProtocolTypeRouter` setup into yours).

### 6. Run migrations
```bash
python manage.py makemigrations chat
python manage.py migrate
```

### 7. Add Redis to docker-compose.yml
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  web:          # your existing Django service
    depends_on:
      - db
      - redis   # ← add this
    ...
```

### 8. Run with Daphne (ASGI server)
```bash
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```
Or in `docker-compose.yml` change the command from `gunicorn` / `runserver` to:
```
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

---

## Frontend Setup

### File placement
Copy the `frontend/src/` files into your React project's `src/` directory,
preserving the sub-folder structure:

```
src/
  api/
    client.js
  context/
    AuthContext.jsx
  hooks/
    useChat.js
  components/
    ChatApp.jsx
    ChatApp.css
    LoginPage.jsx
    LoginPage.css
  App.jsx
```

### Environment variables (Vite)
Create a `.env` file in your React project root:
```
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```
*(Adjust if your backend runs on a different host/port.)*

### Install no extra dependencies
The frontend uses only standard React hooks and the browser's native
`WebSocket` and `fetch` APIs — no extra packages required.

### Update your entry point
In `src/main.jsx` (or `index.js`):
```jsx
import React    from 'react';
import ReactDOM from 'react-dom/client';
import App      from './App';
import './index.css'; // your global resets if any

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

---

## Architecture Overview

```
Browser (React)
   │  REST (fetch)          HTTP → Django REST Framework
   │  WebSocket             WS   → Django Channels → Redis Channel Layer
   ▼
Django (ASGI / Daphne)
   ├── /api/chat/users/              – list users to message
   ├── /api/chat/conversations/      – inbox list
   ├── /api/chat/conversations/start/ – get-or-create 1:1 conversation
   ├── /api/chat/conversations/:id/messages/ – history + mark-read
   └── ws/chat/:id/?token=<jwt>      – WebSocket room
         └── ChatConsumer (channels)
               ├── Authenticates via JWT query param
               ├── Broadcasts to room group via Redis
               └── Persists messages to PostgreSQL
```

---

## WebSocket message protocol

| Direction | JSON payload |
|-----------|-------------|
| Client → Server (send msg) | `{ "type": "chat_message", "content": "Hello!" }` |
| Client → Server (read receipt) | `{ "type": "mark_read" }` |
| Server → Client (new msg) | `{ "type": "chat_message", "message": { ...MessageSerializer } }` |
| Server → Client (read receipt) | `{ "type": "read_receipt", "reader_id": 42, "conversation_id": 7 }` |