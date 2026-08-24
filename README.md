# KaamSathi 🛠️
### A Cooperative-Owned Gig Services Platform for Household & Community Services

> *"Urban Company, but the workers own it."*

Built for **Problem Statement 26089** — Ministry of Cooperation | National Council for Cooperative Training (NCCT) | Category: Software | Theme: Smart Automation

---

## 📌 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [App Workflow](#-app-workflow)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Team](#-team)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🧩 Problem Statement

India has a large, formal network of **Labour Cooperative Federations and Societies** — organized bodies of electricians, plumbers, carpenters, painters, domestic helpers, caregivers, drivers, gardeners, cleaners, and technicians. These are not informally scraped-together gig workers — they already belong to an organized cooperative structure with built-in accountability and, often, existing skill certification.

Yet this workforce has **no digital storefront**. Meanwhile, private platforms (in the mould of Urban Company/UrbanClap) have captured the household-services market. These platforms:

- Take large commissions (20–30%) from workers, cutting into their earnings
- Offer little to no worker welfare or insurance coverage
- Have no cooperative ownership or profit-sharing back to the worker pool

**The gap:** No digital bridge currently exists between cooperative labour supply and household demand.

---

## 💡 Our Solution

**KaamSathi** is a marketplace app, owned by the cooperative, where verified cooperative workers get booked by households and institutions for services — with fair pay, welfare benefits, and consumer trust built in from the start.

Unlike private gig platforms, the cooperative itself is the platform owner. Revenue collected is reinvested into worker welfare (insurance, fair-wage enforcement) and platform upkeep — not extracted as private profit.

---

## ✨ Key Features

### Tier 1 — Core MVP
| Feature | Description |
|---|---|
| 🔐 Service Provider Registration & Verification | Sign-up flow with admin approval and document upload (ID, skill certificates) |
| 🏷️ Worker Skill Profiling | Workers tagged by service category, experience level, and certifications |
| 📅 Customer Booking & Scheduling | Pick a service → pick a worker or auto-assign → pick a time slot |
| 📍 Geo-Location Matching | Nearest available worker shown/assigned via lat-long distance |
| ⭐ Ratings & Feedback | 5-star rating + comment after job completion |

### Tier 2 — Strong Differentiators
| Feature | Description |
|---|---|
| 💳 Digital Payments & Invoicing | Razorpay/Stripe test-mode integration with auto-generated invoice PDF |
| 🚨 Emergency / On-Demand Booking | "Book Now" fast path alongside standard scheduled booking |
| 📊 Federation Admin Dashboard | Cooperative admin view of workers, bookings, earnings, and disputes |
| 🌐 Multilingual Support | At least two Indian languages via i18n |

### Tier 3 — Stretch / Roadmap
| Feature | Description |
|---|---|
| 🛡️ Worker Welfare & Insurance Integration | Mocked API linkage to government schemes (PM-SYM, e-Shram) |
| 🤖 AI-Based Demand Forecasting | Time-series model predicting demand spikes by area and service type |

---

## 🛠️ Tech Stack

**Frontend (Mobile App):** Flutter / React Native — single codebase for customer & worker roles
**Admin Dashboard (Web):** React.js
**Backend:** Node.js/Express (or Django REST Framework)
**Database:** PostgreSQL with PostGIS extension (or MongoDB with geospatial indexing)
**Geo-Matching:** Google Maps API / OpenStreetMap + Haversine formula, or PostGIS `ST_Distance`
**Forecasting Model:** Prophet or ARIMA (time-series prediction on booking data)
**Payments:** Razorpay / Cashfree sandbox
**Deployment:** Render / Railway / AWS Free Tier

---

## 🏗️ System Architecture

```
┌─────────────────┐       ┌─────────────────┐
│  Customer App    │       │   Worker App     │
│ (Flutter/RN)      │       │ (Flutter/RN)     │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         └──────────┬───────────────┘
                     ▼
          ┌─────────────────────┐
          │   Backend API        │
          │ (Node.js/Express)    │
          └─────────┬───────────┘
                     │
     ┌───────────────┼────────────────┐
     ▼               ▼                ▼
┌──────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL │  │ Payment Gateway│  │ Maps/Geo API   │
│ + PostGIS   │  │ (Razorpay)     │  │ (Google/OSM)   │
└──────────┘  └──────────────┘  └──────────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  Admin Web Dashboard │
          │      (React.js)       │
          └─────────────────────┘
```

---

## 🔄 App Workflow

### Customer Journey
1. Open app → select a service category (e.g., plumbing, electrical)
2. App shows nearby verified workers using geo-location matching
3. Select a worker (or let the app auto-assign the nearest one)
4. Pick a time slot and confirm booking
5. Worker is notified, accepts, and travels to the location
6. Job is completed → customer pays digitally → invoice auto-generated
7. Customer rates the worker (5-star + comment)

### Worker Journey
1. Sign up with ID and skill certificates
2. Cooperative admin reviews and approves the profile
3. Profile tagged with skill category, experience, certifications
4. Receive booking notifications → accept/reject jobs
5. Complete job → receive payment (minus a small cooperative fee, reinvested into welfare)

### Admin (Federation) Journey
1. Log in to the web dashboard
2. View all registered workers, active bookings, and earnings
3. Approve/reject new worker registrations
4. Monitor disputes and resolve them
5. View demand forecasting insights to allocate workers proactively

---

## 📁 Project Structure

```
kaamsathi/
├── mobile-app/           # Flutter/React Native app (customer + worker)
│   ├── customer/
│   └── worker/
├── admin-dashboard/      # React.js web dashboard
├── backend/              # Node.js/Express API
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── services/
│       ├── geo-matching/
│       ├── payments/
│       └── forecasting/
├── database/             # Migrations, seed data
├── docs/                 # Architecture diagrams, API docs
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (with PostGIS extension) or MongoDB
- Flutter SDK / React Native CLI
- Razorpay/Cashfree sandbox API keys
- Google Maps API key (or OpenStreetMap setup)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # add your DB, Maps API, and payment gateway keys
npm run dev
```

### Admin Dashboard Setup
```bash
cd admin-dashboard
npm install
npm start
```

---

## 👥 Team

| Member | Responsibility |
|---|---|
| Member 1 & 2 | Mobile app — customer and worker flows |
| Member 3 | Backend / API and geo-matching logic |
| Member 4 | Admin dashboard (web) |
| Member 5 | Payments and notifications integration |
| Member 6 | Forecasting model, pitch deck, and presentation |

---

## 🗺️ Roadmap

- [ ] Core booking, worker verification, and geo-matching (MVP)
- [ ] Payments, invoicing, and admin dashboard
- [ ] Multilingual support (Hindi, Marathi, etc.)
- [ ] Insurance/welfare scheme API integration (PM-SYM, e-Shram)
- [ ] AI-based demand forecasting for workforce allocation
- [ ] Pan-India cooperative federation onboarding

---

## 📄 License

This project was built for Problem Statement 26089 under the Ministry of Cooperation / NCCT hackathon track. License to be decided by the team/institution.

---

*"Digitizing infrastructure that already exists offline — not building something from nothing."*