// client/src/context/AuthContext.jsx

import { createContext, useContext, useState } from 'react';
import socket from '../api/socket';

const AuthContext = createContext(null);

// Wraps the whole app — provides user state and auth functions everywhere
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Load user from localStorage on first render so refresh doesn't log you out
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Saves token + user to state and localStorage after login or register.
  // Updates the socket auth token then connects — the server JWT middleware
  // reads socket.handshake.auth.token on each new connection, so we must
  // set it here before calling connect() rather than relying on the value
  // captured at module load time in socket.js.
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Attach the fresh token and open the socket connection
    socket.auth = { token };
    socket.connect();
  };

  // Clears everything on logout and closes the socket connection.
  // Disconnecting here prevents the socket from trying to reconnect
  // after the token has been removed from localStorage.
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — use this instead of useContext(AuthContext) everywhere
export const useAuth = () => useContext(AuthContext);