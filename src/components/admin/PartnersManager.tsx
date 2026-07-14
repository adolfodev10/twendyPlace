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
    AlertTriangle,
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
    User
} from 'lucide-react';
import toast from 'react-hot-toast';

// Modal de Visualização de Produtos do Parceiro
const PartnerProductsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    partner: Partner | null;
}> = ({ isOpen, onClose, partner }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (partner && isOpen) {
            loadProducts();
        }
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary-600" />
                        Produtos - {partner.name}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p>Nenhum produto associado</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {products.map((product) => (
                                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <img src={product.productImage} alt={product.productName} className="w-12 h-12 rounded-lg object-cover" />
                                        <div>
                                            <p className="font-medium text-gray-900">{product.productName}</p>
                                            <p className="text-sm text-gray-500">Preço: Kz {product.partnerPrice?.toFixed(2) || '0.00'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-green-600">Comissão: {product.commissionRate || 0}%</p>
                                        <p className="text-xs text-gray-500">Kz {product.commission?.toFixed(2) || '0.00'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Modal de Adicionar Produto ao Parceiro
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
        if (isOpen) {
            loadProducts();
        }
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

    const selectedProductData = products.find(p => p.id === selectedProduct);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary-600" />
                        Adicionar Produto
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produto *
                        </label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                            disabled={loading}
                        >
                            <option value="">Selecione um produto</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - Kz {p.price.toFixed(2)}
                                </option>
                            ))}
                        </select>
                        {loading && <p className="text-xs text-gray-500 mt-1">Carregando produtos...</p>}
                    </div>

                    {selectedProductData && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">
                                Preço original: <strong>Kz {selectedProductData.price.toFixed(2)}</strong>
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preço do Parceiro (Kz) *
                        </label>
                        <input
                            type="number"
                            value={partnerPrice}
                            onChange={(e) => setPartnerPrice(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comissão (%) *
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={commissionRate}
                                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                                min="0"
                                max="100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            />
                            <span className="text-gray-500">%</span>
                        </div>
                        {commissionRate > 0 && partnerPrice > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                                Comissão estimada: Kz {((partnerPrice * commissionRate) / 100).toFixed(2)}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
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
            </div>
        </div>
    );
};

const PartnersManager: React.FC = () => {
    const { user } = useAuth();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
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
        bankInfo: {
            bank: '',
            account: '',
            iban: '',
        },
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: type === 'number' ? parseFloat(value) || 0 : value,
                }
            }));
        } else {
            setFormData(prev => ({
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

            let result;
            if (editingPartner) {
                result = await partnerService.updatePartner(editingPartner.id, partnerData);
            } else {
                result = await partnerService.createPartner(partnerData);
            }

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
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 inline mr-1" />Ativo</span>;
            case 'pending':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 inline mr-1" />Pendente</span>;
            case 'inactive':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><XCircle className="w-3 h-3 inline mr-1" />Inativo</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    const filteredPartners = partners.filter(partner =>
        partner.name.toLowerCase().includes(search.toLowerCase()) ||
        partner.company.toLowerCase().includes(search.toLowerCase()) ||
        partner.email.toLowerCase().includes(search.toLowerCase()) ||
        partner.documentId.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: partners.length,
        active: partners.filter(p => p.status === 'active').length,
        pending: partners.filter(p => p.status === 'pending').length,
        inactive: partners.filter(p => p.status === 'inactive').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div>
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

            {/* Modal de Produto (Criar/Editar) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={handleCloseModal} />
                    <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-600" />
                                {editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <input type="text" name="company" value={formData.company} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Documento (NIF/BI) *</label>
                                <input type="text" name="documentId" value={formData.documentId} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (%) *</label>
                                    <input type="number" name="commissionRate" value={formData.commissionRate} onChange={handleInputChange} min="0" max="100" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                    <option value="pending">Pendente</option>
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                            </div>

                            {/* Dados Bancários */}
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Dados Bancários</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Banco</label>
                                        <input type="text" name="bankInfo.bank" value={formData.bankInfo.bank} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Número de Conta</label>
                                        <input type="text" name="bankInfo.account" value={formData.bankInfo.account} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">IBAN</label>
                                        <input type="text" name="bankInfo.iban" value={formData.bankInfo.iban} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {editingPartner ? 'Atualizar' : 'Criar'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteModal && partnerToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-[modalSlideUp_0.3s_ease]">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
                            <p className="text-gray-600">
                                Tem certeza que deseja excluir o parceiro <strong>"{partnerToDelete.name}"</strong>?
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Esta ação não pode ser desfeita.</p>
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                                    Cancelar
                                </button>
                                <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary-600" />
                        Gerenciar Parceiros
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie os parceiros da plataforma e suas comissões
                    </p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto justify-center">
                    <Plus className="w-4 h-4" />
                    Novo Parceiro
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total de Parceiros</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</p>
                    <p className="text-xs text-gray-500">Ativos</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs text-gray-500">Pendentes</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <p className="text-lg sm:text-2xl font-bold text-gray-600">{stats.inactive}</p>
                    <p className="text-xs text-gray-500">Inativos</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Buscar parceiros..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
                        </div>
                    </div>
                    <div className="w-full sm:w-48">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                            <option value="all">Todos</option>
                            <option value="active">Ativos</option>
                            <option value="pending">Pendentes</option>
                            <option value="inactive">Inativos</option>
                        </select>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center whitespace-nowrap">
                        Mostrando: <span className="font-bold ml-1">{filteredPartners.length}</span> parceiros
                    </div>
                </div>
            </div>

            {/* Partners List */}
            <div className="space-y-3">
                {filteredPartners.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhum parceiro encontrado</h3>
                        <p className="text-sm text-gray-500 mt-1">Clique em "Novo Parceiro" para começar.</p>
                    </div>
                ) : (
                    filteredPartners.map((partner) => {
                        const isExpanded = expandedId === partner.id;
                        return (
                            <div key={partner.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpand(partner.id)}>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-primary-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{partner.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{partner.company}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getStatusBadge(partner.status)}
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                {partner.totalProducts || 0} produtos
                                            </span>
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    {partner.email}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Telefone</p>
                                                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    {partner.phone || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Documento</p>
                                                <p className="text-sm font-medium text-gray-900">{partner.documentId}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Comissão</p>
                                                <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                                                    <Percent className="w-3 h-3" />
                                                    {partner.commissionRate}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Vendas</p>
                                                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                    <DollarSign className="w-3 h-3 text-gray-400" />
                                                    Kz {partner.totalSales?.toFixed(2) || '0.00'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Comissão Total</p>
                                                <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                                                    <Banknote className="w-3 h-3" />
                                                    Kz {partner.totalCommission?.toFixed(2) || '0.00'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                            <button onClick={() => { setSelectedPartner(partner); setShowProductsModal(true); }} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                <Eye className="w-4 h-4" />
                                                Ver Produtos
                                            </button>
                                            <button onClick={() => { setSelectedPartner(partner); setShowAddProductModal(true); }} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                                <Plus className="w-4 h-4" />
                                                Adicionar Produto
                                            </button>
                                            <button onClick={() => handleOpenModal(partner)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                <Edit className="w-4 h-4" />
                                                Editar
                                            </button>
                                            <button onClick={() => { setPartnerToDelete(partner); setShowDeleteModal(true); }} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
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
        </div>
    );
};

export default PartnersManager;