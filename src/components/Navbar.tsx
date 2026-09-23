import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Ticket, Home, UserCheck, BarChart3, Headphones } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
    }`;

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition">
              <Headphones size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition">
              HelpDesk<span className="text-blue-600 ml-0.5">PRO</span>
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" end className={navLinkClass}>
              <Home size={17} /> Início
            </NavLink>
            <NavLink to="/tickets" className={navLinkClass}>
              <Ticket size={17} /> Chamados
            </NavLink>
            {(user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') && (
              <NavLink to="/assign" className={navLinkClass}>
                <UserCheck size={17} /> Atribuição
              </NavLink>
            )}
            <NavLink to="/dashboard" className={navLinkClass}>
              <BarChart3 size={17} /> Métricas
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200">
              {userInitial}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mt-0.5 ${
                user?.role === 'ADMIN'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : user?.role === 'TECHNICIAN'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'TECHNICIAN' ? 'Técnico' : 'Cliente'}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Sair da Conta"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};