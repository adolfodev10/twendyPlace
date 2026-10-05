import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  AlertTriangle,
  Package,
  AlertCircle,
  CheckSquare,
  Square,
  Star,
  Layers,
  Tag,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Boxes,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

const InputField: React.FC<{
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  children: React.ReactNode;
}> = ({ id, label, icon: Icon, required, children }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-[11px] font-semibold text-slate-700 mb-1.5 tracking-wide"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
        <Icon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
      </div>
      {children}
    </div>
  </div>
);

/* ============================ COMPONENTE PRINCIPAL ============================ */

const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    stock: 0,
    category: '',
    brand: '',
    rating: 5,
    image: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const sanitizeInput = (input: string) => input.replace(/[<>]/g, '').trim();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setSelectedProducts(new Set());
    setSelectAll(false);
  }, [search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
      const zeroStock = data.filter((p) => p.stock === 0);
      setOutOfStockCount(zeroStock.length);

      if (zeroStock.length > 0) {
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-[90vw] sm:max-w-md w-full bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-xl shadow-amber-200/50 rounded-2xl pointer-events-auto flex items-start gap-3 p-4`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-200">
                <AlertTriangle className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-900">
                  {zeroStock.length} produto{zeroStock.length > 1 ? 's' : ''} com estoque zerado
                </p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Eles não aparecem na loja para clientes. Recomendamos reabastecer.
                </p>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-amber-500 hover:text-amber-700 flex-shrink-0 p-1 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ),
          { duration: 8000 }
        );
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        price: product.price || 0,
        stock: product.stock || 0,
        category: product.category || '',
        brand: product.brand || '',
        rating: product.rating || 5,
        image: product.image || '',
        description: product.description || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: 0,
        stock: 0,
        category: '',
        brand: '',
        rating: 5,
        image: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error('Nome do produto é obrigatório');
    if (formData.price <= 0) return toast.error('Preço deve ser maior que zero');
    if (!formData.category) return toast.error('Selecione uma categoria');
    if (!formData.brand) return toast.error('Selecione uma marca');
    if (!formData.image.trim()) return toast.error('URL da imagem é obrigatória');

    setSaving(true);
    try {
      const productData = {
        name: sanitizeInput(formData.name),
        price: Number(sanitizeInput(String(formData.price))),
        stock: Number(sanitizeInput(String(formData.stock))),
        category: sanitizeInput(formData.category),
        brand: sanitizeInput(formData.brand),
        rating: Number(sanitizeInput(String(formData.rating))),
        image: sanitizeInput(formData.image),
        description: sanitizeInput(formData.description),
      };

      const result = editingProduct
        ? await productService.updateProduct(editingProduct.id, productData)
        : await productService.addProduct(productData);

      if (result.success) {
        toast.success(editingProduct ? 'Produto atualizado!' : 'Produto criado!');
        handleCloseModal();
        loadProducts();
      } else {
        toast.error('Erro ao salvar: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      const result = await productService.deleteProduct(productToDelete.id);
      if (result.success) {
        toast.success('Produto excluído com sucesso!');
        handleCloseDeleteModal();
        loadProducts();
      } else {
        toast.error('Erro ao excluir: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    } finally {
      setDeleting(false);
    }
  };

  const executeBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    setDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const productIds = Array.from(selectedProducts);
      for (const productId of productIds) {
        try {
          const result = await productService.deleteProduct(productId);
          if (result.success) successCount++;
          else errorCount++;
        } catch (error) {
          errorCount++;
          console.error(`Erro ao excluir produto ${productId}:`, error);
        }
      }

      setSelectedProducts(new Set());
      setSelectAll(false);
      setShowBulkDeleteModal(false);

      if (successCount > 0)
        toast.success(`${successCount} produto(s) excluído(s) com sucesso!`);
      if (errorCount > 0)
        toast.error(`${errorCount} produto(s) não puderam ser excluídos`);

      loadProducts();
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
      toast.error('Erro ao excluir produtos');
    } finally {
      setDeleting(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
      setSelectAll(false);
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
      setSelectAll(true);
    }
  };

  const openBulkDeleteModal = () => {
    if (selectedProducts.size === 0) {
      toast.error('Selecione pelo menos um produto para excluir');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  useEffect(() => {
    if (filteredProducts.length > 0) {
      setSelectAll(selectedProducts.size === filteredProducts.length);
    } else {
      setSelectAll(false);
    }
  }, [selectedProducts, filteredProducts]);

  /* ============================ LOADING ============================ */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
          <div className="relative w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Carregando produtos...</p>
      </div>
    );
  }

  /* ============================ RENDER ============================ */
  return (
    <div className="w-full">
      {/* ==================== HEADER ==================== */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-blue-100 shadow-sm mb-3">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold text-blue-700 tracking-wide">
                CATÁLOGO
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Produtos
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie o catálogo, estoque e disponibilidade dos produtos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedProducts.size > 0 && (
              <button
                onClick={openBulkDeleteModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all font-semibold text-sm shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Excluir ({selectedProducts.size})
              </button>
            )}
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all font-semibold text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo produto
            </button>
          </div>
        </div>
      </div>

      {/* ==================== ALERTA ESTOQUE ==================== */}
      {outOfStockCount > 0 && (
        <div className="mb-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-200">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {outOfStockCount} produto{outOfStockCount > 1 ? 's' : ''} com estoque zerado
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Não aparecem na loja. Reabasteça ou oculte-os.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const zeroStockProducts = products.filter((p) => p.stock === 0);
              if (zeroStockProducts.length > 0) {
                toast.success(`${zeroStockProducts.length} produtos com estoque zero`);
              }
            }}
            className="px-4 py-2 text-xs font-bold text-amber-800 bg-white/70 hover:bg-white border border-amber-200 rounded-xl transition-colors shadow-sm"
          >
            Ver todos
          </button>
        </div>
      )}

      {/* ==================== BUSCA ==================== */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por nome, marca ou categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none text-sm font-medium transition-all text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 whitespace-nowrap">
              <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> produtos
            </span>
          </div>
        </div>
      </div>

      {/* ==================== TABELA / CARDS ==================== */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {/* ===== MOBILE (cards) ===== */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Nenhum produto encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Tente ajustar a busca</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isOutOfStock = product.stock === 0;
              const isSelected = selectedProducts.has(product.id);
              return (
                <div
                  key={product.id}
                  className={`p-4 transition-colors ${
                    isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'
                  } ${isOutOfStock && !isSelected ? 'bg-amber-50/40' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleProductSelection(product.id)}
                      className="mt-1 flex-shrink-0 hover:bg-slate-200/70 rounded-md p-0.5 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="relative flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/56/2563eb/ffffff?text=P';
                        }}
                      />
                      {isOutOfStock && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm truncate">
                          {product.name}
                        </p>
                        {isOutOfStock && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold rounded-md">
                            ESGOTADO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {product.brand} · {product.category}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-sm text-slate-900">
                          Kz {product.price.toFixed(2)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : product.stock > 10
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {product.stock} un.
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-amber-500 text-xs flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < product.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(product)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ===== DESKTOP (tabela) ===== */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/70">
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="hover:bg-slate-200/70 rounded-md p-1 transition-colors"
                  >
                    {selectAll ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  <Package className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Produto
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  <Tag className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Categoria
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  <DollarSign className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Preço
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  <Boxes className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Estoque
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  <Star className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Avaliação
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Nenhum produto encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">Tente ajustar a busca</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock === 0;
                  const isSelected = selectedProducts.has(product.id);
                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-slate-100 transition-colors ${
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'
                      } ${isOutOfStock && !isSelected ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleProductSelection(product.id)}
                          className="hover:bg-slate-200/70 rounded-md p-1 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://via.placeholder.com/48/2563eb/ffffff?text=P';
                              }}
                            />
                            {isOutOfStock && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate max-w-[220px]">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                              {product.brand}
                            </p>
                          </div>
                          {isOutOfStock && (
                            <span className="ml-1 px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold rounded-md">
                              ESGOTADO
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-bold whitespace-nowrap">
                          {product.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
                          Kz {product.price.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : product.stock > 10
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {product.stock} un.
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-amber-500 text-xs flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < product.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(product)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ==================== BARRA DE SELEÇÃO ==================== */}
        {selectedProducts.size > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200/70 px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <CheckSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm text-blue-900">
                <strong className="font-bold">{selectedProducts.size}</strong> produto
                {selectedProducts.size > 1 ? 's' : ''} selecionado
                {selectedProducts.size > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedProducts(new Set());
                  setSelectAll(false);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Limpar seleção
              </button>
              <button
                onClick={openBulkDeleteModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all text-xs font-bold shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAL CRIAR/EDITAR ==================== */}
      <ModalShell isOpen={showModal} onClose={handleCloseModal} size="lg">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                editingProduct
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
              }`}
            >
              {editingProduct ? (
                <Edit className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Editar produto' : 'Novo produto'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingProduct
                  ? 'Atualize as informações do produto'
                  : 'Preencha os dados do novo produto'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <InputField id="name" label="NOME DO PRODUTO" icon={Package} required>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: iPhone 15 Pro Max"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900 placeholder-slate-400"
              required
            />
          </InputField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField id="price" label="PREÇO (Kz)" icon={DollarSign} required>
              <input
                id="price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900"
                required
              />
            </InputField>

            <InputField id="stock" label="ESTOQUE" icon={Boxes} required>
              <input
                id="stock"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900"
                required
              />
            </InputField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField id="category" label="CATEGORIA" icon={Tag} required>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900 appearance-none cursor-pointer"
                required
              >
                <option value="">Selecione...</option>
                <option value="Audio">Áudio & Som</option>
                <option value="Computers">Computadores</option>
                <option value="Mobile">Telemóveis</option>
                <option value="Wearables">Acessórios</option>
                <option value="Gaming">Gaming</option>
                <option value="Accessories">Acessórios</option>
                <option value="Cameras">Câmeras</option>
              </select>
            </InputField>

            <InputField id="brand" label="MARCA" icon={Tag} required>
              <select
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900 appearance-none cursor-pointer"
                required
              >
                <option value="">Selecione...</option>
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Sony">Sony</option>
                <option value="Logitech">Logitech</option>
                <option value="Dell">Dell</option>
                <option value="TechBrand">TechBrand</option>
                <option value="SoundMax">SoundMax</option>
                <option value="GameTech">GameTech</option>
                <option value="FitTech">FitTech</option>
                <option value="PhotoPro">PhotoPro</option>
              </select>
            </InputField>
          </div>

          <InputField id="rating" label="AVALIAÇÃO" icon={Star}>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900 appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} {r === 1 ? 'estrela' : 'estrelas'}
                </option>
              ))}
            </select>
          </InputField>

          <InputField id="image" label="URL DA IMAGEM" icon={ImageIcon} required>
            <input
              id="image"
              type="url"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              placeholder="https://..."
              className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900 placeholder-slate-400"
              required
            />
          </InputField>

          {formData.image && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <img
                src={formData.image}
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

          <InputField id="description" label="DESCRIÇÃO" icon={FileText}>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Descrição detalhada do produto..."
              className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900 placeholder-slate-400 resize-none"
            />
          </InputField>

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
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingProduct ? 'Atualizar' : 'Criar produto'}
                </>
              )}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* ==================== MODAL EXCLUSÃO INDIVIDUAL ==================== */}
      <ModalShell
        isOpen={showDeleteModal && !!productToDelete}
        onClose={handleCloseDeleteModal}
        size="sm"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200 mb-4">
            <Trash2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar exclusão</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza que deseja excluir o produto{' '}
            <strong className="text-slate-900">"{productToDelete?.name}"</strong>?
          </p>
          <p className="text-xs text-red-500 mt-1 font-medium">
            Esta ação não pode ser desfeita.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={handleCloseDeleteModal}
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
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
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

      {/* ==================== MODAL EXCLUSÃO EM MASSA ==================== */}
      <ModalShell
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        size="sm"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200 mb-4">
            <Trash2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir produtos</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza que deseja excluir{' '}
            <strong className="text-slate-900">
              {selectedProducts.size} produto{selectedProducts.size > 1 ? 's' : ''}
            </strong>{' '}
            selecionado{selectedProducts.size > 1 ? 's' : ''}?
          </p>
          <p className="text-xs text-red-500 mt-1 font-medium">
            Esta ação não pode ser desfeita.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={() => setShowBulkDeleteModal(false)}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={executeBulkDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all font-semibold text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir {selectedProducts.size}
                </>
              )}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* ==================== ANIMAÇÕES ==================== */}
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

export default ProductsManager;