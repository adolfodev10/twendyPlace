import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { cartService } from '../services/cartService';
import { notificationService } from '../services/notificationService';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle, 
  ArrowLeft, 
  Bell,
  Volume2,
  VolumeX,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// 🔥 Componente de Skeleton Loading
const OrderSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-48" />
                </div>
                <div className="text-right">
                    <div className="h-6 bg-gray-200 rounded w-24 mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 w-12 bg-gray-200 rounded-lg" />
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-48" />
            </div>
        </div>
    );
};

const MyOrders: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [notificationCount, setNotificationCount] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [unreadNotifications, setUnreadNotifications] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    const previousOrdersRef = useRef<Order[]>([]);
    const isFirstLoadRef = useRef<boolean>(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = cartService.onUserOrders(
            user.uid,
            (updatedOrders) => {
                const statusChanges = getStatusChanges(previousOrdersRef.current, updatedOrders);
                
                setOrders(updatedOrders);
                setLastUpdated(new Date());
                setLoading(false);

                if (!isFirstLoadRef.current && statusChanges.length > 0) {
                    statusChanges.forEach(change => {
                        showStatusNotification(change);
                    });

                    setNotificationCount(prev => prev + statusChanges.length);
                    setUnreadNotifications(prev => [
                        ...prev,
                        ...statusChanges.map(c => c.orderId)
                    ]);
                }

                previousOrdersRef.current = updatedOrders;
                isFirstLoadRef.current = false;
            },
            (error: any) => {
                console.error('Erro no listener:', error);
                if (error.code === 'permission-denied') {
                    toast.error('Sem permissão para acessar pedidos');
                } else if (error.code === 'unavailable') {
                    toast.error('Serviço indisponível. Tente novamente.');
                } else {
                    toast.error('Erro ao carregar pedidos em tempo real');
                }
                setLoading(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [user]);

    const getStatusChanges = (oldOrders: Order[], newOrders: Order[]) => {
        const changes: {
            orderNumber: string;
            oldStatus: string;
            newStatus: string;
            orderId: string;
        }[] = [];

        newOrders.forEach((newOrder) => {
            const oldOrder = oldOrders.find(o => o.id === newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
                changes.push({
                    orderNumber: newOrder.orderNumber || newOrder.id.slice(-8),
                    oldStatus: oldOrder.status,
                    newStatus: newOrder.status,
                    orderId: newOrder.id,
                });
            }
        });

        return changes;
    };

    const showStatusNotification = (change: {
        orderNumber: string;
        oldStatus: string;
        newStatus: string;
        orderId: string;
    }) => {
        const statusLabels: Record<string, string> = {
            awaiting_payment: 'Aguardando Pagamento',
            paid: 'Pago',
            processing: 'Processando',
            shipped: 'Enviado',
            delivered: 'Entregue',
            cancelled: 'Cancelado',
        };

        const getStatusIcon = (status: string) => {
            switch (status) {
                case 'awaiting_payment':
                    return <Clock className="h-5 w-5" />;
                case 'paid':
                    return <CheckCircle className="h-5 w-5" />;
                case 'processing':
                    return <Package className="h-5 w-5" />;
                case 'shipped':
                    return <Truck className="h-5 w-5" />;
                case 'delivered':
                    return <CheckCircle className="h-5 w-5" />;
                case 'cancelled':
                    return <XCircle className="h-5 w-5" />;
                default:
                    return <Package className="h-5 w-5" />;
            }
        }


        const label = statusLabels[change.newStatus] || change.newStatus;
        const icon = getStatusIcon(change.newStatus);

        notificationService.showNotification(
            `Pedido #${change.orderNumber}: ${label}`,
            {
                type: change.newStatus === 'cancelled' ? 'error' : 
                       change.newStatus === 'delivered' ? 'success' : 'info',
                duration: 8000,
                icon: icon as any,
                sound: true,
                onClick: () => {
                    window.location.href = `/order-confirmation/${change.orderId}`;
                }
            }
        );

        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification(
                    `Pedido #${change.orderNumber}`,
                    ({
                        body: `Status atualizado: ${label}`,
                        icon: '/favicon.ico',
                        vibrate: [200, 100, 200],
                    } as any)
                );
                setTimeout(() => notification.close(), 8000);
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    window.location.href = `/order-confirmation/${change.orderId}`;
                };
            } catch (error) {
                console.debug('Erro na notificação do navegador:', error);
            }
        }

        setTimeout(() => {
            setUnreadNotifications(prev => 
                prev.filter(id => id !== change.orderId)
            );
        }, 1000);
    };
    
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(() => {
            });
        }
    }, []);

    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        notificationService.toggleSound(newState);
        toast.success(newState ? 'Som ativado' : 'Som desativado');
    };

    const markAllAsRead = () => {
        if (notificationCount === 0) {
            toast.custom('Nenhuma notificação para marcar como lida');
            return;
        }
        setNotificationCount(0);
        setUnreadNotifications([]);
        toast.success('Todas as notificações marcadas como lidas');
    };

    // 🔥 Filtrar pedidos por status
    const filteredOrders = statusFilter === 'all' 
        ? orders 
        : orders.filter(order => order.status === statusFilter);

    const getStatusIcon = (status: string) => {
        const iconMap: Record<string, any> = {
            awaiting_payment: Clock,
            paid: CheckCircle,
            processing: Package,
            shipped: Truck,
            delivered: CheckCircle,
            cancelled: XCircle,
        };
        const Icon = iconMap[status] || Package;
        const colorMap: Record<string, string> = {
            awaiting_payment: 'text-yellow-500',
            paid: 'text-blue-500',
            processing: 'text-purple-500',
            shipped: 'text-cyan-500',
            delivered: 'text-green-500',
            cancelled: 'text-red-500',
        };
        return <Icon className={`h-5 w-5 ${colorMap[status] || 'text-gray-500'}`} />;
    };

    const getStatusColor = (status: string) => {
        const colorMap: Record<string, string> = {
            awaiting_payment: 'bg-yellow-100 text-yellow-700',
            paid: 'bg-blue-100 text-blue-700',
            processing: 'bg-purple-100 text-purple-700',
            shipped: 'bg-cyan-100 text-cyan-700',
            delivered: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return colorMap[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (status: string) => {
        const labelMap: Record<string, string> = {
            awaiting_payment: 'Aguardando Pagamento',
            paid: 'Pago',
            processing: 'Processando',
            shipped: 'Enviado',
            delivered: 'Entregue',
            cancelled: 'Cancelado',
        };
        return labelMap[status] || status;
    };

    const formatDate = (date: any) => {
        if (!date) return 'Data não disponível';
        try {
            if (date.toDate) {
                return date.toDate().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
            if (date.seconds) {
                return new Date(date.seconds * 1000).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
            return 'Data não disponível';
        } catch {
            return 'Data não disponível';
        }
    };

    const statusOptions = [
        { value: 'all', label: 'Todos' },
        { value: 'awaiting_payment', label: 'Aguardando Pagamento' },
        { value: 'paid', label: 'Pago' },
        { value: 'processing', label: 'Processando' },
        { value: 'shipped', label: 'Enviado' },
        { value: 'delivered', label: 'Entregue' },
        { value: 'cancelled', label: 'Cancelado' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="h-6 w-6 text-primary-600" />
                            Meus Pedidos
                        </h1>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <OrderSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="h-6 w-6 text-primary-600" />
                            Meus Pedidos
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Atualizações em tempo real
                            <span className="text-xs text-gray-400">
                                (Última atualização: {lastUpdated.toLocaleTimeString()})
                            </span>
                            {notificationCount > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    {notificationCount} novas
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={toggleSound}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                        >
                            {soundEnabled ? (
                                <Volume2 className="h-5 w-5" />
                            ) : (
                                <VolumeX className="h-5 w-5" />
                            )}
                        </button>
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar à loja
                        </Link>
                    </div>
                </div>

                {/* 🔥 Filtro de Status */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {statusOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                statusFilter === opt.value
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {notificationCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="mb-4 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                    >
                        <Bell className="h-4 w-4" />
                        Marcar todas como lidas
                    </button>
                )}

                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhum pedido encontrado</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {orders.length === 0 
                                ? 'Você ainda não fez nenhum pedido.' 
                                : 'Nenhum pedido com o filtro selecionado.'}
                        </p>
                        {orders.length > 0 && statusFilter !== 'all' && (
                            <button
                                onClick={() => setStatusFilter('all')}
                                className="mt-4 text-sm text-primary-600 hover:text-primary-700"
                            >
                                <RefreshCw className="h-4 w-4 inline mr-1" />
                                Limpar filtro
                            </button>
                        )}
                        {orders.length === 0 && (
                            <Link
                                to="/"
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Começar a comprar
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                            const isUnread = unreadNotifications.includes(order.id);
                            return (
                                <div
                                    key={order.id}
                                    className={`bg-white rounded-xl border p-6 hover:shadow-md transition-all relative ${
                                        isUnread 
                                            ? 'border-primary-400 shadow-md bg-primary-50/30' 
                                            : 'border-gray-200'
                                    }`}
                                >
                                    {isUnread && (
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                            NOVO
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-gray-900">
                                                    Pedido #{order.orderNumber}
                                                </h3>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span className="ml-1">{getStatusLabel(order.status)}</span>
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-primary-600">
                                                Kz {order.total.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {order.items.slice(0, 4).map((item) => (
                                            <img
                                                key={item.id}
                                                src={item.image}
                                                alt={item.name}
                                                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                                }}
                                            />
                                        ))}
                                        {order.items.length > 4 && (
                                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                                +{order.items.length - 4}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium">Entrega:</span>{' '}
                                            {order.customer?.address || 'Endereço não informado'}
                                        </div>
                                        <Link
                                            to={`/order-confirmation/${order.id}`}
                                            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-1"
                                        >
                                            Ver detalhes
                                            <ArrowLeft className="h-3 w-3 rotate-180" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;