import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { productService } from '../services/productService';
import { Product } from '../types';
import Header from '../components/common/Header';
import ProductGrid from '../components/store/ProductGrid';
import CartModal from '../components/store/CartModal';
import Filters from '../components/store/Filters';
import { ShoppingBag, AlertCircle } from 'lucide-react';
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
    maxPrice: 10000,
    rating: 0,
    brands: [] as string[],
  });

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar produtos do Firebase
        const data = await productService.getAllProducts();
        
        console.log('📦 Produtos carregados:', data);
        console.log(`📊 Total: ${data.length} produtos disponíveis`);
        
        // 🔥 Remover duplicatas (mesmo nome) - opcional
        const uniqueProducts = data.filter((product, index, self) => 
          index === self.findIndex(p => p.name === product.name)
        );
        
        if (uniqueProducts.length < data.length) {
          console.log(`🔄 Removidas ${data.length - uniqueProducts.length} duplicatas`);
        }
        
        setProducts(uniqueProducts);
        setFilteredProducts(uniqueProducts);
        
        if (uniqueProducts.length === 0) {
          setError('Nenhum produto disponível no momento.');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
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

    // Filtro de busca
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
      );
    }

    // Filtro de categoria
    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Filtro de preço
    filtered = filtered.filter(p =>
      p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    // Filtro de avaliação
    if (filters.rating > 0) {
      filtered = filtered.filter(p => p.rating >= filters.rating);
    }

    // Filtro de marcas
    if (filters.brands.length > 0) {
      filtered = filtered.filter(p => filters.brands.includes(p.brand));
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <Filters
              filters={filters}
              onFilterChange={setFilters}
              products={products}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {error ? (
              <div className="text-center py-16">
                <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">Erro ao carregar produtos</h3>
                <p className="text-gray-500 mt-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">Nenhum produto encontrado</h3>
                <p className="text-gray-500 mt-2">
                  {products.length === 0 
                    ? 'Não há produtos disponíveis no momento.' 
                    : 'Tente ajustar os filtros ou a pesquisa'}
                </p>
                {products.length > 0 && (
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        category: 'all',
                        minPrice: 0,
                        maxPrice: 10000,
                        rating: 0,
                        brands: [],
                      });
                    }}
                    className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                  <p className="text-sm text-gray-500">
                    Mostrando <span className="font-semibold text-gray-700">{filteredProducts.length}</span> de{' '}
                    <span className="font-semibold text-gray-700">{products.length}</span> produtos disponíveis
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      ✅ {products.length} produtos
                    </span>
                  </div>
                </div>
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