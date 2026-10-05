import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShoppingCart,
  Star,
  Package,
  Shield,
  Sparkles,
  Check,
  TrendingUp,
  Boxes,
} from 'lucide-react';
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
    : products.filter((p) => p.stock > 0);

  const handleAddToCart = (product: Product) => {
    if (isAdmin) {
      toast.error('Administradores não podem comprar produtos!', { duration: 4000 });
      return;
    }

    const currentInCart = items.find((item) => item.id === product.id);
    const currentQty = currentInCart?.qty || 0;

    if (product.stock <= 0) {
      toast.error('Produto esgotado!');
      return;
    }

    if (currentQty >= product.stock) {
      toast.error(`Estoque insuficiente! Apenas ${product.stock} unidades.`);
      return;
    }

    addItem(product);
    toast.success(
      `${product.name} adicionado! (${currentQty + 1}/${product.stock})`
    );
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i < rating
            ? 'fill-amber-400 text-amber-400'
            : 'text-slate-300'
        }`}
      />
    ));

  if (availableProducts.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm text-center py-16 px-4 col-span-full">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Package className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Nenhum produto disponível
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin
            ? 'Todos os produtos estão esgotados.'
            : 'Volte em breve para ver nossas novidades'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-5">
      {availableProducts.map((product) => {
        const currentInCart = items.find((item) => item.id === product.id);
        const currentQty = currentInCart?.qty || 0;
        const isOutOfStock = product.stock <= 0;
        const isMaxReached = currentQty >= product.stock;
        const isLowStock = product.stock > 0 && product.stock <= 3;

        return (
          <div
            key={product.id}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 relative flex flex-col"
          >
            {/* Badges */}
            {isAdmin && (
              <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-violet-200">
                <Shield className="w-3 h-3" />
                Admin
              </div>
            )}

            {/* Image */}
            <div className="relative aspect-square bg-slate-100 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/400/2563eb/ffffff?text=Product';
                }}
              />

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Esgotado */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-500/30">
                    Esgotado
                  </span>
                </div>
              )}

              {/* Low stock */}
              {isLowStock && !isOutOfStock && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md shadow-amber-200">
                  <Sparkles className="w-3 h-3" />
                  Últimas {product.stock}
                </div>
              )}

              {/* In cart */}
              {currentQty > 0 && !isAdmin && !isOutOfStock && (
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-blue-200">
                  <Package className="w-3 h-3" />
                  {currentQty}/{product.stock} no carrinho
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-1">
              {/* Brand */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md tracking-wider uppercase">
                  {product.brand}
                </span>
              </div>

              {/* Name */}
              <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-2 leading-snug">
                {product.name}
              </h3>

              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {renderStars(product.rating)}
                <span className="text-[10px] text-slate-500 ml-0.5 font-semibold">
                  ({product.rating}.0)
                </span>
              </div>

              {/* Price + Button */}
              <div className="flex items-end justify-between gap-2 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    Preço
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Kz {product.price.toFixed(2)}
                  </span>
                  {isLowStock && !isOutOfStock && (
                    <span className="text-[10px] text-amber-600 font-bold mt-0.5 flex items-center gap-1">
                      <TrendingUp className="w-2.5 h-2.5" />
                      Poucas unidades
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock || isMaxReached || isAdmin}
                  className={`
                    group/btn relative p-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm
                    ${
                      isAdmin
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isOutOfStock || isMaxReached
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0'
                    }
                    disabled:cursor-not-allowed
                  `}
                  aria-label={
                    isAdmin
                      ? 'Admin não pode comprar'
                      : 'Adicionar ao carrinho'
                  }
                  title={
                    isAdmin
                      ? 'Administradores não podem comprar'
                      : isOutOfStock
                      ? 'Produto esgotado'
                      : isMaxReached
                      ? `Limite de ${product.stock} unidades atingido`
                      : 'Adicionar ao carrinho'
                  }
                >
                  {isAdmin ? (
                    <Shield className="w-4 h-4" />
                  ) : isMaxReached && !isOutOfStock ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  )}
                </button>
              </div>

              {/* Meta info */}
              {currentQty > 0 && !isAdmin && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Boxes className="w-3 h-3" />
                    <strong className="text-slate-700">{product.stock - currentQty}</strong> disponíveis
                  </span>
                  <span className="text-blue-600 font-bold">
                    {currentQty} no carrinho
                  </span>
                </div>
              )}

              {isAdmin && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-violet-700 bg-violet-50 -mx-4 -mb-4 px-4 py-2 flex items-center gap-1.5 border-t-violet-100">
                  <Shield className="w-3 h-3" />
                  Modo admin — compras desabilitadas
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