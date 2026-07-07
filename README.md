# tour-booking-backend
Smart Tour Package Booking System - Backend API

# VoyaLink Backend

REST API for the VoyaLink Sri Lanka tour booking platform, built with Node.js, Express and TypeScript.

**Live API URL:** https://tour-booking-backend-production.up.railway.app

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | Server framework |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| Groq SDK | AI recommendations |
| dotenv | Environment variables |
| cors | Cross-origin requests |

---

## Project Structure
```
src/
├── config/                       # Reserved for future config
├── controller/
│   ├── authController.ts         # Register, login, refresh token
│   ├── tourController.ts         # Tour CRUD
│   ├── bookingController.ts      # Booking + paymentStage logic
│   ├── paymentController.ts      # Advance/balance payment logic
│   └── aiController.ts           # Groq AI recommendation
├── middleware/
│   ├── auth.ts                   # JWT authentication
│   └── role.ts                   # Role-based authorization
├── models/
│   ├── userModel.ts              # User (USER / ADMIN roles)
│   ├── tourModel.ts              # Tour package
│   ├── bookingModel.ts           # Booking + paymentStage
│   └── paymentModel.ts           # Payment (advance / balance)
├── routes/
│   ├── authRoutes.ts
│   ├── tourRoutes.ts
│   ├── bookingRoutes.ts
│   ├── paymentRoutes.ts
│   └── aiRoutes.ts
├── utils/
│   └── tokens.ts                 # JWT sign helpers
└── index.ts                      # App entry point
```
---

## Setup & Run

### 1. Clone and install

```bash
git clone https://github.com/SithuminiDulanjalee/tour-booking-backend.git
cd tour-booking-backend
npm install
```

### 2. Create `.env`

```env
PORT=5000
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/voyalink
JWT_SECRET=your_strong_secret_here
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
GROQ_API_KEY=gsk_your_groq_key_here
```

> Get a free Groq API key at [console.groq.com](https://console.groq.com)

### 3. Run development server

```bash
npm run dev
```

Output:
Server running on port: 5000
DB connected..!

---

## API Reference

### Auth — `/api/v1/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, returns tokens |
| GET | `/me` | Auth | Get current user |
| POST | `/refresh` | Public | Refresh access token |
| POST | `/admin/register` | Admin | Register new admin |

### Tours — `/api/v1/tours`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List active tours (search, filter, paginate) |
| GET | `/admin/all` | Admin | List all tours including inactive |
| GET | `/:id` | Public | Get single tour |
| POST | `/` | Admin | Create tour |
| PUT | `/:id` | Admin | Update tour |
| DELETE | `/:id` | Admin | Delete tour |

### Bookings — `/api/v1/bookings`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | User | Create booking |
| GET | `/my` | User | Get my bookings |
| GET | `/all` | Admin | Get all bookings |
| PUT | `/:id/cancel` | User | Cancel booking |
| PUT | `/:id/status` | Admin | Update booking status |

### Payments — `/api/v1/payments`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | User | Make a payment |
| GET | `/my` | User | My payment history |
| GET | `/booking/:bookingId` | User | Payment summary for one booking |
| GET | `/all` | Admin | All payments |
| GET | `/stats` | Admin | Revenue statistics |
| PUT | `/:id/status` | Admin | Update payment status |

### AI — `/api/v1/ai`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/recommend` | User only | Groq AI travel recommendation |

---

## Payment Logic
User books tour
└─ paymentStage: "unpaid"
User pays 30% advance (exact LKR amount)
└─ paymentStage: "advance_paid"
Admin confirms booking
├─ Confirm button locked until paymentStage === "advance_paid"
└─ booking.status: "confirmed"
User pays 70% balance (exact LKR amount)
└─ paymentStage: "fully_paid"

**Rules enforced in `paymentController.ts`:**
- Advance must be exactly 30% of `totalPrice`
- Balance only allowed after admin confirms
- Balance must be exactly 70% (remaining) amount
- Cancelled bookings cannot be paid

**Rule enforced in `bookingController.ts`:**
- Admin cannot confirm a booking when `paymentStage === "unpaid"` — returns 400

---

## Data Models

**User**
name, email, password (hashed), roles: [USER|ADMIN], approved

**Tour**
title, description, price (LKR), duration, location, image,
maxGroupSize, availableSlots, itinerary[], category, isActive

**Booking**
tour, user, bookingDate, numberOfPeople, totalPrice, advanceAmount,
status: pending|confirmed|cancelled,
paymentStage: unpaid|advance_paid|fully_paid,
specialRequests

**Payment**
booking, user, amount (LKR), method: card|bank_transfer|cash,
status: pending|completed|failed|refunded,
paymentType: advance|balance,
transactionId, notes

---

## Security

- Passwords hashed with **bcryptjs** (10 salt rounds)
- Access tokens expire in **30 minutes**
- Refresh tokens expire in **7 days**
- All sensitive routes protected by `authenticate` middleware
- Role-based access via `requireRole` middleware
- Groq client initialized inside request handler (not at module load) to ensure `.env` loads first

---

## First Admin Setup

Since `/admin/register` requires an existing admin token, create the first admin manually:

1. Register a normal user via `POST /api/v1/auth/register`
2. Open **MongoDB Atlas** → Collections → `users`
3. Find the document and change `"roles": ["USER"]` → `"roles": ["ADMIN"]`
4. Save — that account is now admin

---

## Build for Production

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

Build:

```bash
npm run build
```

---

## Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect repo
3. Set:

| Field | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |

4. Add environment variables in the Render dashboard:
   PORT              = 5000
  MONGO_URL         = mongodb+srv://...
  JWT_SECRET        = ...
  JWT_REFRESH_SECRET= ...
  GROQ_API_KEY      = gsk_...

5. Deploy

Render auto-deploys on every push to `main`.

---

## Deployed URLs

| Service | URL |
|---|---|
| Backend API | https://tour-booking-backend-production.up.railway.app |
| Frontend | https://tour-booking-frontend-sigma.vercel.app |

---

## Author

Sithumini Dulanjalee ITS2020 — Rapid Application Development · IJSE
