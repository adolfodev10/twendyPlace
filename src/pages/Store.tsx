import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { productService } from '../services/productService';
import { partnerService } from '../services/partnerService';
import { Product } from '../types';
import Header from '../components/common/Header';
import ProductGrid from '../components/store/ProductGrid';
import CartModal from '../components/store/CartModal';
import Filters from '../components/store/Filters';
import { ShoppingBag, AlertCircle, RefreshCw, FilterX, Package, CheckCircle } from 'lucide-react';
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
          partnerService.getPartnerProductsForStore()
        ]);

        let allProducts = [...normalProducts, ...partnerProducts];

        const uniqueProducts = allProducts.filter((product, index, self) =>
          index === self.findIndex(p => p.name === product.name)
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
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    filtered = filtered.filter(p =>
      p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    if (filters.rating > 0) {
      filtered = filtered.filter(p => p.rating >= filters.rating);
    }

    if (filters.brands.length > 0) {
      filtered = filtered.filter(p => filters.brands.includes(p.brand));
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

  const hasActiveFilters = filters.search || filters.category !== 'all' ||
    filters.brands.length > 0 || filters.rating > 0 || filters.maxPrice < 10000;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        cartCount={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        user={user}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <Filters
              filters={filters}
              onFilterChange={setFilters}
              products={products}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {error ? (
              <div className="text-center py-12 sm:py-16">
                <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Erro ao carregar produtos</h3>
                <p className="text-gray-500 mt-2 text-sm sm:text-base">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar novamente
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Nenhum produto encontrado</h3>
                <p className="text-gray-500 mt-2 text-sm sm:text-base">
                  {products.length === 0
                    ? 'Não há produtos disponíveis no momento.'
                    : 'Tente ajustar os filtros ou a pesquisa'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors inline-flex items-center gap-2"
                  >
                    <FilterX className="w-4 h-4" />
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Stats Bar */}
                <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-3 mb-4">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    Mostrando <span className="font-semibold text-gray-700 mx-1">{filteredProducts.length}</span>
                    de <span className="font-semibold text-gray-700 mx-1">{products.length}</span> produtos disponíveis
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span>{products.length} produtos</span>
                    </span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors border border-gray-200"
                      >
                        <FilterX className="w-3.5 h-3.5" />
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </div>

                {/* Product Grid */}
                <ProductGrid products={filteredProducts} />
              </>
            )}
          </div>
        </div>
      </div>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Store;