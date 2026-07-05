import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

// Componente Header simplificado
const Header: React.FC<{ cartCount: number; user: any }> = ({ cartCount, user }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Twendy Create</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user ? `Olá, ${user.name}` : 'Bem-vindo!'}
            </span>
            <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
              🛒 {cartCount}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente ProductCard simplificado
const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void }> = ({ 
  product, 
  onAddToCart 
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400';
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-gray-500">{product.brand}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xl font-bold text-primary-600">
            Kz {product.price.toFixed(2)}
          </span>
          <button
            onClick={() => onAddToCart(product)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

const Store: React.FC = () => {
  const { user } = useAuth();
  const { items, totalItems, addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock products para demonstração
  useEffect(() => {
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
    ];

    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={totalItems} user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nossos Produtos</h1>
        
        {products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Nenhum produto disponível</h3>
            <p className="text-gray-500 mt-2">Volte em breve para ver nossas novidades</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;
