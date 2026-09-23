import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Ticket, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <span className="text-xl font-bold tracking-wide text-indigo-400">HelpDesk PRO</span>
          <nav className="flex space-x-4">
            <Link to="/" className="flex items-center gap-1.5 hover:text-indigo-300 font-medium">
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link to="/tickets" className="flex items-center gap-1.5 hover:text-indigo-300 font-medium">
              <Ticket size={18} /> Chamados
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-semibold">{user?.name}</p>
            <span className="text-xs bg-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};