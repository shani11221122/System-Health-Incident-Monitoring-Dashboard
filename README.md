# 🩺 Health Detector — Website Uptime Monitoring System

A full-stack **website uptime monitoring** application that continuously checks the availability and response time of user-defined URLs. It tracks incidents, sends email alerts on status changes, and provides real-time updates and analytics through a modern React dashboard.

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20PostgreSQL%20%7C%20Redis-blue)

---

## ✨ Features

- **User Authentication** — Secure register/login with JWT tokens and bcrypt password hashing.
- **Monitor Management** — Create, update, and delete URL monitors with configurable check intervals.
- **Automated Health Checks** — A cron-based scheduler pings every monitor at its configured interval.
- **Incident Tracking** — Automatically records downtime incidents and resolves them when a service recovers.
- **Email Alerts** — Sends instant email notifications when a monitor goes **DOWN** and when it **RECOVERS** (via Resend).
- **Real-Time Updates** — Live status changes pushed to the dashboard over Socket.IO.
- **Analytics & History** — Per-monitor response-time and uptime charts powered by Recharts.
- **Rate Limiting** — API-wide and stricter auth-specific rate limiting to prevent abuse.
- **Input Validation** — Zod schemas validate all request payloads.
- **Dark Mode** — Toggleable dark/light theme persisted in the browser.

---

## 🏗️ Tech Stack

### Backend (`server/`)
| Technology | Purpose |
|------------|---------|
| [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) | REST API server |
| [Socket.IO](https://socket.io/) | Real-time status push |
| [Prisma](https://www.prisma.io/) + PostgreSQL ([Neon](https://neon.tech/)) | Database & ORM |
| [Upstash Redis](https://upstash.com/) | Caching monitor status |
| [node-cron](https://www.npmjs.com/package/node-cron) | Scheduled health checks |
| [Resend](https://resend.com/) | Email alert delivery |
| [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) + [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Auth & password hashing |
| [Zod](https://zod.dev/) | Request validation |
| [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) | Rate limiting |

### Frontend (`client/`)
| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI framework |
| [Vite 8](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [Recharts](https://recharts.org/) | Analytics charts |
| [axios](https://axios-http.com/) | HTTP client |
| [socket.io-client](https://socket.io/) | Real-time updates |

---

## 📁 Project Structure

```
Health_detector/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.jsx        # Login / Register UI
│   │   │   ├── MonitorCard.jsx     # Monitor status card
│   │   │   ├── MonitorForm.jsx     # Create/edit monitor form
│   │   │   └── MonitorDetail.jsx   # History & analytics charts
│   │   ├── App.jsx                 # Root component & state
│   │   ├── api.js                  # Axios API client
│   │   ├── socket.js               # Socket.IO client setup
│   │   ├── index.css               # Tailwind styles
│   │   └── main.jsx                # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── server/                     # Express backend
    ├── controller/
    │   ├── auth.js                 # Register / login / getMe
    │   └── monitors.js             # Monitor CRUD, status, incidents, analytics
    ├── middleware/
    │   ├── auth.js                 # JWT verification
    │   └── validate.js             # Zod validation schemas
    ├── prisma/
    │   └── schema.prisma           # Database models
    ├── routes/
    │   ├── auth.routes.js          # /api/auth/*
    │   └── monitor.routes.js       # /api/monitors/*
    ├── services/
    │   ├── cronService.js          # Scheduled monitoring engine
    │   ├── Pingservice.js          # URL ping logic
    │   ├── emailService.js         # Resend email alerts
    │   └── redisClient.js          # Upstash Redis client
    ├── index.js                    # Server entry point
    └── package.json
```

---

## 🗄️ Database Schema

The data layer uses **Prisma** with a PostgreSQL database:

| Model | Description |
|-------|-------------|
| `User` | Registered users (email, hashed password, name) |
| `Monitor` | A URL being monitored (name, url, check interval, owner) |
| `Check` | A single health-check result (status, response time, timestamp) |
| `Incident` | A downtime event (startedAt, optional endedAt) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A PostgreSQL database (e.g., [Neon](https://neon.tech/))
- An [Upstash Redis](https://upstash.com/) instance
- A [Resend](https://resend.com/) API key for email alerts

### 1. Clone & Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure Environment Variables

**`server/.env`**

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
RESEND_API_KEY="re_your-resend-api-key"
ALERT_EMAIL_TO="alerts@example.com"
JWT_SECRET="your-secret-key"
PORT=5000
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:5000
```

### 3. Set Up the Database

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run the Application

```bash
# Start the backend (port 5000)
cd server
npm run dev

# Start the frontend (Vite dev server)
cd client
npm run dev
```

Open the frontend at `http://localhost:5173` (or the port shown by Vite).

---

## 🔌 API Reference

All endpoints (except auth) require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive a JWT |
| `GET` | `/api/auth/me` | Get the current authenticated user |

### Monitors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/monitors` | Create a new monitor |
| `GET` | `/api/monitors` | List all monitors for the user |
| `PUT` | `/api/monitors/:id` | Update a monitor |
| `DELETE` | `/api/monitors/:id` | Delete a monitor |
| `GET` | `/api/monitors/status` | Get current status of all monitors |
| `GET` | `/api/monitors/incidents` | List all incidents |
| `GET` | `/api/monitors/:id/history` | Get check history for a monitor |
| `GET` | `/api/monitors/:id/analytics` | Get analytics for a monitor |

---

## ⚙️ How It Works

1. **User creates a monitor** with a URL and a check interval (in seconds).
2. **`cronService`** schedules a periodic job that pings every monitor at its configured interval.
3. **`Pingservice`** performs an HTTP request to the target URL and measures response time.
4. Each result is stored as a **`Check`** record, and the latest status is cached in **Redis**.
5. When a monitor's status **changes**:
   - **Down** → an `Incident` is opened and a **DOWN alert email** is sent.
   - **Up** (after being down) → the incident is closed and a **RECOVERED email** is sent.
6. A **`statusChange`** event is emitted over **Socket.IO**, updating the dashboard in real time.
7. Users can view **history** and **analytics** (response time & uptime charts) for each monitor.

---

## 🛠️ Scripts

### Backend (`server/`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the server with nodemon (auto-reload) |

### Frontend (`client/`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint |

---

## 📄 License

This project is licensed under the **ISC License**.#   S y s t e m - H e a l t h - I n c i d e n t - M o n i t o r i n g - D a s h b o a r d  
 #   S y s t e m - H e a l t h - I n c i d e n t - M o n i t o r i n g - D a s h b o a r d  
 