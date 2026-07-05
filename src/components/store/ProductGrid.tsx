import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { ShoppingBag, ShoppingCart, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductGridProps {
  products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const { addItem } = useCart();

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Produto esgotado!');
      return;
    }
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 col-span-full">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Nenhum produto disponível</h3>
        <p className="text-gray-500 mt-2">Volte em breve para ver nossas novidades</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
          <div className="relative aspect-square bg-gray-100 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400';
              }}
            />
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  Esgotado
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                {product.name}
              </h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                {product.brand}
              </span>
            </div>

            <div className="flex items-center gap-1 mb-2">
              {renderStars(product.rating)}
              <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xl font-bold text-primary-600">
                  Kz {product.price.toFixed(2)}
                </span>
                {product.stock > 0 && product.stock <= 3 && (
                  <span className="block text-xs text-orange-500 font-medium">
                    ⚡ Últimas {product.stock} unidades!
                  </span>
                )}
              </div>
              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock <= 0}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;