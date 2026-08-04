import React, { useState, useEffect, useMemo } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { Edit, Trash2, Search, X, AlertTriangle, Users, Mail, CheckSquare, Square, Eye, EyeOff, Key, UserPlus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '../../types';

interface UserFormData {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

const UsersManager: React.FC = () => {
  const { user: currentUser } = useAuth(); 
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'customer',
    avatar: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setSelectedUsers(new Set());
    setSelectAll(false);
  }, [search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const sanitizeInput = (input: string) => input.replace(/[<>]/g, '').trim();

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    return password;
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'customer',
        avatar: user.avatar || '',
        password: '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '', email: '', role: 'customer', avatar: '',
        password: generateRandomPassword(), phone: '', address: '', city: '', postalCode: '',
      });
      setShowPassword(true);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!formData.email.trim()) { toast.error('Email é obrigatório'); return; }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { toast.error('Email inválido'); return; }
    if (!editingUser && !formData.password) { toast.error('Senha é obrigatória'); return; }

    setSaving(true);
    try {
      const userData: any = {
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        role: sanitizeInput(formData.role),
        avatar: formData.avatar ? sanitizeInput(formData.avatar) : undefined,
        phone: sanitizeInput(formData.phone || ''),
        address: sanitizeInput(formData.address || ''),
        city: sanitizeInput(formData.city || ''),
        postalCode: sanitizeInput(formData.postalCode || ''),
      };
      if (!editingUser && formData.password) {
        userData.password = formData.password;
        userData.sendEmail = true;
      }

      let result;
      if (editingUser) {
        result = await userService.updateUser(editingUser.id || editingUser.uid, userData);
      } else {
        result = await userService.createUser(userData);
      }

      if (result.success) {
        toast.success(editingUser ? 'Usuário atualizado!' : 'Usuário criado! Senha enviada por email.');
        handleCloseModal();
        loadUsers();
      } else {
        toast.error('Erro: ' + result.error);
      }
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    if (userToDelete.uid === currentUser?.uid || userToDelete.id === currentUser?.uid) {
      toast.error('Não podes excluir a tua própria conta!');
      return;
    }

    setDeleting(true);
    try {
      const result = await userService.deleteUser(userToDelete.id || userToDelete.uid);
      if (result.success) {
        toast.success('Usuário excluído!');
        setShowDeleteModal(false);
        setUserToDelete(null);
        loadUsers();
      } else {
        toast.error('Erro: ' + result.error);
      }
    } catch (error) {
      toast.error('Erro ao excluir');
    } finally {
      setDeleting(false);
    }
  };

  const executeBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    if (currentUser && selectedUsers.has(currentUser.uid || '')) {
      toast.error('Não podes excluir a tua própria conta!');
      return;
    }

    setDeleting(true);
    let success = 0, errors = 0;
    try {
      for (const userId of Array.from(selectedUsers)) {
        try {
          const res = await userService.deleteUser(userId);
          res.success ? success++ : errors++;
        } catch { errors++; }
      }
      setSelectedUsers(new Set());
      setSelectAll(false);
      setShowBulkDeleteModal(false);
      if (success) toast.success(`${success} excluído(s)!`);
      if (errors) toast.error(`${errors} falha(s)`);
      loadUsers();
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userToResetPassword) return;
    setSaving(true);
    try {
      const result = await userService.resetPassword(userToResetPassword.id || userToResetPassword.uid);
      if (result.success) {
        toast.success(`Senha redefinida! Enviada para ${userToResetPassword.email}`);
        setShowResetPasswordModal(false);
        setUserToResetPassword(null);
      } else {
        toast.error('Erro: ' + result.error);
      }
    } catch { toast.error('Erro ao redefinir'); }
    finally { setSaving(false); }
  };

  const getUserId = (user: User) => user.id || user.uid;

  const toggleUserSelection = (userId: string) => {
    if (currentUser && (userId === currentUser.uid || userId === currentUser.id)) {
      toast.error('Não podes selecionar a tua própria conta!');
      return;
    }
    setSelectedUsers(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      const allIds = filteredUsers
        .filter(u => getUserId(u) !== currentUser?.uid && getUserId(u) !== currentUser?.id)
        .map(u => getUserId(u));
      setSelectedUsers(new Set(allIds));
      setSelectAll(true);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.role?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  useEffect(() => {
    if (filteredUsers.length > 0) {
      setSelectAll(selectedUsers.size === filteredUsers.filter(u => getUserId(u) !== currentUser?.uid).length);
    }
  }, [selectedUsers, filteredUsers, currentUser]);

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return { label: 'Admin', className: 'bg-red-100 text-red-700' };
      default:
        return { label: 'Cliente', className: 'bg-green-100 text-green-700' };
    }
  };

  const getInitials = (name: string, email: string): string => {
    if (name?.trim()) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.split('@')[0].slice(0, 2).toUpperCase() || 'U';
  };

  const isCurrentUser = (user: User) => 
    currentUser && (getUserId(user) === currentUser.uid || getUserId(user) === currentUser.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="lg:-mt-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" />
          Gerenciar Usuários
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{users.length} total</span>
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedUsers.size > 0 && (
            <button onClick={() => setShowBulkDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Trash2 className="w-4 h-4" /> Excluir ({selectedUsers.size})
            </button>
          )}
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <UserPlus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar usuários..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 w-12">
                  <button onClick={toggleSelectAll} className="hover:bg-gray-200 rounded p-0.5">
                    {selectAll ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Usuário</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Função</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 hidden lg:table-cell">Criado em</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhum usuário encontrado</td></tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const isSelected = selectedUsers.has(getUserId(user));
                  const roleBadge = getRoleBadge(user.role || '');
                  const isSelf = isCurrentUser(user);
                  
                  return (
                    <tr key={getUserId(user) || index} className={`border-b border-gray-100 transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'} ${isSelf ? 'bg-blue-50/30' : ''}`}>
                      <td className="py-3 px-3 sm:px-4">
                        {/* ✅ Esconder checkbox para o próprio Admin */}
                        {!isSelf && (
                          <button onClick={() => toggleUserSelection(getUserId(user))} className="hover:bg-gray-200 rounded p-0.5">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                          </button>
                        )}
                        {isSelf && <span className="text-[10px] text-blue-500 font-medium">Você</span>}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-primary-700 font-bold text-sm">{getInitials(user.name, user.email)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {user.name || user.email?.split('@')[0] || 'Usuário'}
                              {isSelf && <span className="text-[10px] text-blue-500 ml-1">(você)</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-gray-600 text-sm hidden md:table-cell">
                        <Mail className="w-3 h-3 inline mr-1 text-gray-400" />{user.email}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge.className}`}>{roleBadge.label}</span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-gray-500 text-sm hidden lg:table-cell">
                        {(() => {
                          const d = user.createdAt as any;
                          if (!d) return '-';
                          if (d instanceof Date) return d.toLocaleDateString('pt-PT');
                          if (typeof d.seconds === 'number') return new Date(d.seconds * 1000).toLocaleDateString('pt-PT');
                          if (typeof d.toDate === 'function') return d.toDate().toLocaleDateString('pt-PT');
                          return '-';
                        })()}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button onClick={() => handleOpenModal(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit className="w-4 h-4" /></button>
                          {!isSelf && (
                            <>
                              <button onClick={() => { setUserToResetPassword(user); setShowResetPasswordModal(true); }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="Redefinir senha"><Key className="w-4 h-4" /></button>
                              <button onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {selectedUsers.size > 0 && (
          <div className="bg-primary-50 border-t border-primary-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-primary-700"><strong>{selectedUsers.size}</strong> selecionado(s)</p>
            <button onClick={() => { setSelectedUsers(new Set()); setSelectAll(false); }} className="text-sm text-gray-600 hover:text-gray-800 underline">Limpar</button>
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={handleCloseModal}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Endereço</label>
                <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <input type="text" name="city" value={formData.city || ''} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código Postal</label>
                  <input type="text" name="postalCode" value={formData.postalCode || ''} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Função *</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" required>
                  <option value="customer">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-1">Senha *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password || ''} onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-2 border rounded-lg font-mono text-sm" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button type="button" onClick={() => { setFormData(prev => ({ ...prev, password: generateRandomPassword() })); setShowPassword(true); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                  {saving ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modais de Delete, Reset e Bulk Delete (mantidos iguais) */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
            <h3 className="text-xl font-bold mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-600">Excluir <strong>"{userToDelete.name}"</strong>?</p>
            <p className="text-sm text-red-500 mt-1">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleDeleteUser} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPasswordModal && userToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowResetPasswordModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-4"><Key className="w-8 h-8 text-orange-500" /></div>
            <h3 className="text-xl font-bold mb-2">Redefinir Senha</h3>
            <p className="text-gray-600">Enviar nova senha para <strong>{userToResetPassword.email}</strong>?</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowResetPasswordModal(false)} disabled={saving} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleResetPassword} disabled={saving} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50">
                {saving ? 'Enviando...' : 'Redefinir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowBulkDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
            <h3 className="text-xl font-bold mb-2">Excluir Usuários</h3>
            <p className="text-gray-600">Excluir <strong>{selectedUsers.size}</strong> usuário(s)?</p>
            <p className="text-sm text-red-500 mt-1">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowBulkDeleteModal(false)} disabled={deleting} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={executeBulkDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
                {deleting ? 'Excluindo...' : `Excluir ${selectedUsers.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;