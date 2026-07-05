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
  Clock
} from 'lucide-react';

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

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Carregar pedidos
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        const pendingOrders = orders.filter(o => o.status === 'awaiting_payment');

        // Calcular receita total
        const totalRevenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + o.total, 0);

        // Carregar produtos
        const productsSnap = await getDocs(collection(db, 'products'));
        const totalProducts = productsSnap.size;

        // Carregar clientes
        const clientsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
        const totalClients = clientsSnap.size;

        setStats({
          totalOrders: orders.length,
          pendingOrders: pendingOrders.length,
          totalProducts,
          totalClients,
          totalRevenue,
          recentOrders: orders.slice(0, 5),
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    { label: 'Total de Pedidos', value: stats.totalOrders, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Pendentes', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Produtos', value: stats.totalProducts, icon: Package, color: 'bg-green-500' },
    { label: 'Clientes', value: stats.totalClients, icon: Users, color: 'bg-purple-500' },
    { label: 'Faturamento', value: `Kz ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos Pedidos</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Pedido</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map(order => {
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

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {order.customer?.name || 'Cliente'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        Kz {order.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
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

export default Dashboard;