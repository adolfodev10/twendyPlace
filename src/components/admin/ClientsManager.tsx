import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User } from '../../types';
import { Search, Mail, Phone, MapPin, Trash2, AlertTriangle, CheckSquare, Square, Users, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const ClientsManager: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 🔥 NOVO: Estados para seleção múltipla
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  // Limpar seleção quando a busca mudar
  useEffect(() => {
    setSelectedClients(new Set());
    setSelectAll(false);
  }, [search]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'customer'));
      const snapshot = await getDocs(q);
      const clientsData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];

      setClients(clientsData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Filtrar clientes com useMemo
  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.name?.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase()) ||
      client.phone?.toLowerCase().includes(search.toLowerCase()) ||
      client.city?.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  // 🔥 NOVO: Funções de seleção
  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(clientId)) {
        newSelected.delete(clientId);
      } else {
        newSelected.add(clientId);
      }
      return newSelected;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedClients(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredClients.map(client => client.uid));
      setSelectedClients(allIds);
      setSelectAll(true);
    }
  };

  // Sincronizar selectAll
  useEffect(() => {
    if (filteredClients.length > 0) {
      setSelectAll(selectedClients.size === filteredClients.length);
    } else {
      setSelectAll(false);
    }
  }, [selectedClients, filteredClients]);

  // 🔥 NOVO: Abrir modal de exclusão em massa
  const openBulkDeleteModal = () => {
    if (selectedClients.size === 0) {
      toast.error('Selecione pelo menos um cliente para excluir');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  // 🔥 NOVO: Executar exclusão em massa
  const executeBulkDelete = async () => {
    if (selectedClients.size === 0) return;

    setDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const clientIds = Array.from(selectedClients);

      // Processar em lotes de 10
      const batchSize = 10;

      for (let i = 0; i < clientIds.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchIds = clientIds.slice(i, i + batchSize);

        for (const clientId of batchIds) {
          const userRef = doc(db, 'users', clientId);
          batch.delete(userRef);
          successCount++;
        }

        await batch.commit();
      }

      setSelectedClients(new Set());
      setSelectAll(false);
      setShowBulkDeleteModal(false);

      if (successCount > 0) {
        toast.success(`${successCount} cliente(s) excluído(s) com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} cliente(s) não puderam ser excluídos`);
      }

      loadClients();
    } catch (error) {
      console.error('Erro ao excluir clientes:', error);
      toast.error('Erro ao excluir clientes');
    } finally {
      setDeleting(false);
    }
  };

  // 🔥 NOVO: Exportar clientes selecionados para CSV
  const exportSelectedToCSV = () => {
    const clientsToExport = selectedClients.size > 0
      ? filteredClients.filter(c => selectedClients.has(c.uid))
      : filteredClients;

    if (clientsToExport.length === 0) {
      toast.error('Nenhum cliente para exportar');
      return;
    }

    const headers = ['Nome', 'Email', 'Telefone', 'Cidade', 'Endereço'];
    const rows = clientsToExport.map(client => [
      client.name || '',
      client.email || '',
      client.phone || '',
      client.city || '',
      client.address || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`${clientsToExport.length} cliente(s) exportado(s)!`);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" />
          Gerenciar Clientes
        </h1>

        {/* 🔥 NOVO: Botões de ação */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Botão de exportar */}
          <button
            onClick={exportSelectedToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title={selectedClients.size > 0 ? 'Exportar selecionados' : 'Exportar todos'}
          >
            <Download className="w-4 h-4" />
            Exportar {selectedClients.size > 0 ? `(${selectedClients.size})` : 'Todos'}
          </button>

          {/* Botão de exclusão em massa */}
          {selectedClients.size > 0 && (
            <button
              onClick={openBulkDeleteModal}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir ({selectedClients.size})
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes por nome, email, telefone ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* 🔥 NOVO: Barra de seleção */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {selectAll ? (
              <CheckSquare className="w-4 h-4 text-primary-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            {selectAll ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
          <span className="text-sm text-gray-500">
            {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedClients.size > 0 && (
          <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            {selectedClients.size} selecionado{selectedClients.size > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg">Nenhum cliente encontrado</p>
            <p className="text-sm mt-1">Tente ajustar sua busca</p>
          </div>
        ) : (
          filteredClients.map(client => {
            const isSelected = selectedClients.has(client.uid);

            return (
              <div
                key={client.uid}
                className={`bg-white rounded-xl border-2 p-6 transition-all cursor-pointer ${isSelected
                    ? 'border-primary-500 shadow-md shadow-primary-100 bg-primary-50/30'
                    : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                  }`}
                onClick={() => toggleClientSelection(client.uid)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name || 'Cliente')}&background=2563eb&color=fff`}
                      alt={client.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      <p className="text-sm text-gray-500">Cliente</p>
                    </div>
                  </div>

                  {/* 🔥 NOVO: Checkbox de seleção */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleClientSelection(client.uid);
                    }}
                    className={`p-1 rounded-lg transition-colors ${isSelected
                        ? 'text-primary-600 hover:bg-primary-100'
                        : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    title={isSelected ? 'Desmarcar' : 'Selecionar'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{client.city}</span>
                    </div>
                  )}
                </div>

                {client.address && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Endereço:</span> {client.address}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 🔥 NOVO: Barra de ações flutuante */}
      {selectedClients.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-4 animate-[modalSlideUp_0.3s_ease]">
          <p className="text-sm font-medium text-gray-700">
            <strong>{selectedClients.size}</strong> cliente{selectedClients.size > 1 ? 's' : ''} selecionado{selectedClients.size > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedClients(new Set());
                setSelectAll(false);
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Limpar
            </button>
            <button
              onClick={exportSelectedToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={openBulkDeleteModal}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </div>
      )}

      {/* 🔥 NOVO: Modal de Exclusão em Massa */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowBulkDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-[modalSlideUp_0.3s_ease]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Clientes</h3>
              <p className="text-gray-600">
                Tem certeza que deseja excluir <strong>{selectedClients.size}</strong> cliente{selectedClients.size > 1 ? 's' : ''}?
              </p>
              <p className="text-sm text-red-500 mt-1">Esta ação não pode ser desfeita. Todos os dados dos clientes serão permanentemente removidos.</p>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <p className="text-xs text-yellow-700">
                  <strong>Atenção:</strong> Os pedidos associados a estes clientes não serão excluídos automaticamente.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeBulkDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Excluir {selectedClients.size} cliente{selectedClients.size > 1 ? 's' : ''}
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

export default ClientsManager;