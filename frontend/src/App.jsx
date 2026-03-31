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
import AddSkill from "./pages/AddSkill";
import Listings from "./pages/Listings";
import SwapRequests from "./pages/SwapRequests";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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

        <Route
          path="/add-skill"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AddSkill />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/listings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Listings />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SwapRequests />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
