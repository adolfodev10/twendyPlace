import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, ShoppingCart, Trash2, Minus, Plus, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartService } from '../../services/cartService';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Modal de Confirmação
const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
  items: any[];
  loading: boolean;
}> = ({ isOpen, onClose, onConfirm, total, items, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-[modalSlideUp_0.3s_ease]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Pedido</h3>
          <p className="text-gray-500 mb-6">
            Confirme seu pedido de <strong className="text-primary-600">Kz {total.toFixed(2)}</strong>
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left max-h-48 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                <span className="text-sm text-gray-700">{item.name}</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.qty}x Kz {(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-gray-300">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-primary-600 text-lg">Kz {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                'Confirmar Pedido'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de Dados de Pagamento
const PaymentInfoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  total: number;
  orderNumber: string;
}> = ({ isOpen, onClose, total, orderNumber }) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copiado!');
    }).catch(() => {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      toast.success('Copiado!');
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-[modalSlideUp_0.3s_ease]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary-600" />
            Dados para Pagamento
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="bg-green-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Total a Pagar:</span>
            <span className="text-2xl font-bold text-green-600">Kz {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-blue-800">
            Efetue o pagamento utilizando um dos métodos abaixo. Após o pagamento, o administrador confirmará o seu pedido.
          </span>
        </div>

        {/* Multicaixa Express */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <strong className="text-gray-900">Multicaixa Express</strong>
          </div>
          <div className="flex justify-between items-center py-1 text-sm">
            <span className="text-gray-500">Número:</span>
            <button onClick={() => copyToClipboard('(+244) 923 456 789')} className="font-mono text-gray-900 hover:text-primary-600 flex items-center gap-1">
              (+244) 923 456 789
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
          <div className="flex justify-between items-center py-1 text-sm">
            <span className="text-gray-500">Titular:</span>
            <span className="text-gray-900">Twendy Create Lda</span>
          </div>
        </div>

        {/* Transferência Bancária */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <strong className="text-gray-900">Transferência Bancária</strong>
          </div>
          <div className="flex justify-between items-center py-1 text-sm">
            <span className="text-gray-500">IBAN:</span>
            <button onClick={() => copyToClipboard('AO06 0040 0000 1234 5678 9012 3')} className="font-mono text-gray-900 hover:text-primary-600 flex items-center gap-1 text-xs">
              AO06 0040 0000 1234 5678 9012 3
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
          <div className="flex justify-between items-center py-1 text-sm">
            <span className="text-gray-500">Banco:</span>
            <span className="text-gray-900">Banco Millennium Atlântico</span>
          </div>
          <div className="flex justify-between items-center py-1 text-sm">
            <span className="text-gray-500">Titular:</span>
            <span className="text-gray-900">Twendy Create Lda</span>
          </div>
        </div>

        {/* Unitel Money */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <strong className="text-gray-900">Unitel Money</strong>
          </div>
          <div className="flex justify-between items-center py-1 text-sm">
            <span className="text-gray-500">Número:</span>
            <button onClick={() => copyToClipboard('(+244) 923 456 789')} className="font-mono text-gray-900 hover:text-primary-600 flex items-center gap-1">
              (+244) 923 456 789
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
          <div className="flex justify-between items-center py-1 text-sm">
            <span className="text-gray-500">Titular:</span>
            <span className="text-gray-900">Twendy Create Lda</span>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mb-4">
          Pedido #<strong className="text-gray-900">{orderNumber}</strong>
          <br />
          <span className="text-xs">Guarde o número do pedido para referência.</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
          >
            Fechar
          </button>
          <Link
            to="/my-orders"
            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold text-center"
          >
            Ver Meus Pedidos
          </Link>
        </div>
      </div>
    </div>
  );
};

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

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
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      const customerData = {
        name: user?.name || 'Cliente',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        city: user?.city || '',
      };

      const result = await cartService.createOrder(
        user!.uid,
        items,
        totalPrice,
        customerData,
        'multicaixa'
      );

      if (result.success) {
        clearCart();
        setShowConfirmModal(false);
        setOrderNumber(result.orderNumber || '');
        setShowPaymentModal(true);
        toast.success(`Pedido #${result.orderNumber} criado com sucesso!`);
        onClose();
      } else {
        toast.error('Erro ao criar pedido: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      {/* Modais de Checkout */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmOrder}
        total={totalPrice}
        items={items}
        loading={loading}
      />

      <PaymentInfoModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={totalPrice}
        orderNumber={orderNumber}
      />
    </>
  );
};

export default CartModal;