# Convo

A full-stack video conferencing web app with WebRTC peer-to-peer video/audio, real-time chat, screen sharing, meeting rooms, and user authentication.

## Features

- **Video meetings** — WebRTC mesh calls with camera, mic, and screen share
- **Meeting rooms** — Short shareable codes (e.g. `abc-def-ghi`)
- **In-call chat** — Socket.io messaging during meetings
- **Authentication** — Register, login, JWT-based sessions
- **Meeting history** — Rejoin or copy past meeting codes
- **Responsive UI** — Desktop and mobile layouts

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, Vite, MUI, React Router, Socket.io Client |
| Backend | Node.js, Express, Socket.io, MongoDB, Mongoose |
| Real-time | WebRTC (STUN), Socket.io signaling |

## Project structure

```
Convo/
├── backend/          # Express API + Socket.io server
│   ├── app.js
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       └── routes/
├── frontend/         # React SPA
│   └── src/
│       ├── component/
│       ├── pages/
│       ├── hooks/
│       └── utils/
└── README.md
```

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** Atlas cluster or local MongoDB instance
- **HTTPS** in production (required for camera/microphone access)

## Environment variables

### Backend (`backend/.env`)

```env
PORT=8000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/convo
```

Copy from `backend/.env.example`.

### Frontend (`frontend/.env`)

Optional for local development:

```env
VITE_API_URL=http://localhost:8000
```

For production, set `VITE_API_URL` to your deployed backend URL **at build time** (e.g. in Vercel/Netlify env settings).

Copy from `frontend/.env.example`.

## Local development

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGO_URI
npm run dev
```

Server runs at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` (Vite default).

### 3. Use the app

1. Open `http://localhost:5173`
2. Register or log in
3. Create a **New Meeting** or join with a code
4. Allow camera/microphone when prompted

## Production deployment

### Backend (e.g. Render, Railway, Fly.io)

1. Deploy the `backend/` folder as a Node service
2. Set environment variables:
   - `PORT` — provided by host (e.g. Render sets this automatically)
   - `MONGO_URI` — MongoDB Atlas connection string
3. Start command: `npm start`
4. Ensure WebSocket support is enabled (Socket.io)

### Frontend (e.g. Vercel, Netlify, Cloudflare Pages)

1. Deploy the `frontend/` folder
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set build-time env:
   - `VITE_API_URL=https://your-backend.onrender.com`
5. Configure SPA routing — all routes should fallback to `index.html`

**Vercel** — add `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Netlify** — add `public/_redirects` or `netlify.toml`:

```
/*    /index.html   200
```

### Post-deploy checklist

- [ ] Backend health: `GET https://your-api/` responds
- [ ] Frontend loads over **HTTPS**
- [ ] Login/register works
- [ ] Create meeting → video preview in lobby
- [ ] Two devices join same room code → see/hear each other
- [ ] Chat messages deliver
- [ ] CORS allows your frontend origin (backend uses open CORS by default)

## API reference

Base URL: `{API_URL}/api/v1/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Login, returns JWT token |
| POST | `/add_to_activity` | Bearer token | Save/update meeting history |
| GET | `/get_all_activity` | Bearer token | List user's meeting history |

### Socket.io events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-call` | Client → Server | Join room `(roomId, username)` |
| `user-joined` | Server → Client | Participant joined |
| `user-left` | Server → Client | Participant left |
| `signal` | Both | WebRTC SDP / ICE exchange |
| `chat-message` | Both | In-call chat |

Room ID is the meeting code from the URL path (e.g. `/abc-def-ghi`).

## WebRTC notes

- Uses Google's public STUN server for NAT traversal
- For strict corporate/school networks, add a **TURN** server in `frontend/src/utils/peerConfig.js`
- One webcam per browser — test multi-user with separate devices or browsers
- Use headphones when testing on one machine to reduce echo

## Troubleshooting

| Issue | Likely cause | Fix |
|-------|--------------|-----|
| Camera not working | Not HTTPS (prod) | Deploy with SSL |
| Camera busy | Another tab/app using webcam | Close other apps/tabs |
| Can't connect to room | Backend down or wrong `VITE_API_URL` | Check API URL and rebuild frontend |
| Login 404 | Backend not running or wrong URL | Verify `VITE_API_URL` |
| No remote video | Firewall/NAT | Add TURN server |
| Duplicate history entries | Old data before dedupe fix | Rejoin updates existing entry now |

## Scripts

### Backend

```bash
npm run dev    # Development with nodemon
npm start      # Production
```

### Frontend

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

## License

ISC
