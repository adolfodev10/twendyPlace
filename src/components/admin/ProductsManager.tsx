import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import { Plus, Edit, Trash2, Search, X, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
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

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
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
    
    // Validações
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
        name: formData.name.trim(),
        price: formData.price,
        stock: formData.stock,
        category: formData.category,
        brand: formData.brand,
        rating: formData.rating,
        image: formData.image.trim(),
        description: formData.description.trim(),
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.brand.toLowerCase().includes(search.toLowerCase()) ||
    product.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gerenciar Produtos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Produto</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden sm:table-cell">Categoria</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden md:table-cell">Marca</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Preço</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden sm:table-cell">Estoque</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden lg:table-cell">Avaliação</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                          <p className="font-medium text-gray-900 text-sm truncate max-w-[120px] sm:max-w-none">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate sm:hidden">{product.brand}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-600 text-sm hidden md:table-cell">
                      {product.brand}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-semibold text-gray-900 text-sm whitespace-nowrap">
                      Kz {product.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        product.stock > 10 ? 'bg-green-100 text-green-700' :
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.stock} un.
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 hidden lg:table-cell">
                      <span className="text-yellow-500 text-sm whitespace-nowrap">
                        {'★'.repeat(product.rating)}{'☆'.repeat(5 - product.rating)}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label="Editar produto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(product)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Excluir produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Produto (Criar/Editar) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[modalSlideUp_0.3s_ease]">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: iPhone 15 Pro"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                  required
                />
              </div>

              {/* Preço e Estoque */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (Kz) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                    required
                  />
                </div>
              </div>

              {/* Categoria e Marca */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca *
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
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
                </div>
              </div>

              {/* Avaliação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avaliação (1-5)
                </label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                >
                  {[1, 2, 3, 4, 5].map(r => (
                    <option key={r} value={r}>{r} ★</option>
                  ))}
                </select>
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem *
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                  required
                />
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80/2563eb/ffffff?text=Preview';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Descrição do produto..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
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

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={handleCloseDeleteModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-[modalSlideUp_0.3s_ease]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-gray-600">
                Tem certeza que deseja excluir o produto <strong>"{productToDelete.name}"</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Esta ação não pode ser desfeita.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleCloseDeleteModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;