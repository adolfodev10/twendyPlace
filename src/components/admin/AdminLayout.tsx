import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
  FileImage,
  Users2,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import AdminNotificationBell from '../AdminNotificationBell';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Pedidos' },
    { path: '/admin/products', icon: Package, label: 'Produtos' },
    { path: '/admin/clients', icon: Users, label: 'Clientes' },
    { path: '/admin/users', icon: UserCircle, label: 'Usuários' },
    { path: '/admin/proofPayment', icon: FileImage, label: 'Comprovativos' },
    { path: '/admin/partners', icon: Users2, label: 'Parceiros' },
  ];

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Logout realizado!');
    setIsSidebarOpen(false);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex">
      {/* ==================== OVERLAY MOBILE ==================== */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 animate-fadeIn"
          onClick={closeSidebar}
        />
      )}

      {/* ==================== SIDEBAR ==================== */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-[280px] lg:w-64
          bg-white/95 backdrop-blur-xl border-r border-slate-200/70
          flex flex-col z-50 shadow-xl lg:shadow-none
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-200/70 flex items-center justify-between flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group" onClick={closeSidebar}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm tracking-tight leading-tight">
                Twendy Create
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Painel Admin</p>
            </div>
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-2 text-[10px] font-bold text-slate-400 tracking-wider">
            MENU PRINCIPAL
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm shadow-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full" />
                )}
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span
                  className={`font-medium text-sm ${
                    isActive ? 'text-blue-700 font-semibold' : ''
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-200/70 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/60">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=2563eb&color=fff&size=64`
              }
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name || 'Admin'}
              </p>
              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 px-3 py-2 mt-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl w-full transition-all duration-200"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span className="font-medium">Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile menu + notificações) */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
            {/* Menu button (mobile) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            {/* Espaço vazio no desktop (o sidebar já tem o logo) */}
            <div className="hidden lg:block" />

            {/* Notificações + avatar */}
            <div className="flex items-center gap-2">
              <AdminNotificationBell />
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-in-out }
      `}</style>
    </div>
  );
};

export default AdminLayout;