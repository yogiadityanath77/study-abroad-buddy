// client/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import VisaPage from './pages/VisaPage';
import CulturePage from './pages/CulturePage';
import HealthPage from './pages/HealthPage';
import HousingPage from './pages/HousingPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

// All 11 routes wired up — protected routes require login + onboarding
const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Semi-protected — needs login but not onboarding */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected routes — need login + onboarding complete */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/visa" element={<ProtectedRoute><VisaPage /></ProtectedRoute>} />
          <Route path="/culture" element={<ProtectedRoute><CulturePage /></ProtectedRoute>} />
          <Route path="/health" element={<ProtectedRoute><HealthPage /></ProtectedRoute>} />
          <Route path="/housing" element={<ProtectedRoute><HousingPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;