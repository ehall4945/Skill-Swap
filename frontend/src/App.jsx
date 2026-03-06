/*
ROOT APP COMPONENT

Responsible for:
- Rendering global layout (AppLayout)
- Rendering current page components
*/

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile'; // <-- 1. Import your new Profile page

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Public Routes: No Sidebar/Navbar needed here */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 2. Protected Routes: Wrapped in AppLayout and ProtectedRoute */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* --- NEW PROFILE ROUTE --- */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* 3. Fallback: Redirect anything else to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;