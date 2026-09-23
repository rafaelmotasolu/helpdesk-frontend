import React, { useEffect, useState } from 'react';
import { ticketService } from '../api/ticketService';
import { userService } from '../api/userService';
import type { Ticket, Status, Priority, Category, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, Search } from 'lucide-react';

export const TicketList: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Estados de modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Formulário de Criação
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('SOFTWARE');
  const [newPriority, setNewPriority] = useState<Priority>('LOW');

  const loadData = async () => {
    const data = await ticketService.getAll();
    setTickets(data);
    if (user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') {
      const users = await userService.getAll();
      setTechnicians(users.filter(u => u.role === 'TECHNICIAN'));
    }
  };

  useEffect(() => {
    ticketService.getAll().then(setTickets);
    if (user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') {
      userService.getAll().then((users) => {
        setTechnicians(users.filter(u => u.role === 'TECHNICIAN'));
      });
    }
  }, [user?.role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await ticketService.create({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      priority: newPriority,
      customerId: user.id,
    });
    setIsCreateOpen(false);
    setNewTitle('');
    setNewDesc('');
    loadData();
  };

  const handleStatusChange = async (ticketId: number, status: Status) => {
    await ticketService.updateStatus(ticketId, status);
    loadData();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev: Ticket | null) => prev ? { ...prev, status } : null);
    }
  };

  const handleAssign = async (ticketId: number, technicianId: number) => {
    await ticketService.assignTechnician(ticketId, technicianId);
    loadData();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev: Ticket | null) => prev ? { ...prev, technicianId, status: 'IN_PROGRESS' } : null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || t.status === selectedStatus;
    const matchesPriority = !selectedPriority || t.priority === selectedPriority;
    const matchesCategory = !selectedCategory || t.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Chamados</h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Novo Chamado
        </button>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos os Status</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="WAITING">WAITING</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todas as Prioridades</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todas as Categorias</option>
          <option value="HARDWARE">HARDWARE</option>
          <option value="SOFTWARE">SOFTWARE</option>
          <option value="NETWORK">NETWORK</option>
        </select>
      </div>

      {/* Tabela de Chamados */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Título</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3">Prioridade</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredTickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTicket(t)}>
                <td className="px-6 py-4 font-semibold text-gray-900">#{t.id}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{t.title}</td>
                <td className="px-6 py-4 text-gray-600">{t.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                    t.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    t.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {t.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Ver Detalhes
                  </button>
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nenhum chamado encontrado com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Novo Chamado</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  >
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="NETWORK">NETWORK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes e Ações */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-xs font-bold text-gray-400">CHAMADO #{selectedTicket.id}</span>
                <h2 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h2>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700">Descrição:</p>
              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-lg">{selectedTicket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Categoria:</span>
                <p className="font-semibold">{selectedTicket.category}</p>
              </div>
              <div>
                <span className="text-gray-500">Prioridade:</span>
                <p className="font-semibold">{selectedTicket.priority}</p>
              </div>
              <div>
                <span className="text-gray-500">Data de Abertura:</span>
                <p className="font-semibold">{new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <span className="text-gray-500">ID do Cliente:</span>
                <p className="font-semibold">#{selectedTicket.customerId}</p>
              </div>
            </div>

            {/* Ações de Gestão de Técnico e Status */}
            {(user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') && (
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-800">Ações do Atendimento</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Alterar Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as Status)}
                      className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="WAITING">WAITING</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600">Atribuir Técnico</label>
                    <select
                      value={selectedTicket.technicianId || ''}
                      onChange={(e) => handleAssign(selectedTicket.id, Number(e.target.value))}
                      className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="">Não atribuído</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};