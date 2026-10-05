import React, { useState, useEffect } from 'react';
import { cartService } from '../../services/cartService';
import { Order } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  RefreshCw,
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
  ChevronUp,
  Filter,
  Layers,
  Calendar,
  DollarSign,
  Boxes,
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

/* ============================ CONSTANTES ============================ */
const STATUS_HISTORY: Record<
  string,
  { label: string; badge: string; dot: string; icon: any }
> = {
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

/* ============================ MODAL SHELL ============================ */
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
        className={`relative bg-white/95 backdrop-blur-xl rounded-3xl ${maxW} w-full shadow-2xl shadow-slate-900/20 border border-slate-200/70 animate-modalSlideUp max-h-[95vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
};

/* ============================ MODAIS ============================ */

const ProofViewerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  url: string;
  orderNumber: string;
  customerName: string;
}> = ({ isOpen, onClose, url, orderNumber, customerName }) => {
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
            <p className="text-xs text-slate-500">{customerName}</p>
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
          <img
            src={url}
            alt="Comprovativo"
            className="w-full rounded-xl shadow-sm border border-slate-200"
          />
        )}
      </div>

      <div className="p-5 border-t border-slate-200/70 flex flex-col sm:flex-row gap-3">
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

const ValidatePaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order | null;
  loading: boolean;
}> = ({ isOpen, onClose, onConfirm, order, loading }) => {
  if (!isOpen || !order) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="sm" zIndex="z-[60]">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Validar pagamento</h3>
            <p className="text-xs text-slate-500">Confirme os dados antes de validar</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Pedido</span>
            <span className="text-sm font-bold text-slate-900">
              #{order.orderNumber}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Cliente</span>
            <span className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">
              {order.customer?.name || 'Cliente'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total</span>
            <span className="text-sm font-bold text-slate-900">
              Kz {order.total?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Status atual</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_HISTORY[order.status]?.badge || 'bg-slate-50 text-slate-700 border-slate-200'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${STATUS_HISTORY[order.status]?.dot || 'bg-slate-400'}`}
              />
              {STATUS_HISTORY[order.status]?.label || order.status}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">
            Ao confirmar, o pedido passa para{' '}
            <strong className="text-blue-900">"Pago"</strong> e o cliente é
            notificado automaticamente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all font-semibold text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Validar pagamento
              </>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

const RejectProofModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order | null;
  loading: boolean;
}> = ({ isOpen, onClose, onConfirm, order, loading }) => {
  if (!isOpen || !order) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="sm" zIndex="z-[60]">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200">
            <FileX className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Rejeitar comprovativo</h3>
            <p className="text-xs text-slate-500">Confirme antes de rejeitar</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Tem certeza que deseja rejeitar o comprovativo do pedido{' '}
          <strong className="text-slate-900">#{order.orderNumber}</strong>?
        </p>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/70 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-800 leading-relaxed">
            O pedido permanecerá com status{' '}
            <strong className="text-red-900">"Aguardando Pagamento"</strong> e o
            cliente poderá enviar um novo comprovativo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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
    </ModalShell>
  );
};

/* ============================ COMPONENTE PRINCIPAL ============================ */

