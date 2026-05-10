# MALLICHATAPP 💬

A premium, real-time chat application inspired by the **WhatsApp Web** experience. Built with a focus on modern aesthetics, performance, and a stable real-time messaging architecture.

![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/node.js-v16%2B-blue)
![Socket.io](https://img.shields.io/badge/socket.io-v4.7-orange)
![Tailwind](https://img.shields.io/badge/styling-Tailwind_CSS-38bdf8)

---

## ✨ Premium Features

- **WhatsApp-Style UI**: A pixel-perfect dark mode interface that replicates the look and feel of WhatsApp Web, including circular avatars and clean typography.
- **Real-Time Communication**: Instant message delivery and typing indicators powered by **Socket.io**.
- **Persistent Unread Badges**: A custom "Read Receipt" system stored in `localStorage` that calculates unread messages even after page reloads.
- **Dynamic Vibrant Avatars**: Every user is automatically assigned a unique, vibrant gradient avatar based on their username.
- **Smart Contact Sorting**: Conversations are automatically sorted with the most recent messages bubbling to the top.
- **Seamless Auth Flow**: Realistic Signup and Login flow that validates users and prepares them for chatting.

---

## 🛠️ Technology Stack

### Backend
- **Node.js & Express**: Core server framework.
- **MongoDB**: Persistent database for storing users and message history.
- **Socket.io**: WebSockets for low-latency, real-time bidirectional communication.
- **Mongoose**: Elegant MongoDB object modeling.

### Frontend
- **Vanilla JavaScript (ES6 Modules)**: Modularized codebase for easy maintenance.
- **Tailwind CSS**: Utility-first styling for a custom, high-end look.
- **State Management**: Centralized application state for real-time UI updates.

---

## 📂 Project Structure

```text
MALLICHATAPP/
├── backend/                # Node.js Server
│   ├── controllers/        # Business logic for Auth and Messages
│   ├── models/             # Database schemas (Mongoose)
│   ├── routes/             # API endpoints
│   ├── server.js           # Server entry point
│   └── socketHandler.js    # Real-time event logic
├── frontend/               # Client Application
│   ├── public/             # Static HTML and Assets
│   └── src/                
│       ├── components/     # UI Templates (templates.js)
│       ├── js/             # Application Logic (app.js, ui.js, state.js)
│       └── css/            # Tailwind Styles
└── README.md               # You are here!
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB Atlas** account (or local MongoDB)

### 2. Installation
Clone the repository and install dependencies for both parts:

```bash
# Install Backend dependencies
cd backend
npm install

# (Optional) If you want to modify styles
cd ../frontend
npm install
```

### 3. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

### 4. Running the App
Start the backend server:
```bash
cd backend
npm run dev
```
Open **http://localhost:3000** in your browser to start chatting!

---

## 💡 How It Works (Development Highlights)

### **The Unread Message Logic**
Unlike simple chat apps that lose unread counts on refresh, this app uses a **Timestamp Comparison** system.
- When you click a contact, the app saves `sivionchat:read:[user]:[partner]` with the current timestamp.
- On reload, it compares every message's time against that timestamp to decide if it should show a **Green Badge**.

### **Real-time Synchronization**
The app listens for `message:new` events. When a message arrives, the UI instantly:
1. Bubbles that contact to the top of the sidebar.
2. Updates the message preview.
3. Increments the unread count if you aren't currently viewing that chat.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

*Developed with ❤️ for a premium chatting experience.*
