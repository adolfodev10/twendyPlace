import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCart, Star, Package, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductGridProps {
  products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const { addItem, items } = useCart();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const availableProducts = isAdmin
    ? products
    : products.filter(p => p.stock > 0);

  const handleAddToCart = (product: Product) => {
    if (isAdmin) {
      toast.error('Administradores não podem comprar produtos!', {
        duration: 4000,
      });
      return;
    }

    const currentInCart = items.find(item => item.id === product.id);
    const currentQty = currentInCart?.qty || 0;

    if (product.stock <= 0) {
      toast.error('Produto esgotado!');
      return;
    }

    if (currentQty >= product.stock) {
      toast.error(`Estoque insuficiente! Apenas ${product.stock} unidades disponíveis.`);
      return;
    }

    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho! (${currentQty + 1}/${product.stock})`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
      />
    ));
  };

  if (availableProducts.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 col-span-full">
        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Nenhum produto disponível</h3>
        <p className="text-gray-500 mt-2 text-sm">
          {isAdmin ? 'Todos os produtos estão esgotados.' : 'Volte em breve para ver nossas novidades'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {availableProducts.map((product) => {
        const currentInCart = items.find(item => item.id === product.id);
        const currentQty = currentInCart?.qty || 0;
        const isOutOfStock = product.stock <= 0;
        const isMaxReached = currentQty >= product.stock;

        return (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
          >
            {isAdmin && (
              <div className="absolute top-2 right-2 z-10 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                <Shield className="w-3 h-3" />
                Admin
              </div>
            )}

            <div className="relative aspect-square bg-gray-100 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400/2563eb/ffffff?text=Product';
                }}
              />
              {isOutOfStock ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                    Esgotado
                  </span>
                </div>
              ) : product.stock <= 3 && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                  Últimas {product.stock} unidades!
                </div>
              )}
              {isMaxReached && !isOutOfStock && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                  No carrinho: {currentQty}/{product.stock}
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 flex-1">
                  {product.name}
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                  {product.brand}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-2">
                {renderStars(product.rating)}
                <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-base sm:text-lg font-bold text-primary-600">
                    Kz {product.price.toFixed(2)}
                  </span>
                  {product.stock > 0 && product.stock <= 3 && (
                    <span className="block text-xs text-orange-500 font-medium mt-0.5">
                      Últimas unidades!
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock || isMaxReached || isAdmin}
                  className={`
                    p-2 sm:p-2.5 rounded-lg transition-all 
                    ${isAdmin
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:scale-100'
                      : isOutOfStock || isMaxReached
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed hover:scale-100'
                        : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-105 active:scale-95'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  aria-label={isAdmin ? 'Admin não pode comprar' : 'Adicionar ao carrinho'}
                  title={isAdmin ? 'Administradores não podem comprar' :
                    isOutOfStock ? 'Produto esgotado' :
                      isMaxReached ? `Limite de ${product.stock} unidades atingido` :
                        'Adicionar ao carrinho'}
                >
                  {isAdmin ? (
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : isMaxReached ? (
                    <span className="text-xs font-bold">✓</span>
                  ) : (
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>

              {currentQty > 0 && !isAdmin && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>{currentQty} no carrinho</span>
                  <span className="text-gray-300">|</span>
                  <span>{product.stock - currentQty} disponíveis</span>
                </div>
              )}

              {isAdmin && (
                <div className="mt-2 text-[10px] text-purple-600 bg-purple-50 px-2 py-1 rounded flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Modo administrador - compras desabilitadas
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;