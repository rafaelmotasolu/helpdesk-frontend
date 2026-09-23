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
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition duration-150 ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
    }`;

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
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
            <NavLink to="/dashboard" className={navLinkClass}>
              <BarChart3 size={15} /> Métricas
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
              {userInitial}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{user?.name}</p>
              <span className={`text-[10px] font-medium px-2 py-0.2 rounded-full uppercase tracking-wider inline-block mt-0.5 ${
                user?.role === 'ADMIN'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : user?.role === 'TECHNICIAN'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'TECHNICIAN' ? 'Técnico' : 'Cliente'}
              </span>
            </div>
          </div>

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
  );
};