import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AdminNotificationProvider } from './contexts/AdminNotificationContext';
import AdminNotificationBell from './components/AdminNotificationBell';
import { Package } from 'lucide-react';

// Pages
import Store from './pages/Store';
import AdminDashboard from './pages/AdminDashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import MyOrders from './pages/MyOrders';
import OrderConfirmation from './pages/OrderConfirmation';
import Profile from './pages/Profile';
import ProtectedRoute from './components/common/ProtectedRoute';

// Componente de Layout com Header
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Notificações */}
      {!isAuthPage && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <a href="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    Twendy
                  </span>
                </a>
              </div>

              {/* Ações do Header */}
              <div className="flex items-center gap-3">
                {/* Sino de Notificações (apenas Admin) */}
                {isAdmin && <AdminNotificationBell />}

                {/* Informações do Usuário */}
                {user && (
                  <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-700">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-700">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Conteúdo Principal */}
      <main>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AdminNotificationProvider>
        <CartProvider>
          <BrowserRouter>
            <AppLayout>
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
            </AppLayout>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                },
                success: {
                  style: {
                    background: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                  },
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#f0fdf4',
                  },
                },
                error: {
                  style: {
                    background: '#fef2f2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                  },
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fef2f2',
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