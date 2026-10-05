import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  X,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Upload,
  File,
  Check,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Building,
  Copy,
  Edit3,
  Save,
  Truck,
  ShieldCheck,
  Clock,
  Banknote,
  Loader2,
  Sparkles,
  User as UserIcon,
  Package,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartService } from '../../services/cartService';
import { userService } from '../../services/userService';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = 'delivery' | 'multicaixa';


/* ============================ CONFIRM MODAL ============================ */

const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    userData: { phone: string; address: string; city: string },
    paymentMethod: PaymentMethod
  ) => void;
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
  isOpen,
  onClose,
  onConfirm,
  total,
  items,
  loading,
  onFileUpload,
  uploadedFile,
  isUploading,
  uploadedFileURL,
  userData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState(userData?.phone || '');
  const [editAddress, setEditAddress] = useState(userData?.address || '');
  const [editCity, setEditCity] = useState(userData?.city || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('delivery');

  useEffect(() => {
    if (userData) {
      setEditPhone(userData.phone || '');
      setEditAddress(userData.address || '');
      setEditCity(userData.city || '');
    }
  }, [userData]);

  const COMPANY_IBAN = 'AO06.0040.0000.1234.5678.9012.3';
  const COMPANY_NAME = 'Twendy Create LDA.';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copiado!`))
      .catch(() => toast.error(`Erro ao copiar ${label}`));
  };

  const handleConfirm = () => {
    onConfirm({ phone: editPhone, address: editAddress, city: editCity }, paymentMethod);
  };

  const hasCompleteData = editPhone.trim() && editAddress.trim() && editCity.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl shadow-slate-900/20 border border-slate-200/70 animate-modalSlideUp max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Finalizar pedido
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Confirme seu pedido de{' '}
            <strong className="text-blue-600 font-bold">
              Kz {total.toFixed(2)}
            </strong>
          </p>
        </div>

        {/* Método de pagamento */}
        <div className="mb-6">
          <h4 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-3">
            Método de pagamento
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Delivery */}
            <button
              type="button"
              onClick={() => setPaymentMethod('delivery')}
              className={`relative p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                paymentMethod === 'delivery'
                  ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md shadow-emerald-100'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              {paymentMethod === 'delivery' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    paymentMethod === 'delivery'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'
                      : 'bg-slate-100'
                  }`}
                >
                  <Truck
                    className={`w-5 h-5 ${
                      paymentMethod === 'delivery' ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    Pagamento na entrega
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Pague em dinheiro ou TPA ao receber
                  </p>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                      paymentMethod === 'delivery'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Sem pagamento antecipado
                  </div>
                </div>
              </div>
            </button>

            {/* Transferência */}
            <button
              type="button"
              onClick={() => setPaymentMethod('multicaixa')}
              className={`relative p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                paymentMethod === 'multicaixa'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md shadow-blue-100'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              {paymentMethod === 'multicaixa' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    paymentMethod === 'multicaixa'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                      : 'bg-slate-100'
                  }`}
                >
                  <Building
                    className={`w-5 h-5 ${
                      paymentMethod === 'multicaixa' ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    Transferência bancária
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Transfira para o nosso IBAN
                  </p>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                      paymentMethod === 'multicaixa'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    Confirmação 24-72h
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Dados do cliente */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/60 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
              Seus dados
            </h4>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                isEditing
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="w-3 h-3" />
                  Salvar
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3" />
                  Editar
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {/* Nome/Email */}
            <div className="flex items-start gap-2.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Nome / Email
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {userData?.name || 'Não informado'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {userData?.email || 'Não informado'}
                </p>
              </div>
            </div>

            {/* Telefone */}
            <div className="flex items-start gap-2.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Telefone *
                </p>
                {isEditing ? (
                  <div className="mt-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+244 9XX XXX XXX"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-blue-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <p
                    className={`text-sm font-medium ${
                      editPhone ? 'text-slate-900' : 'text-red-500'
                    }`}
                  >
                    {editPhone || '⚠️ Obrigatório — clique em Editar'}
                  </p>
                )}
              </div>
            </div>

            {/* Morada */}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Morada *
                </p>
                {isEditing ? (
                  <div className="mt-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Rua, número, bairro..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-blue-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <p
                    className={`text-sm font-medium ${
                      editAddress ? 'text-slate-900' : 'text-red-500'
                    }`}
                  >
                    {editAddress || '⚠️ Obrigatório — clique em Editar'}
                  </p>
                )}
              </div>
            </div>

            {/* Cidade */}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Cidade *
                </p>
                {isEditing ? (
                  <div className="mt-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Sua cidade"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-blue-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <p
                    className={`text-sm font-medium ${
                      editCity ? 'text-slate-900' : 'text-red-500'
                    }`}
                  >
                    {editCity || '⚠️ Obrigatório — clique em Editar'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {!hasCompleteData && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                Preencha telefone, morada e cidade antes de finalizar.
              </p>
            </div>
          )}
        </div>

        {/* Transferência bancária */}
        {paymentMethod === 'multicaixa' && (
          <>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl p-4 mb-5">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                Dados para transferência
              </h4>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Titular
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {COMPANY_NAME}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    IBAN
                  </p>
                  <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-xl p-2.5 mt-1.5 border border-emerald-200">
                    <p className="text-xs font-mono font-bold text-slate-900 flex-1 select-all truncate">
                      {COMPANY_IBAN}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(COMPANY_IBAN, 'IBAN')}
                      className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0"
                      title="Copiar IBAN"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-700" />
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Transferências entre bancos diferentes podem levar{' '}
                    <strong>24-72h úteis</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload */}
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-slate-700 mb-2 tracking-wide">
                COMPROVATIVO DE PAGAMENTO{' '}
                <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>

              {!uploadedFileURL ? (
                <div
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    uploadedFile
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/40'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) onFileUpload(e.target.files[0]);
                    }}
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                        <File className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-emerald-800">
                          {uploadedFile.name}
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          {(uploadedFile.size / 1024).toFixed(0)} KB · Processando...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                        <Upload className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Clique para fazer upload
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG ou PDF · máx. 5MB
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-emerald-800">
                      Comprovativo enviado!
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(uploadedFileURL, '_blank')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2"
                    >
                      Ver comprovativo
                    </button>
                  </div>
                </div>
              )}
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                * O upload é opcional. Se não enviar, nossa equipe confirmará manualmente.
              </p>
            </div>
          </>
        )}

        {/* Delivery info */}
        {paymentMethod === 'delivery' && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl p-4 mb-5">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Pagamento na entrega
            </h4>
            <div className="space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed">
                Você pagará{' '}
                <strong className="text-emerald-800">Kz {total.toFixed(2)}</strong>{' '}
                quando receber seu produto.
              </p>
              <div className="flex items-start gap-2">
                <Banknote className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Aceitamos dinheiro ou cartão (TPA) no momento da entrega.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Nossa equipe entrará em contacto para confirmar a entrega.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resumo do pedido */}
        <div className="bg-white/70 border border-slate-200/70 rounded-2xl p-4 mb-5 max-h-44 overflow-y-auto">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            Resumo do pedido
          </h4>
          <div className="space-y-1.5">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0"
              >
                <span className="text-xs text-slate-600 truncate pr-2">
                  {item.name}
                </span>
                <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                  {item.qty}x · Kz {(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-900">Total</span>
            <span className="text-lg font-bold text-blue-600">
              Kz {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl p-4 mb-5">
          <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Próximos passos
          </h4>
          <ol className="text-[11px] text-slate-700 space-y-1 list-decimal list-inside leading-relaxed">
            {paymentMethod === 'delivery' ? (
              <>
                <li>Confirme seus dados de entrega acima</li>
                <li>Nosso time entrará em contacto</li>
                <li>Pague quando receber o produto</li>
              </>
            ) : (
              <>
                <li>Preencha telefone e morada</li>
                <li>Realize a transferência para o IBAN</li>
                <li>Envie o comprovativo (opcional)</li>
                <li>Confirme o pedido</li>
              </>
            )}
          </ol>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || isUploading || !hasCompleteData}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              paymentMethod === 'delivery'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : paymentMethod === 'delivery' ? (
              <>
                <Check className="w-4 h-4" />
                Confirmar pedido
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar transferência
              </>
            )}
          </button>
        </div>

        {!hasCompleteData && !isUploading && (
          <p className="mt-2.5 text-[11px] text-red-500 font-medium flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            Preencha telefone, morada e cidade
          </p>
        )}
      </div>
    </div>
  );
};

/* ============================ CART MODAL ============================ */

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

  const userData = user
    ? {
        name: user.name || user?.email?.split('@')[0] || 'Cliente',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
      }
    : null;

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    const item = items.find((i) => i.id === productId);
    if (!item) return;
    if (newQty > item.stock) {
      toast.error(`Estoque insuficiente! Apenas ${item.stock} unidades.`);
      return;
    }
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }
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
    if (!user) {
      toast.error('Faça login para finalizar');
      onClose();
      return;
    }
    if (items.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    if (!validateStockBeforeCheckout()) return;
    setUploadedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadedFileURL(null);
    setShowConfirmModal(true);
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máx 5MB.');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou PDF.');
      return;
    }
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(
        'https://api.imgbb.com/1/upload?key=4e470b576522a10c52b87edf23905cb3',
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      if (data.success) {
        setUploadedFileURL(data.data.url);
        setUploadProgress(100);
        toast.success('Comprovativo enviado!');
      } else {
        toast.error('Erro ao enviar.');
        setUploadedFile(null);
      }
    } catch {
      toast.error('Erro ao enviar.');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmOrder = async (
    editedData: { phone: string; address: string; city: string },
    paymentMethod: PaymentMethod
  ) => {
    if (!validateStockBeforeCheckout()) {
      setShowConfirmModal(false);
      return;
    }

    setLoading(true);
    try {
      if (user?.uid) {
        await userService
          .updateUser(user.uid, {
            phone: editedData.phone,
            address: editedData.address,
            city: editedData.city,
          } as any)
          .catch((err) => console.error('Erro ao atualizar perfil:', err));
      }

      const customerData = {
        name: user?.name || 'Cliente',
        email: user?.email || '',
        phone: editedData.phone,
        address: editedData.address,
        city: editedData.city,
      };

      const result = await cartService.createOrder(
        user!.uid,
        items,
        totalPrice,
        customerData,
        paymentMethod,
        uploadedFileURL ?? undefined
      );

      if (result.success) {
        clearCart();
        setShowConfirmModal(false);
        onClose();
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
      {/* Drawer */}
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
          onClick={onClose}
        />
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20 border-l border-slate-200/70 flex flex-col animate-slideInRight">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
                <ShoppingCart className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Meu carrinho
                </h2>
                <p className="text-[10px] text-slate-500">
                  {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </p>
              </div>
              {totalItems > 0 && (
                <span className="ml-1 min-w-[22px] h-[22px] px-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <ShoppingCart className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Carrinho vazio
                </h3>
                <p className="text-xs text-slate-500 mb-5 max-w-[240px]">
                  Explore nossa loja e adicione produtos para começar
                </p>
                <button
                  onClick={onClose}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2"
                >
                  Continuar comprando
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm border border-slate-200/70 rounded-2xl hover:border-slate-300 transition-colors"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/64';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm font-bold text-blue-600 mt-0.5">
                        Kz {item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3 h-3 text-slate-600" />
                        </button>
                        <span className="text-sm font-bold text-slate-900 w-6 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.qty + 1)}
                          disabled={item.qty >= item.stock}
                          className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3 text-slate-600" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900 mb-1.5 whitespace-nowrap">
                        Kz {(item.price * item.qty).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors ml-auto block"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-slate-200/70 px-5 py-4 bg-white/70 backdrop-blur-sm">
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="text-slate-700 font-bold">
                    Kz {totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Entrega</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Grátis
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mb-4">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-xl font-bold text-blue-600 tracking-tight">
                  Kz {totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5"
                  title="Limpar carrinho"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all font-bold text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  Finalizar pedido
                </button>
              </div>

              {!user && (
                <p className="mt-3 text-center text-[11px] text-slate-500">
                  <Link
                    to="/login"
                    className="font-bold text-blue-600 hover:underline underline-offset-2"
                  >
                    Faça login
                  </Link>{' '}
                  para finalizar
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
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

      {/* Animações */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%) }
          to { transform: translateX(0) }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-in-out }
        .animate-modalSlideUp { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) }
      `}</style>
    </>
  );
};

export default CartModal;