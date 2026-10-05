import React, { useState, useEffect } from 'react';
import { Partner } from '../../types';
import { partnerService } from '../../services/partnerService';
import {
  X,
  Package,
  Users,
  DollarSign,
  Percent,
  Image as ImageIcon,
  Tag,
  Boxes,
  Star,
  FileText,
  Sparkles,
  Loader2,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PartnerProductCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partnerId?: string;
}

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

const PartnerProductCreator: React.FC<PartnerProductCreatorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  partnerId: initialPartnerId,
}) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState(initialPartnerId || '');
  const [productData, setProductData] = useState({
    name: '',
    price: 0,
    partnerPrice: 0,
    stock: 0,
    category: '',
    brand: '',
    rating: 5,
    image: '',
    description: '',
    commissionRate: 15,
  });

  const categories = [
    'Audio',
    'Computers',
    'Mobile',
    'Wearables',
    'Gaming',
    'Accessories',
    'Cameras',
  ];
  const brands = [
    'Apple',
    'Samsung',
    'Sony',
    'Logitech',
    'Dell',
    'TechBrand',
    'SoundMax',
    'GameTech',
    'FitTech',
    'PhotoPro',
  ];

  useEffect(() => {
    if (isOpen) loadPartners();
  }, [isOpen]);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const data = await partnerService.getAllPartners('active');
      setPartners(data);
      if (data.length === 1 && !selectedPartnerId) {
        setSelectedPartnerId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error);
      toast.error('Erro ao carregar parceiros');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPartnerId) return toast.error('Selecione um parceiro');
    if (!productData.name.trim() || productData.price <= 0 || !productData.image.trim()) {
      return toast.error('Nome, Preço e Imagem são obrigatórios');
    }

    setSaving(true);
    try {
      const result = await partnerService.createPartnerProduct(selectedPartnerId, {
        name: productData.name.trim(),
        price: productData.price,
        partnerPrice: productData.partnerPrice || productData.price,
        stock: productData.stock,
        category: productData.category,
        brand: productData.brand,
        rating: productData.rating,
        image: productData.image.trim(),
        description: productData.description.trim(),
        commissionRate: productData.commissionRate,
      });

      if (result.success) {
        toast.success('Produto do parceiro criado com sucesso!');
        onSuccess();
        onClose();
        setProductData({
          name: '',
          price: 0,
          partnerPrice: 0,
          stock: 0,
          category: '',
          brand: '',
          rating: 5,
          image: '',
          description: '',
          commissionRate: 15,
        });
      } else {
        toast.error('Erro ao criar produto: ' + result.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar produto');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const estimatedCommission =
    productData.partnerPrice > 0
      ? (productData.partnerPrice * productData.commissionRate) / 100
      : 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl shadow-slate-900/20 border border-slate-200/70 animate-modalSlideUp">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Criar produto do parceiro
              </h2>
              <p className="text-xs text-slate-500">
                Produto exclusivo da rede de parceiros
              </p>
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
          {/* Parceiro */}
          <div>
            <FieldLabel required>Parceiro</FieldLabel>
            <IconInput icon={Users}>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer disabled:opacity-60`}
                required
                disabled={!!initialPartnerId || loading}
              >
                <option value="">Selecione um parceiro</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.company} ({p.commissionRate}% comissão)
                  </option>
                ))}
              </select>
            </IconInput>
            {loading && (
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Carregando parceiros...
              </p>
            )}
          </div>

          {/* Dados do produto */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Package className="w-3 h-3" />
                DADOS DO PRODUTO
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <FieldLabel required>Nome do produto</FieldLabel>
                <IconInput icon={Package}>
                  <input
                    type="text"
                    name="name"
                    value={productData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: iPhone 15 Pro"
                    className={inputClass}
                    required
                  />
                </IconInput>
              </div>

              {/* Preços */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Preço original (Kz)</FieldLabel>
                  <IconInput icon={DollarSign}>
                    <input
                      type="number"
                      name="price"
                      value={productData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      required
                    />
                  </IconInput>
                </div>
                <div>
                  <FieldLabel required>Preço parceiro (Kz)</FieldLabel>
                  <IconInput icon={DollarSign}>
                    <input
                      type="number"
                      name="partnerPrice"
                      value={productData.partnerPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      required
                    />
                  </IconInput>
                </div>
              </div>

              {/* Estoque e Comissão */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Estoque</FieldLabel>
                  <IconInput icon={Boxes}>
                    <input
                      type="number"
                      name="stock"
                      value={productData.stock}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
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
                      name="commissionRate"
                      value={productData.commissionRate}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className={inputClass}
                      required
                    />
                  </IconInput>
                </div>
              </div>

              {/* Categoria e Marca */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Categoria</FieldLabel>
                  <IconInput icon={Tag}>
                    <select
                      name="category"
                      value={productData.category}
                      onChange={handleInputChange}
                      className={`${inputClass} appearance-none cursor-pointer`}
                      required
                    >
                      <option value="">Selecione</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </IconInput>
                </div>
                <div>
                  <FieldLabel required>Marca</FieldLabel>
                  <IconInput icon={Building2}>
                    <select
                      name="brand"
                      value={productData.brand}
                      onChange={handleInputChange}
                      className={`${inputClass} appearance-none cursor-pointer`}
                      required
                    >
                      <option value="">Selecione</option>
                      {brands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </IconInput>
                </div>
              </div>

              {/* Imagem */}
              <div>
                <FieldLabel required>URL da imagem</FieldLabel>
                <IconInput icon={ImageIcon}>
                  <input
                    type="url"
                    name="image"
                    value={productData.image}
                    onChange={handleInputChange}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className={inputClass}
                    required
                  />
                </IconInput>
                {productData.image && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <img
                      src={productData.image}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/64/ef4444/ffffff?text=Erro';
                      }}
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Preview</p>
                      <p className="text-[11px] text-slate-500">Imagem carregada</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Avaliação */}
              <div>
                <FieldLabel>Avaliação</FieldLabel>
                <IconInput icon={Star}>
                  <select
                    name="rating"
                    value={productData.rating}
                    onChange={handleInputChange}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        {r} {r === 1 ? 'estrela' : 'estrelas'}
                      </option>
                    ))}
                  </select>
                </IconInput>
              </div>

              {/* Descrição */}
              <div>
                <FieldLabel>Descrição</FieldLabel>
                <div className="relative group">
                  <div className="absolute top-3 left-3.5 flex items-start pointer-events-none z-10">
                    <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <textarea
                    name="description"
                    value={productData.description}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Descrição do produto..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900 placeholder-slate-400 resize-none"
                  />
                </div>
              </div>

              {/* Comissão estimada */}
              {productData.partnerPrice > 0 && productData.commissionRate > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-800">
                      Comissão estimada por venda
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">
                    Kz {estimatedCommission.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {productData.commissionRate}% de Kz {productData.partnerPrice.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5 transition-all font-semibold text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Criar produto
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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

export default PartnerProductCreator;