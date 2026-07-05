import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { cartService } from '../services/cartService';
import { CheckCircle, Package, Truck, Clock, ArrowLeft, Home, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);

    // 🔥 LISTENER EM TEMPO REAL para o pedido
    const unsubscribe = cartService.onOrderById(
      orderId,
      (updatedOrder) => {
        if (updatedOrder) {
          // Verificar se o pedido pertence ao usuário
          if (updatedOrder.userId !== user.uid) {
            toast.error('Este pedido não pertence à sua conta');
            navigate('/');
            return;
          }
          setOrder(updatedOrder);
          setLoading(false);
          
          // Mostrar notificação se o status mudou
          if (order && order.status !== updatedOrder.status) {
            const statusLabels: Record<string, string> = {
              awaiting_payment: 'Aguardando Pagamento',
              paid: 'Pago ✅',
              processing: 'Processando 🔄',
              shipped: 'Enviado 🚚',
              delivered: 'Entregue 📦',
              cancelled: 'Cancelado ❌',
            };
            toast(
              `Status do pedido atualizado: ${statusLabels[updatedOrder.status] || updatedOrder.status}`,
              { duration: 5000, icon: '🔄' }
            );
          }
        } else {
          toast.error('Pedido não encontrado');
          navigate('/');
        }
      },
      (error) => {
        console.error('Erro no listener:', error);
        toast.error('Erro ao carregar pedido');
        setLoading(false);
      }
    );

    // Limpar listener ao desmontar
    return () => unsubscribe();
  }, [orderId, user, navigate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'awaiting_payment':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="h-6 w-6 text-blue-500" />;
      case 'processing':
        return <Package className="h-6 w-6 text-purple-500" />;
      case 'shipped':
        return <Truck className="h-6 w-6 text-cyan-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'cancelled':
        return <Package className="h-6 w-6 text-red-500" />;
      default:
        return <Package className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting_payment':
        return 'text-yellow-600 bg-yellow-50';
      case 'paid':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-purple-600 bg-purple-50';
      case 'shipped':
        return 'text-cyan-600 bg-cyan-50';
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'awaiting_payment':
        return 'Aguardando Pagamento';
      case 'paid':
        return 'Pago';
      case 'processing':
        return 'Processando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Formatar data com fallback
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Pedido não encontrado</h2>
          <Link to="/" className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar à loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pedido Confirmado!</h1>
              <p className="text-sm text-gray-500">
                Pedido #{order.orderNumber} - {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              <span className={`font-medium px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                Status: {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Bell className="h-3 w-3" />
              <span>Atualizações em tempo real</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
                  }}
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    Quantidade: {item.qty} × Kz {item.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    Kz {(item.price * item.qty).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-primary-600">
              Kz {order.total.toFixed(2)}
            </span>
          </div>
          {order.customer && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Endereço de entrega:</span>{' '}
                {order.customer.address}, {order.customer.city}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Cliente:</span> {order.customer.name}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Continuar Comprando
          </Link>
          <Link
            to="/my-orders"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="h-4 w-4" />
            Meus Pedidos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;