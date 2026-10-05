import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User } from '../../types';
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  Users,
  Loader2,
  Download,
  UserCircle,
  Layers,
  FileSpreadsheet,
  Building2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ============================ MODAL SHELL ============================ */
const ModalShell: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full shadow-2xl shadow-slate-900/20 border border-slate-200/70 animate-modalSlideUp">
        {children}
      </div>
    </div>
  );
};

/* ============================ COMPONENTE PRINCIPAL ============================ */
const ClientsManager: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    setSelectedClients(new Set());
    setSelectAll(false);
  }, [search]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'customer'));
      const snapshot = await getDocs(q);
      const clientsData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
      setClients(clientsData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase()) ||
        client.phone?.toLowerCase().includes(search.toLowerCase()) ||
        client.city?.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedClients(new Set());
      setSelectAll(false);
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.uid)));
      setSelectAll(true);
    }
  };

  useEffect(() => {
    if (filteredClients.length > 0) {
      setSelectAll(selectedClients.size === filteredClients.length);
    } else {
      setSelectAll(false);
    }
  }, [selectedClients, filteredClients]);

  const openBulkDeleteModal = () => {
    if (selectedClients.size === 0) {
      toast.error('Selecione pelo menos um cliente para excluir');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const executeBulkDelete = async () => {
    if (selectedClients.size === 0) return;
    setDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const clientIds = Array.from(selectedClients);
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

      if (successCount > 0)
        toast.success(`${successCount} cliente(s) excluído(s) com sucesso!`);
      if (errorCount > 0)
        toast.error(`${errorCount} cliente(s) não puderam ser excluídos`);

      loadClients();
    } catch (error) {
      console.error('Erro ao excluir clientes:', error);
      toast.error('Erro ao excluir clientes');
    } finally {
      setDeleting(false);
    }
  };

  const exportSelectedToCSV = () => {
    const clientsToExport =
      selectedClients.size > 0
        ? filteredClients.filter((c) => selectedClients.has(c.uid))
        : filteredClients;

    if (clientsToExport.length === 0) {
      toast.error('Nenhum cliente para exportar');
      return;
    }

    const headers = ['Nome', 'Email', 'Telefone', 'Cidade', 'Endereço'];
    const rows = clientsToExport.map((client) => [
      client.name || '',
      client.email || '',
      client.phone || '',
      client.city || '',
      client.address || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `clientes_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`${clientsToExport.length} cliente(s) exportado(s)!`);
  };

  /* ============================ LOADING ============================ */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
          <div className="relative w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Carregando clientes...</p>
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
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold text-blue-700 tracking-wide">
                BASE DE CLIENTES
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Clientes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie os clientes registados na plataforma.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportSelectedToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold text-sm shadow-sm"
              title={selectedClients.size > 0 ? 'Exportar selecionados' : 'Exportar todos'}
            >
              <Download className="w-4 h-4" />
              Exportar{' '}
              {selectedClients.size > 0 ? `(${selectedClients.size})` : 'Todos'}
            </button>

            {selectedClients.size > 0 && (
              <button
                onClick={openBulkDeleteModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all font-semibold text-sm shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Excluir ({selectedClients.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================== BUSCA ==================== */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por nome, email, telefone ou cidade..."
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
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 whitespace-nowrap">
              <strong className="text-slate-900 font-bold">
                {filteredClients.length}
              </strong>{' '}
              cliente{filteredClients.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== BARRA DE SELEÇÃO ==================== */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm px-4 py-3 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${
              selectAll
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {selectAll ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            {selectAll ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
          <span className="text-xs text-slate-500">
            {filteredClients.length} cliente
            {filteredClients.length !== 1 ? 's' : ''} encontrado
            {filteredClients.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedClients.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              <CheckSquare className="w-3 h-3" />
              {selectedClients.size} selecionado{selectedClients.size > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ==================== GRID ==================== */}
      {filteredClients.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-base font-bold text-slate-900">Nenhum cliente encontrado</p>
          <p className="text-sm text-slate-500 mt-1">
            {search ? 'Tente ajustar sua busca' : 'Ainda não há clientes registados'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const isSelected = selectedClients.has(client.uid);
            const initials = (client.name || 'C')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={client.uid}
                onClick={() => toggleClientSelection(client.uid)}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl border p-5 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'border-blue-400 shadow-lg shadow-blue-100 bg-blue-50/40'
                    : 'border-slate-200/70 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5'
                }`}
              >
                {/* Glow quando selecionado */}
                {isSelected && (
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl" />
                )}

                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleClientSelection(client.uid);
                  }}
                  className={`absolute top-4 right-4 z-10 p-1.5 rounded-lg transition-all ${
                    isSelected
                      ? 'text-blue-600 bg-blue-100 hover:bg-blue-200'
                      : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 opacity-0 group-hover:opacity-100'
                  }`}
                  title={isSelected ? 'Desmarcar' : 'Selecionar'}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                {/* Header: Avatar + Nome */}
                <div className="flex items-center gap-3 mb-4 relative">
                  {client.avatar ? (
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md shadow-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
                      <span className="text-white font-bold text-base">{initials}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {client.name || 'Cliente'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <UserCircle className="w-3 h-3 text-slate-400" />
                      <p className="text-[11px] text-slate-500 font-medium">Cliente</p>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">{client.city}</span>
                    </div>
                  )}
                </div>

                {/* Endereço */}
                {client.address && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="line-clamp-2 leading-relaxed">
                        <span className="font-bold text-slate-700">Endereço:</span>{' '}
                        {client.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== BARRA FLUTUANTE ==================== */}
      {selectedClients.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-modalSlideUp">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/40 border border-slate-700/50 px-5 py-3.5 flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  {selectedClients.size} cliente
                  {selectedClients.size > 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  selecionado{selectedClients.size > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-700/60" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedClients(new Set());
                  setSelectAll(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={exportSelectedToCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all text-xs font-bold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Exportar
              </button>
              <button
                onClick={openBulkDeleteModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5 transition-all text-xs font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL EXCLUSÃO ==================== */}
      <ModalShell
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200 mb-4">
            <Trash2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir clientes</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza que deseja excluir{' '}
            <strong className="text-slate-900">
              {selectedClients.size} cliente{selectedClients.size > 1 ? 's' : ''}
            </strong>
            ?
          </p>
          <p className="text-xs text-red-500 mt-1 font-medium">
            Esta ação não pode ser desfeita. Todos os dados serão removidos.
          </p>

          <div className="mt-4 p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Atenção:</strong> Os pedidos associados a estes clientes
              <strong> não serão excluídos</strong> automaticamente.
            </p>
          </div>

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

      {/* ==================== ANIMAÇÕES ==================== */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-in-out }
        .animate-modalSlideUp { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ClientsManager;