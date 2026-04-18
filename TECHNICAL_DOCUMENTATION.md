# TECHNICAL PROJECT DOCUMENTATION

## Leave Management System

This document provides a comprehensive technical overview of the Leave Management System, covering system setup, architecture, APIs, database design, and internal workflows.

### 1. Installation & Setup

**Prerequisites**
- Node.js (v16 or higher)
- MongoDB (Local or Atlas)
- npm / yarn

**Step 1: Clone Repository**
```bash
git clone <your-repo-link>
cd leave-management-system
```

**Step 2: Frontend Setup (Client - React)**
```bash
cd frontend
npm install
```
Create `.env` (optional, for custom API URLs):
```
REACT_APP_API_URL=http://localhost:5000
```
Run:
```bash
npm start
```
App runs on:
http://localhost:3000

**Step 3: Backend Setup (Server - Node + Express + MongoDB)**
```bash
cd backend
npm install
```
Create `.env`:
```
MONGO_URI=mongodb+srv://<db_username>:<db_password>@cluster0.rxryics.mongodb.net/leave_management_system?retryWrites=true&w=majority
PORT=5000
```
Run:
```bash
npm run dev
```
App runs on:
http://localhost:5000

### 2. System Architecture Overview

The system follows a 3-tier architecture:

#### 1. Presentation Layer (Frontend)
- Built using **React**
- Handles UI, routing, and user interaction (Admin, Manager, and Employee Dashboards)
- Communicates with the backend via REST APIs

#### 2. Application Layer (Backend)
- **Node.js + Express** server
- Handles business logic (leave balance calculations, dynamic holiday management)
- Authentication & authorization (role-based access)
- API routing and payload validation

#### 3. Data Layer (Database)
- **MongoDB** (NoSQL Cloud via Atlas)
- Stores users, leave requests, leave history, leave balances, and public/corporate holidays

#### Architecture Flow

```text
User → React UI → API Request → Express Server → MongoDB
         ↓
  Role-Based Auth Layer
```

### 3. Folder Structure

```text
leave-management-system/
├── frontend/             # Frontend (React App)
│   ├── public/           # Static assets (index.html, logos, etc.)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Dashboard views (Admin, Manager, Employee)
│   │   ├── services/     # Frontend API / util logic
│   │   ├── App.js        # Main React component
│   │   └── index.js      # React DOM entry
│   ├── package.json      # Client dependencies
│   └── README.md
├── backend/              # Backend (Node + Express)
│   ├── config/           # Database configuration (db.js)
│   ├── data/             # Local JSON storage (users.json, balances)
│   ├── middleware/       # Custom Express middleware (roleMiddleware)
│   ├── models/           # MongoDB Schemas (Holiday.js)
│   ├── routes/           # REST API routes logic
│   ├── utils/            # Helper logic (leaveCalculator.js)
│   ├── seedHolidays.js   # Script to populate holidays database
│   ├── server.js         # Core Express server entry point
│   ├── package.json      # Server dependencies
│   └── .env              # Environment variables
└── TECHNICAL_DOCUMENTATION.md
```

### 4. API Endpoints Dictionary

**Authentication**
- `POST /api/login` → Login and receive user profile/role

**Users (`/api/users`)**
- `GET /api/users` → Fetch all users (Admin access)
- `POST /api/users` → Create a new user (Admin)
- `PUT /api/users/:id` → Update user details, manage assignments, and roles
- `PUT /api/users/:id/reset-password` → Reset a user's password
- `DELETE /api/users/:id` → Delete a user account

**Leave Management**
- `GET /api/leave-balance/:userId` → Fetch total, used, and remaining leave balance
- `POST /api/leave-preview` → Calculate working days dynamically before applying
- `POST /api/leave-request` → Submit a new leave request
- `GET /api/leave-history/:userId` → View personal leave history
- `GET /api/leave-requests` → View all organization leave requests
- `GET /api/manager/leave-requests` → Retrieve requests pending an assigned manager
- `PUT /api/manager/leave-requests/:id` → Approve or reject a leave request

**Holidays (`/api/holidays`)**
- `GET /api/holidays` → Fetch both auto-generated public and custom corporate holidays
- `POST /api/holidays` → Add a new custom holiday (Admin)
- `DELETE /api/holidays/:id` → Delete a custom holiday

### 5. Database Schemas

**User Model**
```json
{
  "id": "Number",
  "name": "String",
  "username": "String",
  "password": "String",
  "role": "['admin', 'manager', 'employee']",
  "managerId": "Number | null"
}
```

**Leave Request Model**
```json
{
  "id": "Number",
  "userId": "Number",
  "startDate": "String (YYYY-MM-DD)",
  "endDate": "String (YYYY-MM-DD)",
  "reason": "String",
  "leaveType": "String",
  "requestedDays": "Number",
  "status": "['pending', 'approved', 'rejected']",
  "appliedAt": "Date"
}
```

