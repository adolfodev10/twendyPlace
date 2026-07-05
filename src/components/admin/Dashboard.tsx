import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Order } from '../../types';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle
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
        // Carregar pedidos
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        const pendingOrders = orders.filter(o => o.status === 'awaiting_payment');

        // Calcular receita total
        const totalRevenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total || 0), 0);

        // Carregar produtos
        const productsSnap = await getDocs(collection(db, 'products'));
        const totalProducts = productsSnap.size;

        // Carregar clientes
        const clientsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
        const totalClients = clientsSnap.size;

        // Últimos pedidos (ordenados por data)
        const recentOrders = [...orders]
          .sort((a, b) => {
            const toMillis = (val: any) => {
              if (!val) return 0;
              // Firestore Timestamp has toDate(), JS Date has getTime()
              if (typeof val.toDate === 'function') return val.toDate().getTime();
              if (val instanceof Date) return val.getTime();
              // fallback for numeric timestamps
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
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Pendentes', 
      value: stats.pendingOrders, 
      icon: Clock, 
      color: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    { 
      label: 'Produtos', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      label: 'Clientes', 
      value: stats.totalClients, 
      icon: Users, 
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    { 
      label: 'Faturamento', 
      value: `Kz ${stats.totalRevenue.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600'
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
      <div className="flex items-center justify-center h-64 sm:h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 sm:h-96 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Erro ao carregar</h3>
        <p className="text-gray-500 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid - Responsivo */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className={`${stat.color} p-2.5 sm:p-3 rounded-lg`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-3 truncate">
              {stat.value}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders - Responsivo */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          Últimos Pedidos
        </h2>
        
        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[500px] sm:min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Pedido</th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Total</th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden sm:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => {
                  const formattedDate = formatDate(order.createdAt);

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 sm:px-4">
                        <span className="font-medium text-gray-900 text-sm">
                          #{order.orderNumber || order.id.slice(-6)}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-sm text-gray-600 truncate max-w-[80px] sm:max-w-none">
                        {order.customer?.name || 'Cliente'}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-semibold text-gray-900 text-sm whitespace-nowrap">
                        Kz {order.total?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-sm text-gray-500 hidden sm:table-cell whitespace-nowrap">
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
        <div className="mt-4 pt-4 border-t border-gray-100 text-center sm:text-right">
          <Link 
            to="/admin/orders" 
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Ver todos os pedidos
            <ShoppingCart className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;