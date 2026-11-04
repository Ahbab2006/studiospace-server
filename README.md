# StudioSpace — Backend API

StudioSpace is a studio booking platform backend built with Node.js, Express.js, and MongoDB. It provides RESTful APIs for studio management, booking operations, authentication, and role-based access control.

The backend handles client requests, manages database operations, verifies user authentication, and protects restricted resources through middleware.

## 🌐 Live Backend

**Backend API:** https://studiospace-server-4qre.onrender.com

**Frontend:** https://studiospace-client-9p5k.vercel.app/

## ✨ Key Features

- **Studio Management:** Create, retrieve, update, and delete studio listings.
- **Booking Management:** Handle studio booking operations.
- **User Authentication:** Verify Better Auth JWT tokens.
- **Admin Authorization:** Protect administrative routes.
- **Role-Based Access Control (RBAC):** Manage permissions for Admin, Sub-admin, and regular User roles.
- **Permission Middleware:** Restrict specific operations based on assigned permissions.
- **MongoDB Integration:** Store and retrieve application data using MongoDB.
- **RESTful API:** Provide structured API endpoints for the frontend application.
- **Secure Configuration:** Manage environment variables and database credentials.

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js
- JavaScript
- CommonJS

### Database
- MongoDB
- MongoDB Atlas

### Authentication & Security
- Better Auth
- JWT
- JOSE
- Cookie Parser
- Role-Based Access Control (RBAC)
- CORS

### Development Tools
- Nodemon
- dotenv
- npm

## 📦 Installation & Setup

Follow these steps to run the backend server locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Ahbab2006/studiospace-server
```

### 2. Navigate to the Project Directory

```bash
cd studiospace-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_URL=http://localhost:3000
```

Replace the placeholder values with your actual configuration.

**Important:** Never upload your `.env` file or sensitive credentials to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

The server will start at:

```text
http://localhost:5000
```

### 6. Start the Production Server

```bash
npm start
```

## 📁 Project Structure

```text
studiospace-server/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── adminController.js
│   ├── bookingController.js
│   └── studioController.js
│
├── middleware/
│   ├── verifyAdmin.js
│   ├── verifyPermission.js
│   └── verifyToken.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── bookingRoutes.js
│   └── studioRoutes.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## 🔐 Authentication & Authorization

StudioSpace uses Better Auth for user authentication and JWT-based token verification for protected backend APIs.

### Authentication Middleware

- `verifyToken.js` — Verifies JWT tokens and identifies authenticated users.
- `verifyAdmin.js` — Handles administrative access verification.
- `verifyPermission.js` — Checks whether a user has permission to perform a specific operation.

### User Roles

| Role | Access |
|---|---|
| Admin | Full administrative access |
| Sub-admin | Access to assigned permissions |
| User | Standard user access |

## 🗄️ Database

StudioSpace uses MongoDB as its primary database.

MongoDB Atlas provides cloud database hosting.

The database stores application information, including:

- User information
- Studio listings
- Booking information
- Authentication-related data

## 🔌 API Integration

The backend provides API services for the StudioSpace frontend.

**Frontend Application:** Next.js

**Backend API:** Express.js

**Communication:** HTTP REST API with JSON data.

## 🚀 Deployment

The backend is deployed using Render.

**Production API:** https://studiospace-server-4qre.onrender.com

The application uses MongoDB Atlas for cloud database connectivity.

## 🎯 Project Goal

The goal of the StudioSpace backend is to provide a secure and scalable API infrastructure for studio discovery, studio management, and booking operations with authentication and role-based authorization.

---

**Developed with ❤️ using Node.js, Express.js, and MongoDB.**