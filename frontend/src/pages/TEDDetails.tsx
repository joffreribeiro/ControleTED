import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tedService, TED, PhysicalMilestone, FinancialItem } from '../services/tedService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function TEDDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ted, setTed] = useState<TED | null>(null);
  const [milestones, setMilestones] = useState<PhysicalMilestone[]>([]);
  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'physical' | 'financial'>('overview');

  useEffect(() => {
    loadTED();
  }, [id]);

  const loadTED = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const data = await tedService.getById(parseInt(id));
      setTed(data);
      setMilestones(data.physical_milestones || []);
      setFinancialItems(data.financial_items || []);
    } catch (err) {
      setError('Erro ao carregar TED');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: { [key: string]: string } = {
      'PLANEJAMENTO': 'badge-yellow',
      'EXECUÇÃO': 'badge-blue',
      'CONCLUÍDO': 'badge-green',
      'SUSPENSO': 'badge-red',
    };
    return classes[status] || 'badge-gray';
  };

  const getMilestoneBadgeClass = (status: string) => {
    const classes: { [key: string]: string } = {
      'CONCLUÍDO': 'badge-green',
      'EM_ANDAMENTO': 'badge-blue',
      'ATRASADO': 'badge-red',
    };
    return classes[status] || 'badge-yellow';
  };

  const getFinancialBadgeClass = (status: string) => {
    const classes: { [key: string]: string } = {
      'PLANEJADO': 'badge-yellow',
      'PAGO': 'badge-green',
    };
    return classes[status] || 'badge-red';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="spinner w-5 h-5" />
          Carregando TED...
        </div>
      </div>
    );
  }

  if (!ted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">TED não encontrado</p>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">Voltar ao Dashboard</button>
        </div>
      </div>
    );
  }

  const physicalData = [
    { name: 'Executado', value: ted.physical_progress_percentage || 0 },
    { name: 'Restante', value: 100 - (ted.physical_progress_percentage || 0) }
  ];

  const financialData = [
    { name: 'Executado', value: ted.financial_progress_percentage || 0 },
    { name: 'Restante', value: 100 - (ted.financial_progress_percentage || 0) }
  ];

  const PHYSICAL_COLORS = ['#3b82f6', '#e5e7eb'];
  const FINANCIAL_COLORS = ['#10b981', '#e5e7eb'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="nav-brand">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Controle TED
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TED Header Card */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold text-gray-800">{ted.title}</h2>
                <span className={getStatusBadgeClass(ted.status)}>{ted.status}</span>
              </div>
              <p className="text-gray-500">TED #{ted.number}</p>
            </div>
          </div>

          {ted.description && <p className="text-gray-600 mb-5">{ted.description}</p>}

          <div className="grid grid-cols-4 gap-4">
            <div className="stat-card bg-blue-50">
              <div className="flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Data Início</p>
              <p className="font-bold text-gray-800">{ted.start_date ? new Date(ted.start_date).toLocaleDateString('pt-BR') : '—'}</p>
            </div>
            <div className="stat-card bg-blue-50">
              <div className="flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Data Término</p>
              <p className="font-bold text-gray-800">{ted.end_date ? new Date(ted.end_date).toLocaleDateString('pt-BR') : '—'}</p>
            </div>
            <div className="stat-card bg-emerald-50">
              <div className="flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Orçamento</p>
              <p className="font-bold text-gray-800">R$ {ted.total_budget?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="stat-card bg-red-50">
              <div className="flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Total Gasto</p>
              <p className="font-bold text-gray-800">R$ {ted.total_spent?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {(['overview', 'physical', 'financial'] as const).map((tab) => {
            const labels: Record<string, string> = { overview: 'Visão Geral', physical: 'Execução Física', financial: 'Execução Financeira' };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Progresso Físico</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">{ted.physical_progress_percentage || 0}%</p>
              <div className="progress-bar h-3 mb-4">
                <div
                  className="progress-fill bg-blue-500 h-3"
                  style={{ width: `${ted.physical_progress_percentage || 0}%` }}
                />
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={physicalData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {PHYSICAL_COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Progresso Financeiro</h3>
              <p className="text-3xl font-bold text-emerald-600 mb-4">{ted.financial_progress_percentage || 0}%</p>
              <div className="progress-bar h-3 mb-4">
                <div
                  className="progress-fill bg-emerald-500 h-3"
                  style={{ width: `${ted.financial_progress_percentage || 0}%` }}
                />
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={financialData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {FINANCIAL_COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Physical Tab */}
        {activeTab === 'physical' && (
          <div className="card">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Marcos Físicos</h3>
                <p className="text-sm text-gray-500">{milestones.length} marco{milestones.length !== 1 ? 's' : ''} cadastrado{milestones.length !== 1 ? 's' : ''}</p>
              </div>
              <button className="btn-primary text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Marco
              </button>
            </div>

            {milestones.length === 0 ? (
              <div className="empty-state">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full mb-3">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="font-medium mb-1">Nenhum marco físico cadastrado</p>
                <p className="text-sm text-gray-400">Adicione marcos para acompanhar a execução física.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map(milestone => (
                  <div key={milestone.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800">{milestone.description}</h4>
                      <span className={getMilestoneBadgeClass(milestone.status)}>{milestone.status}</span>
                    </div>
                    <div className="progress-bar h-2.5 mb-2">
                      <div
                        className="progress-fill bg-blue-500 h-2.5"
                        style={{ width: `${milestone.actual_percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Realizado: <span className="font-semibold text-blue-600">{milestone.actual_percentage}%</span></span>
                      <span>Meta: <span className="font-semibold">{milestone.target_percentage}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="card">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Itens Financeiros</h3>
                <p className="text-sm text-gray-500">{financialItems.length} item{financialItems.length !== 1 ? 'ns' : ''} cadastrado{financialItems.length !== 1 ? 's' : ''}</p>
              </div>
              <button className="btn-primary text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Item
              </button>
            </div>

            {financialItems.length === 0 ? (
              <div className="empty-state">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full mb-3">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium mb-1">Nenhum item financeiro cadastrado</p>
                <p className="text-sm text-gray-400">Adicione itens para acompanhar a execução financeira.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {financialItems.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800">{item.description}</h4>
                      <span className={getFinancialBadgeClass(item.status)}>{item.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Planejado</p>
                        <p className="font-bold text-gray-800">R$ {item.planned_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Gasto</p>
                        <p className="font-bold text-gray-800">R$ {item.spent_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Data</p>
                        <p className="font-bold text-gray-800">{item.payment_date ? new Date(item.payment_date).toLocaleDateString('pt-BR') : '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
