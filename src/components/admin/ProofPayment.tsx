import React, { useState, useEffect } from 'react';
import { cartService } from '../../services/cartService';
import { Order } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
    Search,
    RefreshCw,
    Bell,
    Package,
    AlertCircle,
    CheckCircle,
    Clock,
    Truck,
    XCircle,
    Loader2,
    AlertTriangle,
    Eye,
    FileImage,
    Download,
    X,
    Check,
    FileCheck,
    FileX,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    doc,
    updateDoc,
    serverTimestamp,
    setDoc,
    collection,
    arrayUnion,
} from 'firebase/firestore';
import { db } from '../../services/firebase';

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
    customerName: string;
}> = ({ isOpen, onClose, url, orderNumber, customerName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileImage className="w-5 h-5 text-primary-600" />
                            Comprovativo de Pagamento
                        </h3>
                        <p className="text-sm text-gray-500">
                            Pedido #{orderNumber} - {customerName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[70vh] bg-gray-50">
                    {url.match(/\.(pdf)$/i) ? (
                        <iframe src={url} className="w-full h-[500px] rounded-lg border border-gray-200" title="Comprovativo PDF" />
                    ) : (
                        <img src={url} alt="Comprovativo" className="w-full rounded-lg border border-gray-200" />
                    )}
                </div>
                <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Baixar Comprovativo
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

// Modal de Confirmação para validar pagamento
const ValidatePaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    order: Order | null;
    loading: boolean;
}> = ({ isOpen, onClose, onConfirm, order, loading }) => {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-full">
                            <FileCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Validar Pagamento</h3>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Pedido:</span> #{order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Cliente:</span> {order.customer?.name || 'Cliente'}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Total:</span> Kz {order.total?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Status atual:</span>{' '}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                <Clock className="w-3 h-3" />
                                Aguardando Pagamento
                            </span>
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-700">
                            Ao confirmar, o status do pedido será alterado para <strong>"Pago"</strong> e o cliente será notificado.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
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
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Validando...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Confirmar Pagamento
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal para rejeitar comprovativo
const RejectProofModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    order: Order | null;
    loading: boolean;
}> = ({ isOpen, onClose, onConfirm, order, loading }) => {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 rounded-full">
                            <FileX className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Rejeitar Comprovativo</h3>
                    </div>

                    <p className="text-gray-600 mb-4">
                        Tem certeza que deseja rejeitar o comprovativo do pedido <strong>#{order.orderNumber}</strong>?
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">
                            O pedido permanecerá com status <strong>"Aguardando Pagamento"</strong> e o cliente poderá enviar um novo comprovativo.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
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
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4" />
                                    Rejeitar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProofPayment: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'with_proof' | 'without_proof'>('all');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [viewingProof, setViewingProof] = useState<{ orderId: string; url: string } | null>(null);
    const [validateModal, setValidateModal] = useState<Order | null>(null);
    const [rejectModal, setRejectModal] = useState<Order | null>(null);
    const [validating, setValidating] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

    useEffect(() => {
        setLoading(true);

        const unsubscribe = cartService.onAllOrders(
            (updatedOrders) => {
                setOrders(updatedOrders);
                setLastUpdated(new Date());
                setLoading(false);
            },
            undefined,
            (error) => {
                console.error('Erro no listener:', error);
                toast.error('Erro ao carregar pedidos em tempo real');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Filtrar pedidos com comprovativos
    const ordersWithProof = orders.filter(order => order.paymentProof);
    const ordersWithoutProof = orders.filter(order => !order.paymentProof);

    const getFilteredOrders = () => {
        let filtered = orders;

        if (filter === 'with_proof') {
            filtered = ordersWithProof;
        } else if (filter === 'without_proof') {
            filtered = ordersWithoutProof;
        }

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(order =>
                order.orderNumber?.toLowerCase().includes(searchLower) ||
                order.customer?.name?.toLowerCase().includes(searchLower) ||
                order.customer?.email?.toLowerCase().includes(searchLower)
            );
        }

        const getTimeValue = (value: any) => {
            if (!value) return 0;
            if (typeof value.toDate === 'function') return value.toDate().getTime();
            if (value instanceof Date) return value.getTime();
            return new Date(value).getTime();
        };

        // Ordenar por data (mais recentes primeiro)
        filtered.sort((a, b) => {
            const dateA = getTimeValue(a.createdAt);
            const dateB = getTimeValue(b.createdAt);
            return dateB - dateA;
        });

        return filtered;
    };

    const filteredOrders = getFilteredOrders();

    const toggleExpand = (orderId: string) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const validatePayment = async (order: Order) => {
        setValidating(true);
        try {
            const orderRef = doc(db, 'orders', order.id);
            const now = new Date().toISOString();

            const historyEntry = {
                from: order.status,
                to: 'paid',
                changedAt: now,
                changedBy: user?.uid || 'unknown',
                changedByName: user?.name || 'Sistema',
                validated: true,
                validatedBy: user?.uid,
                validatedByName: user?.name,
            };

            await updateDoc(orderRef, {
                status: 'paid',
                updatedAt: serverTimestamp(),
                updatedBy: user?.uid || 'unknown',
                updatedByName: user?.name || 'Sistema',
                statusHistory: arrayUnion(historyEntry),
                validatedBy: user?.uid,
                validatedByName: user?.name,
                validatedAt: now,
            });

            // Notificar cliente
            if (order.userId) {
                await saveNotificationForClient(order.userId, {
                    orderId: order.id,
                    orderNumber: order.orderNumber || order.id.slice(-8),
                    oldStatus: order.status,
                    newStatus: 'paid',
                    message: `✅ Pagamento do pedido #${order.orderNumber || order.id.slice(-8)} foi validado!`,
                    timestamp: now,
                    read: false,
                });
            }

            toast.success(`✅ Pagamento do pedido #${order.orderNumber} validado com sucesso!`);
            setValidateModal(null);

        } catch (error: any) {
            console.error('Erro ao validar pagamento:', error);
            toast.error('Erro ao validar pagamento. Tente novamente.');
        } finally {
            setValidating(false);
        }
    };

    const rejectProof = async (order: Order) => {
        setRejecting(true);
        try {
            // Apenas notificar o cliente que o comprovativo foi rejeitado
            if (order.userId) {
                await saveNotificationForClient(order.userId, {
                    orderId: order.id,
                    orderNumber: order.orderNumber || order.id.slice(-8),
                    oldStatus: order.status,
                    newStatus: order.status,
                    message: `❌ O comprovativo do pedido #${order.orderNumber || order.id.slice(-8)} foi rejeitado. Por favor, envie um novo comprovativo.`,
                    timestamp: new Date().toISOString(),
                    read: false,
                });
            }

            toast(`Comprovativo do pedido #${order.orderNumber} foi rejeitado.`, {
                icon: '❌',
            });
            setRejectModal(null);

        } catch (error: any) {
            console.error('Erro ao rejeitar comprovativo:', error);
            toast.error('Erro ao rejeitar comprovativo. Tente novamente.');
        } finally {
            setRejecting(false);
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

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            awaiting_payment: 'bg-yellow-100 text-yellow-700',
            paid: 'bg-blue-100 text-blue-700',
            processing: 'bg-purple-100 text-purple-700',
            shipped: 'bg-cyan-100 text-cyan-700',
            delivered: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (status: string) => {
        return STATUS_HISTORY[status]?.label || status;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const stats = {
        total: orders.length,
        withProof: ordersWithProof.length,
        withoutProof: ordersWithoutProof.length,
        pendingValidation: ordersWithProof.filter(o => o.status === 'awaiting_payment').length,
    };

    return (
        <div>
            {/* Modais */}
            <ProofViewerModal
                isOpen={!!viewingProof}
                onClose={() => setViewingProof(null)}
                url={viewingProof?.url || ''}
                orderNumber={orders.find(o => o.id === viewingProof?.orderId)?.orderNumber || ''}
                customerName={orders.find(o => o.id === viewingProof?.orderId)?.customer?.name || ''}
            />

            <ValidatePaymentModal
                isOpen={!!validateModal}
                onClose={() => setValidateModal(null)}
                onConfirm={() => validateModal && validatePayment(validateModal)}
                order={validateModal}
                loading={validating}
            />

            <RejectProofModal
                isOpen={!!rejectModal}
                onClose={() => setRejectModal(null)}
                onConfirm={() => rejectModal && rejectProof(rejectModal)}
                order={rejectModal}
                loading={rejecting}
            />

            {/* Header */}
            <div className="flex lg:-mt-32 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileImage className="w-6 h-6 text-primary-600" />
                        Gerenciar Comprovativos
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total de Pedidos</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.withProof}</p>
                    <p className="text-xs text-gray-500">Com Comprovativo</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <p className="text-lg sm:text-2xl font-bold text-red-500">{stats.withoutProof}</p>
                    <p className="text-xs text-gray-500">Sem Comprovativo</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <p className="text-lg sm:text-2xl font-bold text-yellow-500">{stats.pendingValidation}</p>
                    <p className="text-xs text-gray-500">Aguardando Validação</p>
                </div>
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
                            onChange={(e) => setFilter(e.target.value as typeof filter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        >
                            <option value="all">Todos</option>
                            <option value="with_proof">Com Comprovativo</option>
                            <option value="without_proof">Sem Comprovativo</option>
                        </select>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center whitespace-nowrap">
                        Mostrando: <span className="font-bold ml-1">{filteredOrders.length}</span> pedidos
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <FileImage className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhum pedido encontrado</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {filter === 'with_proof'
                                ? 'Nenhum pedido com comprovativo enviado.'
                                : filter === 'without_proof'
                                    ? 'Todos os pedidos já têm comprovativo.'
                                    : 'Nenhum pedido encontrado com os filtros atuais.'}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const hasProof = !!order.paymentProof;
                        const isExpanded = expandedOrders.has(order.id);
                        const isAwaitingPayment = order.status === 'awaiting_payment';

                        return (
                            <div
                                key={order.id}
                                className={`bg-white rounded-xl border transition-all ${hasProof ? 'border-green-200 hover:border-green-300' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {/* Card Header - sempre visível */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleExpand(order.id)}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-900 text-sm">
                                                #{order.orderNumber}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                <span className="ml-1">{getStatusLabel(order.status)}</span>
                                            </span>
                                            {hasProof && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    <FileCheck className="w-3 h-3 inline mr-1" />
                                                    Comprovativo
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-gray-900">
                                                Kz {order.total?.toFixed(2) || '0.00'}
                                            </span>
                                            <span className="text-xs text-gray-500 hidden sm:inline">
                                                {order.customer?.name || 'Cliente'}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body - expandido */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Cliente</p>
                                                <p className="text-sm font-medium text-gray-900">{order.customer?.name || 'Cliente'}</p>
                                                <p className="text-xs text-gray-500">{order.customer?.email || ''}</p>
                                                <p className="text-xs text-gray-500">{order.customer?.phone || ''}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Data do Pedido</p>
                                                <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                                                <p className="text-xs text-gray-500">Total: Kz {order.total?.toFixed(2) || '0.00'}</p>
                                                <p className="text-xs text-gray-500">Itens: {order.items?.length || 0}</p>
                                            </div>
                                        </div>

                                        {/* Comprovativo */}
                                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                    {hasProof ? (
                                                        <>
                                                            <FileCheck className="w-5 h-5 text-green-500" />
                                                            <span className="text-sm font-medium text-gray-700">Comprovativo enviado</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileX className="w-5 h-5 text-gray-400" />
                                                            <span className="text-sm text-gray-500">Nenhum comprovativo enviado</span>
                                                        </>
                                                    )}
                                                </div>
                                                {hasProof && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setViewingProof({ orderId: order.id, url: order.paymentProof! })}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Ver
                                                        </button>
                                                        {isAwaitingPayment && (
                                                            <>
                                                                <button
                                                                    onClick={() => setValidateModal(order)}
                                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                    Validar
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectModal(order)}
                                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                    Rejeitar
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Itens do pedido */}
                                        {order.items && order.items.length > 0 && (
                                            <details className="text-sm">
                                                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">
                                                    Ver itens do pedido ({order.items.length})
                                                </summary>
                                                <div className="mt-2 space-y-1 pl-2">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between text-sm border-b border-gray-100 py-1">
                                                            <span>{item.name}</span>
                                                            <span>{item.qty}x Kz {item.price?.toFixed(2) || '0.00'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ProofPayment;