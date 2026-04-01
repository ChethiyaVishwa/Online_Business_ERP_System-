# 🏢 Online Business ERP System

A full-stack **Enterprise Resource Planning (ERP)** web application built for managing day-to-day business operations. This system covers employee management, inventory tracking, sales monitoring, and business analytics — all in one centralized platform.

---

## 🖥️ Live Preview

> Run locally following the setup instructions below.
> Frontend: `http://localhost:5173`
> Backend API: `http://localhost:5000`

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🔐 **Authentication** | Secure login with JWT tokens |
| 📊 **Dashboard** | Overview of key business metrics |
| 👥 **Employee Management** | Add, update & manage staff records |
| 📦 **Inventory Management** | Track stock levels and products |
| 💰 **Sales Management** | Record and monitor sales transactions |
| 📈 **Reports & Analytics** | Generate business performance reports |
| 👤 **User Management** | Manage system users and roles |

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ **React** (with Vite)
- 🎨 **CSS** (Custom styling)
- 🔀 **React Router DOM** (Client-side routing)

### Backend
- 🟩 **Node.js** with **Express.js**
- 🗄️ **MySQL** (Relational database)
- 🔑 **JWT** (JSON Web Token authentication)
- 🔒 **bcrypt** (Password hashing)

---

## 📁 Project Structure

```
Online_Business_ERP/
│
├── backend/                  # Node.js REST API
│   ├── config/               # Database connection setup
│   ├── middleware/           # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js           # Login / Register
│   │   ├── employees.js      # Employee CRUD
│   │   ├── inventory.js      # Inventory CRUD
│   │   ├── sales.js          # Sales management
│   │   └── reports.js        # Reports & analytics
│   ├── server.js             # Express app entry point
│   ├── package.json
│   └── .env                  # ⚠️ Not included (create manually)
│
├── frontend/                 # React (Vite) app
│   ├── public/
│   └── src/
│       ├── api/              # Axios API calls
│       ├── components/
│       │   ├── Layout.jsx    # Main layout wrapper
│       │   ├── Navbar.jsx    # Top navigation bar
│       │   └── Sidebar.jsx   # Side navigation menu
│       ├── context/
│       │   └── AuthContext.jsx  # Global auth state
│       ├── pages/
│       │   ├── Login.jsx     # Login page
│       │   ├── Dashboard.jsx # Main dashboard
│       │   ├── Employees.jsx # Employee management
│       │   ├── Inventory.jsx # Inventory management
│       │   ├── Sales.jsx     # Sales management
│       │   ├── Reports.jsx   # Reports & analytics
│       │   └── Users.jsx     # User management
│       ├── App.jsx
│       └── main.jsx
│
├── .gitignore
└── README.md
```

---

## ⚙️ Setup & Installation

### ✅ Prerequisites
Make sure these are installed on your machine:
- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://www.mysql.com/) Server
- npm (comes with Node.js)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ChethiyaVishwa/Online_Business_ERP_System-.git
cd Online_Business_ERP_System-
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=erp_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

Set up the database:
```sql
CREATE DATABASE erp_db;
```

Start the backend server:
```bash
node server.js
```

> ✅ Server runs on: `http://localhost:5000`

---

### 3️⃣ Frontend Setup

Open a **new terminal** and run:

```bash
cd frontend
npm install
npm run dev
```

> ✅ App runs on: `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/register` | Register new user |
| `GET` | `/api/employees` | Get all employees |
| `POST` | `/api/employees` | Add new employee |
| `PUT` | `/api/employees/:id` | Update employee |
| `DELETE` | `/api/employees/:id` | Delete employee |
| `GET` | `/api/inventory` | Get inventory items |
| `POST` | `/api/inventory` | Add inventory item |
| `GET` | `/api/sales` | Get all sales |
| `POST` | `/api/sales` | Record a sale |
| `GET` | `/api/reports` | Get business reports |
| `GET` | `/api/health` | API health check |

---

## 🔒 Security Notes

- ✅ Passwords are hashed using **bcrypt**
- ✅ All protected routes require a valid **JWT token**
- ✅ The `.env` file is excluded from Git via `.gitignore`
- ⚠️ **Never share your `.env` file publicly**

---

## 🚀 Future Improvements

- [ ] Add role-based access control (Admin / Manager / Staff)
- [ ] Export reports as PDF / Excel
- [ ] Email notifications for low stock alerts
- [ ] Dark mode UI toggle
- [ ] Mobile responsive design enhancements

---

## 👨‍💻 Developer

**Chethiya Vishwa**
- GitHub: [@ChethiyaVishwa](https://github.com/ChethiyaVishwa)
- Email: chethiyavishwa717@gmail.com

---

## 📄 License

This project is built for educational purposes as part of an **Information Technology for Business** course.

---

⭐ If you found this project useful, feel free to **star** the repository!
