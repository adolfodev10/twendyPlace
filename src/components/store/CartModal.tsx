import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, ShoppingCart, Trash2, Minus, Plus, CreditCard, Upload, File, Check, AlertCircle, MapPin, Phone, Mail, Building, Copy, Edit3, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartService } from '../../services/cartService';
import { userService } from '../../services/userService'; // ✅ Importar userService

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Modal de Confirmação com Upload
const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userData: { phone: string; address: string; city: string }) => void; // ✅ Passa dados editados
  total: number;
  items: any[];
  loading: boolean;
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
  uploadProgress: number;
  isUploading: boolean;
  uploadedFileURL: string | null;
  userData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  } | null;
}> = ({
  isOpen, onClose, onConfirm, total, items, loading, onFileUpload,
  uploadedFile, isUploading, uploadedFileURL, userData
}) => {
    if (!isOpen) return null;

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✅ ESTADOS PARA EDITAR MORADA E TELEFONE
    const [isEditing, setIsEditing] = useState(false);
    const [editPhone, setEditPhone] = useState(userData?.phone || '');
    const [editAddress, setEditAddress] = useState(userData?.address || '');
    const [editCity, setEditCity] = useState(userData?.city || '');

    // ✅ Atualizar quando userData mudar
    useEffect(() => {
      if (userData) {
        setEditPhone(userData.phone || '');
        setEditAddress(userData.address || '');
        setEditCity(userData.city || '');
      }
    }, [userData]);

    const COMPANY_IBAN = 'AO06.0040.0000.1234.5678.9012.3';
    const COMPANY_NAME = 'Twendy Create LDA.';

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('IBAN copiado!');
      }).catch(() => toast.error('Erro ao copiar IBAN'));
    };

    const handleConfirm = () => {
      // ✅ Passar os dados editados para o pai
      onConfirm({
        phone: editPhone,
        address: editAddress,
        city: editCity,
      });
    };

    const hasCompleteData = editPhone.trim() && editAddress.trim() && editCity.trim();

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-4 sm:p-8 max-w-2xl w-full mx-2 sm:mx-4 shadow-2xl animate-[modalSlideUp_0.3s_ease] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 sm:w-10 h-8 sm:h-10 text-primary-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Finalizar Pedido</h3>
            <p className="text-gray-500 mb-6">
              Confirme seu pedido de <strong className="text-primary-600">Kz {total.toFixed(2)}</strong>
            </p>

            {/* Grid de informações */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
              {/* ✅ Dados do Cliente - AGORA EDITÁVEIS */}
              <div className="bg-blue-50 rounded-xl p-4 text-left">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    Seus Dados
                  </h4>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    {isEditing ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                    {isEditing ? 'Salvar' : 'Editar'}
                  </button>
                </div>

                {/* Nome (não editável) */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Nome / Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userData?.name || 'Não informado'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userData?.email || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {/* ✅ Telefone - EDITÁVEL */}
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Telefone *</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+244 9XX XXX XXX"
                          className="w-full mt-1 px-3 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        />
                      ) : (
                        <p className={`text-sm font-medium ${editPhone ? 'text-gray-900' : 'text-red-500'}`}>
                          {editPhone || '⚠️ Obrigatório - Clique em Editar'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ✅ Morada - EDITÁVEL */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Morada *</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Rua, número, bairro..."
                          className="w-full mt-1 px-3 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        />
                      ) : (
                        <p className={`text-sm font-medium ${editAddress ? 'text-gray-900' : 'text-red-500'}`}>
                          {editAddress || '⚠️ Obrigatório - Clique em Editar'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ✅ Cidade - EDITÁVEL */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Cidade *</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="Sua cidade"
                          className="w-full mt-1 px-3 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        />
                      ) : (
                        <p className={`text-sm font-medium ${editCity ? 'text-gray-900' : 'text-red-500'}`}>
                          {editCity || '⚠️ Obrigatório - Clique em Editar'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {!hasCompleteData && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">
                      Preencha telefone, morada e cidade antes de finalizar.
                    </p>
                  </div>
                )}
              </div>

              {/* Dados de Pagamento (mantido igual) */}
              <div className="bg-green-50 rounded-xl p-4 text-left">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-green-600" />
                  Pagamento por Multicaixa
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Titular</p>
                    <p className="text-sm font-medium text-gray-900">{COMPANY_NAME}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">IBAN</p>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 mt-1 border border-gray-200">
                      <p className="text-sm font-mono font-bold text-gray-900 flex-1 select-all">{COMPANY_IBAN}</p>
                      <button onClick={() => copyToClipboard(COMPANY_IBAN)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo do Pedido (mantido igual) */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left max-h-40 overflow-y-auto">
              <h4 className="font-semibold text-gray-900 mb-2">Resumo do Pedido</h4>
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900">{item.qty}x Kz {(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-primary-600 text-lg">Kz {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" /> Instruções
              </h4>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Preencha seu telefone e morada acima</li>
                <li>Realize a transferência para o IBAN</li>
                <li>Faça o upload do comprovativo abaixo</li>
                <li>Confirme o pedido</li>
              </ol>
            </div>

            {/* Upload (mantido igual) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Comprovativo de Pagamento *
              </label>
              {!uploadedFileURL ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploadedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary-400'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) onFileUpload(e.target.files[0]); }} />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <File className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-700">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Clique para fazer upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG ou PDF (máx. 5MB)</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-green-700">Comprovativo enviado!</p>
                    <button onClick={() => window.open(uploadedFileURL, '_blank')} className="text-xs text-primary-600 hover:text-primary-700">Ver comprovativo</button>
                  </div>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || !uploadedFileURL || isUploading || !hasCompleteData}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Processando...' : isUploading ? 'Enviando...' : 'Confirmar Pedido'}
              </button>
            </div>
            {(!uploadedFileURL || !hasCompleteData) && !isUploading && (
              <p className="mt-2 text-xs text-red-500">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                {!hasCompleteData ? 'Preencha telefone, morada e cidade' : 'Envie o comprovativo de pagamento'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

ConfirmModal.displayName = 'ConfirmModal';

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

  const userData = user ? {
    name: user.name || 'Cliente',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
  } : null;

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    const item = items.find(i => i.id === productId);
    if (!item) return;
    if (newQty > item.stock) {
      toast.error(`Estoque insuficiente! Apenas ${item.stock} unidades disponíveis.`);
      return;
    }
    if (newQty <= 0) { removeItem(productId); return; }
    updateQuantity(productId, newQty);
  };

  const validateStockBeforeCheckout = () => {
    for (const item of items) {
      if (item.qty > item.stock) {
        toast.error(`${item.name}: ${item.qty} no carrinho, só ${item.stock} disponíveis.`);
        return false;
      }
    }
    return true;
  };

  const handleCheckout = () => {
    if (!user) { toast.error('Faça login para finalizar'); onClose(); return; }
    if (items.length === 0) { toast.error('Carrinho vazio'); return; }
    if (!validateStockBeforeCheckout()) return;
    setUploadedFile(null); setUploadProgress(0); setIsUploading(false); setUploadedFileURL(null);
    setShowConfirmModal(true);
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande. Máx 5MB.'); return; }
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) { toast.error('Formato inválido. Use PNG, JPG ou PDF.'); return; }
    setUploadedFile(file); setIsUploading(true); setUploadProgress(0);
    try {
      const formData = new FormData(); formData.append('image', file);
      const response = await fetch('https://api.imgbb.com/1/upload?key=4e470b576522a10c52b87edf23905cb3', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) { setUploadedFileURL(data.data.url); setUploadProgress(100); toast.success('Comprovativo enviado!'); }
      else { toast.error('Erro ao enviar.'); setUploadedFile(null); }
    } catch { toast.error('Erro ao enviar.'); setUploadedFile(null); }
    finally { setIsUploading(false); }
  };

  // ✅ handleConfirmOrder agora recebe os dados editados
  const handleConfirmOrder = async (editedData: { phone: string; address: string; city: string }) => {
    if (!uploadedFileURL) { toast.error('Envie o comprovativo'); return; }
    if (!validateStockBeforeCheckout()) { setShowConfirmModal(false); return; }

    setLoading(true);
    try {
      // ✅ Salvar dados do usuário no Firestore
      if (user?.uid) {
        // Cast to any to allow updating additional profile fields (phone/address/city)
        await userService.updateUser(user.uid, {
          phone: editedData.phone,
          address: editedData.address,
          city: editedData.city,
        } as any).catch(err => console.log('Erro ao atualizar perfil:', err));
      }

      const customerData = {
        name: user?.name || 'Cliente',
        email: user?.email || '',
        phone: editedData.phone,
        address: editedData.address,
        city: editedData.city,
      };

      const result = await cartService.createOrder(
        user!.uid, items, totalPrice, customerData, 'multicaixa', uploadedFileURL
      );

      if (result.success) {
        clearCart(); setShowConfirmModal(false); onClose();
        navigate(`/order-confirmation/${result.orderId}`);
        toast.success(`Pedido #${result.orderNumber} criado!`);
      } else {
        toast.error('Erro: ' + result.error);
      }
    } catch (error) {
      toast.error('Erro ao criar pedido.');
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
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold">Meu Carrinho</h2>
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">{totalItems} itens</span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium">Carrinho vazio</h3>
                  <button onClick={onClose} className="mt-4 text-sm text-primary-600">Continuar comprando</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                      <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64'; }} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{item.name}</h4>
                        <p className="text-sm font-semibold text-primary-600">Kz {item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => handleUpdateQuantity(item.id, item.qty - 1)} disabled={item.qty <= 1} className="p-0.5 hover:bg-gray-100 rounded-full"><Minus className="h-3 w-3" /></button>
                          <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, item.qty + 1)} disabled={item.qty >= item.stock} className="p-0.5 hover:bg-gray-100 rounded-full"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">Kz {(item.price * item.qty).toFixed(2)}</p>
                        <button onClick={() => removeItem(item.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t px-4 py-4">
                <div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Subtotal</span><span>Kz {totalPrice.toFixed(2)}</span></div>
                <div className="flex justify-between mb-4"><span className="text-sm text-gray-600">Entrega</span><span className="text-green-600">Grátis</span></div>
                <div className="flex justify-between border-t pt-4 mb-4"><span className="font-semibold">Total</span><span className="text-xl font-bold text-primary-600">Kz {totalPrice.toFixed(2)}</span></div>
                <div className="flex gap-2">
                  <button onClick={clearCart} className="flex-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">Limpar</button>
                  <button onClick={handleCheckout} className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                    <CreditCard className="h-4 w-4" /> Finalizar
                  </button>
                </div>
                {!user && <p className="mt-2 text-center text-xs text-gray-500"><Link to="/login" className="text-primary-600">Faça login</Link> para finalizar</p>}
              </div>
            )}
          </div>
        </div>
      </div>

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
        userData={userData}
      />
    </>
  );
};

export default CartModal;