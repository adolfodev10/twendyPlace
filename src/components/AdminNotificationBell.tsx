import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminNotifications } from '../contexts/AdminNotificationContext';
import {
  Bell,
  Package,
  FileText,
  X,
  Clock,
  CheckCheck,
  Trash2,
  ChevronRight,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminNotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    pendingOrdersCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useAdminNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  if (!isAdmin) return null;

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    navigate(`/admin/orders?orderId=${notification.orderId}`);
    setIsOpen(false);
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const now = new Date();
    let date: Date;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
    else date = new Date(timestamp);

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'new_order':
        return {
          icon: Package,
          gradient: 'from-emerald-500 to-teal-600',
          shadow: 'shadow-emerald-200',
          bg: 'bg-emerald-50/60 border-emerald-200/70',
          label: 'Novo pedido',
        };
      case 'payment_proof':
        return {
          icon: FileText,
          gradient: 'from-blue-500 to-indigo-600',
          shadow: 'shadow-blue-200',
          bg: 'bg-blue-50/60 border-blue-200/70',
          label: 'Comprovativo',
        };
      case 'status_change':
        return {
          icon: Clock,
          gradient: 'from-violet-500 to-purple-600',
          shadow: 'shadow-violet-200',
          bg: 'bg-violet-50/60 border-violet-200/70',
          label: 'Status',
        };
      default:
        return {
          icon: Bell,
          gradient: 'from-slate-500 to-slate-700',
          shadow: 'shadow-slate-200',
          bg: 'bg-slate-50/60 border-slate-200/70',
          label: 'Notificação',
        };
    }
  };

  const hasBadge = unreadCount > 0 || pendingOrdersCount > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
        }`}
        title="Notificações"
      >
        <Bell
          className={`w-5 h-5 transition-transform ${
            isAnimating ? 'animate-bell-shake' : ''
          } ${isOpen ? 'scale-105' : ''}`}
        />

        {/* Badge */}
        {hasBadge && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
            {unreadCount > 0 ? (
              <span className="min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md shadow-red-200">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : (
              <>
                <span className="w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full border-2 border-white shadow-md" />
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              </>
            )}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200/70 z-50 overflow-hidden animate-dropdownIn">
          {/* Header */}
          <div className="p-4 border-b border-slate-200/70 bg-gradient-to-br from-slate-50 to-blue-50/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Notificações
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {notifications.length}{' '}
                    {notifications.length === 1 ? 'item' : 'itens'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-blue-600"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-red-600"
                    title="Limpar todas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary chips */}
            {(pendingOrdersCount > 0 || unreadCount > 0) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {pendingOrdersCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                    <Package className="w-3 h-3" />
                    {pendingOrdersCount} pendente
                    {pendingOrdersCount > 1 ? 's' : ''}
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">
                  Nenhuma notificação
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Novos pedidos e comprovativos aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const style = getNotificationStyle(notification.type);
                  const Icon = style.icon;
                  const isUnread = !notification.read;

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group w-full text-left p-3.5 transition-all duration-200 hover:bg-slate-50 ${
                        isUnread ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} ${style.shadow} flex items-center justify-center shadow-md`}
                        >
                          <Icon className="w-4.5 h-4.5 text-white" />
                          {isUnread && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                {style.label}
                              </span>
                              <span className="text-[10px] text-slate-300">·</span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </div>

                          <p
                            className={`text-xs leading-relaxed line-clamp-2 ${
                              isUnread
                                ? 'text-slate-900 font-semibold'
                                : 'text-slate-600 font-medium'
                            }`}
                          >
                            {notification.message}
                          </p>

                          {notification.orderNumber && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              #{notification.orderNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200/70 bg-gradient-to-br from-slate-50 to-blue-50/40">
              <button
                onClick={() => {
                  navigate('/admin/orders');
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 py-1.5 hover:bg-white rounded-lg transition-colors group"
              >
                Ver todos os pedidos
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bellShake {
          0%, 100% { transform: rotate(0); }
          10%, 30% { transform: rotate(-10deg); }
          20%, 40% { transform: rotate(10deg); }
          50%, 60% { transform: rotate(-5deg); }
          70%, 80% { transform: rotate(5deg); }
          90% { transform: rotate(0); }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-bell-shake { animation: bellShake 0.8s ease-in-out; }
        .animate-dropdownIn { animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default AdminNotificationBell;