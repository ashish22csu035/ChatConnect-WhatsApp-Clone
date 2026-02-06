# ChatConnect - Video Chat Application

Full-stack MERN video chat app with WebRTC, Socket.io, and Docker.

## Quick Start

### Local Development
```bash
# Backend
cd server
npm install
npm run dev

# Frontend (new terminal)
cd client
npm install
npm run dev
```

### Docker
```bash
docker-compose up -d
```

## Tech Stack
- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express + Socket.io
- Database: MongoDB Atlas
- Auth: Google OAuth 2.0
- Video: WebRTC (simple-peer)
- DevOps: Docker + GitHub Actions + AWS EC2

See AWS_DEPLOYMENT_GUIDE.md for deployment instructions.
