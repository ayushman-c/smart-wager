# Smart Wager — Smart QR-Based Lab Management System

A production-ready MERN stack application for Mechanical Engineering Laboratory management with QR-based equipment tracking and practical submission.

---

## Features

- **QR-Based Equipment Tracking** — Issue and return lab equipment using QR code scans
- **Practical Submission Portal** — Students upload practicals after scanning teacher-generated QR
- **Role-Based Access** — Admin, Teacher/Lab Assistant, and Student roles
- **Dashboard Analytics** — Charts for daily issues, returns, equipment utilization
- **PDF & Excel Reports** — Inventory, issue/return, submission, and missing equipment reports
- **Audit Logs** — Track every action with user, timestamp, and IP
- **Notification System** — Alerts for overdue returns, damaged equipment, pending verifications
- **Dark Mode / Light Mode** — Full theme support
- **Cloudinary Integration** — Image and PDF uploads for submissions

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS + ShadCN UI |
| Backend     | Node.js + Express.js                |
| Database    | MongoDB Atlas + Mongoose            |
| Auth        | JWT + RBAC                          |
| QR          | qrcode + html5-qrcode               |
| Files       | Cloudinary                          |
| Charts      | Recharts                            |
| PDF/Excel   | jsPDF + autotable + xlsx            |

---

## Project Structure

```
Smart Wager/
├── backend/
│   ├── controllers/      # Business logic
│   ├── middleware/        # Auth middleware
│   ├── models/           # MongoDB schemas
│   ├── routes/           # Express routes
│   ├── utils/            # Helpers (audit, notifications, cloudinary)
│   ├── server.js         # Entry point
│   ├── seed.js           # Database seeder
│   └── .env.example      # Environment template
│
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/   # Sidebar, Header, DashboardLayout
        │   └── ui/       # Button, Card, Dialog, Input, etc.
        ├── context/      # AuthContext
        ├── lib/          # API client, utils
        └── pages/        # All page components
```

---

## Installation

### 1. Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, and Cloudinary credentials in .env
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Seed the Database

```bash
cd backend
node seed.js
```

This creates the following demo accounts and 8 equipment items with QR codes.

### Demo Credentials

#### Admin
| Name | Email | Password |
|---|---|---|
| Admin User | admin@lab.edu | admin123 |

#### Teacher
| Name | Email | Password |
|---|---|---|
| Dr. Ramesh Kumar | teacher@lab.edu | teacher123 |

#### Students
| Name | Email | Password | Roll No. | Section |
|---|---|---|---|---|
| Ayush Sharma | student@lab.edu | student123 | ME2021001 | A |
| Priya Verma | priya.verma@lab.edu | priya@123 | ME2021002 | A |
| Rohan Mehta | rohan.mehta@lab.edu | rohan@123 | ME2021003 | B |
| Sneha Patel | sneha.patel@lab.edu | sneha@123 | ME2021004 | B |
| Karan Singh | karan.singh@lab.edu | karan@123 | ME2021005 | A |
| Ananya Joshi | ananya.joshi@lab.edu | ananya@123 | ME2021006 | B |

---

## Environment Variables (backend/.env)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/smart-wager
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

---

## API Endpoints

| Route                     | Method | Access          | Description                  |
|---------------------------|--------|-----------------|------------------------------|
| /api/auth/login           | POST   | Public          | Login                        |
| /api/auth/me              | GET    | Private         | Get current user             |
| /api/equipment            | GET    | All             | List equipment               |
| /api/equipment/:id/qr     | POST   | Admin/Teacher   | Regenerate QR                |
| /api/equipment/scan       | POST   | Admin/Teacher   | Lookup by QR data            |
| /api/students             | GET    | Admin/Teacher   | List students                |
| /api/issue                | POST   | Admin/Teacher   | Issue equipment              |
| /api/return               | POST   | Admin/Teacher   | Return equipment             |
| /api/submissions/qr       | POST   | Admin/Teacher   | Generate submission QR       |
| /api/submissions          | POST   | Student         | Submit practical             |
| /api/submissions/:id/review | PATCH | Admin/Teacher  | Approve/reject submission    |
| /api/dashboard/stats      | GET    | Admin/Teacher   | Dashboard stats              |
| /api/reports/inventory    | GET    | Admin/Teacher   | Inventory report             |
| /api/audit                | GET    | Admin           | Audit logs                   |
| /api/notifications        | GET    | All             | Get notifications            |

---

## Workflow

### Equipment Issue
1. Teacher searches and selects student
2. Teacher searches or scans equipment QR
3. System creates transaction, marks equipment as Issued

### Equipment Return
1. Teacher finds active transaction
2. Notes condition on return
3. System updates inventory, triggers alerts if damaged/overdue

### Practical Submission
1. Teacher generates Submission QR for a practical
2. Student scans QR with camera
3. Student uploads images/PDF + remarks
4. Teacher reviews and grades submission

---

## Academic Use

This project is suitable as a:
- Mini Project
- Innovation Project
- Final Year Project (partial)

for Mechanical Engineering, Information Technology, or Computer Science departments.
