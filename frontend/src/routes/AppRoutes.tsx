import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import LoginPage from '../features/auth/LoginPage';
import MovieListPage from '../features/movies/MovieListPage';
import MovieDetailPage from '../features/movies/MovieDetailPage';
import SeatSelectionPage from '../features/bookings/SeatSelectionPage';
import UserProfilePage from '../features/profile/UserProfilePage';
import AdminDashboardPage from '../features/admin/AdminDashboardPage';
import AdminMoviePage from '../features/admin/AdminMoviePage';
import AdminShowPage from '../features/admin/AdminShowPage';
import { Navbar } from '../layouts/Navbar';
import { Footer } from '../layouts/Footer';

// User Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Admin Protected Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-dark-text font-sans">
      <Navbar />
      
      {/* Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Routes>
          {/* Guest Browsing */}
          <Route path="/" element={<MovieListPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/auth" element={<LoginPage />} />

          {/* User Booking Details (Protected) */}
          <Route
            path="/shows/:showId"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Management (Protected) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/movies"
            element={
              <AdminRoute>
                <AdminMoviePage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/shows"
            element={
              <AdminRoute>
                <AdminShowPage />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};
export default AppRoutes;
