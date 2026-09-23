import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/userService';
import {
  LogOut,
  Ticket,
  Home,
  UserCheck,
  BarChart3,
  Headphones,
  Users,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (isSubmitting) return;
    setIsPasswordModalOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('Usuário não identificado.');
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.updatePassword(user.id, { newPassword });
      setSuccessMessage('Sua senha foi alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        closePasswordModal();
      }, 1500);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || 'Não foi possível alterar sua senha. Tente novamente.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition duration-150 ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
    }`;

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Headphones size={18} />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                HelpDesk<span className="text-blue-600 ml-0.5">PRO</span>
              </span>
            </NavLink>

            <nav className="hidden md:flex items-center space-x-1">
              <NavLink to="/" end className={navLinkClass}>
                <Home size={15} /> Início
              </NavLink>
              <NavLink to="/tickets" className={navLinkClass}>
                <Ticket size={15} /> Chamados
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink to="/assign" className={navLinkClass}>
                  <UserCheck size={15} /> Atribuição
                </NavLink>
              )}
              {user?.role === 'ADMIN' && (
                <NavLink to="/users" className={navLinkClass}>
                  <Users size={15} /> Usuários
                </NavLink>
              )}
              <NavLink to="/dashboard" className={navLinkClass}>
                <BarChart3 size={15} /> Métricas
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {/* Bloco de Perfil do Usuário */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                {userInitial}
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-none">{user?.name}</p>
                <span
                  className={`text-[10px] font-medium px-2 py-0.2 rounded-full uppercase tracking-wider inline-block mt-0.5 ${
                    user?.role === 'ADMIN'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : user?.role === 'TECHNICIAN'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'TECHNICIAN' ? 'Técnico' : 'Cliente'}
                </span>
              </div>
            </div>

            {/* Botão de Alterar Senha ao lado do perfil */}
            <button
              onClick={openPasswordModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition shadow-2xs"
              title="Alterar Minha Senha"
            >
              <Key size={14} className="text-slate-500 hover:text-blue-600" />
              <span className="hidden sm:inline">Alterar Senha</span>
            </button>

            <div className="h-5 w-px bg-slate-200 ml-1" />

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Sair da Conta"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Alteração de Senha */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={closePasswordModal}
        >
          <div
            className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Key size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Alterar Minha Senha</h3>
                  <p className="text-[11px] text-slate-500">Atualize sua credencial de acesso</p>
                </div>
              </div>
              <button
                onClick={closePasswordModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  disabled={isSubmitting || !!successMessage}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
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
                  disabled={isSubmitting || !!successMessage}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!successMessage}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  {isSubmitting ? 'Salvando...' : 'Salvar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};