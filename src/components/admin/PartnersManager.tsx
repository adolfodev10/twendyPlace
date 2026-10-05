import React, { useState, useEffect } from 'react';
import { Partner } from '../../types';
import { partnerService } from '../../services/partnerService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  Users,
  Mail,
  Phone,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Percent,
  Banknote,
  Building2,
  MapPin,
  FileText,
  Landmark,
  Layers,
  Filter,
  Sparkles,
  TrendingUp,
  Loader2,
  UserPlus,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PartnerProductCreator from './PartnerProductCreator';

/* ============================ SUBCOMPONENTES ============================ */

const ModalShell: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  zIndex?: string;
}> = ({ isOpen, onClose, children, size = 'md', zIndex = 'z-50' }) => {
  if (!isOpen) return null;
  const maxW = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-xl' }[size];

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4`}>
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      <div
        className={`relative bg-white/95 backdrop-blur-xl rounded-3xl ${maxW} w-full shadow-2xl shadow-slate-900/20 border border-slate-200/70 animate-modalSlideUp max-h-[95vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
};

const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 tracking-wide">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const IconInput: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}> = ({ icon: Icon, children }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
      <Icon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
    </div>
    {children}
  </div>
);

const inputClass =
  'w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900 placeholder-slate-400';

/* ============================ MODAL DE PRODUTOS DO PARCEIRO ============================ */

const PartnerProductsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
}> = ({ isOpen, onClose, partner }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (partner && isOpen) loadProducts();
  }, [partner, isOpen]);

  const loadProducts = async () => {
    if (!partner) return;
    setLoading(true);
    try {
      const data = await partnerService.getPartnerProducts(partner.id);
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !partner) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="lg" zIndex="z-[70]">
      <div className="flex items-center justify-between p-5 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Produtos do parceiro
            </h3>
            <p className="text-xs text-slate-500">{partner.name} · {partner.company}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto max-h-[60vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-500">Carregando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Nenhum produto associado
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Adicione produtos a este parceiro para começar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={product.productImage}
                    alt={product.productName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {product.productName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Preço: Kz {product.partnerPrice?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 justify-end">
                    <Percent className="w-3 h-3" />
                    {product.commissionRate || 0}%
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Kz {product.commission?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
};

/* ============================ MODAL ADICIONAR PRODUTO EXISTENTE ============================ */

const AddProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  onSuccess: () => void;
}> = ({ isOpen, onClose, partnerId, onSuccess }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [partnerPrice, setPartnerPrice] = useState(0);
  const [commissionRate, setCommissionRate] = useState(15);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) loadProducts();
  }, [isOpen]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { productService } = await import('../../services/productService');
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || partnerPrice <= 0 || commissionRate < 0) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSaving(true);
    try {
      const result = await partnerService.addProductToPartner(
        partnerId,
        selectedProduct,
        partnerPrice,
        commissionRate
      );

      if (result.success) {
        toast.success('Produto adicionado ao parceiro!');
        onSuccess();
        onClose();
      } else {
        toast.error('Erro ao adicionar: ' + result.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao adicionar produto');
    } finally {
      setSaving(false);
    }
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="sm" zIndex="z-[70]">
      <div className="flex items-center justify-between p-5 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Adicionar produto</h3>
            <p className="text-xs text-slate-500">Vincule um produto existente</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <FieldLabel required>Produto</FieldLabel>
          <IconInput icon={Package}>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer`}
              required
              disabled={loading}
            >
              <option value="">Selecione um produto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — Kz {p.price.toFixed(2)}
                </option>
              ))}
            </select>
          </IconInput>
          {loading && (
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Carregando produtos...
            </p>
          )}
        </div>

        {selectedProductData && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl p-3.5">
            <p className="text-xs text-blue-800">
              <span className="font-bold">Preço original:</span>{' '}
              Kz {selectedProductData.price.toFixed(2)}
            </p>
          </div>
        )}

        <div>
          <FieldLabel required>Preço do parceiro (Kz)</FieldLabel>
          <IconInput icon={DollarSign}>
            <input
              type="number"
              value={partnerPrice}
              onChange={(e) => setPartnerPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={inputClass}
              required
            />
          </IconInput>
        </div>

        <div>
          <FieldLabel required>Comissão (%)</FieldLabel>
          <IconInput icon={Percent}>
            <input
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              className={inputClass}
              required
            />
          </IconInput>
          {commissionRate > 0 && partnerPrice > 0 && (
            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200/70 rounded-xl">
              <p className="text-[11px] text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Comissão estimada:{' '}
                <strong className="text-emerald-900">
                  Kz {((partnerPrice * commissionRate) / 100).toFixed(2)}
                </strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all font-semibold text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Adicionar
              </>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ============================ COMPONENTE PRINCIPAL ============================ */

const PartnersManager: React.FC = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>(
    'all'
  );
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showProductCreator, setShowProductCreator] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    documentId: '',
    address: '',
    city: '',
    commissionRate: 15,
    status: 'pending' as 'active' | 'inactive' | 'pending',
    description: '',
    bankInfo: { bank: '', account: '', iban: '' },
  });

  useEffect(() => {
    loadPartners();
  }, [statusFilter]);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const data = await partnerService.getAllPartners(filter);
      setPartners(data);
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error);
      toast.error('Erro ao carregar parceiros');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name || '',
        email: partner.email || '',
        phone: partner.phone || '',
        company: partner.company || '',
        documentId: partner.documentId || '',
        address: partner.address || '',
        city: partner.city || '',
        commissionRate: partner.commissionRate || 15,
        status: partner.status || 'pending',
        description: partner.description || '',
        bankInfo: partner.bankInfo || { bank: '', account: '', iban: '' },
      });
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        documentId: '',
        address: '',
        city: '',
        commissionRate: 15,
        status: 'pending',
        description: '',
        bankInfo: { bank: '', account: '', iban: '' },
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPartner(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: type === 'number' ? parseFloat(value) || 0 : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.documentId.trim()) {
      toast.error('Nome, Email e Documento são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const partnerData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        documentId: formData.documentId.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        commissionRate: formData.commissionRate,
        status: formData.status,
        description: formData.description.trim(),
        bankInfo: formData.bankInfo,
        logo: '',
        totalSales: 0,
        totalCommission: 0,
        totalProducts: 0,
        products: [],
        approvedAt: formData.status === 'active' ? new Date() : undefined,
        approvedBy: formData.status === 'active' ? user?.uid : undefined,
      };

      const result = editingPartner
        ? await partnerService.updatePartner(editingPartner.id, partnerData)
        : await partnerService.createPartner(partnerData);

      if (result.success) {
        toast.success(editingPartner ? 'Parceiro atualizado!' : 'Parceiro criado!');
        handleCloseModal();
        loadPartners();
      } else {
        toast.error('Erro ao salvar: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar parceiro:', error);
      toast.error('Erro ao salvar parceiro');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!partnerToDelete) return;
    setDeleting(true);
    try {
      const result = await partnerService.deletePartner(partnerToDelete.id);
      if (result.success) {
        toast.success('Parceiro excluído com sucesso!');
        setShowDeleteModal(false);
        setPartnerToDelete(null);
        loadPartners();
      } else {
        toast.error('Erro ao excluir: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir parceiro:', error);
      toast.error('Erro ao excluir parceiro');
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Ativo',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          Icon: CheckCircle,
        };
      case 'pending':
        return {
          label: 'Pendente',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          Icon: Clock,
        };
      case 'inactive':
        return {
          label: 'Inativo',
          className: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          Icon: XCircle,
        };
      default:
        return {
          label: status,
          className: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          Icon: Users,
        };
    }
  };

  const filteredPartners = partners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(search.toLowerCase()) ||
      partner.company.toLowerCase().includes(search.toLowerCase()) ||
      partner.email.toLowerCase().includes(search.toLowerCase()) ||
      partner.documentId.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: partners.length,
    active: partners.filter((p) => p.status === 'active').length,
    pending: partners.filter((p) => p.status === 'pending').length,
    inactive: partners.filter((p) => p.status === 'inactive').length,
  };

  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-200',
    },
    {
      label: 'Ativos',
      value: stats.active,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-200',
    },
    {
      label: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-200',
    },
    {
      label: 'Inativos',
      value: stats.inactive,
      icon: XCircle,
      gradient: 'from-slate-500 to-slate-700',
      shadow: 'shadow-slate-200',
    },
  ];

  /* ============================ LOADING ============================ */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
          <div className="relative w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Carregando parceiros...</p>
      </div>
    );
  }

  /* ============================ RENDER ============================ */
  return (
    <div className="w-full">
      {/* Modais */}
      <PartnerProductsModal
        isOpen={showProductsModal}
        onClose={() => setShowProductsModal(false)}
        partner={selectedPartner}
      />

      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        partnerId={selectedPartner?.id || ''}
        onSuccess={loadPartners}
      />

      {/* Modal criar/editar parceiro */}
      <ModalShell isOpen={showModal} onClose={handleCloseModal} size="lg">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                editingPartner
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
              }`}
            >
              {editingPartner ? (
                <Edit className="w-5 h-5 text-white" />
              ) : (
                <UserPlus className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingPartner ? 'Editar parceiro' : 'Novo parceiro'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingPartner
                  ? 'Atualize as informações do parceiro'
                  : 'Registre um novo parceiro na plataforma'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <FieldLabel required>Nome</FieldLabel>
            <IconInput icon={Users}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome do parceiro"
                className={inputClass}
                required
              />
            </IconInput>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Email</FieldLabel>
              <IconInput icon={Mail}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="parceiro@email.com"
                  className={inputClass}
                  required
                />
              </IconInput>
            </div>
            <div>
              <FieldLabel>Telefone</FieldLabel>
              <IconInput icon={Phone}>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+244 9XX XXX XXX"
                  className={inputClass}
                />
              </IconInput>
            </div>
          </div>

          <div>
            <FieldLabel>Empresa</FieldLabel>
            <IconInput icon={Building2}>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Nome da empresa"
                className={inputClass}
              />
            </IconInput>
          </div>

          <div>
            <FieldLabel required>Documento (NIF/BI)</FieldLabel>
            <IconInput icon={Hash}>
              <input
                type="text"
                name="documentId"
                value={formData.documentId}
                onChange={handleInputChange}
                placeholder="000000000LA000"
                className={inputClass}
                required
              />
            </IconInput>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Cidade</FieldLabel>
              <IconInput icon={MapPin}>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Cidade"
                  className={inputClass}
                />
              </IconInput>
            </div>
            <div>
              <FieldLabel required>Comissão (%)</FieldLabel>
              <IconInput icon={Percent}>
                <input
                  type="number"
                  name="commissionRate"
                  value={formData.commissionRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className={inputClass}
                  required
                />
              </IconInput>
            </div>
          </div>

          <div>
            <FieldLabel>Endereço</FieldLabel>
            <IconInput icon={MapPin}>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Rua, número, bairro..."
                className={inputClass}
              />
            </IconInput>
          </div>

          <div>
            <FieldLabel>Status</FieldLabel>
            <IconInput icon={CheckCircle}>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="pending">Pendente</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </IconInput>
          </div>

          <div>
            <FieldLabel>Descrição</FieldLabel>
            <div className="relative group">
              <div className="absolute top-3 left-3.5 flex items-start pointer-events-none z-10">
                <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                placeholder="Descrição breve do parceiro..."
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900 placeholder-slate-400 resize-none"
              />
            </div>
          </div>

          {/* Dados bancários */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Landmark className="w-3 h-3" />
                DADOS BANCÁRIOS
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="space-y-3">
              <div>
                <FieldLabel>Banco</FieldLabel>
                <IconInput icon={Landmark}>
                  <input
                    type="text"
                    name="bankInfo.bank"
                    value={formData.bankInfo.bank}
                    onChange={handleInputChange}
                    placeholder="Ex: BAI, BFA, BCI..."
                    className={inputClass}
                  />
                </IconInput>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Número de conta</FieldLabel>
                  <IconInput icon={Hash}>
                    <input
                      type="text"
                      name="bankInfo.account"
                      value={formData.bankInfo.account}
                      onChange={handleInputChange}
                      placeholder="0000000000"
                      className={inputClass}
                    />
                  </IconInput>
                </div>
                <div>
                  <FieldLabel>IBAN</FieldLabel>
                  <IconInput icon={Hash}>
                    <input
                      type="text"
                      name="bankInfo.iban"
                      value={formData.bankInfo.iban}
                      onChange={handleInputChange}
                      placeholder="AO06 0000 0000 0000 0000 0"
                      className={inputClass}
                    />
                  </IconInput>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full sm:flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all font-semibold text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingPartner ? 'Atualizar' : 'Criar parceiro'}
                </>
              )}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* Modal exclusão */}
      <ModalShell
        isOpen={showDeleteModal && !!partnerToDelete}
        onClose={() => setShowDeleteModal(false)}
        size="sm"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200 mb-4">
            <Trash2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar exclusão</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza que deseja excluir o parceiro{' '}
            <strong className="text-slate-900">"{partnerToDelete?.name}"</strong>?
          </p>
          <p className="text-xs text-red-500 mt-1 font-medium">
            Esta ação não pode ser desfeita.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all font-semibold text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </>
              )}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* ==================== HEADER ==================== */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-blue-100 shadow-sm mb-3">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold text-blue-700 tracking-wide">
                REDE DE PARCEIROS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Parceiros
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie parceiros, comissões e produtos associados.
            </p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all font-semibold text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo parceiro
          </button>
        </div>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
            />
            <div className="relative">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow} mb-3`}
              >
                <stat.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== FILTROS ==================== */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por nome, empresa, email ou NIF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none text-sm font-medium transition-all text-slate-900 placeholder-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full sm:w-48">
            <div className="relative group">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none text-sm font-medium transition-all text-slate-900 appearance-none cursor-pointer"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="pending">Pendentes</option>
                <option value="inactive">Inativos</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 whitespace-nowrap">
              <strong className="text-slate-900 font-bold">
                {filteredPartners.length}
              </strong>{' '}
              parceiro{filteredPartners.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== LISTA ==================== */}
      <div className="space-y-3">
        {filteredPartners.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Nenhum parceiro encontrado
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Clique em "Novo parceiro" para começar.
            </p>
          </div>
        ) : (
          filteredPartners.map((partner) => {
            const isExpanded = expandedId === partner.id;
            const badge = getStatusBadge(partner.status);
            const initials = (partner.name || 'P')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={partner.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300"
              >
                {/* Header do card */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  onClick={() => toggleExpand(partner.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                          partner.status === 'active'
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'
                            : partner.status === 'pending'
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200'
                            : 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-200'
                        }`}
                      >
                        <span className="text-white font-bold text-sm">
                          {initials}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">
                          {partner.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {partner.company || 'Sem empresa'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${badge.className}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                        <Package className="w-3 h-3" />
                        {partner.totalProducts || 0} produtos
                      </span>
                      <div className="p-1 rounded-lg bg-slate-100/70">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corpo expandido */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                    {/* Info em grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 mt-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Email
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{partner.email}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Telefone
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {partner.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Documento
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-slate-400" />
                          {partner.documentId}
                        </p>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          Comissão
                        </p>
                        <p className="text-base font-bold text-emerald-800 mt-0.5 flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5" />
                          {partner.commissionRate}%
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                          Vendas totais
                        </p>
                        <p className="text-base font-bold text-blue-800 mt-0.5 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Kz {partner.totalSales?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/60 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">
                          Comissão total
                        </p>
                        <p className="text-base font-bold text-violet-800 mt-0.5 flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5" />
                          Kz {partner.totalCommission?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedPartner(partner);
                          setShowProductsModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver produtos
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPartner(partner);
                          setShowAddProductModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" />
                        Vincular produto
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPartner(partner);
                          setShowProductCreator(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Criar produto
                      </button>
                      <button
                        onClick={() => handleOpenModal(partner)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setPartnerToDelete(partner);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Creator */}
      <PartnerProductCreator
        isOpen={showProductCreator}
        onClose={() => setShowProductCreator(false)}
        onSuccess={loadPartners}
        partnerId={selectedPartner?.id}
      />

      {/* Animações */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-in-out }
        .animate-modalSlideUp { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) }
      `}</style>
    </div>
  );
};

export default PartnersManager;