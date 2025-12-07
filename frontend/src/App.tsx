import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { UserRole } from './types';

// Pages
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import EventsPage from './pages/Events/EventsPage';
import EventDetailsPage from './pages/Events/EventDetailsPage';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageUsersPage from './pages/Admin/ManageUsersPage';
import PendingOrganizersPage from './pages/Admin/PendingOrganizersPage';
import ReportedEventsPage from './pages/Admin/ReportedEventsPage';

// Organizer Pages
import OrganizerDashboard from './pages/Organizer/OrganizerDashboard';
import CreateEventPage from './pages/Organizer/CreateEventPage';
import EditEventPage from './pages/Organizer/EditEventPage';
import ManageEventPage from './pages/Organizer/ManageEventPage';

// Attendee Pages
import AttendeeDashboard from './pages/Attendee/AttendeeDashboard';
import MyBookingsPage from './pages/Attendee/MyBookingsPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/login" element={<MainLayout><LoginPage /></MainLayout>} />
      <Route path="/register" element={<MainLayout><RegisterPage /></MainLayout>} />
      <Route path="/events" element={<MainLayout><EventsPage /></MainLayout>} />
      <Route path="/events/:id" element={<MainLayout><EventDetailsPage /></MainLayout>} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/admin/users"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <ManageUsersPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/admin/organizers/pending"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <PendingOrganizersPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <ReportedEventsPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />

      {/* Organizer Routes */}
      <Route
        path="/organizer/dashboard"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <OrganizerDashboard />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/organizer/events/create"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <CreateEventPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/organizer/events/:id/edit"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <EditEventPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/organizer/events/:id/manage"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <ManageEventPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />

      {/* Attendee Routes */}
      <Route
        path="/attendee/dashboard"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
              <AttendeeDashboard />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/attendee/bookings"
        element={
          <MainLayout>
            <ProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
              <MyBookingsPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