const ProofPayment: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'with_proof' | 'without_proof'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [viewingProof, setViewingProof] = useState<{ orderId: string; url: string } | null>(
    null
  );
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

  const ordersWithProof = orders.filter((order) => order.paymentProof);
  const ordersWithoutProof = orders.filter((order) => !order.paymentProof);

  const getFilteredOrders = () => {
    let filtered = orders;

    if (filter === 'with_proof') filtered = ordersWithProof;
    else if (filter === 'without_proof') filtered = ordersWithoutProof;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
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

    filtered.sort((a, b) => {
      const dateA = getTimeValue(a.createdAt);
      const dateB = getTimeValue(b.createdAt);
      return dateB - dateA;
    });

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
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
        userId,
        ...notification,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
    }
  };

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
        <p className="text-slate-500 text-sm font-medium">Carregando comprovativos...</p>
      </div>
    );
  }

  const stats = {
    total: orders.length,
    withProof: ordersWithProof.length,
    withoutProof: ordersWithoutProof.length,
    pendingValidation: ordersWithProof.filter((o) => o.status === 'awaiting_payment')
      .length,
  };

  const statCards = [
    {
      label: 'Total de pedidos',
      value: stats.total,
      icon: Package,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-200',
    },
    {
      label: 'Com comprovativo',
      value: stats.withProof,
      icon: FileCheck,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-200',
    },
    {
      label: 'Sem comprovativo',
      value: stats.withoutProof,
      icon: FileX,
      gradient: 'from-slate-500 to-slate-700',
      shadow: 'shadow-slate-200',
    },
    {
      label: 'Aguardando validação',
      value: stats.pendingValidation,
      icon: Clock,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-200',
    },
  ];

  /* ============================ RENDER ============================ */
  return (
    <div className="w-full">
      {/* Modais */}
      <ProofViewerModal
        isOpen={!!viewingProof}
        onClose={() => setViewingProof(null)}
        url={viewingProof?.url || ''}
        orderNumber={
          orders.find((o) => o.id === viewingProof?.orderId)?.orderNumber || ''
        }
        customerName={
          orders.find((o) => o.id === viewingProof?.orderId)?.customer?.name || ''
        }
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

      {/* ==================== HEADER ==================== */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-blue-100 shadow-sm mb-3">
              <FileImage className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold text-blue-700 tracking-wide">
                COMPROVATIVOS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Comprovativos
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Atualizações em tempo real
              <span className="text-xs text-slate-400">
                · última:{' '}
                {lastUpdated.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>

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

      {/* ==================== STATS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
            />
            <div className="relative">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow} mb-3`}
              >
                <stat.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== FILTROS ==================== */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por pedido, cliente ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none text-sm font-medium transition-all text-slate-900 placeholder-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full sm:w-56">
            <div className="relative group">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none text-sm font-medium transition-all text-slate-900 appearance-none cursor-pointer"
              >
                <option value="all">Todos os pedidos</option>
                <option value="with_proof">Com comprovativo</option>
                <option value="without_proof">Sem comprovativo</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 whitespace-nowrap">
              <strong className="text-slate-900 font-bold">
                {filteredOrders.length}
              </strong>{' '}
              pedido{filteredOrders.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== LISTA ==================== */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <FileImage className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Nenhum pedido encontrado
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {filter === 'with_proof'
                ? 'Nenhum pedido com comprovativo enviado.'
                : filter === 'without_proof'
                ? 'Todos os pedidos já têm comprovativo.'
                : 'Nenhum pedido com os filtros atuais.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const hasProof = !!order.paymentProof;
            const isExpanded = expandedOrders.has(order.id);
            const isAwaitingPayment = order.status === 'awaiting_payment';
            const status = STATUS_HISTORY[order.status];
            const initials = (order.customer?.name || 'C')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={order.id}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                  hasProof
                    ? 'border-emerald-200/70 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50'
                    : 'border-slate-200/70 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50'
                }`}
              >
                {/* Header do card */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-slate-900 text-sm">
                        #{order.orderNumber}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${status?.badge || 'bg-slate-50 text-slate-700 border-slate-200'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${status?.dot || 'bg-slate-400'}`}
                        />
                        {status?.label || order.status}
                      </span>

                      {hasProof && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                          <FileCheck className="w-3 h-3" />
                          Comprovativo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                        Kz {order.total?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-[140px]">
                        {order.customer?.name || 'Cliente'}
                      </span>
                      <div className="p-1 rounded-lg bg-slate-100/70">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corpo expandido */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                    {/* Info do cliente + data */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 mt-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
                          <span className="text-white font-bold text-xs">
                            {initials}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                            Cliente
                          </p>
                          <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                            {order.customer?.name || 'Cliente'}
                          </p>
                          {order.customer?.email && (
                            <p className="text-[11px] text-slate-500 truncate">
                              {order.customer.email}
                            </p>
                          )}
                          {order.customer?.phone && (
                            <p className="text-[11px] text-slate-500">
                              {order.customer.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                            Data do pedido
                          </p>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                              Itens
                            </p>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                              <Boxes className="w-3 h-3 text-slate-400" />
                              {order.items?.length || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                              Total
                            </p>
                            <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                              <DollarSign className="w-3 h-3 text-slate-400" />
                              Kz {order.total?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comprovativo */}
                    <div
                      className={`rounded-2xl p-4 mb-3 border ${
                        hasProof
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/70'
                          : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2.5">
                          {hasProof ? (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                <FileCheck className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-emerald-900">
                                  Comprovativo enviado
                                </p>
                                <p className="text-[10px] text-emerald-700">
                                  Pronto para validação
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                                <FileX className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-600">
                                  Nenhum comprovativo enviado
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  Aguardando cliente
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {hasProof && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingProof({
                                  orderId: order.id,
                                  url: order.paymentProof!,
                                });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </button>

                            {isAwaitingPayment && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setValidateModal(order);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 rounded-lg transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Validar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectModal(order);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
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
                      <details className="text-sm group">
                        <summary className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 py-1">
                          <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                          Ver itens do pedido ({order.items.length})
                        </summary>
                        <div className="mt-2 space-y-1 pl-5">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-xs border-b border-slate-100 py-1.5 last:border-0"
                            >
                              <span className="text-slate-600 font-medium">
                                {item.name}
                              </span>
                              <span className="text-slate-900 font-bold whitespace-nowrap">
                                {item.qty}x · Kz {item.price?.toFixed(2) || '0.00'}
                              </span>
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

export default ProofPayment;