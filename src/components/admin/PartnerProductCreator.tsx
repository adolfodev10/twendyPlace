import React, { useState, useEffect } from 'react';
import { Partner } from '../../types';
import { partnerService } from '../../services/partnerService';
import { Plus, X, Package, Users, DollarSign, Percent, Image, Tag, Box } from 'lucide-react';
import toast from 'react-hot-toast';

interface PartnerProductCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    partnerId?: string;
}

const PartnerProductCreator: React.FC<PartnerProductCreatorProps> = ({
    isOpen,
    onClose,
    onSuccess,
    partnerId: initialPartnerId
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

    const categories = ['Audio', 'Computers', 'Mobile', 'Wearables', 'Gaming', 'Accessories', 'Cameras'];
    const brands = ['Apple', 'Samsung', 'Sony', 'Logitech', 'Dell', 'TechBrand', 'SoundMax', 'GameTech', 'FitTech', 'PhotoPro'];

    useEffect(() => {
        if (isOpen) {
            loadPartners();
        }
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setProductData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPartnerId) {
            toast.error('Selecione um parceiro');
            return;
        }

        if (!productData.name.trim() || productData.price <= 0 || !productData.image.trim()) {
            toast.error('Nome, Preço e Imagem são obrigatórios');
            return;
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
                // Reset form
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

    // Calcular comissão estimada
    const estimatedCommission = productData.partnerPrice > 0
        ? (productData.partnerPrice * productData.commissionRate) / 100
        : 0;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary-600" />
                        Produto para Parceiro
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Selecionar Parceiro */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Users className="w-4 h-4 inline mr-1" />
                            Parceiro *
                        </label>
                        <select
                            value={selectedPartnerId}
                            onChange={(e) => setSelectedPartnerId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                            disabled={!!initialPartnerId || loading}
                        >
                            <option value="">Selecione um parceiro</option>
                            {partners.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - {p.company} ({p.commissionRate}% comissão)
                                </option>
                            ))}
                        </select>
                        {loading && <p className="text-xs text-gray-500 mt-1">Carregando parceiros...</p>}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Dados do Produto</h3>

                        {/* Nome */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome do Produto *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={productData.name}
                                onChange={handleInputChange}
                                placeholder="Ex: iPhone 15 Pro"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>

                        {/* Preços */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Preço Original (Kz) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={productData.price}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Preço do Parceiro (Kz) *
                                </label>
                                <input
                                    type="number"
                                    name="partnerPrice"
                                    value={productData.partnerPrice}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Estoque e Comissão */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Box className="w-4 h-4 inline mr-1" />
                                    Estoque *
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={productData.stock}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Percent className="w-4 h-4 inline mr-1" />
                                    Comissão (%) *
                                </label>
                                <input
                                    type="number"
                                    name="commissionRate"
                                    value={productData.commissionRate}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Categoria e Marca */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Categoria *
                                </label>
                                <select
                                    name="category"
                                    value={productData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                >
                                    <option value="">Selecione</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Marca *
                                </label>
                                <select
                                    name="brand"
                                    value={productData.brand}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                >
                                    <option value="">Selecione</option>
                                    {brands.map((brand) => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Imagem */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Image className="w-4 h-4 inline mr-1" />
                                URL da Imagem *
                            </label>
                            <input
                                type="url"
                                name="image"
                                value={productData.image}
                                onChange={handleInputChange}
                                placeholder="https://exemplo.com/imagem.jpg"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            />
                            {productData.image && (
                                <div className="mt-2">
                                    <img src={productData.image} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                                </div>
                            )}
                        </div>

                        {/* Avaliação */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação (1-5)</label>
                            <select
                                name="rating"
                                value={productData.rating}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                {[1, 2, 3, 4, 5].map(r => (
                                    <option key={r} value={r}>{r} ★</option>
                                ))}
                            </select>
                        </div>

                        {/* Descrição */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea
                                name="description"
                                value={productData.description}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="Descrição do produto..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                            />
                        </div>

                        {/* Resumo da Comissão */}
                        {productData.partnerPrice > 0 && productData.commissionRate > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700">
                                    <DollarSign className="w-4 h-4 inline" />
                                    Comissão estimada por venda: <strong>Kz {estimatedCommission.toFixed(2)}</strong>
                                    <span className="block text-xs text-green-600">
                                        ({productData.commissionRate}% de Kz {productData.partnerPrice.toFixed(2)})
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Criar Produto
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PartnerProductCreator;