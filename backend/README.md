# SivionChat

SivionChat is a professional, WhatsApp-inspired real-time chat application built with Node.js, Express, Socket.io, HTML5, Tailwind CSS, and vanilla JavaScript modules.

## Features

- Login/Sign-up flow with sleek Tailwind UI
- Real-time message delivery with Socket.io
- Message metadata (sender and HH:MM timestamp)
- Delete for Everyone support with synchronized UI updates
- Responsive enterprise-style three-pane dashboard
- Local state management for messages and active users

## Directory Map

```text
SivionChat/
├── backend/
│   ├── server.js
│   ├── socketHandler.js
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   ├── controllers/
│   │   ├── authController.js
│   │   └── messageController.js
│   ├── models/
│   │   └── store.js
│   └── routes/
│       └── authRoutes.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   └── templates.js
│       ├── css/
│       │   └── tailwind.css
│       ├── js/
│       │   ├── app.js
│       │   ├── auth.js
│       │   ├── socket.js
│       │   ├── state.js
│       │   └── ui.js
│       ├── styles/
│       │   └── theme.js
│       └── utils/
│           └── time.js
```

## Run on localhost:3000

1. Open terminal in `backend` and install dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

   or production mode:

   ```bash
   npm start
   ```

3. Open:

   [http://localhost:3000](http://localhost:3000)

## Notes

- This version uses an in-memory store (users/messages reset on server restart).
- For production persistence, replace `backend/models/store.js` with a database layer.
