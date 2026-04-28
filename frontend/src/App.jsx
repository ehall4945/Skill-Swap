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
import ChatApp from './components/ChatApp';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import AddSkill from "./pages/AddSkill";
import Listings from "./pages/Listings";
import NotificationPage from "./pages/NotificationPage";
import SwapRequests from "./pages/SwapRequests";
import BlockedList from './pages/BlockedList';
import RateUser from "./pages/RateUser";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
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
            path="/chat"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ChatApp />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/blocked"
            element={
              <ProtectedRoute>
              <AppLayout>
                <BlockedList />
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
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PublicProfile />
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
            path="/skills/new"
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
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NotificationPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rate"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RateUser />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