**Leave Balance Model**
```json
{
  "userId": "Number",
  "total": "Number",
  "used": "Number",
  "remaining": "Number"
}
```

**Holiday Model (MongoDB)**
```json
{
  "_id": "ObjectId",
  "title": "String",
  "date": "String (YYYY-MM-DD)",
  "type": "['public', 'corporate']",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 6. Internal Code Explanation (Key Workflows)

**Authentication Flow**
1. User submits login credentials via the UI.
2. Backend verifies credentials securely against stored user data (`users.json`).
3. User profile (including assigned role and manager) is generated and returned securely.
4. User profile object is temporarily cached in the frontend via browser `localStorage`.
5. Frontend routing mechanism strictly utilizes the cached user role to allow/deny protected route access.

**Leave Application Flow**
1. Employee inputs leave dates (`startDate`, `endDate`) and leave type.
2. Frontend hits `POST /api/leave-preview` to accurately calculate total required working days. Backend calculates this by scanning `startDate` through `endDate`, automatically omitting Sundays and recognized Holidays (`models/Holiday.js`).
3. Employee clicks Submit (`POST /api/leave-request`).
4. Leave Request is safely recorded in the database, initialized globally with an unapproved `"pending"` state.
5. Success confirmation returned to the employee.

**Manager Approval Flow**
1. Assigned Manager views their direct team's pending requests via `GET /api/manager/leave-requests`.
2. Manager approves or rejects the employee's request (`PUT`).
3. Backend processes the request and resolves the request state.
4. **If approved:** Backend immediately accesses employee balances (`leaveBalances.json`) and surgically subtracts the exact requested duration from the employee's total `remaining` leave quota.
5. Confirmation finalized and UI repainted.

**Role-Based Access Control**
- **Admin** → High-level management. Create/Edit/Delete users, assign structured managers, and strictly manage the organization's Public & Corporate holidays.
- **Manager** → Medium-level management. Monitor only their assigned team members' requests, Approve or Reject pending leaves.
- **Employee** → Base-level access. Access personal dashboard exclusively, review personal remaining leave balances, apply for leaves, track personal pipeline history.

**Date & Time Handling Logic**
Your application ensures consistent date handling across regions by mapping all incoming JavaScript Date objects to strict `YYYY-MM-DD` string formats prior to any duration logic. This standard normalization intentionally prevents local timezone mismatches that could otherwise disrupt exact leave day calculations.

### 7. UI Guide (Screens Overview)

**Login Page**
- Secure employee, manager, and administrative access
- Credential validation and persistent UI role-routing

**Employee Dashboard (Leave Application Interface)**
- Displays live leave balances (`total`, `used`, `remaining`)
- Apply for leaves across date slots, including live preview of billable working days
- Track chronological history of submitted requests

**Manager Dashboard**
- View incoming leave requests specifically filtered to directly assigned team members
- One-click Approve or Reject functionality that securely triggers upstream balance reallocation

**Admin Dashboard (Admin Panel)**
- Complete organization control (manage overall structure and user accounts)
- Dynamically assign Managers to specific standard Employees
- Integrated Holiday Calendar UI to declare, edit, and automatically propagate Public and Corporate Holidays across the entire organization

### 8. User Manual

**Steps to Use (Employee & Manager)**
1. **Login** to the platform using assigned credentials.
2. **Review Balances:** Track your personalized total, used, and remaining leave quotas.
3. **Select Dates:** Input desired leave start and end dates along with the leave type.
4. **Submit Request:** Preview automatic day calculations (which securely exclude holidays/weekends) and submit your application.
5. **Manage Team (Managers Only):** Review incoming requests directly from assigned team members to efficiently approve or reject submissions.

**Admin Usage**
- Create, organize, and securely manage employee, manager, and administrative tier accounts.
- Configure organizational layout by dynamically mapping managers to employees.
- Globally declare Public and Custom Corporate Holidays.

### 9. Deployment

**Deployment Flow:**
- **Backend** → Render
- **Frontend** → Vercel / Netlify
- **Database** → MongoDB Atlas

### 10. Future Enhancements

- **Email/SMS Notifications:** Automatic alerts for leave request approvals and rejections.
- **Calendar Sync:** Export leave itineraries natively to Google Calendar or Outlook integrations.
- **Real-time Updates (WebSockets):** Push immediate notifications to a manager's UI when an employee submits a new request.
- **Advanced Automated Rollovers:** End-of-year automated tracking to rollover unused specific quotas into the approaching year.
- **Analytical Dashboards:** Exportable Excel/CSV graphical analysis for general company absentee logic.
