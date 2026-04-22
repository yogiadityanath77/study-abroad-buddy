// client/src/api/socket.js

import { io } from 'socket.io-client';

// Singleton socket instance — imported wherever socket events are needed.
// autoConnect: false means the socket does NOT connect on import.
// AuthContext calls socket.connect() after login and socket.disconnect() on logout
// so the connection lifecycle is tied to the user's auth state.
//
// auth.token is read once at creation time. AuthContext must call
// socket.auth = { token } and socket.connect() after login so the
// JWT middleware on the server receives a fresh token on each connection.
const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('token'),
  },
});

export default socket;