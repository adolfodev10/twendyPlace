import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, ShoppingCart, Trash2, Minus, Plus, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleCheckout = () => {
    if (!user) {
      toast.error('Faça login para finalizar a compra');
      onClose();
      return;
    }
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }
    toast.success('Redirecionando para checkout...');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold">Meu Carrinho</h2>
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Seu carrinho está vazio</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comece a adicionar produtos!
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Continuar comprando
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b border-gray-100 pb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm font-semibold text-primary-600">
                        Kz {item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                          className="rounded-full p-0.5 hover:bg-gray-100 transition-colors"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3 w-3 text-gray-500" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          className="rounded-full p-0.5 hover:bg-gray-100 transition-colors"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3 w-3 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        Kz {(item.price * item.qty).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-semibold text-gray-900">
                  Kz {totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-sm text-gray-600">Entrega</span>
                <span className="text-sm font-semibold text-green-600">Grátis</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-4 mb-4">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">
                  Kz {totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="flex-1 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Limpar
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Finalizar
                </button>
              </div>

              {!user && (
                <p className="mt-2 text-center text-xs text-gray-500">
                  <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                    Faça login
                  </Link>{' '}
                  para finalizar a compra
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;