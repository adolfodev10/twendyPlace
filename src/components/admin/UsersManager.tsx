import React, { useState, useEffect, useMemo } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Edit,
  Trash2,
  Search,
  X,
  Users,
  Mail,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Key,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  UserCircle,
  Building2,
  Phone,
  MapPin,
  Hash,
  Loader2,
  Crown,
  Sparkles,
  Layers,
} from 'lucide-react';
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

/* ============================ SUBCOMPONENTES ============================ */

const ModalShell: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ isOpen, onClose, children, size = 'md' }) => {
  if (!isOpen) return null;
  const maxW = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
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

const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 tracking-wide">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const IconInput: React.FC<{
  id: string;
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

/* ============================ COMPONENTE PRINCIPAL ============================ */

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
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++)
      password += chars.charAt(Math.floor(Math.random() * chars.length));
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
        name: '',
        email: '',
        role: 'customer',
        avatar: '',
        password: generateRandomPassword(),
        phone: '',
        address: '',
        city: '',
        postalCode: '',
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Nome é obrigatório');
    if (!formData.email.trim()) return toast.error('Email é obrigatório');
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      return toast.error('Email inválido');
    if (!editingUser && !formData.password)
      return toast.error('Senha é obrigatória');

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

      const result = editingUser
        ? await userService.updateUser(editingUser.id || editingUser.uid, userData)
        : await userService.createUser(userData);

      if (result.success) {
        toast.success(
          editingUser ? 'Usuário atualizado!' : 'Usuário criado! Senha enviada por email.'
        );
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
    if (
      userToDelete.uid === currentUser?.uid ||
      userToDelete.id === currentUser?.uid
    ) {
      toast.error('Não podes excluir a tua própria conta!');
      return;
    }

    setDeleting(true);
    try {
      const result = await userService.deleteUser(
        userToDelete.id || userToDelete.uid
      );
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
    let success = 0;
    let errors = 0;
    try {
      for (const userId of Array.from(selectedUsers)) {
        try {
          const res = await userService.deleteUser(userId);
          res.success ? success++ : errors++;
        } catch {
          errors++;
        }
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
      const result = await userService.resetPassword(
        userToResetPassword.id || userToResetPassword.uid
      );
      if (result.success) {
        toast.success(`Senha redefinida! Enviada para ${userToResetPassword.email}`);
        setShowResetPasswordModal(false);
        setUserToResetPassword(null);
      } else {
        toast.error('Erro: ' + result.error);
      }
    } catch {
      toast.error('Erro ao redefinir');
    } finally {
      setSaving(false);
    }
  };

  const getUserId = (user: User) => user.id || user.uid;

  const toggleUserSelection = (userId: string) => {
    if (currentUser && (userId === currentUser.uid || userId === currentUser.id)) {
      toast.error('Não podes selecionar a tua própria conta!');
      return;
    }
    setSelectedUsers((prev) => {
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
        .filter(
          (u) => getUserId(u) !== currentUser?.uid && getUserId(u) !== currentUser?.id
        )
        .map((u) => getUserId(u));
      setSelectedUsers(new Set(allIds));
      setSelectAll(true);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.role?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  useEffect(() => {
    if (filteredUsers.length > 0) {
      setSelectAll(
        selectedUsers.size ===
        filteredUsers.filter((u) => getUserId(u) !== currentUser?.uid).length
      );
    }
  }, [selectedUsers, filteredUsers, currentUser]);

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return {
          label: 'Admin',
          className: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
        };
      default:
        return {
          label: 'Cliente',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
    }
  };

  const getInitials = (name: string, email: string): string => {
    if (name?.trim())
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    return email?.split('@')[0].slice(0, 2).toUpperCase() || 'U';
  };

  const isCurrentUser = (user: User) =>
    currentUser &&
    (getUserId(user) === currentUser.uid || getUserId(user) === currentUser.id);

  const adminCount = users.filter(
    (u) => u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'administrador'
  ).length;
  const clientCount = users.length - adminCount;

  /* ============================ LOADING ============================ */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
          <div className="relative w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Carregando usuários...</p>
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
                EQUIPE & USUÁRIOS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Usuários
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie permissões, funções e dados dos usuários do sistema.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedUsers.size > 0 && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all font-semibold text-sm shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Excluir ({selectedUsers.size})
              </button>
            )}
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all font-semibold text-sm shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Novo usuário
            </button>
          </div>
        </div>
      </div>

      {/* ==================== MINI STATS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {[
          {
            label: 'Total',
            value: users.length,
            icon: Users,
            gradient: 'from-blue-500 to-indigo-600',
            shadow: 'shadow-blue-200',
          },
          {
            label: 'Administradores',
            value: adminCount,
            icon: Crown,
            gradient: 'from-red-500 to-rose-600',
            shadow: 'shadow-red-200',
          },
          {
            label: 'Clientes',
            value: clientCount,
            icon: UserCircle,
            gradient: 'from-emerald-500 to-teal-600',
            shadow: 'shadow-emerald-200',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow} flex-shrink-0`}
            >
              <stat.icon className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">
                {stat.value}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== BUSCA ==================== */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou função..."
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
                {filteredUsers.length}
              </strong>{' '}
              usuário{filteredUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== TABELA ==================== */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
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
                  <UserCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Usuário
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase hidden md:table-cell">
                  <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Email
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Função
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase hidden lg:table-cell">
                  Criado em
                </th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      Nenhum usuário encontrado
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste a busca</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const isSelected = selectedUsers.has(getUserId(user));
                  const roleBadge = getRoleBadge(user.role || '');
                  const isSelf = isCurrentUser(user);

                  return (
                    <tr
                      key={getUserId(user) || index}
                      className={`border-b border-slate-100 transition-colors ${isSelected
                          ? 'bg-blue-50/60'
                          : isSelf
                            ? 'bg-blue-50/30'
                            : 'hover:bg-slate-50/60'
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        {!isSelf ? (
                          <button
                            onClick={() => toggleUserSelection(getUserId(user))}
                            className="hover:bg-slate-200/70 rounded-md p-1 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-md">
                            <Sparkles className="w-2.5 h-2.5" />
                            Você
                          </span>
                        )}
                      </td>

                      {/* Usuário */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl flex-shrink-0 overflow-hidden shadow-sm shadow-slate-200">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-10 h-10 rounded-2xl object-cover border-2 border-white"
                              />
                            ) : (
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${roleBadge.label === 'Admin'
                                    ? 'bg-gradient-to-br from-red-500 to-rose-600'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                  }`}
                              >
                                <span className="text-white font-bold text-xs">
                                  {getInitials(user.name, user.email)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                              {user.name || user.email?.split('@')[0] || 'Usuário'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px] md:hidden">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-sm text-slate-600 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{user.email}</span>
                        </div>
                      </td>

                      {/* Função */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${roleBadge.className}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${roleBadge.dot}`} />
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Criado em */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap hidden lg:table-cell">
                        {(() => {
                          const d = user.createdAt as any;
                          if (!d) return '—';
                          if (d instanceof Date) return d.toLocaleDateString('pt-PT');
                          if (typeof d.seconds === 'number')
                            return new Date(d.seconds * 1000).toLocaleDateString('pt-PT');
                          if (typeof d.toDate === 'function')
                            return d.toDate().toLocaleDateString('pt-PT');
                          return '—';
                        })()}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => {
                                  setUserToResetPassword(user);
                                  setShowResetPasswordModal(true);
                                }}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Redefinir senha"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

        {/* Barra de seleção */}
        {selectedUsers.size > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200/70 px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <CheckSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm text-blue-900">
                <strong className="font-bold">{selectedUsers.size}</strong> usuário
                {selectedUsers.size > 1 ? 's' : ''} selecionado
                {selectedUsers.size > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedUsers(new Set());
                  setSelectAll(false);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Limpar seleção
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
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
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${editingUser
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                }`}
            >
              {editingUser ? (
                <Edit className="w-5 h-5 text-white" />
              ) : (
                <UserPlus className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingUser ? 'Editar usuário' : 'Novo usuário'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingUser
                  ? 'Atualize as informações do usuário'
                  : 'Crie uma nova conta de acesso'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <FieldLabel required>Nome</FieldLabel>
            <IconInput id="name" icon={UserCircle}>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome completo"
                className={inputClass}
                required
              />
            </IconInput>
          </div>

          <div>
            <FieldLabel required>Email</FieldLabel>
            <IconInput id="email" icon={Mail}>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="usuario@email.com"
                className={inputClass}
                required
              />
            </IconInput>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Telefone</FieldLabel>
              <IconInput id="phone" icon={Phone}>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  placeholder="+244 9XX XXX XXX"
                  className={inputClass}
                />
              </IconInput>
            </div>
            <div>
              <FieldLabel required>Função</FieldLabel>
              <IconInput id="role" icon={ShieldCheck}>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`${inputClass} appearance-none cursor-pointer`}
                  required
                >
                  <option value="customer">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </IconInput>
            </div>
          </div>

          <div>
            <FieldLabel>Endereço</FieldLabel>
            <IconInput id="address" icon={MapPin}>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                placeholder="Rua, número, bairro..."
                className={inputClass}
              />
            </IconInput>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Cidade</FieldLabel>
              <IconInput id="city" icon={Building2}>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  placeholder="Sua cidade"
                  className={inputClass}
                />
              </IconInput>
            </div>
            <div>
              <FieldLabel>Código postal</FieldLabel>
              <IconInput id="postalCode" icon={Hash}>
                <input
                  id="postalCode"
                  type="text"
                  name="postalCode"
                  value={formData.postalCode || ''}
                  onChange={handleInputChange}
                  placeholder="1234-567"
                  className={inputClass}
                />
              </IconInput>
            </div>
          </div>

          {!editingUser && (
            <div>
              <FieldLabel required>Senha inicial</FieldLabel>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                  <Key className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-20 py-2.5 text-sm font-mono font-medium border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-slate-900"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        password: generateRandomPassword(),
                      }));
                      setShowPassword(true);
                    }}
                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                    title="Gerar nova senha"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Será enviada automaticamente por email
              </p>
            </div>
          )}

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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {editingUser ? 'Atualizar' : 'Criar usuário'}
                </>
              )}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* ==================== MODAL EXCLUSÃO INDIVIDUAL ==================== */}
      <ModalShell
        isOpen={showDeleteModal && !!userToDelete}
        onClose={() => setShowDeleteModal(false)}
        size="sm"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200 mb-4">
            <Trash2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar exclusão</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Excluir o usuário{' '}
            <strong className="text-slate-900">"{userToDelete?.name}"</strong>?
          </p>
          <p className="text-xs text-red-500 mt-1 font-medium">
            Esta ação não pode ser desfeita.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteUser}
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

      {/* ==================== MODAL RESET SENHA ==================== */}
      <ModalShell
        isOpen={showResetPasswordModal && !!userToResetPassword}
        onClose={() => setShowResetPasswordModal(false)}
        size="sm"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200 mb-4">
            <Key className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Redefinir senha</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Enviar nova senha para{' '}
            <strong className="text-slate-900">{userToResetPassword?.email}</strong>?
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            O usuário receberá a nova senha por email.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={() => setShowResetPasswordModal(false)}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetPassword}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-200 hover:-translate-y-0.5 transition-all font-semibold text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Redefinir
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
          <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir usuários</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Excluir{' '}
            <strong className="text-slate-900">
              {selectedUsers.size} usuário{selectedUsers.size > 1 ? 's' : ''}
            </strong>
            ?
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir {selectedUsers.size}
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

export default UsersManager;