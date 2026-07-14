import React, { useState, useEffect } from 'react';
import { cartService } from '../../services/cartService';
import { Order } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
    Search,
    RefreshCw,
    Bell,
    Package,
    User,
    Calendar,
    DollarSign,
    AlertCircle,
    CheckCircle,
    Clock,
    Truck,
    XCircle,
    Send,
    Loader2,
    AlertTriangle,
    Eye,
    FileImage,
    Download,
    X,
    Shield,
    Check,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc, // 🔥 ADICIONADO
    serverTimestamp,
    setDoc,
    collection,
    arrayUnion,
    increment,
    writeBatch
} from 'firebase/firestore';
import { db } from '../../services/firebase';

// Configuração de transições de status permitidas
const STATUS_TRANSITIONS: Record<string, string[]> = {
    awaiting_payment: ['paid', 'cancelled'],
    paid: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
};

// Histórico de status
const STATUS_HISTORY: Record<string, { label: string; color: string; icon: any }> = {
    awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    paid: { label: 'Pago', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    processing: { label: 'Processando', color: 'bg-purple-100 text-purple-700', icon: Loader2 },
    shipped: { label: 'Enviado', color: 'bg-cyan-100 text-cyan-700', icon: Truck },
    delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

// Modal de Visualização de Comprovativo
const ProofViewerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    url: string;
    orderNumber: string;
}> = ({ isOpen, onClose, url, orderNumber }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileImage className="w-5 h-5 text-primary-600" />
                        Comprovativo - Pedido #{orderNumber}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[70vh]">
                    {url.match(/\.(pdf)$/i) ? (
                        <iframe src={url} className="w-full h-[500px] rounded-lg" title="Comprovativo PDF" />
                    ) : (
                        <img src={url} alt="Comprovativo" className="w-full rounded-lg" />
                    )}
                </div>
                <div className="p-4 border-t border-gray-200 flex gap-3">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Baixar
                    </a>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal de Confirmação para Status
const ConfirmModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    loading: boolean;
    confirmText?: string;
    cancelText?: string;
    warning?: string;
}> = ({ isOpen, onClose, onConfirm, title, message, loading, confirmText = 'Confirmar', cancelText = 'Cancelar', warning }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 ${warning ? 'bg-yellow-100' : 'bg-blue-100'} rounded-full`}>
                            {warning ? (
                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                            ) : (
                                <Shield className="w-6 h-6 text-blue-600" />
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    </div>
                    <p className="text-gray-600 mb-6">{message}</p>
                    {warning && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-yellow-700">{warning}</p>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 🔥 NOVO: Modal de Confirmação de Exclusão
const DeleteConfirmModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    orderNumber: string;
    loading: boolean;
}> = ({ isOpen, onClose, onConfirm, orderNumber, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminar Pedido</h3>
                    <p className="text-gray-600">
                        Tem certeza que deseja eliminar o pedido <strong>#{orderNumber}</strong>?
                    </p>
                    <p className="text-sm text-red-500 mt-1">Esta ação não pode ser desfeita.</p>
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OrdersManager: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [updating, setUpdating] = useState<string | null>(null);
    const [viewingProof, setViewingProof] = useState<{ orderId: string; url: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        orderId: string;
        newStatus: string;
        oldStatus: string;
        orderNumber: string;
        hasProof: boolean;
    }>({
        isOpen: false,
        orderId: '',
        newStatus: '',
        oldStatus: '',
        orderNumber: '',
        hasProof: false,
    });

    // 🔥 NOVO: Estado para o modal de exclusão
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        orderId: string;
        orderNumber: string;
    }>({
        isOpen: false,
        orderId: '',
        orderNumber: '',
    });

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
            toast.success(`Novo pedido #${newOrder.orderNumber} recebido!`, {
                duration: 5000,
                icon: <Package className="w-5 h-5" />,
            });
        }
        prevOrdersRef.current = newOrders;
    };

    const isTransitionAllowed = (fromStatus: string, toStatus: string): boolean => {
        if (fromStatus === toStatus) return false;
        return STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
    };

    const openConfirmModal = (orderId: string, newStatus: string, oldStatus: string, orderNumber: string) => {
        if (!isTransitionAllowed(oldStatus, newStatus)) {
            toast.error(`Não é possível mudar de "${STATUS_HISTORY[oldStatus]?.label || oldStatus}" para "${STATUS_HISTORY[newStatus]?.label || newStatus}"`);
            return;
        }

        const order = orders.find(o => o.id === orderId);
        const hasProof = !!order?.paymentProof;

        if (newStatus === 'paid' && !hasProof) {
            toast.error('Cliente não enviou comprovativo de pagamento', {
                icon: <AlertCircle className="w-5 h-5 text-red-500" />,
                duration: 5000,
            });
            return;
        }

        setConfirmModal({
            isOpen: true,
            orderId,
            newStatus,
            oldStatus,
            orderNumber,
            hasProof,
        });
    };

    // 🔥 NOVO: Abrir modal de exclusão
    const openDeleteModal = (orderId: string, orderNumber: string) => {
        setDeleteModal({
            isOpen: true,
            orderId,
            orderNumber,
        });
    };

    const executeStatusChange = async () => {
        const { orderId, newStatus, oldStatus, orderNumber } = confirmModal;
        setUpdating(orderId);

        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                toast.error('Pedido não encontrado');
                setUpdating(null);
                setConfirmModal({ isOpen: false, orderId: '', newStatus: '', oldStatus: '', orderNumber: '', hasProof: false });
                return;
            }

            const orderData = orderSnap.data() as Record<string, any>;
            const now = new Date().toISOString();

            const historyEntry = {
                from: oldStatus,
                to: newStatus,
                changedAt: now,
                changedBy: user?.uid || 'unknown',
                changedByName: user?.name || 'Sistema',
                validated: newStatus === 'paid' ? true : false,
                validatedBy: newStatus === 'paid' ? user?.uid : null,
                validatedByName: newStatus === 'paid' ? user?.name : null,
            };

            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: serverTimestamp(),
                updatedBy: user?.uid || 'unknown',
                updatedByName: user?.name || 'Sistema',
                statusHistory: arrayUnion(historyEntry),
                ...(newStatus === 'paid' && {
                    validatedBy: user?.uid,
                    validatedByName: user?.name,
                    validatedAt: now,
                })
            });

            if (newStatus === 'cancelled' && orderData.items) {
                if (oldStatus !== 'paid') {
                    await restoreStock(orderData.items);
                }
            }

            if (orderData?.userId) {
                await saveNotificationForClient(orderData.userId, {
                    orderId: orderId,
                    orderNumber: orderNumber || orderId.slice(-8),
                    oldStatus: oldStatus,
                    newStatus: newStatus,
                    message: `Status do pedido #${orderNumber || orderId.slice(-8)} atualizado para ${STATUS_HISTORY[newStatus]?.label || newStatus}`,
                    timestamp: now,
                    read: false,
                });
            }

            toast.success(`Status atualizado para: ${STATUS_HISTORY[newStatus]?.label || newStatus}`);

            if (newStatus === 'paid') {
                toast.success(`✅ Pagamento validado por ${user?.name || 'Administrador'}`, {
                    icon: <Check className="w-5 h-5 text-green-500" />,
                    duration: 5000,
                });
            }

            toast.success(`Notificação enviada para o cliente`, {
                icon: <Send className="w-5 h-5" />,
                duration: 3000,
            });

        } catch (error: any) {
            console.error('Erro ao atualizar status:', error);

            if (error.code === 'permission-denied') {
                toast.error('Sem permissão para alterar status');
            } else if (error.code === 'not-found') {
                toast.error('Pedido não encontrado');
            } else {
                toast.error('Erro ao atualizar status. Tente novamente.');
            }
        } finally {
            setUpdating(null);
            setConfirmModal({ isOpen: false, orderId: '', newStatus: '', oldStatus: '', orderNumber: '', hasProof: false });
        }
    };

    // 🔥 NOVO: Executar exclusão do pedido
    const executeDeleteOrder = async () => {
        const { orderId, orderNumber } = deleteModal;
        setDeleting(true);

        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                toast.error('Pedido não encontrado');
                setDeleting(false);
                setDeleteModal({ isOpen: false, orderId: '', orderNumber: '' });
                return;
            }

            const orderData = orderSnap.data();

            // 🔥 Restaurar estoque se o pedido não foi cancelado
            if (orderData.status !== 'cancelled' && orderData.items) {
                await restoreStock(orderData.items);
            }

            // 🔥 ELIMINAR O PEDIDO
            await deleteDoc(orderRef);

            toast.success(`Pedido #${orderNumber} eliminado com sucesso!`);
            setDeleteModal({ isOpen: false, orderId: '', orderNumber: '' });

            // 🔥 Recarregar a lista de pedidos
            setLoading(true);
            setTimeout(() => setLoading(false), 500);

        } catch (error: any) {
            console.error('Erro ao eliminar pedido:', error);
            toast.error('Erro ao eliminar pedido. Tente novamente.');
        } finally {
            setDeleting(false);
        }
    };

    const restoreStock = async (items: any[]) => {
        try {
            const batch = writeBatch(db);
            for (const item of items) {
                const productRef = doc(db, 'products', item.id);
                batch.update(productRef, {
                    stock: increment(item.qty),
                });
            }
            await batch.commit();
        } catch (error) {
            console.error('Erro ao restaurar estoque:', error);
        }
    };

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

    const getStatusIcon = (status: string) => {
        const Icon = STATUS_HISTORY[status]?.icon;
        if (!Icon) return <Package className="w-4 h-4 text-gray-500" />;
        const colors: Record<string, string> = {
            awaiting_payment: 'text-yellow-500',
            paid: 'text-blue-500',
            processing: 'text-purple-500',
            shipped: 'text-cyan-500',
            delivered: 'text-green-500',
            cancelled: 'text-red-500',
        };
        return <Icon className={`w-4 h-4 ${colors[status] || 'text-gray-500'}`} />;
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
            {/* Modal de Confirmação para Status */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, orderId: '', newStatus: '', oldStatus: '', orderNumber: '', hasProof: false })}
                onConfirm={executeStatusChange}
                title="Confirmar Mudança de Status"
                message={`Deseja alterar o pedido #${confirmModal.orderNumber} de "${STATUS_HISTORY[confirmModal.oldStatus]?.label || confirmModal.oldStatus}" para "${STATUS_HISTORY[confirmModal.newStatus]?.label || confirmModal.newStatus}"?`}
                loading={updating === confirmModal.orderId}
                confirmText="Confirmar"
                cancelText="Cancelar"
                warning={confirmModal.newStatus === 'paid' ? 'Ao confirmar, o pagamento será validado e o cliente será notificado.' : undefined}
            />

            {/* 🔥 NOVO: Modal de Confirmação de Exclusão */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, orderId: '', orderNumber: '' })}
                onConfirm={executeDeleteOrder}
                orderNumber={deleteModal.orderNumber}
                loading={deleting}
            />

            {/* Modal de Visualização de Comprovativo */}
            <ProofViewerModal
                isOpen={!!viewingProof}
                onClose={() => setViewingProof(null)}
                url={viewingProof?.url || ''}
                orderNumber={orders.find(o => o.id === viewingProof?.orderId)?.orderNumber || ''}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-primary-600" />
                        Gerenciar Pedidos
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
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
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto justify-center"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por pedido ou cliente..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-48">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center whitespace-nowrap">
                        Total: <span className="font-bold ml-1">{filteredOrders.length}</span> pedidos
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">
                                    <Package className="w-3.5 h-3.5 inline mr-1" />
                                    Pedido
                                </th>
                                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">
                                    <User className="w-3.5 h-3.5 inline mr-1" />
                                    Cliente
                                </th>
                                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden sm:table-cell">
                                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                                    Data
                                </th>
                                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">
                                    <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                                    Total
                                </th>
                                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">
                                    Status
                                </th>
                                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">
                                    <FileImage className="w-3.5 h-3.5 inline mr-1" />
                                    Comprovativo
                                </th>
                                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                        <p>Nenhum pedido encontrado</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const isUpdating = updating === order.id;
                                    const hasProof = !!order.paymentProof;
                                    const isPaidOrProcessing = order.status === 'paid' || order.status === 'processing';
                                    const isDeletable = order.status === 'cancelled' || order.status === 'delivered';

                                    return (
                                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-3 sm:px-4">
                                                <span className="font-medium text-gray-900 text-sm">
                                                    #{order.orderNumber}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm truncate max-w-[100px] sm:max-w-none">
                                                        {order.customer?.name || 'Cliente'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[150px]">
                                                        {order.customer?.email || ''}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 sm:px-4 text-gray-600 text-xs hidden sm:table-cell">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="py-3 px-3 sm:px-4 font-semibold text-gray-900 text-sm whitespace-nowrap">
                                                Kz {order.total?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span>{STATUS_HISTORY[order.status]?.label || order.status}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                {hasProof ? (
                                                    <button
                                                        onClick={() => setViewingProof({ orderId: order.id, url: order.paymentProof! })}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Ver comprovativo"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Ver</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg whitespace-nowrap">
                                                        Não enviado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => openConfirmModal(
                                                            order.id,
                                                            e.target.value,
                                                            order.status,
                                                            order.orderNumber || order.id.slice(-8)
                                                        )}
                                                        disabled={isUpdating || (order.status === 'delivered' || order.status === 'cancelled')}
                                                        className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:opacity-50 max-w-[110px]"
                                                    >
                                                        {statusOptions.filter(opt => opt.value !== 'all').map(opt => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {isUpdating && (
                                                        <Loader2 className="animate-spin w-4 h-4 text-primary-600" />
                                                    )}
                                                    {/* 🔥 BOTÃO DE ELIMINAR */}
                                                    {isDeletable && (
                                                        <button
                                                            onClick={() => openDeleteModal(order.id, order.orderNumber || order.id.slice(-8))}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar pedido"
                                                            disabled={isUpdating}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {!isDeletable && (
                                                        <span className="text-[10px] text-gray-400">Ativo</span>
                                                    )}
                                                    {!hasProof && order.status === 'awaiting_payment' && (
                                                        <span className="text-xs text-yellow-600 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Aguardando comprovativo
                                                        </span>
                                                    )}
                                                    {isPaidOrProcessing && (
                                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                                            <Check className="w-3 h-3" />
                                                            Validado
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrdersManager;