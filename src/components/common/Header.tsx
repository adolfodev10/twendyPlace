import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { User as UserType } from '../../types';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const logo = '/logo.jpg';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  user: UserType | null;
}

const getInitials = (user: UserType): string => {
  if (user.name && user.name.trim()) {
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email?.split('@')[0].slice(0, 2).toUpperCase() || 'U';
};

const UserAvatar: React.FC<{ user: UserType }> = ({ user }) => {
  const [imgError, setImgError] = useState(false);

  if (user.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user.name || 'Usuário'}
        className="w-8 h-8 rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
      <span className="text-white font-bold text-sm">
        {getInitials(user)}
      </span>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ cartCount, onCartClick, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Logout realizado com sucesso!');
    setIsUserDropdownOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            {!logoError ? (
              <img
                src={logo}
                alt="Twendy Create"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">TC</span>
              </div>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}

            <button onClick={onCartClick} className="relative p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <UserAvatar user={user} />
                  <span className="hidden lg:inline">
                    {user.name || user.email?.split('@')[0] || 'Usuário'}
                  </span>
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link to="/my-orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserDropdownOpen(false)}>
                      <ShoppingCart className="w-4 h-4" />
                      Meus Pedidos
                    </Link>
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-700 hover:text-primary-600">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {user?.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}
              <button onClick={() => { setIsMenuOpen(false); onCartClick(); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg">
                <ShoppingCart className="w-4 h-4" />
                Carrinho ({cartCount})
              </button>
              {user ? (
                <>
                  <Link to="/my-orders" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <ShoppingCart className="w-4 h-4" />
                    Meus Pedidos
                  </Link>
                  <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg text-center" onClick={() => setIsMenuOpen(false)}>
                  Entrar
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;