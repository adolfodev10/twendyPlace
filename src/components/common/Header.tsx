import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  User as UserIcon,
  Package,
  ChevronDown,
  Home,
  Sparkles,
} from 'lucide-react';
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
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email?.split('@')[0].slice(0, 2).toUpperCase() || 'U';
};

const UserAvatar: React.FC<{ user: UserType; size?: 'sm' | 'md' }> = ({
  user,
  size = 'sm',
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  if (user.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user.name || 'Usuário'}
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0`}
    >
      <span className={`text-white font-bold ${textClass}`}>
        {getInitials(user)}
      </span>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ cartCount, onCartClick, user }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Fecha dropdown ao clicar fora */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Fecha menu mobile ao mudar de rota */
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location.pathname]);

  /* Detecta scroll para blur */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Logout realizado com sucesso!');
    setIsUserDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shadow-sm shadow-slate-200/40'
            : 'bg-white/95 backdrop-blur-sm border-b border-slate-200/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ==================== LOGO ==================== */}
            <Link
              to="/"
              className="flex items-center gap-3 group flex-shrink-0"
            >
              {!logoError ? (
                <img
                  src={logo}
                  alt="Twendy Create"
                  className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-xl border border-slate-200/70 group-hover:scale-105 transition-transform duration-300"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-bold text-base">TC</span>
                </div>
              )}
              <div className="hidden sm:block">
                <p className="font-bold text-slate-900 text-sm tracking-tight leading-tight">
                  Twendy Create
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Loja Oficial
                </p>
              </div>
            </Link>

            {/* ==================== DESKTOP ==================== */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Nav: Home */}
              <Link
                to="/"
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  location.pathname === '/'
                    ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4" />
                Loja
              </Link>

              {/* Nav: Admin */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    location.pathname.startsWith('/admin')
                      ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Painel
                </Link>
              )}

              <div className="w-px h-6 bg-slate-200/70 mx-1.5" />

              {/* Carrinho */}
              <button
                onClick={onCartClick}
                className="relative p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                aria-label="Abrir carrinho"
              >
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md shadow-red-200 animate-pulse-slow">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              {/* User dropdown */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border transition-all duration-200 ${
                      isUserDropdownOpen
                        ? 'bg-slate-50 border-slate-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <UserAvatar user={user} />
                    <span className="hidden lg:inline text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                      {user.name || user.email?.split('@')[0] || 'Usuário'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isUserDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/70 py-2 z-50 animate-dropdownIn">
                      {/* Header do dropdown */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {user.name || 'Usuário'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/70 rounded-full">
                            <Sparkles className="w-2.5 h-2.5 text-red-500" />
                            <span className="text-[10px] font-bold text-red-700 tracking-wide">
                              ADMINISTRADOR
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Itens */}
                      <div className="py-1.5">
                        <Link
                          to="/my-orders"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                            <Package className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                          </div>
                          Meus pedidos
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-violet-50 flex items-center justify-center transition-colors">
                            <UserIcon className="w-4 h-4 text-slate-500 group-hover:text-violet-600 transition-colors" />
                          </div>
                          Meu perfil
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-amber-50 flex items-center justify-center transition-colors">
                              <LayoutDashboard className="w-4 h-4 text-slate-500 group-hover:text-amber-600 transition-colors" />
                            </div>
                            Painel admin
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="pt-1.5 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 w-full transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                            <LogOut className="w-4 h-4 text-red-500" />
                          </div>
                          Sair da conta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="group flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5 transition-all duration-300 ml-1"
                >
                  Entrar
                </Link>
              )}
            </div>

            {/* ==================== MOBILE TOGGLE ==================== */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Abrir menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* ==================== MOBILE MENU ==================== */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-xl animate-dropdownIn">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1.5">
              {/* User header mobile */}
              {user && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/70 mb-3">
                  <UserAvatar user={user} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {user.name || 'Usuário'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/70 rounded-full">
                      <Sparkles className="w-2.5 h-2.5 text-red-500" />
                      <span className="text-[10px] font-bold text-red-700">
                        ADMIN
                      </span>
                    </span>
                  )}
                </div>
              )}

              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Home className="w-4 h-4 text-slate-500" />
                Loja
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  Painel admin
                </Link>
              )}

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onCartClick();
                }}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors w-full"
              >
                <span className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4 text-slate-500" />
                  Carrinho
                </span>
                {cartCount > 0 && (
                  <span className="min-w-[22px] h-[22px] px-1.5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-red-200">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <>
                  <Link
                    to="/my-orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Package className="w-4 h-4 text-slate-500" />
                    Meus pedidos
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    Meu perfil
                  </Link>

                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da conta
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mt-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-200"
                >
                  Entrar na conta
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Animações */}
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-dropdownIn {
          animation: dropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default Header;