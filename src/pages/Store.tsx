import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { productService } from '../services/productService';
import { Product } from '../types';
import Header from '../components/common/Header';
import ProductGrid from '../components/store/ProductGrid';
import CartModal from '../components/store/CartModal';
import Filters from '../components/store/Filters';
import { ShoppingBag } from 'lucide-react';

const Store: React.FC = () => {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
      try {
        const data = await productService.getAllProducts();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        // Dados mock para fallback
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Smartphone Pro 14',
            price: 899.99,
            stock: 10,
            category: 'Mobile',
            brand: 'TechBrand',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1618972888345-125ccf0fee12?w=400',
            description: 'Smartphone de última geração'
          },
          {
            id: '2',
            name: 'Fones Bluetooth Premium',
            price: 149.99,
            stock: 15,
            category: 'Audio',
            brand: 'SoundMax',
            rating: 4,
            image: 'https://images.unsplash.com/photo-1640300065113-738f2abb8ba6?w=400',
            description: 'Fones com cancelamento de ruído'
          },
          {
            id: '3',
            name: 'Laptop Gaming Ultra',
            price: 1299.99,
            stock: 5,
            category: 'Computers',
            brand: 'GameTech',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1677157561132-4f9e282a1684?w=400',
            description: 'Laptop para gamers'
          },
          {
            id: '4',
            name: 'Smartwatch Fitness Pro',
            price: 349.99,
            stock: 8,
            category: 'Wearables',
            brand: 'FitTech',
            rating: 4,
            image: 'https://images.unsplash.com/photo-1665860455418-017fa50d29bc?w=400',
            description: 'Smartwatch com monitor cardíaco'
          },
          {
            id: '5',
            name: 'Câmera Digital 4K',
            price: 1899.99,
            stock: 3,
            category: 'Cameras',
            brand: 'PhotoPro',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1532272278764-53cd1fe53f72?w=400',
            description: 'Câmera profissional 4K'
          },
          {
            id: '6',
            name: 'Tablet Pro 11',
            price: 649.99,
            stock: 7,
            category: 'Computers',
            brand: 'TechBrand',
            rating: 4,
            image: 'https://images.unsplash.com/photo-1740637977676-c8040b41dc7a?w=400',
            description: 'Tablet de alta performance'
          },
        ];
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
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
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">Nenhum produto encontrado</h3>
                <p className="text-gray-500 mt-2">Tente ajustar os filtros ou a pesquisa</p>
              </div>
            ) : (
              <ProductGrid products={filteredProducts} />
            )}
          </div>
        </div>
      </div>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Store;