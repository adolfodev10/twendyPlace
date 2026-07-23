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

  // 🔥 FUNÇÃO CORRIGIDA - com verificações de segurança
  const formatDate = (value: unknown): string => {
    if (!value) return '--';

    try {
      let date: Date | null = null;

      if (typeof (value as any)?.toDate === 'function') {
        date = (value as any).toDate();
      } else if (value instanceof Date) {
        date = value;
      } else if (typeof value === 'object' && (value as any)?.seconds) {
        date = new Date((value as any).seconds * 1000);
      } else if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          date = parsed;
        }
      }

      if (!date || isNaN(date.getTime())) {
        return '--';
      }

      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '--';
    }
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
            const getTime = (val: any): number => {
              if (!val) return 0;
              if (typeof val?.toDate === 'function') return val.toDate().getTime();
              if (val instanceof Date) return val.getTime();
              if (typeof val === 'number') return val;
              if (typeof val === 'object' && val?.seconds) return val.seconds * 1000;
              return 0;
            };
            const dateA = getTime(a.createdAt);
            const dateB = getTime(b.createdAt);
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
    awaiting_payment: 'Aguardando',
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
      <div className="flex flex-col  items-center justify-center h-48 sm:h-64 md:h-96 text-center px-4">
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
    <div className="w-full px-2 -mt-28 sm:px-0">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h1>

      {/* Stats Grid - Responsivo */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className={`${stat.color} p-2 sm:p-2.5 md:p-3 rounded-lg`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 hidden xs:block" />
            </div>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mt-2 sm:mt-3 truncate">
              {stat.value}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 truncate">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders - Versão Mobile (Card View) */}
      <div className="block lg:hidden mb-6">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          Últimos Pedidos
        </h2>

        {stats.recentOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-8 text-gray-500">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map((order) => {
              const formattedDate = formatDate(order.createdAt);
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                      #{order.orderNumber || order.id?.slice(-6)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                    <span>{order.customer?.name || 'Cliente'}</span>
                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">Kz {order.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="mt-1 text-[9px] sm:text-[10px] text-gray-400">{formattedDate}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Orders - Versão Desktop (Table View) */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          Últimos Pedidos
        </h2>

        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-500">Pedido</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-500">Total</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-500">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => {
                  const formattedDate = formatDate(order.createdAt);
                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 text-sm">
                          #{order.orderNumber || order.id?.slice(-6)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-[150px]">
                        {order.customer?.name || 'Cliente'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 text-sm whitespace-nowrap">
                        Kz {order.total?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'} whitespace-nowrap`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 text-right">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Ver todos os pedidos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Link para pedidos no mobile */}
      <div className="block lg:hidden text-center mt-2">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          Ver todos os pedidos
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;