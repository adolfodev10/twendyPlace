import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Aguardando',
  paid: 'Pago',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalClients: 0,
    totalRevenue: 0,
    recentOrders: [] as Order[],
    allOrders: [] as Order[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (!isNaN(parsed.getTime())) date = parsed;
      }
      if (!date || isNaN(date.getTime())) return '--';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
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
        const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0);
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
            return getTime(b.createdAt) - getTime(a.createdAt);
          })
          .slice(0, 5);

        setStats({
          totalOrders: orders.length,
          pendingOrders: pendingOrders.length,
          totalProducts,
          totalClients,
          totalRevenue,
          recentOrders,
          allOrders: orders,
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

  const chartData = useMemo(() => {
    const getDateFromValue = (value: unknown): Date | null => {
      if (!value) return null;

      if (typeof (value as any)?.toDate === 'function') {
        return (value as any).toDate();
      }

      if (value instanceof Date) {
        return value;
      }

      if (typeof value === 'object' && value !== null && 'seconds' in value) {
        const seconds = (value as { seconds?: number }).seconds;
        if (typeof seconds === 'number') {
          return new Date(seconds * 1000);
        }
      }

      if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      return null;
    };

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const salesByDay = last7Days.map(day => {
      const dayOrders = stats.allOrders.filter(o => {
        const orderDate = getDateFromValue(o.createdAt);
        if (!orderDate) return false;
        return (
          orderDate.getDate() === day.getDate() &&
          orderDate.getMonth() === day.getMonth() &&
          orderDate.getFullYear() === day.getFullYear()
        );
      });

      return {
        dia: day.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        vendas: dayOrders.filter(o => o.status !== 'cancelled').length,
        faturamento: dayOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0),
      };
    });

    const statusCount: Record<string, number> = {};
    stats.allOrders.forEach(o => {
      const status = o.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const statusData = Object.entries(statusCount).map(([name, value]) => ({
      name: STATUS_LABELS[name] || name,
      value,
    }));

    return { salesByDay, statusData };
  }, [stats.allOrders]);


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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Erro ao carregar</h3>
        <p className="text-base text-gray-500 mt-2">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full lg:-mt-32 px-2 sm:px-0">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className={`${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500 hidden xs:block" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-3 truncate">{stat.value}</p>
            <p className="text-xs text-gray-500 truncate">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 📊 GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Gráfico de Linha - Vendas 7 dias */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Vendas - Últimos 7 Dias
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="vendas" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} name="Vendas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Faturamento 7 dias */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Faturamento - Últimos 7 Dias
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(value: number) => `Kz ${value.toFixed(2)}`} />
              <Bar dataKey="faturamento" fill="#10b981" radius={[6, 6, 0, 0]} name="Faturamento" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza - Status dos Pedidos */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-violet-500" />
            Status dos Pedidos
          </h2>
          {chartData.statusData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={chartData.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {chartData.statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico de Barras Horizontais - Top Produtos (placeholder) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Resumo Rápido
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Taxa de aprovação</span>
                <span className="font-semibold text-green-600">
                  {stats.totalOrders > 0 ? Math.round(((stats.totalOrders - (stats.allOrders?.filter(o => o.status === 'cancelled').length || 0)) / stats.totalOrders) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.totalOrders > 0 ? Math.round(((stats.totalOrders - (stats.allOrders?.filter(o => o.status === 'cancelled').length || 0)) / stats.totalOrders) * 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Pedidos pendentes</span>
                <span className="font-semibold text-yellow-600">
                  {stats.totalOrders > 0 ? Math.round((stats.pendingOrders / stats.totalOrders) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${stats.totalOrders > 0 ? Math.round((stats.pendingOrders / stats.totalOrders) * 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Ticket médio</span>
                <span className="font-semibold text-blue-600">
                  Kz {stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, stats.totalOrders > 0 ? ((stats.totalRevenue / stats.totalOrders) / 10000) * 100 : 0)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders - Mobile (Card View) */}
      <div className="block lg:hidden mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          Últimos Pedidos
        </h2>
        {stats.recentOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map((order) => {
              const formattedDate = formatDate(order.createdAt);
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 text-sm">#{order.orderNumber || order.id?.slice(-6)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{order.customer?.name || 'Cliente'}</span>
                    <span className="font-semibold text-gray-900 text-sm">Kz {order.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-gray-400">{formattedDate}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Orders - Desktop (Table View) */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Pedido</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => {
                  const formattedDate = formatDate(order.createdAt);
                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 text-sm">#{order.orderNumber || order.id?.slice(-6)}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-[150px]">{order.customer?.name || 'Cliente'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900 text-sm whitespace-nowrap">Kz {order.total?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'} whitespace-nowrap`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{formattedDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-100 text-right">
          <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
            Ver todos os pedidos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Link mobile */}
      <div className="block lg:hidden text-center mt-2">
        <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
          Ver todos os pedidos
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;