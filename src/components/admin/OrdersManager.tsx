import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cartService } from '../../services/cartService';
import { Order } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
    Package,
    AlertCircle,
    CheckCircle,
    Clock,
    Truck,
    XCircle,
    Loader2,
    AlertTriangle,
    FileImage,
    Download,
    X,
    Shield,
    Check,
    Trash2,
    RefreshCw,
    Search,
    CheckSquare,
    Square,
    User,
    Calendar,
    DollarSign,
    Eye,
    Banknote,
    Building,
    Filter,
    Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    setDoc,
    collection,
    arrayUnion,
    increment,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { notificationService } from '../../services/notificationService';

/* ============================ CONSTANTES ============================ */
const STATUS_TRANSITIONS: Record<string, string[]> = {
    awaiting_payment: ['paid', 'processing', 'cancelled'],
    paid: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
};

const STATUS_HISTORY: Record<string, { label: string; badge: string; dot: string; icon: any }> = {
    awaiting_payment: {
        label: 'Aguardando',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        icon: Clock,
    },
    paid: {
        label: 'Pago',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        icon: CheckCircle,
    },
    processing: {
        label: 'Processando',
        badge: 'bg-violet-50 text-violet-700 border-violet-200',
        dot: 'bg-violet-500',
        icon: Loader2,
    },
    shipped: {
        label: 'Enviado',
        badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        dot: 'bg-cyan-500',
        icon: Truck,
    },
    delivered: {
        label: 'Entregue',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle,
    },
    cancelled: {
        label: 'Cancelado',
        badge: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
        icon: XCircle,
    },
};

/* ============================ MODAIS ============================ */

const ModalShell: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    zIndex?: string;
}> = ({ isOpen, onClose, children, size = 'md', zIndex = 'z-50' }) => {
    if (!isOpen) return null;
    const maxW = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

    return (
        <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />
            <div
                className={`relative bg-white/95 backdrop-blur-xl rounded-3xl ${maxW} w-full shadow-2xl shadow-slate-900/20 border border-slate-200/70 animate-modalSlideUp`}
            >
                {children}
            </div>
        </div>
    );
};

const ProofViewerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    url: string;
    orderNumber: string;
}> = ({ isOpen, onClose, url, orderNumber }) => {
    if (!isOpen) return null;

    return (
        <ModalShell isOpen={isOpen} onClose={onClose} size="lg" zIndex="z-[70]">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/70">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                        <FileImage className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Comprovativo — Pedido #{orderNumber}
                        </h3>
                        <p className="text-xs text-slate-500">Visualização do comprovativo enviado</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <X className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[65vh] bg-slate-50/50">
                {url.match(/\.(pdf)$/i) ? (
                    <iframe
                        src={url}
                        className="w-full h-[500px] rounded-xl border border-slate-200"
                        title="Comprovativo PDF"
                    />
                ) : (
                    <img src={url} alt="Comprovativo" className="w-full rounded-xl shadow-sm" />
                )}
            </div>

            <div className="p-5 border-t border-slate-200/70 flex gap-3">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all font-semibold text-sm"
                >
                    <Download className="w-4 h-4" />
                    Baixar comprovativo
                </a>
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
                >
                    Fechar
                </button>
            </div>
        </ModalShell>
    );
};

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
}> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    loading,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    warning,
}) => {
        if (!isOpen) return null;

        return (
            <ModalShell isOpen={isOpen} onClose={onClose} size="sm">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${warning
                                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                                }`}
                        >
                            {warning ? (
                                <AlertTriangle className="w-5 h-5 text-white" />
                            ) : (
                                <Shield className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{message}</p>

                    {warning && (
                        <div className="mb-5 p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-xl flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed">{warning}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all font-semibold text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
            </ModalShell>
        );
    };

const BulkDeleteConfirmModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    selectedCount: number;
    loading: boolean;
}> = ({ isOpen, onClose, onConfirm, selectedCount, loading }) => {
    if (!isOpen) return null;

    return (
        <ModalShell isOpen={isOpen} onClose={onClose} size="sm" zIndex="z-[60]">
            <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200 mb-4">
                    <Trash2 className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar pedidos</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                    Tem certeza que deseja eliminar{' '}
                    <strong className="text-slate-900">
                        {selectedCount} pedido{selectedCount > 1 ? 's' : ''}
                    </strong>
                    ?
                </p>
                <p className="text-xs text-red-500 mt-1 font-medium">
                    Esta ação não pode ser desfeita.
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        Apenas pedidos com status{' '}
                        <span className="font-bold text-red-600">Cancelado</span> ou{' '}
                        <span className="font-bold text-emerald-600">Entregue</span> podem ser
                        eliminados.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all font-semibold text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
        </ModalShell>
    );
};

/* ============================ COMPONENTE PRINCIPAL ============================ */

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

    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        orderId: string;
        newStatus: string;
        oldStatus: string;
        orderNumber: string;
        hasProof: boolean;
        paymentMethod: string;
    }>({
        isOpen: false,
        orderId: '',
        newStatus: '',
        oldStatus: '',
        orderNumber: '',
        hasProof: false,
        paymentMethod: 'multicaixa',
    });

    const [bulkDeleteModal, setBulkDeleteModal] = useState<{ isOpen: boolean }>({
        isOpen: false,
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

    useEffect(() => {
        setSelectedOrders(new Set());
        setSelectAll(false);
    }, [filter, search]);

    const prevOrdersRef = useRef<Order[]>([]);
    const isFirstLoadRef = useRef(true);

    const checkForNewOrders = (newOrders: Order[]) => {
        if (isFirstLoadRef.current) {
            prevOrdersRef.current = newOrders;
            isFirstLoadRef.current = false;
            return;
        }

        if (newOrders.length > prevOrdersRef.current.length) {
            const prevIds = new Set(prevOrdersRef.current.map((o) => o.id));
            const newOrdersList = newOrders.filter((o) => !prevIds.has(o.id));

            newOrdersList.forEach(async (newOrder) => {
                const exists = await notificationService.checkNotificationExists(
                    newOrder.id,
                    'new_order'
                );
                if (!exists) {
                    toast.success(`🛍️ Novo pedido #${newOrder.orderNumber} recebido!`, {
                        duration: 8000,
                        icon: <Package className="w-5 h-5 text-green-500" />,
                    });
                }
                notificationService.saveAdminNotification({
                    orderId: newOrder.id,
                    orderNumber: newOrder.orderNumber || newOrder.id.slice(-8),
                    message: `Novo pedido #${newOrder.orderNumber} de ${newOrder.customer?.name || 'Cliente'} - Kz ${newOrder.total?.toFixed(2)}`,
                    type: 'new_order',
                    status: newOrder.status,
                });
            });
        }

        prevOrdersRef.current.forEach(async (prevOrder) => {
            const currentOrder = newOrders.find((o) => o.id === prevOrder.id);
            if (currentOrder && !prevOrder.paymentProof && currentOrder.paymentProof) {
                const exists = await notificationService.checkNotificationExists(
                    currentOrder.id,
                    'payment_proof'
                );
                if (!exists) {
                    toast.success(`📎 Comprovativo enviado — Pedido #${currentOrder.orderNumber}`, {
                        duration: 6000,
                        icon: <FileImage className="w-5 h-5 text-blue-500" />,
                    });
                }
                notificationService.saveAdminNotification({
                    orderId: currentOrder.id,
                    orderNumber: currentOrder.orderNumber || currentOrder.id.slice(-8),
                    message: `Comprovativo de pagamento enviado para o pedido #${currentOrder.orderNumber}`,
                    type: 'payment_proof',
                    status: currentOrder.status,
                });
            }
        });

        prevOrdersRef.current = newOrders;
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            if (!search) return true;
            const searchLower = search.toLowerCase();
            return (
                order.orderNumber?.toLowerCase().includes(searchLower) ||
                order.customer?.name?.toLowerCase().includes(searchLower) ||
                order.customer?.email?.toLowerCase().includes(searchLower)
            );
        });
    }, [orders, search]);

    const getDeletableOrders = useMemo(() => {
        return filteredOrders.filter(
            (order) => order.status === 'cancelled' || order.status === 'delivered'
        );
    }, [filteredOrders]);

    const hasSelectableOrders = getDeletableOrders.length > 0;

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders((prev) => {
            const newSelected = new Set(prev);
            if (newSelected.has(orderId)) newSelected.delete(orderId);
            else newSelected.add(orderId);
            return newSelected;
        });
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedOrders(new Set());
            setSelectAll(false);
        } else {
            const allIds = new Set(getDeletableOrders.map((order) => order.id));
            setSelectedOrders(allIds);
            setSelectAll(true);
        }
    };

    useEffect(() => {
        if (getDeletableOrders.length > 0) {
            setSelectAll(selectedOrders.size === getDeletableOrders.length);
        } else {
            setSelectAll(false);
        }
    }, [selectedOrders, getDeletableOrders]);

    const isTransitionAllowed = (fromStatus: string, toStatus: string): boolean => {
        if (fromStatus === toStatus) return false;
        return STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
    };

    const openConfirmModal = (
        orderId: string,
        newStatus: string,
        oldStatus: string,
        orderNumber: string
    ) => {
        if (!isTransitionAllowed(oldStatus, newStatus)) {
            toast.error(
                `Não é possível mudar de "${STATUS_HISTORY[oldStatus]?.label || oldStatus}" para "${STATUS_HISTORY[newStatus]?.label || newStatus}"`
            );
            return;
        }

        const order = orders.find((o) => o.id === orderId);
        const hasProof = !!order?.paymentProof;
        const paymentMethod = order?.paymentMethod || 'multicaixa';

        if (newStatus === 'paid' && !hasProof && paymentMethod !== 'delivery') {
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
            paymentMethod,
        });
    };

    const openBulkDeleteModal = () => {
        if (selectedOrders.size === 0) {
            toast.error('Selecione pelo menos um pedido para eliminar');
            return;
        }
        setBulkDeleteModal({ isOpen: true });
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
                setConfirmModal({
                    isOpen: false,
                    orderId: '',
                    newStatus: '',
                    oldStatus: '',
                    orderNumber: '',
                    hasProof: false,
                    paymentMethod: 'multicaixa',
                });
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
                }),
            });

            if (newStatus === 'cancelled' && orderData.items) {
                if (oldStatus !== 'paid') {
                    await restoreStock(orderData.items);
                }
            }

            if (orderData?.userId) {
                await saveNotificationForClient(orderData.userId, {
                    orderId,
                    orderNumber: orderNumber || orderId.slice(-8),
                    oldStatus,
                    newStatus,
                    message: `Status do pedido #${orderNumber || orderId.slice(-8)} atualizado para ${STATUS_HISTORY[newStatus]?.label || newStatus}`,
                    timestamp: now,
                    read: false,
                });
            }

            notificationService.saveAdminNotification({
                orderId,
                orderNumber: orderNumber || orderId.slice(-8),
                message: `Status do pedido #${orderNumber || orderId.slice(-8)} alterado para ${STATUS_HISTORY[newStatus]?.label || newStatus}`,
                type: 'status_change',
                status: newStatus,
            });

            toast.success(`Status atualizado: ${STATUS_HISTORY[newStatus]?.label || newStatus}`);

            if (newStatus === 'paid') {
                toast.success(`✅ Pagamento validado por ${user?.name || 'Administrador'}`, {
                    icon: <Check className="w-5 h-5 text-green-500" />,
                    duration: 5000,
                });
            }
        } catch (error: any) {
            console.error('Erro ao atualizar status:', error);
            if (error.code === 'permission-denied') toast.error('Sem permissão para alterar status');
            else if (error.code === 'not-found') toast.error('Pedido não encontrado');
            else toast.error('Erro ao atualizar status. Tente novamente.');
        } finally {
            setUpdating(null);
            setConfirmModal({
                isOpen: false,
                orderId: '',
                newStatus: '',
                oldStatus: '',
                orderNumber: '',
                hasProof: false,
                paymentMethod: 'multicaixa',
            });
        }
    };

    const executeBulkDelete = async () => {
        if (selectedOrders.size === 0) return;

        setDeleting(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            const orderIds = Array.from(selectedOrders);
            const batchSize = 10;

            for (let i = 0; i < orderIds.length; i += batchSize) {
                const batch = writeBatch(db);
                const batchIds = orderIds.slice(i, i + batchSize);

                for (const orderId of batchIds) {
                    const orderRef = doc(db, 'orders', orderId);
                    const orderSnap = await getDoc(orderRef);

                    if (!orderSnap.exists()) {
                        errorCount++;
                        continue;
                    }

                    const orderData = orderSnap.data();

                    if (orderData.status !== 'cancelled' && orderData.items) {
                        const stockBatch = writeBatch(db);
                        for (const item of orderData.items) {
                            const productRef = doc(db, 'products', item.id);
                            stockBatch.update(productRef, { stock: increment(item.qty) });
                        }
                        await stockBatch.commit();
                    }

                    batch.delete(orderRef);
                    successCount++;
                }

                await batch.commit();
            }

            setSelectedOrders(new Set());
            setSelectAll(false);
            setBulkDeleteModal({ isOpen: false });

            if (successCount > 0)
                toast.success(`${successCount} pedido(s) eliminado(s) com sucesso!`);
            if (errorCount > 0) toast.error(`${errorCount} pedido(s) não encontrado(s)`);

            setLoading(true);
            setTimeout(() => setLoading(false), 500);
        } catch (error: any) {
            console.error('Erro ao eliminar pedidos:', error);
            toast.error('Erro ao eliminar pedidos. Tente novamente.');
        } finally {
            setDeleting(false);
        }
    };

    const restoreStock = async (items: any[]) => {
        try {
            const batch = writeBatch(db);
            for (const item of items) {
                const productRef = doc(db, 'products', item.id);
                batch.update(productRef, { stock: increment(item.qty) });
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
                userId,
                ...notification,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Erro ao salvar notificação:', error);
        }
    };

    const statusOptions = [
        { value: 'all', label: 'Todos os status' },
        { value: 'awaiting_payment', label: 'Aguardando pagamento' },
        { value: 'paid', label: 'Pago' },
        { value: 'processing', label: 'Processando' },
        { value: 'shipped', label: 'Enviado' },
        { value: 'delivered', label: 'Entregue' },
        { value: 'cancelled', label: 'Cancelado' },
    ];

    const formatDate = (date: any) => {
        if (!date) return '—';
        try {
            let d: Date | null = null;
            if (date.toDate) d = date.toDate();
            else if (date.seconds) d = new Date(date.seconds * 1000);
            else {
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) d = parsed;
            }
            if (!d) return '—';
            return d.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '—';
        }
    };

    /* ============================ LOADING ============================ */
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
                    <div className="relative w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Carregando pedidos...</p>
            </div>
        );
    }

    /* ============================ RENDER ============================ */
    return (
        <div className="w-full">
            {/* Modais */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() =>
                    setConfirmModal({
                        isOpen: false,
                        orderId: '',
                        newStatus: '',
                        oldStatus: '',
                        orderNumber: '',
                        hasProof: false,
                        paymentMethod: 'multicaixa',
                    })
                }
                onConfirm={executeStatusChange}
                title="Confirmar mudança de status"
                message={`Deseja alterar o pedido #${confirmModal.orderNumber} de "${STATUS_HISTORY[confirmModal.oldStatus]?.label || confirmModal.oldStatus}" para "${STATUS_HISTORY[confirmModal.newStatus]?.label || confirmModal.newStatus}"?`}
                loading={updating === confirmModal.orderId}
                warning={
                    confirmModal.newStatus === 'paid' && confirmModal.paymentMethod !== 'delivery'
                        ? 'Ao confirmar, o pagamento será validado e o cliente será notificado.'
                        : undefined
                }
            />

            <BulkDeleteConfirmModal
                isOpen={bulkDeleteModal.isOpen}
                onClose={() => setBulkDeleteModal({ isOpen: false })}
                onConfirm={executeBulkDelete}
                selectedCount={selectedOrders.size}
                loading={deleting}
            />

            <ProofViewerModal
                isOpen={!!viewingProof}
                onClose={() => setViewingProof(null)}
                url={viewingProof?.url || ''}
                orderNumber={orders.find((o) => o.id === viewingProof?.orderId)?.orderNumber || ''}
            />

            {/* ==================== HEADER ==================== */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-blue-100 shadow-sm mb-3">
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[11px] font-bold text-blue-700 tracking-wide">
                                GESTÃO DE PEDIDOS
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                            Pedidos
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            Atualizações em tempo real
                            <span className="text-xs text-slate-400">
                                · última: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedOrders.size > 0 && (
                            <button
                                onClick={openBulkDeleteModal}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all font-semibold text-sm shadow-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar ({selectedOrders.size})
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setLoading(true);
                                setTimeout(() => setLoading(false), 500);
                            }}
                            className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold text-sm shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            Atualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* ==================== FILTROS ==================== */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm p-4 mb-5">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    {/* Busca */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar por pedido, cliente ou email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none text-sm font-medium transition-all text-slate-900 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Select */}
                    <div className="w-full sm:w-56">
                        <div className="relative group">
                            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none text-sm font-medium transition-all text-slate-900 appearance-none cursor-pointer"
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <svg
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Contador */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500 whitespace-nowrap">
                            <strong className="text-slate-900 font-bold">{filteredOrders.length}</strong> pedidos
                        </span>
                    </div>
                </div>
            </div>

            {/* ==================== TABELA ==================== */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px]">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200/70">
                                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase w-12">
                                    {hasSelectableOrders && (
                                        <button
                                            onClick={toggleSelectAll}
                                            className="hover:bg-slate-200/70 rounded-md p-1 transition-colors"
                                            title={selectAll ? 'Desmarcar todos' : 'Selecionar todos'}
                                        >
                                            {selectAll ? (
                                                <CheckSquare className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <Square className="w-4 h-4 text-slate-400" />
                                            )}
                                        </button>
                                    )}
                                </th>
                                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                                    <Package className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                    Pedido
                                </th>
                                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                                    <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                    Cliente
                                </th>
                                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                                    <Banknote className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                    Pagamento
                                </th>
                                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase hidden lg:table-cell">
                                    <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                    Data
                                </th>
                                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                                    <DollarSign className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                    Total
                                </th>
                                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                                    Status
                                </th>
                                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                                    <FileImage className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                    Comprovativo
                                </th>
                                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16">
                                        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                            <AlertCircle className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">Nenhum pedido encontrado</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Ajuste os filtros ou aguarde novos pedidos
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const isUpdating = updating === order.id;
                                    const hasProof = !!order.paymentProof;
                                    const isPaidOrProcessing =
                                        order.status === 'paid' || order.status === 'processing';
                                    const isDeletable =
                                        order.status === 'cancelled' || order.status === 'delivered';
                                    const isSelected = selectedOrders.has(order.id);
                                    const paymentMethod = order.paymentMethod || 'multicaixa';
                                    const status = STATUS_HISTORY[order.status];

                                    return (
                                        <tr
                                            key={order.id}
                                            className={`border-b border-slate-100 transition-colors ${isSelected
                                                    ? 'bg-blue-50/60'
                                                    : 'hover:bg-slate-50/60'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="py-3.5 px-4">
                                                {isDeletable && (
                                                    <button
                                                        onClick={() => toggleOrderSelection(order.id)}
                                                        className="hover:bg-slate-200/70 rounded-md p-1 transition-colors"
                                                        title={isSelected ? 'Desmarcar' : 'Selecionar'}
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="w-4 h-4 text-blue-600" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-slate-400" />
                                                        )}
                                                    </button>
                                                )}
                                            </td>

                                            {/* Pedido */}
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-slate-900 text-sm">
                                                    #{order.orderNumber}
                                                </span>
                                            </td>

                                            {/* Cliente */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                            order.customer?.name || 'Cliente'
                                                        )}&background=2563eb&color=fff&size=64`}
                                                        alt={order.customer?.name}
                                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 text-sm truncate max-w-[140px]">
                                                            {order.customer?.name || 'Cliente'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                                                            {order.customer?.email || ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Pagamento */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${paymentMethod === 'delivery'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}
                                                >
                                                    {paymentMethod === 'delivery' ? (
                                                        <>
                                                            <Banknote className="w-3 h-3" />
                                                            Na entrega
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Building className="w-3 h-3" />
                                                            Transferência
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            {/* Data */}
                                            <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap hidden lg:table-cell">
                                                {formatDate(order.createdAt)}
                                            </td>

                                            {/* Total */}
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
                                                    Kz {order.total?.toFixed(2) || '0.00'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${status?.badge || 'bg-slate-50 text-slate-700 border-slate-200'}`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${status?.dot || 'bg-slate-400'}`}
                                                    />
                                                    {status?.label || order.status}
                                                </span>
                                            </td>

                                            {/* Comprovativo */}
                                            <td className="py-3.5 px-4">
                                                {hasProof ? (
                                                    <button
                                                        onClick={() =>
                                                            setViewingProof({ orderId: order.id, url: order.paymentProof! })
                                                        }
                                                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Ver
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap font-medium">
                                                        {paymentMethod === 'delivery' ? 'Não necessário' : 'Não enviado'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Ações */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) =>
                                                            openConfirmModal(
                                                                order.id,
                                                                e.target.value,
                                                                order.status,
                                                                order.orderNumber || order.id.slice(-8)
                                                            )
                                                        }
                                                        disabled={isUpdating || isDeletable}
                                                        className="px-2.5 py-1.5 border border-slate-200 bg-white/60 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed max-w-[130px] hover:border-slate-300 transition-colors cursor-pointer"
                                                    >
                                                        {statusOptions
                                                            .filter((opt) => opt.value !== 'all')
                                                            .map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                    </select>

                                                    {isUpdating && (
                                                        <Loader2 className="animate-spin w-3.5 h-3.5 text-blue-600" />
                                                    )}
                                                    {!hasProof &&
                                                        order.status === 'awaiting_payment' &&
                                                        paymentMethod === 'multicaixa' && (
                                                            <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-1 whitespace-nowrap">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Aguardando
                                                            </span>
                                                        )}
                                                    {isPaidOrProcessing && (
                                                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 whitespace-nowrap">
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

                {/* ==================== BARRA DE SELEÇÃO ==================== */}
                {selectedOrders.size > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200/70 px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                            <p className="text-sm text-blue-900">
                                <strong className="font-bold">{selectedOrders.size}</strong> pedido
                                {selectedOrders.size > 1 ? 's' : ''} selecionado
                                {selectedOrders.size > 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setSelectedOrders(new Set());
                                    setSelectAll(false);
                                }}
                                className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Limpar seleção
                            </button>
                            <button
                                onClick={openBulkDeleteModal}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all text-xs font-bold shadow-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Eliminar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ==================== ANIMAÇÕES ==================== */}
            <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-in-out }
        .animate-modalSlideUp { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) }
      `}</style>
        </div>
    );
};

export default OrdersManager;