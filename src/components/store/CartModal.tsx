import React, { useState, useRef } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, ShoppingCart, Trash2, Minus, Plus, CreditCard, Upload, File, Check, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartService } from '../../services/cartService';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Modal de Confirmação com Upload
const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
  items: any[];
  loading: boolean;
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
  uploadProgress: number;
  isUploading: boolean;
  uploadedFileURL: string | null;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  total,
  items,
  loading,
  onFileUpload,
  uploadedFile,
  uploadProgress,
  isUploading,
  uploadedFileURL
}) => {
    if (!isOpen) return null;

    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-[modalSlideUp_0.3s_ease] max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Pedido</h3>
            <p className="text-gray-500 mb-6">
              Confirme seu pedido de <strong className="text-primary-600">Kz {total.toFixed(2)}</strong>
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left max-h-40 overflow-y-auto">
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

            {/* Upload de Comprovativo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Comprovativo de Pagamento *
              </label>

              {!uploadedFileURL ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploadedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary-400'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <File className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-700">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadedFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Clique para fazer upload do comprovativo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG ou PDF (máx. 5MB)</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-green-700">Comprovativo enviado!</p>
                    <button
                      onClick={() => window.open(uploadedFileURL, '_blank')}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Ver comprovativo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || !uploadedFileURL || isUploading}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : isUploading ? (
                  <>
                    <Upload className="w-4 h-4 animate-pulse" />
                    Enviando...
                  </>
                ) : (
                  'Confirmar Pedido'
                )}
              </button>
            </div>
            {!uploadedFileURL && !isUploading && (
              <p className="mt-2 text-xs text-red-500">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                É necessário enviar o comprovativo de pagamento
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileURL, setUploadedFileURL] = useState<string | null>(null);

  if (!isOpen) return null;

  // 🔥 VALIDAÇÃO DE ESTOQUE AO ATUALIZAR QUANTIDADE
  const handleUpdateQuantity = (productId: string, newQty: number) => {
    const item = items.find(i => i.id === productId);
    if (!item) return;

    // 🔥 Validar se a nova quantidade não excede o estoque
    if (newQty > item.stock) {
      toast.error(`Estoque insuficiente! Apenas ${item.stock} unidades disponíveis.`);
      return;
    }

    if (newQty <= 0) {
      removeItem(productId);
      return;
    }

    updateQuantity(productId, newQty);
  };

  // 🔥 Verificar se algum item excede o estoque antes de finalizar
  const validateStockBeforeCheckout = () => {
    for (const item of items) {
      if (item.qty > item.stock) {
        toast.error(`${item.name}: você tem ${item.qty} no carrinho, mas só ${item.stock} disponíveis.`);
        return false;
      }
    }
    return true;
  };

  // 🔥 HANDLE CHECKOUT
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

    // 🔥 VALIDAR ESTOQUE ANTES DE FINALIZAR
    if (!validateStockBeforeCheckout()) {
      return;
    }

    setUploadedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadedFileURL(null);
    setShowConfirmModal(true);
  };

  // 🔥 HANDLE UPLOAD DE COMPROVATIVO - CORRIGIDO
const handleFileUpload = async (file: File) => {
  // Validar tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Arquivo muito grande. Máximo 5MB.');
    return;
  }

  // Validar tipo
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    toast.error('Formato inválido. Use PNG, JPG ou PDF.');
    return;
  }

  setUploadedFile(file);
  setIsUploading(true);
  setUploadProgress(0);

  try {
    // 🔥 CORRIGIDO: Usar FormData corretamente
    const formData = new FormData();
    formData.append('image', file);

    // 🔥 CORRIGIDO: Usar fetch (mais simples e confiável)
    const response = await fetch('https://api.imgbb.com/1/upload?key=4e470b576522a10c52b87edf23905cb3', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      setUploadedFileURL(data.data.url);
      setUploadProgress(100);
      toast.success('Comprovativo enviado com sucesso!');
    } else {
      toast.error('Erro ao enviar comprovativo. Tente novamente.');
      setUploadedFile(null);
    }
  } catch (error) {
    console.error('Erro no upload:', error);
    toast.error('Erro ao enviar comprovativo. Tente novamente.');
    setUploadedFile(null);
  } finally {
    setIsUploading(false);
  }
};

  // 🔥 HANDLE CONFIRMAR PEDIDO
  const handleConfirmOrder = async () => {
    if (!uploadedFileURL) {
      toast.error('Envie o comprovativo antes de confirmar');
      return;
    }

    // 🔥 Validar estoque novamente antes de finalizar
    if (!validateStockBeforeCheckout()) {
      setShowConfirmModal(false);
      return;
    }

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
        'multicaixa',
        uploadedFileURL
      );

      if (result.success) {
        clearCart();
        setShowConfirmModal(false);
        onClose();
        navigate(`/order-confirmation/${result.orderId}`);
        toast.success(`Pedido #${result.orderNumber} criado com sucesso!`);
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
              <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Seu carrinho está vazio</h3>
                  <p className="mt-1 text-sm text-gray-500">Comece a adicionar produtos!</p>
                  <button onClick={onClose} className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500">
                    Continuar comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const isMaxReached = item.qty >= item.stock;
                    const isOutOfStock = item.stock <= 0;

                    return (
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
                              onClick={() => handleUpdateQuantity(item.id, item.qty - 1)}
                              className="rounded-full p-0.5 hover:bg-gray-100 transition-colors"
                              aria-label="Diminuir quantidade"
                              disabled={item.qty <= 1}
                            >
                              <Minus className="h-3 w-3 text-gray-500" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.qty + 1)}
                              className="rounded-full p-0.5 hover:bg-gray-100 transition-colors"
                              aria-label="Aumentar quantidade"
                              disabled={isMaxReached || isOutOfStock}
                            >
                              <Plus className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                          {/* INFO DE ESTOQUE */}
                          <div className="flex items-center gap-2 mt-1">
                            {isOutOfStock ? (
                              <span className="text-xs text-red-500">Esgotado</span>
                            ) : isMaxReached ? (
                              <span className="text-xs text-orange-500">Limite atingido</span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {item.stock - item.qty} disponíveis
                              </span>
                            )}
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
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-semibold text-gray-900">Kz {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-gray-600">Entrega</span>
                  <span className="text-sm font-semibold text-green-600">Grátis</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-4 mb-4">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-primary-600">Kz {totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={clearCart} className="flex-1 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
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
                    </Link> para finalizar a compra
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmOrder}
        total={totalPrice}
        items={items}
        loading={loading}
        onFileUpload={handleFileUpload}
        uploadedFile={uploadedFile}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        uploadedFileURL={uploadedFileURL}
      />
    </>
  );
};

export default CartModal;