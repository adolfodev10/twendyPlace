import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import { Plus, Edit, Trash2, Search, X, Save, AlertTriangle, Package, AlertCircle, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const sanitizeInput = (input: string) => {
    return input.replace(/[<>]/g, '').trim();
  };

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
      const zeroStock = data.filter(p => p.stock === 0);
      setOutOfStockCount(zeroStock.length);

      if (zeroStock.length > 0) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-[90vw] sm:max-w-md w-full bg-yellow-50 border border-yellow-200 shadow-lg rounded-xl pointer-events-auto flex items-start gap-3 p-3 sm:p-4`}>
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-800">
                ⚠️ {zeroStock.length} produto{zeroStock.length > 1 ? 's' : ''} com estoque zerado!
              </p>
              <p className="text-[10px] sm:text-xs text-yellow-600 mt-0.5">
                Eles não aparecem na loja para clientes.
              </p>
            </div>
            <button onClick={() => toast.dismiss(t.id)} className="text-yellow-500 hover:text-yellow-700 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ), { duration: 8000 });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }
    if (!formData.category) {
      toast.error('Selecione uma categoria');
      return;
    }
    if (!formData.brand) {
      toast.error('Selecione uma marca');
      return;
    }
    if (!formData.image.trim()) {
      toast.error('URL da imagem é obrigatória');
      return;
    }

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

      let result;
      if (editingProduct) {
        result = await productService.updateProduct(editingProduct.id, productData);
      } else {
        result = await productService.addProduct(productData);
      }

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
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Erro ao excluir produto ${productId}:`, error);
        }
      }

      setSelectedProducts(new Set());
      setSelectAll(false);
      setShowBulkDeleteModal(false);

      if (successCount > 0) {
        toast.success(`${successCount} produto(s) excluído(s) com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} produto(s) não puderam ser excluídos`);
      }

      loadProducts();
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
      toast.error('Erro ao excluir produtos');
    } finally {
      setDeleting(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      return newSelected;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredProducts.map(product => product.id));
      setSelectedProducts(allIds);
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
    return products.filter(product =>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-0 -mt-32">
      {/* Banner de Produtos Esgotados */}
      {outOfStockCount > 0 && (
        <div className="mb-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-yellow-800">
                {outOfStockCount} produto{outOfStockCount > 1 ? 's' : ''} com estoque zerado
              </p>
              <p className="text-[10px] sm:text-xs text-yellow-700 hidden sm:block">
                Estes produtos não aparecem na loja para clientes. Recomendamos reabastecer ou ocultar.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSearch('');
              const zeroStockProducts = products.filter(p => p.stock === 0);
              if (zeroStockProducts.length > 0) {
                toast.success(`${zeroStockProducts.length} produtos com estoque zero`);
              }
            }}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors flex-shrink-0"
          >
            Ver todos
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
          <span className="truncate">Gerenciar Produtos</span>
          {outOfStockCount > 0 && (
            <span className="text-xs sm:text-sm font-normal text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
              {outOfStockCount} esgotados
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedProducts.size > 0 && (
            <button
              onClick={openBulkDeleteModal}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Excluir</span> ({selectedProducts.size})
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Mobile: Card View */}
        <div className="block sm:hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum produto encontrado
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock === 0;
                const isSelected = selectedProducts.has(product.id);
                return (
                  <div key={product.id} className={`p-3 ${isSelected ? 'bg-primary-50' : ''} ${isOutOfStock ? 'bg-yellow-50/30' : ''}`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleProductSelection(product.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56/2563eb/ffffff?text=P';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                          {isOutOfStock && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">ESGOTADO</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{product.brand} • {product.category}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-sm">Kz {product.price.toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isOutOfStock ? 'bg-red-100 text-red-700' : product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {product.stock} un.
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-yellow-500 text-xs">{'★'.repeat(product.rating)}</span>
                          <div className="flex gap-1 ml-auto">
                            <button onClick={() => handleOpenModal(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOpenDeleteModal(product)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop: Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 w-12">
                  <button onClick={toggleSelectAll} className="hover:bg-gray-200 rounded p-0.5 transition-colors">
                    {selectAll ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Produto</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden md:table-cell">Categoria</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden lg:table-cell">Marca</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Preço</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Estoque</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden xl:table-cell">Avaliação</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isOutOfStock = product.stock === 0;
                  const isSelected = selectedProducts.has(product.id);
                  return (
                    <tr key={product.id} className={`border-b border-gray-100 transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'} ${isOutOfStock ? 'bg-yellow-50/30' : ''}`}>
                      <td className="py-3 px-3 sm:px-4">
                        <button onClick={() => toggleProductSelection(product.id)} className="hover:bg-gray-200 rounded p-0.5 transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                        </button>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48/2563eb/ffffff?text=Product';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate max-w-[120px] sm:max-w-[200px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate md:hidden">{product.brand} • {product.category}</p>
                          </div>
                          {isOutOfStock && (
                            <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded hidden sm:inline">
                              ESGOTADO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-gray-600 text-sm hidden lg:table-cell">
                        {product.brand}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-semibold text-gray-900 text-sm whitespace-nowrap">
                        Kz {product.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${isOutOfStock ? 'bg-red-100 text-red-700 animate-pulse' : product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {product.stock} un.
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 hidden xl:table-cell">
                        <span className="text-yellow-500 text-sm whitespace-nowrap">
                          {'★'.repeat(product.rating)}{'☆'.repeat(5 - product.rating)}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button onClick={() => handleOpenModal(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenDeleteModal(product)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

        {/* Barra de seleção */}
        {selectedProducts.size > 0 && (
          <div className="bg-primary-50 border-t border-primary-200 px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-primary-700">
              <strong>{selectedProducts.size}</strong> produto{selectedProducts.size > 1 ? 's' : ''} selecionado{selectedProducts.size > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => { setSelectedProducts(new Set()); setSelectAll(false); }} className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 underline">
                Limpar
              </button>
              <button onClick={openBulkDeleteModal} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar Produto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/60" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-[modalSlideUp_0.3s_ease] mx-2 sm:mx-0">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Preço (Kz) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} min="0" step="0.01" className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Estoque *</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} min="0" className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                    <option value="">Selecione...</option>
                    <option value="Audio">Áudio & Som</option>
                    <option value="Computers">Computadores</option>
                    <option value="Mobile">Telemóveis</option>
                    <option value="Wearables">Acessórios</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Accessories">Acessórios</option>
                    <option value="Cameras">Câmeras</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Marca *</label>
                  <select name="brand" value={formData.brand} onChange={handleInputChange} className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
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
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Avaliação (1-5)</label>
                <select name="rating" value={formData.rating} onChange={handleInputChange} className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  {[1, 2, 3, 4, 5].map(r => (
                    <option key={r} value={r}>{r} ★</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">URL da Imagem *</label>
                <input type="url" name="image" value={formData.image} onChange={handleInputChange} className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                {formData.image && (
                  <div className="mt-2">
                    <img src={formData.image} alt="Preview" className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-gray-200" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleCloseModal} className="w-full sm:flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="w-full sm:flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingProduct ? 'Atualizar' : 'Criar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão Individual */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={handleCloseDeleteModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-[modalSlideUp_0.3s_ease] mx-2 sm:mx-0">
            <div className="p-4 sm:p-6 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-600">Tem certeza que deseja excluir o produto <strong>"{productToDelete.name}"</strong>?</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Esta ação não pode ser desfeita.</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
                <button onClick={handleCloseDeleteModal} className="w-full sm:flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={deleting} className="w-full sm:flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
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
          </div>
        </div>
      )}

      {/* Modal de Exclusão em Massa */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowBulkDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-[modalSlideUp_0.3s_ease] mx-2 sm:mx-0">
            <div className="p-4 sm:p-6 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Excluir Produtos</h3>
              <p className="text-sm text-gray-600">
                Tem certeza que deseja excluir <strong>{selectedProducts.size}</strong> produto{selectedProducts.size > 1 ? 's' : ''} selecionado{selectedProducts.size > 1 ? 's' : ''}?
              </p>
              <p className="text-xs sm:text-sm text-red-500 mt-1">Esta ação não pode ser desfeita.</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
                <button onClick={() => setShowBulkDeleteModal(false)} disabled={deleting} className="w-full sm:flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={executeBulkDelete} disabled={deleting} className="w-full sm:flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;