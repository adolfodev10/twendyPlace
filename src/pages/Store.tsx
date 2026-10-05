import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { productService } from '../services/productService';
import { partnerService } from '../services/partnerService';
import { Product } from '../types';
import Header from '../components/common/Header';
import ProductGrid from '../components/store/ProductGrid';
import CartModal from '../components/store/CartModal';
import Filters from '../components/store/Filters';
import {
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  FilterX,
  Package,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Shield,
  Truck,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Store: React.FC = () => {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: 0,
    maxPrice: 50000,
    rating: 0,
    brands: [] as string[],
  });

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const [normalProducts, partnerProducts] = await Promise.all([
          productService.getAllProducts(),
          partnerService.getPartnerProductsForStore(),
        ]);

        let allProducts = [...normalProducts, ...partnerProducts];

        const uniqueProducts = allProducts.filter(
          (product, index, self) =>
            index === self.findIndex((p) => p.name === product.name)
        );

        uniqueProducts.sort((a, b) => a.name.localeCompare(b.name));

        setProducts(uniqueProducts);
        setFilteredProducts(uniqueProducts);

        if (uniqueProducts.length === 0) {
          setError('Nenhum produto disponível no momento.');
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setError('Erro ao carregar produtos. Tente novamente mais tarde.');
        toast.error('Erro ao carregar produtos');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.brand.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    filtered = filtered.filter(
      (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    if (filters.rating > 0) {
      filtered = filtered.filter((p) => p.rating >= filters.rating);
    }

    if (filters.brands.length > 0) {
      filtered = filtered.filter((p) => filters.brands.includes(p.brand));
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      minPrice: 0,
      maxPrice: 10000,
      rating: 0,
      brands: [],
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category !== 'all' ||
    filters.brands.length > 0 ||
    filters.rating > 0 ||
    filters.maxPrice < 10000;

  // Estatísticas rápidas para o hero
  const stats = useMemo(() => {
    const avgRating =
      products.length > 0
        ? products.reduce((acc, p) => acc + (p.rating || 0), 0) / products.length
        : 0;
    return {
      total: products.length,
      avgRating: avgRating.toFixed(1),
      categories: new Set(products.map((p) => p.category)).size,
      brands: new Set(products.map((p) => p.brand)).size,
    };
  }, [products]);

  /* ----------------------------- LOADING ----------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <Header
          cartCount={totalItems}
          onCartClick={() => setIsCartOpen(true)}
          user={user}
        />
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-slate-700 font-semibold">Carregando produtos</p>
            <p className="text-slate-400 text-sm mt-1">
              Preparando a melhor experiência para você...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <Header
        cartCount={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        user={user}
      />

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute top-10 right-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-blue-100 shadow-sm mb-4">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 tracking-wide">
                  CATÁLOGO
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                Descubra produtos{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  selecionados
                </span>{' '}
                para você
              </h1>

              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                Explore nosso catálogo com curadoria de qualidade, preços
                competitivos e entrega rápida. Tudo o que você precisa em um só
                lugar.
              </p>

              {/* Mini stats */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {[
                  {
                    icon: Package,
                    label: `${stats.total} produtos`,
                    color: 'text-blue-600 bg-blue-50 border-blue-100',
                  },
                  {
                    icon: Star,
                    label: `${stats.avgRating} avaliação`,
                    color:
                      'text-amber-600 bg-amber-50 border-amber-100',
                  },
                  {
                    icon: TrendingUp,
                    label: `${stats.categories} categorias`,
                    color:
                      'text-emerald-600 bg-emerald-50 border-emerald-100',
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${stat.color} shadow-sm`}
                  >
                    <stat.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 lg:w-64">
              {[
                {
                  icon: Truck,
                  title: 'Entrega Rápida',
                  desc: 'Em até 48h',
                },
                {
                  icon: Shield,
                  title: 'Compra Segura',
                  desc: '100% protegida',
                },
                {
                  icon: CheckCircle2,
                  title: 'Qualidade',
                  desc: 'Garantida',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== CONTEÚDO ======================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar de filtros */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <Filters
                filters={filters}
                onFilterChange={setFilters}
                products={products}
              />
            </div>
          </aside>

          {/* Grid principal */}
          <main className="flex-1 min-w-0">
            {error ? (
              <ErrorState error={error} />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                hasProducts={products.length > 0}
                hasActiveFilters={!!hasActiveFilters}
                onClear={clearFilters}
              />
            ) : (
              <>
                {/* Barra de resultado */}
                <div className="mb-5 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/70 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {filteredProducts.length}{' '}
                          {filteredProducts.length === 1
                            ? 'produto encontrado'
                            : 'produtos encontrados'}
                        </p>
                        <p className="text-xs text-slate-500">
                          de {products.length} disponíveis no catálogo
                        </p>
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all duration-200"
                      >
                        <FilterX className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </div>

                <ProductGrid products={filteredProducts} />
              </>
            )}
          </main>
        </div>
      </div>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

/* ============================ SUBCOMPONENTES ============================ */

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-red-100 shadow-sm p-8 sm:p-12 text-center">
    <div className="absolute top-0 right-0 w-40 h-40 bg-red-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
    <div className="relative">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200 mb-5">
        <AlertCircle className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">
        Ops! Algo deu errado
      </h3>
      <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="group mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 transition-all duration-300"
      >
        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
        Tentar novamente
      </button>
    </div>
  </div>
);

const EmptyState: React.FC<{
  hasProducts: boolean;
  hasActiveFilters: boolean;
  onClear: () => void;
}> = ({ hasProducts, hasActiveFilters, onClear }) => (
  <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-slate-200/70 shadow-sm p-8 sm:p-12 text-center">
    <div className="absolute top-0 left-0 w-40 h-40 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
    <div className="relative">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-5">
        <ShoppingBag className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">
        Nenhum produto encontrado
      </h3>
      <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
        {hasProducts
          ? 'Não encontramos produtos com os filtros selecionados. Tente ajustar os critérios de busca.'
          : 'Não há produtos disponíveis no momento. Volte em breve!'}
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="group mt-6 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300"
        >
          <FilterX className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          Limpar todos os filtros
        </button>
      )}
    </div>
  </div>
);

export default Store;