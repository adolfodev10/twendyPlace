import React, { useState, useEffect } from 'react';
import { cartService } from '../../services/cartService';
import { Order } from '../../types';
import { Search, RefreshCw, Bell} from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';

const OrdersManager: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);

        const unsubscribe = cartService.onAllOrders(
            (updatedOrders) => {
                setOrders(updatedOrders);
                setLastUpdated(new Date());
                setLoading(false);
                checkForNewOrders(updatedOrders);
            },
            filter,
            (error) => {
                console.error('Erro no listener:', error);
                toast.error('Erro ao carregar pedidos em tempo real');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [filter]);

    const prevOrdersRef = React.useRef<Order[]>([]);

    const checkForNewOrders = (newOrders: Order[]) => {
        if (prevOrdersRef.current.length > 0 && newOrders.length > prevOrdersRef.current.length) {
            const newOrder = newOrders[0];
            toast.success(`🔔 Novo pedido #${newOrder.orderNumber} recebido!`, {
                duration: 5000,
                icon: '🛒'
            });
        }
        prevOrdersRef.current = newOrders;
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        if (!newStatus) return;
        setUpdating(orderId);

        try {
            // Buscar o pedido antes de atualizar
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            
            if (!orderSnap.exists()) {
                toast.error('Pedido não encontrado');
                setUpdating(null);
                return;
            }

            const orderData = orderSnap.data() as Record<string, any>;
            const oldStatus = orderData?.status;

            // Atualizar status
            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });

            // 🔔 NOTIFICAR O CLIENTE (salvar notificação no Firebase)
            if (orderData?.userId) {
                await saveNotificationForClient(orderData.userId, {
                    orderId: orderId,
                    orderNumber: orderData.orderNumber || orderId.slice(-8),
                    oldStatus: oldStatus,
                    newStatus: newStatus,
                    message: `Status do pedido #${orderData.orderNumber || orderId.slice(-8)} atualizado para ${getStatusLabel(newStatus)}`,
                    timestamp: new Date().toISOString(),
                    read: false,
                });
            }

            toast.success(`✅ Status atualizado para: ${getStatusLabel(newStatus)}`);

            // 🔊 Notificação para o admin (feedback visual)
            toast.success(`📨 Notificação enviada para o cliente`, {
                icon: '📨',
                duration: 3000,
            });

        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            toast.error('Erro ao atualizar status');
        } finally {
            setUpdating(null);
        }
    };

    // Salvar notificação no Firestore para o cliente
    const saveNotificationForClient = async (userId: string, notification: any) => {
        try {
            const notificationsRef = doc(collection(db, 'notifications'));
            await setDoc(notificationsRef, {
                userId: userId,
                ...notification,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Erro ao salvar notificação:', error);
        }
    };

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            awaiting_payment: 'Aguardando Pagamento',
            paid: 'Pago',
            processing: 'Processando',
            shipped: 'Enviado',
            delivered: 'Entregue',
            cancelled: 'Cancelado',
        };
        return labels[status] || status;
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

    const statusColors: Record<string, string> = {
        awaiting_payment: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-blue-100 text-blue-700',
        processing: 'bg-purple-100 text-purple-700',
        shipped: 'bg-cyan-100 text-cyan-700',
        delivered: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    const statusLabels: Record<string, string> = {
        awaiting_payment: 'Aguardando Pagamento',
        paid: 'Pago',
        processing: 'Processando',
        shipped: 'Enviado',
        delivered: 'Entregue',
        cancelled: 'Cancelado',
    };

    const formatDate = (date: any) => {
        if (!date) return 'Data não disponível';
        try {
            if (date.toDate) {
                return date.toDate().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
            if (date.seconds) {
                return new Date(date.seconds * 1000).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
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

    const filteredOrders = orders.filter(order => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            order.orderNumber?.toLowerCase().includes(searchLower) ||
            order.customer?.name?.toLowerCase().includes(searchLower) ||
            order.customer?.email?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Pedidos</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Atualizações em tempo real
                        <span className="text-xs text-gray-400">
                            (Última atualização: {lastUpdated.toLocaleTimeString()})
                        </span>
                    </p>
                </div>
                <button
                    onClick={() => {
                        setLoading(true);
                        setTimeout(() => setLoading(false), 500);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por pedido ou cliente..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="w-48">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                        Total: <span className="font-bold ml-1">{filteredOrders.length}</span> pedidos
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Pedido</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cliente</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Data</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        Nenhum pedido encontrado
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-900">
                                            #{order.orderNumber}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{order.customer?.name || 'Cliente'}</p>
                                                <p className="text-sm text-gray-500">{order.customer?.email || ''}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 text-sm">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-900">
                                            Kz {order.total.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                                {statusLabels[order.status]}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    disabled={updating === order.id}
                                                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:opacity-50"
                                                >
                                                    {statusOptions.filter(opt => opt.value !== 'all').map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                {updating === order.id && (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrdersManager;