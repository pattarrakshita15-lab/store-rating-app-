# Store Rating Application

A full-stack web application where users can rate stores and view overall ratings.

## 🚀 Features

- User Registration & Login (JWT Authentication)
- Role-Based Access (Admin, User, Store Owner)
- Admin can add stores
- Users can rate stores (1–5 stars)
- Store owners can view average rating
- Search functionality
- Protected routes
- Automatic database seeding

## 🛠 Tech Stack

Frontend:
- React.js
- Axios
- React Router

Backend:
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Bcrypt

Database:
- PostgreSQL

## 📂 Project Structure

store-rating-app
├── backend
├── frontend
└── README.md

## ⚙ How To Run Locally

### Backend

cd backend  
npm install  
node server.js  

### Frontend

cd frontend  
npm install  
npm start  

## 🔐 Environment Variables

Create `.env` in backend:

PORT=5000  
DB_USER=postgres  
DB_PASSWORD=yourpassword  
DB_NAME=STORE_RATING_APP  
DB_HOST=localhost  

---

## 👩‍💻 Developed By

Rakshita