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
  Sparkles,
  ArrowUpRight,
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
  awaiting_payment: 'bg-amber-50 text-amber-700 border border-amber-200',
  paid: 'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-violet-50 text-violet-700 border border-violet-200',
  shipped: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
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
      if (typeof (value as any)?.toDate === 'function') date = (value as any).toDate();
      else if (value instanceof Date) date = value;
      else if (typeof value === 'object' && (value as any)?.seconds)
        date = new Date((value as any).seconds * 1000);
      else if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) date = parsed;
      }
      if (!date || isNaN(date.getTime())) return '--';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
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
        const orders = ordersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[];
        const pendingOrders = orders.filter((o) => o.status === 'awaiting_payment');
        const totalRevenue = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total || 0), 0);
        const productsSnap = await getDocs(collection(db, 'products'));
        const clientsSnap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'customer'))
        );
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
          totalProducts: productsSnap.size,
          totalClients: clientsSnap.size,
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
      if (typeof (value as any)?.toDate === 'function') return (value as any).toDate();
      if (value instanceof Date) return value;
      if (typeof value === 'object' && value !== null && 'seconds' in value) {
        const seconds = (value as { seconds?: number }).seconds;
        if (typeof seconds === 'number') return new Date(seconds * 1000);
      }
      if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      return null;
    };

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const salesByDay = last7Days.map((day) => {
      const dayOrders = stats.allOrders.filter((o) => {
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
        vendas: dayOrders.filter((o) => o.status !== 'cancelled').length,
        faturamento: dayOrders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total || 0), 0),
      };
    });

    const statusCount: Record<string, number> = {};
    stats.allOrders.forEach((o) => {
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
    {
      label: 'Total de Pedidos',
      value: stats.totalOrders,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-200',
    },
    {
      label: 'Pendentes',
      value: stats.pendingOrders,
      icon: Clock,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-200',
    },
    {
      label: 'Produtos',
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-200',
    },
    {
      label: 'Clientes',
      value: stats.totalClients,
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-200',
    },
    {
      label: 'Faturamento',
      value: `Kz ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      gradient: 'from-cyan-500 to-blue-600',
      shadow: 'shadow-cyan-200',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
          <div className="relative w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200 mb-4">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Erro ao carregar</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const approvalRate =
    stats.totalOrders > 0
      ? Math.round(
          ((stats.totalOrders - (stats.allOrders?.filter((o) => o.status === 'cancelled').length || 0)) /
            stats.totalOrders) *
            100
        )
      : 0;

  const pendingRate =
    stats.totalOrders > 0 ? Math.round((stats.pendingOrders / stats.totalOrders) * 100) : 0;

  const avgTicket = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

  return (
    <div className="w-full">
      {/* ==================== HEADER ==================== */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-blue-100 shadow-sm mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[11px] font-bold text-blue-700 tracking-wide">
            PAINEL ADMINISTRATIVO
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Visão geral do negócio
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe pedidos, produtos e faturamento em tempo real.
        </p>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}
                >
                  <stat.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== CHARTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6">
        {/* Line Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <TrendingUp className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Vendas — Últimos 7 dias</h2>
              <p className="text-[11px] text-slate-500">Evolução diária de pedidos</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" fontSize={11} stroke="#94a3b8" />
              <YAxis fontSize={11} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="vendas"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
                name="Vendas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <BarChart3 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Faturamento — Últimos 7 dias</h2>
              <p className="text-[11px] text-slate-500">Receita diária em Kwanzas</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" fontSize={11} stroke="#94a3b8" />
              <YAxis fontSize={11} stroke="#94a3b8" />
              <Tooltip
                formatter={(value: number) => `Kz ${value.toFixed(2)}`}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="faturamento" fill="#10b981" radius={[8, 8, 0, 0]} name="Faturamento" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <ShoppingCart className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Status dos pedidos</h2>
              <p className="text-[11px] text-slate-500">Distribuição por situação</p>
            </div>
          </div>
          {chartData.statusData.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Sem dados disponíveis</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resumo Rápido */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200">
              <Package className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Resumo rápido</h2>
              <p className="text-[11px] text-slate-500">Métricas essenciais</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Taxa de aprovação */}
            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-slate-600 font-medium">Taxa de aprovação</span>
                <span className="font-bold text-emerald-600 text-base">{approvalRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${approvalRate}%` }}
                />
              </div>
            </div>

            {/* Pendentes */}
            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-slate-600 font-medium">Pedidos pendentes</span>
                <span className="font-bold text-amber-600 text-base">{pendingRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pendingRate}%` }}
                />
              </div>
            </div>

            {/* Ticket médio */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-slate-600 font-medium">Ticket médio</span>
                <span className="font-bold text-blue-600 text-base">
                  Kz {avgTicket.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Valor médio por pedido não cancelado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== RECENT ORDERS ==================== */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
              <Clock className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Últimos pedidos</h2>
              <p className="text-[11px] text-slate-500">Atividade recente da loja</p>
            </div>
          </div>
          <Link
            to="/admin/orders"
            className="group hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Ver todos
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">
                      #{order.orderNumber || order.id?.slice(-6)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {order.customer?.name || 'Cliente'}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      Kz {order.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">{formatDate(order.createdAt)}</div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="text-left py-3 px-5 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                      Pedido
                    </th>
                    <th className="text-left py-3 px-5 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-5 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                      Total
                    </th>
                    <th className="text-left py-3 px-5 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-5 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-900 text-sm">
                          #{order.orderNumber || order.id?.slice(-6)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-600 truncate max-w-[180px]">
                        {order.customer?.name || 'Cliente'}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900 text-sm whitespace-nowrap">
                        Kz {order.total?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                            STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Mobile footer link */}
        <div className="lg:hidden p-4 border-t border-slate-100 text-center">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600"
          >
            Ver todos os pedidos
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;