import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AdminNotificationProvider } from './contexts/AdminNotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

const Store = lazy(() => import('./pages/Store'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Profile = lazy(() => import('./pages/Profile'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
        <div className="relative w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
      </div>
      <p className="text-slate-500 text-sm font-medium">Carregando...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <AdminNotificationProvider>
        <CartProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Store />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                  path="/my-orders"
                  element={
                    <ProtectedRoute>
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-confirmation/:orderId"
                  element={
                    <ProtectedRoute>
                      <OrderConfirmation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            <Toaster
              position="bottom-right"
              reverseOrder={false}
              gutter={10}
              containerClassName="!z-[9999]"
              toastOptions={{
                duration: 4000,
                className: '!font-sans',
                style: {
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: '1px solid #e2e8f0',
                  boxShadow:
                    '0 10px 30px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)',
                  maxWidth: '420px',
                },
                success: {
                  duration: 3500,
                  style: {
                    background:
                      'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                  },
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#f0fdf4',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background:
                      'linear-gradient(135deg, #fef2f2 0%, #fef1f2 100%)',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                  },
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fef2f2',
                  },
                },
                loading: {
                  style: {
                    background:
                      'linear-gradient(135deg, #eff6ff 0%, #eff6ff 100%)',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe',
                  },
                  iconTheme: {
                    primary: '#3b82f6',
                    secondary: '#eff6ff',
                  },
                },
              }}
            />
          </BrowserRouter>
        </CartProvider>
      </AdminNotificationProvider>
    </AuthProvider>
  );
}

export default App;