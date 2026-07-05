import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Pedidos' },
    { path: '/admin/products', icon: Package, label: 'Produtos' },
    { path: '/admin/clients', icon: Users, label: 'Clientes' },
  ];

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Logout realizado!');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-gray-900">Admin</span>
        </Link>
        <div className="w-10" /> {/* Spacer para centralizar */}
      </header>

      {/* Overlay para mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col z-50
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:w-64
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={closeSidebar}>
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="font-bold text-gray-900">Admin</span>
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${isActive ? 'text-primary-600' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=2563eb&color=fff`}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 mt-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`
        transition-all duration-300
        lg:ml-64
        ${isSidebarOpen ? 'ml-72' : 'ml-0'}
      `}>
        {/* Espaço para o header mobile */}
        <div className="lg:hidden h-16" />
        <div className="p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;