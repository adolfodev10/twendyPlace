import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { Edit, Trash2, Search, X, Save, AlertTriangle, Users, Mail, Shield, CheckSquare, Square, Eye, EyeOff, Key, UserPlus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserFormData {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  password?: string;
}

const UsersManager: React.FC = () => {
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

  // Seleção múltipla
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'user',
    avatar: '',
    password: '',
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

  const sanitizeInput = (input: string) => {
    return input.replace(/[<>]/g, '').trim();
  };

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        avatar: user.avatar || '',
        password: '',
      });
    } else {
      setEditingUser(null);
      const randomPass = generateRandomPassword();
      setFormData({
        name: '',
        email: '',
        role: 'customer',
        avatar: '',
        password: randomPass,
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome do usuário é obrigatório');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Email inválido');
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error('Senha é obrigatória para novo usuário');
      return;
    }

    setSaving(true);
    try {
      const userData: any = {
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        role: sanitizeInput(formData.role),
        avatar: formData.avatar ? sanitizeInput(formData.avatar) : undefined,
      };


      // Só envia senha se for criação OU redefinição de senha
      if (!editingUser && formData.password) {
        userData.password = formData.password;
        userData.sendEmail = true; // Flag para backend enviar email com a senha
      }

      let result;
      if (editingUser) {
        result = await userService.updateUser(editingUser.uid, userData);
      } else {
        result = await userService.createUser(userData);
      }

      if (result.success) {
        if (!editingUser) {
          toast.success('Usuário criado! A senha foi enviada por email.');
        } else {
          toast.success('Usuário atualizado com sucesso!');
        }
        handleCloseModal();
        loadUsers();
      } else {
        toast.error('Erro ao salvar: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const result = await userService.deleteUser(userToDelete.uid);
      if (result.success) {
        toast.success('Usuário excluído com sucesso!');
        setShowDeleteModal(false);
        setUserToDelete(null);
        loadUsers();
      } else {
        toast.error('Erro ao excluir: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setDeleting(false);
    }
  };

  // Exclusão em massa
  const executeBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    setDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const userIds = Array.from(selectedUsers);

      for (const userId of userIds) {
        try {
          const result = await userService.deleteUser(userId);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      setSelectedUsers(new Set());
      setSelectAll(false);
      setShowBulkDeleteModal(false);

      if (successCount > 0) {
        toast.success(`${successCount} usuário(s) excluído(s)!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} usuário(s) não puderam ser excluídos`);
      }

      loadUsers();
    } finally {
      setDeleting(false);
    }
  };

  // Redefinir senha
  const handleResetPassword = async () => {
    if (!userToResetPassword) return;

    setSaving(true);
    try {
      const result = await userService.resetPassword(userToResetPassword.uid);

      if (result.success) {
        toast.success(`Senha redefinida! A nova senha foi enviada para ${userToResetPassword.email}`);
        setShowResetPasswordModal(false);
        setUserToResetPassword(null);
      } else {
        toast.error('Erro ao redefinir senha: ' + result.error);
      }
    } catch (error) {
      toast.error('Erro ao redefinir senha');
    } finally {
      setSaving(false);
    }
  };

  // Seleção
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        newSelected.add(userId);
      }
      return newSelected;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredUsers.map(user => user.uid));
      setSelectedUsers(allIds);
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
      setSelectAll(selectedUsers.size === filteredUsers.length);
    }
  }, [selectedUsers, filteredUsers]);

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return { label: 'Admin', className: 'bg-red-100 text-red-700' };
      default:
        return { label: 'Cliente', className: 'bg-green-100 text-green-700' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="lg:-mt-32">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" />
          Gerenciar Usuários
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {users.length} total
          </span>
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedUsers.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir ({selectedUsers.size})
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuários por nome, email ou função..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-3 sm:px-4 text-xs font-medium text-gray-500 w-12">
                  <button onClick={toggleSelectAll} className="hover:bg-gray-200 rounded p-0.5 transition-colors">
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
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const isSelected = selectedUsers.has(user.uid);
                  const roleBadge = getRoleBadge(user.role || '');
                  // ✅ Garantir key única
                  const uniqueKey = user.uid || user.email || `user-${index}`;
                  return (
                    <tr key={uniqueKey} className={`border-b border-gray-100 transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 px-3 sm:px-4">
                        <button onClick={() => toggleUserSelection(user.uid)} className="hover:bg-gray-200 rounded p-0.5 transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                        </button>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-primary-700 font-bold text-sm">
                                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-gray-600 text-sm hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-gray-500 text-sm hidden lg:table-cell">
                        {user.createdAt && typeof (user.createdAt as any).seconds === 'number' ? new Date((user.createdAt as any).seconds * 1000).toLocaleDateString('pt-PT') : user.createdAt instanceof Date ? user.createdAt.toLocaleDateString('pt-PT') : '-'}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button onClick={() => handleOpenModal(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar usuário">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setUserToResetPassword(user); setShowResetPasswordModal(true); }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Redefinir senha">
                            <Key className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir usuário">
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
        {selectedUsers.size > 0 && (
          <div className="bg-primary-50 border-t border-primary-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-primary-700">
              <strong>{selectedUsers.size}</strong> usuário{selectedUsers.size > 1 ? 's' : ''} selecionado{selectedUsers.size > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => { setSelectedUsers(new Set()); setSelectAll(false); }} className="text-sm text-gray-600 hover:text-gray-800 underline">
                Limpar seleção
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar Usuário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[modalSlideUp_0.3s_ease]">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {editingUser ? <Edit className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-primary-600" />}
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: João da Silva"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="joao@exemplo.com"
                    required
                  />
                </div>
              </div>

              {/* Função */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função *</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                    required
                  >
                    <option value="customer">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              {/* Senha (apenas para criação) */}
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha *
                    <span className="text-xs text-gray-500 ml-1">(será enviada por email)</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                      required={!editingUser}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPass = generateRandomPassword();
                          setFormData(prev => ({ ...prev, password: newPass }));
                          setShowPassword(true);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Gerar nova senha"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">A senha será enviada automaticamente para o email do usuário.</p>
                </div>
              )}

              {/* Aviso para edição */}
              {editingUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    A edição não altera a senha do usuário. Para redefinir a senha, use o botão <Key className="w-3 h-3 inline" /> na lista de usuários.
                  </p>
                </div>
              )}

              {/* Botões */}
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
                      {editingUser ? 'Atualizar' : 'Criar Usuário'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-[modalSlideUp_0.3s_ease]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-gray-600">Tem certeza que deseja excluir o usuário <strong>"{userToDelete.name}"</strong>?</p>
              <p className="text-sm text-red-500 mt-1">Esta ação não pode ser desfeita.</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Cancelar
                </button>
                <button onClick={handleDeleteUser} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Excluindo...</> : <><Trash2 className="w-4 h-4" />Excluir</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Redefinir Senha */}
      {showResetPasswordModal && userToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowResetPasswordModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-[modalSlideUp_0.3s_ease]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Redefinir Senha</h3>
              <p className="text-gray-600">
                Uma nova senha será gerada e enviada para <strong>{userToResetPassword.email}</strong>.
              </p>
              <p className="text-sm text-gray-500 mt-1">O usuário <strong>{userToResetPassword.name}</strong> receberá a nova senha por email.</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => setShowResetPasswordModal(false)} disabled={saving} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleResetPassword} disabled={saving} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Enviando...</> : <><Key className="w-4 h-4" />Redefinir Senha</>}
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
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-[modalSlideUp_0.3s_ease]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Usuários</h3>
              <p className="text-gray-600">Tem certeza que deseja excluir <strong>{selectedUsers.size}</strong> usuário{selectedUsers.size > 1 ? 's' : ''}?</p>
              <p className="text-sm text-red-500 mt-1">Esta ação não pode ser desfeita.</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => setShowBulkDeleteModal(false)} disabled={deleting} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={executeBulkDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Excluindo...</> : <><Trash2 className="w-4 h-4" />Excluir {selectedUsers.size}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;