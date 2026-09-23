import React, { useEffect, useState } from 'react';
import { userService } from '../api/userService';
import type { User, Role } from '../types';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Key,
  UserX,
  Edit2,
  Eye,
  SlidersHorizontal,
  Mail,
  Calendar,
  Lock,
} from 'lucide-react';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [inactivatingUser, setInactivatingUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulário Criação
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<Role>('CLIENT');
  const [createPassword, setCreatePassword] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Formulário Edição
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Role>('CLIENT');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Formulário Troca de Senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const data = await userService.getAll();
        if (isMounted) setUsers(data);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createPassword.length < 6) {
      showNotification('A senha deve possuir no mínimo 6 caracteres.', 'error');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      await userService.create({
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
      });
      setIsCreateOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('CLIENT');
      showNotification('Usuário criado com sucesso!');
      setReloadKey((k) => k + 1);
    } catch (err: unknown) {
      console.error('Erro ao criar usuário:', err);
      showNotification('Não foi possível criar o usuário. Verifique os dados.', 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmittingEdit(true);
    try {
      await userService.update(editingUser.id, {
        name: editName,
        email: editEmail,
        role: editRole,
      });
      showNotification(`Usuário #${editingUser.id} atualizado com sucesso!`);
      setEditingUser(null);
      if (viewingUser?.id === editingUser.id) {
        setViewingUser((prev) => (prev ? { ...prev, name: editName, email: editEmail, role: editRole } : null));
      }
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      showNotification('Não foi possível atualizar o usuário.', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmInactivate = async () => {
    if (!inactivatingUser) return;
    try {
      await userService.inactivate(inactivatingUser.id);
      showNotification(`Usuário ${inactivatingUser.name} inativado com sucesso.`);
      setInactivatingUser(null);
      if (viewingUser?.id === inactivatingUser.id) {
        setViewingUser((prev) => (prev ? { ...prev, active: false } : null));
      }
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error('Erro ao inativar usuário:', err);
      showNotification('Não foi possível inativar o usuário.', 'error');
    }
  };

  const openPasswordModal = (user: User) => {
    setPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;

    if (newPassword.length < 6) {
      showNotification('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('A confirmação de senha não confere.', 'error');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await userService.updatePassword(passwordUser.id, { newPassword });
      showNotification(`Senha do usuário ${passwordUser.name} alterada com sucesso!`);
      setPasswordUser(null);
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      showNotification('Não foi possível alterar a senha do usuário.', 'error');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    const matchesRole = !selectedRole || u.role === selectedRole;
    const matchesStatus =
      !selectedStatus ||
      (selectedStatus === 'active' && u.active !== false) ||
      (selectedStatus === 'inactive' && u.active === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Administrador
          </span>
        );
      case 'TECHNICIAN':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Técnico
          </span>
        );
      case 'CLIENT':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Cliente
          </span>
        );
    }
  };

  const getStatusBadge = (active?: boolean) => {
    if (active === false) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Inativo
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Ativo
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="text-blue-600" size={24} />
            Gestão de Usuários
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre, consulte, atualize permissões e gerencie credenciais da equipe
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition text-sm"
        >
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg text-sm font-medium flex items-center gap-2 border transition ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold uppercase tracking-wider">
          <SlidersHorizontal size={13} className="text-blue-600" />
          <span>Filtros de Usuários</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Campo de Busca */}
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Filtro Perfil */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          >
            <option value="">Todos os Perfis</option>
            <option value="ADMIN">Administrador</option>
            <option value="TECHNICIAN">Técnico</option>
            <option value="CLIENT">Cliente</option>
          </select>

          {/* Filtro Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-left">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nome & E-mail</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setViewingUser(u)}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      #{u.id}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{u.name}</span>
                          <span className="text-[11px] text-slate-400 block">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">{getRoleBadge(u.role)}</td>

                    <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(u.active)}</td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingUser(u);
                        }}
                        className="px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                        title="Consultar Detalhes"
                      >
                        <Eye size={14} className="inline mr-1" />
                        Ver
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(u);
                        }}
                        className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                        title="Atualizar Usuário"
                      >
                        <Edit2 size={14} className="inline mr-1" />
                        Editar
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPasswordModal(u);
                        }}
                        className="px-2 py-1 text-xs font-medium text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition"
                        title="Alterar Senha"
                      >
                        <Key size={14} className="inline mr-1" />
                        Senha
                      </button>

                      {u.active !== false && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInactivatingUser(u);
                          }}
                          className="px-2 py-1 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition"
                          title="Inativar Usuário"
                        >
                          <UserX size={14} className="inline mr-1" />
                          Inativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                Novo Usuário
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="joao@empresa.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Perfil de Acesso
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as Role)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="CLIENT">Cliente (Solicitante)</option>
                  <option value="TECHNICIAN">Técnico (Suporte)</option>
                  <option value="ADMIN">Administrador (Gestão Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Senha Provisória
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                >
                  {isSubmittingCreate ? 'Salvando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Consulta / Detalhes */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {viewingUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{viewingUser.name}</h2>
                  <p className="text-xs text-slate-400">ID #{viewingUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2.5">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">E-mail</span>
                  <span className="font-semibold text-slate-800">{viewingUser.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px] mb-1">Perfil de Acesso</span>
                  {getRoleBadge(viewingUser.role)}
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px] mb-1">Status da Conta</span>
                  {getStatusBadge(viewingUser.active)}
                </div>
              </div>

              {viewingUser.createdAt && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2.5">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data de Cadastro</span>
                    <span className="font-medium text-slate-700">
                      {new Date(viewingUser.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    openEditModal(viewingUser);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  onClick={() => {
                    openPasswordModal(viewingUser);
                  }}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium transition flex items-center gap-1"
                >
                  <Key size={13} /> Senha
                </button>
              </div>

              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 size={16} className="text-blue-600" />
                Atualizar Usuário #{editingUser.id}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Perfil de Acesso
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="CLIENT">Cliente (Solicitante)</option>
                  <option value="TECHNICIAN">Técnico (Suporte)</option>
                  <option value="ADMIN">Administrador (Gestão Total)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                >
                  {isSubmittingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Inativação */}
      {inactivatingUser && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-lg border border-slate-200 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <UserX size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Inativar Usuário</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja realmente inativar o usuário <strong>{inactivatingUser.name}</strong> (#{inactivatingUser.id})? O acesso do usuário ao sistema será suspenso.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setInactivatingUser(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmInactivate}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition"
              >
                Sim, Inativar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      {passwordUser && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-lg border border-slate-200 space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Lock size={16} className="text-amber-600" />
                Alterar Senha do Usuário
              </h3>
              <button
                onClick={() => setPasswordUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Defina a nova senha para o usuário <strong>{passwordUser.name}</strong>.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordUser(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition"
                >
                  {isSubmittingPassword ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
