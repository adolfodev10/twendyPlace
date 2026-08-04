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
  ExternalLink
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
    clearNotifications 
  } = useAdminNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) return null;

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

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    navigate(`/admin/orders?orderId=${notification.orderId}`);
    setIsOpen(false);
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const now = new Date();
    let date: Date;
    
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <Package className="w-4 h-4 text-green-500" />;
      case 'payment_proof':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'status_change':
        return <Clock className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_order':
        return 'bg-green-50 border-green-200';
      case 'payment_proof':
        return 'bg-blue-50 border-blue-200';
      case 'status_change':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-primary-100 text-primary-700' 
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="Notificações"
      >
        <Bell 
          className={`w-5 h-5 transition-transform ${isAnimating ? 'animate-bell-shake' : ''}`} 
        />
        
        {/* Badge de contagem */}
        {(unreadCount > 0 || pendingOrdersCount > 0) && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center">
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
        )}

        {/* Indicador pulsante de novos pedidos */}
        {pendingOrdersCount > 0 && unreadCount === 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 animate-slide-down overflow-hidden">
          {/* Cabeçalho */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                Notificações
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                    title="Limpar todas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Resumo */}
            <div className="flex items-center gap-3 text-xs text-gray-600">
              {pendingOrdersCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                  <Package className="w-3 h-3" />
                  {pendingOrdersCount} pedido{pendingOrdersCount > 1 ? 's' : ''} pendente{pendingOrdersCount > 1 ? 's' : ''}
                </span>
              )}
              {unreadCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full font-medium">
                  <Bell className="w-3 h-3" />
                  {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhuma notificação</p>
                <p className="text-gray-400 text-xs mt-1">
                  As notificações de novos pedidos aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${
                      !notification.read ? 'bg-primary-50/50' : ''
                    } ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        !notification.read ? 'bg-white shadow-sm' : 'bg-gray-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            Pedido #{notification.orderNumber}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-gray-600 text-xs line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          <span className="text-[10px] text-primary-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3 h-3" />
                            Ver detalhes
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/admin/orders');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-1"
              >
                Ver todos os pedidos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;