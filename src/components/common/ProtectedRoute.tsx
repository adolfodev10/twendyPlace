import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  /* ==================== LOADING ==================== */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
            <div className="relative w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-slate-700 text-sm font-bold flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Verificando acesso
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Aguarde um instante...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ==================== NÃO AUTENTICADO ==================== */
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /* ==================== NÃO ADMIN ==================== */
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  /* ==================== AUTORIZADO ==================== */
  return <>{children}</>;
};

export default ProtectedRoute;