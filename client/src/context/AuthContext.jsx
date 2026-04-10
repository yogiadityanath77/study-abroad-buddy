// client/src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Wraps the whole app — provides user state and auth functions everywhere
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Load user from localStorage on first render so refresh doesn't log you out
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Saves token + user to state and localStorage after login or register
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Clears everything on logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — use this instead of useContext(AuthContext) everywhere
export const useAuth = () => useContext(AuthContext);