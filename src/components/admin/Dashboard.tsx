import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Order } from '../../types';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalClients: 0,
    totalRevenue: 0,
    recentOrders: [] as Order[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (value: unknown): string => {
    const date = typeof (value as { toDate?: () => Date }).toDate === 'function'
      ? (value as { toDate: () => Date }).toDate()
      : value instanceof Date
        ? value
        : null;

    if (!date) return '--';

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        const pendingOrders = orders.filter(o => o.status === 'awaiting_payment');

        const totalRevenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total || 0), 0);

        const productsSnap = await getDocs(collection(db, 'products'));
        const totalProducts = productsSnap.size;

        const clientsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
        const totalClients = clientsSnap.size;

        const recentOrders = [...orders]
          .sort((a, b) => {
            const toMillis = (val: any) => {
              if (!val) return 0;
              if (typeof val.toDate === 'function') return val.toDate().getTime();
              if (val instanceof Date) return val.getTime();
              if (typeof val === 'number') return val;
              return 0;
            };
            const dateA = toMillis(a.createdAt);
            const dateB = toMillis(b.createdAt);
            return dateB - dateA;
          })
          .slice(0, 5);

        setStats({
          totalOrders: orders.length,
          pendingOrders: pendingOrders.length,
          totalProducts,
          totalClients,
          totalRevenue,
          recentOrders,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setError('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    { 
      label: 'Total de Pedidos', 
      value: stats.totalOrders, 
      icon: ShoppingCart, 
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50'
    },
    { 
      label: 'Pendentes', 
      value: stats.pendingOrders, 
      icon: Clock, 
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgLight: 'bg-yellow-50'
    },
    { 
      label: 'Produtos', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50'
    },
    { 
      label: 'Clientes', 
      value: stats.totalClients, 
      icon: Users, 
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50'
    },
    { 
      label: 'Faturamento', 
      value: `Kz ${stats.totalRevenue.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgLight: 'bg-emerald-50'
    },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64 md:h-96">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-64 md:h-96 text-center px-4">
        <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Erro ao carregar</h3>
        <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h1>

      {/* Stats Grid - Responsivo com breakpoints otimizados */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className={`${stat.color} p-2 sm:p-2.5 md:p-3 rounded-lg`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
            </div>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mt-2 sm:mt-3 truncate">
              {stat.value}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 truncate">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders - Responsivo */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 md:p-6">
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          Últimos Pedidos
        </h2>
        
        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[480px] sm:min-w-[600px] md:min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm font-medium text-gray-500">Pedido</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm font-medium text-gray-500 hidden xs:table-cell">Cliente</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm font-medium text-gray-500">Total</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm font-medium text-gray-500 hidden md:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => {
                  const formattedDate = formatDate(order.createdAt);

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4">
                        <span className="font-medium text-gray-900 text-[11px] sm:text-sm">
                          #{order.orderNumber || order.id.slice(-6)}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[11px] sm:text-sm text-gray-600 truncate max-w-[60px] xs:max-w-none hidden xs:table-cell">
                        {order.customer?.name || 'Cliente'}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 font-semibold text-gray-900 text-[11px] sm:text-sm whitespace-nowrap">
                        Kz {order.total?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'} whitespace-nowrap`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[10px] sm:text-sm text-gray-500 hidden md:table-cell whitespace-nowrap">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Link para ver todos os pedidos */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 text-center sm:text-right">
          <Link 
            to="/admin/orders" 
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Ver todos os pedidos
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;