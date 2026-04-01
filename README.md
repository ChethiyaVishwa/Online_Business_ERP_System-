# 🌍 Online Business ERP — Travel Agency Management System

A full-stack ERP (Enterprise Resource Planning) system built for a Travel Agency. Manage bookings, vehicles, drivers, guides, packages, and payments — all in one place, with dual-currency (LKR & USD) support.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT (JSON Web Tokens) |

---

## 📁 Project Structure

```
Online_Business_ERP/
├── backend/          # Express.js REST API
│   ├── config/       # Database connection
│   ├── middleware/   # Auth middleware
│   ├── routes/       # API route handlers
│   └── server.js     # Entry point
├── frontend/         # React (Vite) app
│   ├── public/
│   └── src/
│       ├── components/
│       └── pages/
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MySQL Server
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/Online_Business_ERP.git
cd Online_Business_ERP
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` with:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=erp_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

Start the backend:
```bash
node server.js
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

## ✨ Features

- 🔐 JWT Authentication (Login/Register)
- 🚗 Vehicle Management
- 👤 Driver & Guide Management
- 📦 Tour Package Management
- 📅 Booking System
- 💳 Payment Tracking
- 💱 Dual Currency Display (LKR & USD)
- 🗺️ Custom Tour Builder

---

## 🔒 Environment Variables

**Never commit your `.env` file.** It is excluded via `.gitignore`. Always create it manually on each machine.

---

## 📄 License

This project is for educational purposes.
