# 🅿 ParkSmart — College Parking Management System

A full-stack parking management system built with **React.js**, **Node.js (Express)**, **MongoDB**, and **MySQL**.

---

## 📁 Project Structure

```
parksmart/
├── frontend/                   # React.js app (Vite)
│   └── src/
│       ├── components/         # Layout, shared UI
│       ├── pages/              # All route pages
│       ├── context/            # AuthContext (global state)
│       ├── hooks/              # useSocket (real-time)
│       └── utils/              # Axios API instance
│
├── backend/                    # Node.js + Express API
│   ├── config/                 # MongoDB + MySQL config
│   ├── models/                 # Mongoose + Sequelize models
│   ├── controllers/            # Route logic
│   ├── routes/                 # Express routers
│   ├── middleware/             # JWT auth guard
│   └── scripts/seed.js         # Database seeder
│
└── database/
    ├── mysql/schema.sql        # MySQL tables + views
    └── mongodb/seed.js         # MongoDB seed script
```

---

## ⚙️ Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Frontend   | React 18, Vite, React Router v6, Recharts |
| Backend    | Node.js, Express 4, Socket.io        |
| Primary DB | MongoDB (Mongoose ODM)               |
| Analytics  | MySQL 8 (Sequelize ORM)              |
| Auth       | JWT (jsonwebtoken + bcryptjs)        |
| Real-time  | Socket.io (slot updates live)        |

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))
- MySQL 8 (optional – for analytics)

### 2. Clone & Install

```bash
git clone <repo-url>
cd parksmart

# Install root + all workspace deps
npm run install:all
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, MySQL creds
```

### 4. Seed the Database

```bash
cd backend
npm run seed
```

Output:
```
✅ 40 parking slots created
✅ 3 users created

🔑 Demo credentials:
   admin    → admin@parksmart.com   / admin123
   student  → student@parksmart.com / student123
   faculty  → faculty@parksmart.com / faculty123
```

### 5. Run (dev mode — both servers)

```bash
# From project root
npm run dev
```

- Frontend → http://localhost:3000
- Backend  → http://localhost:5000
- API docs → http://localhost:5000/api/health

### 6. MySQL Setup (optional)

```bash
mysql -u root -p < database/mysql/schema.sql
```

---

## 🗺️ API Reference

### Auth
| Method | Endpoint              | Access  | Description       |
|--------|-----------------------|---------|-------------------|
| POST   | /api/auth/register    | Public  | Register user     |
| POST   | /api/auth/login       | Public  | Login + get token |
| GET    | /api/auth/me          | Private | Current user      |
| POST   | /api/auth/add-vehicle | Private | Add vehicle       |

### Slots
| Method | Endpoint               | Access  | Description        |
|--------|------------------------|---------|--------------------|
| GET    | /api/slots             | Private | All slots          |
| GET    | /api/slots/stats       | Private | Dashboard stats    |
| POST   | /api/slots             | Admin   | Create slots       |
| PATCH  | /api/slots/:slotId     | Admin   | Update slot status |
| DELETE | /api/slots/:slotId     | Admin   | Remove slot        |

### Bookings
| Method | Endpoint               | Access  | Description        |
|--------|------------------------|---------|--------------------|
| POST   | /api/bookings          | Private | Create booking     |
| GET    | /api/bookings/my       | Private | My bookings        |
| GET    | /api/bookings/recent   | Private | Recent (admin)     |
| DELETE | /api/bookings/:id      | Private | Cancel booking     |

### Entry/Exit
| Method | Endpoint                | Access  | Description        |
|--------|-------------------------|---------|--------------------|
| POST   | /api/entry-exit/entry   | Staff   | Record entry       |
| POST   | /api/entry-exit/exit    | Staff   | Record exit        |
| GET    | /api/entry-exit/log     | Staff   | Today's log        |

### Users (Admin)
| Method | Endpoint               | Access  | Description        |
|--------|------------------------|---------|--------------------|
| GET    | /api/users             | Admin   | All users          |
| DELETE | /api/users/:id         | Admin   | Remove user        |
| PATCH  | /api/users/:id/suspend | Admin   | Suspend/activate   |

---

## 🔌 Real-time Events (Socket.io)

| Event          | Payload                          | Description              |
|----------------|----------------------------------|--------------------------|
| `slot:updated` | `{ slotId, status }`             | Slot status changed      |
| `booking:new`  | `{ bookingId }`                  | New booking created      |

---

## 👤 Roles & Permissions

| Feature               | Student | Faculty | Admin |
|-----------------------|---------|---------|-------|
| View parking map      | ✓       | ✓       | ✓     |
| Book slot             | ✓       | ✓       | ✓     |
| Cancel own booking    | ✓       | ✓       | ✓     |
| Record entry/exit     |         | ✓       | ✓     |
| Manage slots          |         |         | ✓     |
| View all users        |         |         | ✓     |
| Remove/suspend users  |         |         | ✓     |

---

## 🗃️ Database Design

### MongoDB Collections
- **users** — auth, profile, vehicles
- **parkingslots** — slot state, current vehicle/booking
- **bookings** — reservation lifecycle
- **entryexits** — gate event log

### MySQL Tables
- **parking_sessions** — completed sessions for analytics
- **slot_logs** — status change audit trail
- **Views**: `daily_occupancy`, `peak_hours`, `active_sessions`

---

## 🏗️ Deployment

```bash
# Build frontend
npm run build --workspace=frontend

# Serve with Express (add to server.js):
# app.use(express.static('../frontend/dist'))

# OR deploy separately:
# Frontend → Vercel / Netlify
# Backend  → Railway / Render / EC2
# MongoDB  → MongoDB Atlas
# MySQL    → PlanetScale / RDS
```

---

## 📄 License
MIT — free to use for college projects.
