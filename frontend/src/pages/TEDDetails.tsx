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

  if (loading) return <div className="text-center p-6">Carregando...</div>;
  if (!ted) return <div className="text-center p-6 text-red-600">TED não encontrado</div>;

  const physicalData = [
    { name: 'Progresso Físico', value: ted.physical_progress_percentage || 0 },
    { name: 'Restante', value: 100 - (ted.physical_progress_percentage || 0) }
  ];

  const financialData = [
    { name: 'Financeiro', value: ted.financial_progress_percentage || 0 },
    { name: 'Restante', value: 100 - (ted.financial_progress_percentage || 0) }
  ];

  const COLORS = ['#3b82f6', '#e5e7eb'];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Controle TED</h1>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Voltar
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold">{ted.title}</h2>
              <p className="text-gray-600">TED #{ted.number}</p>
            </div>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
              {ted.status}
            </span>
          </div>

          {ted.description && <p className="text-gray-600 mb-4">{ted.description}</p>}

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600">Data Início</p>
              <p className="font-bold">{ted.start_date ? new Date(ted.start_date).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600">Data Término</p>
              <p className="font-bold">{ted.end_date ? new Date(ted.end_date).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-gray-600">Orçamento</p>
              <p className="font-bold">R$ {ted.total_budget?.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <p className="text-sm text-gray-600">Gasto</p>
              <p className="font-bold">R$ {ted.total_spent?.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Abas de navegação */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('physical')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'physical'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Execução Física
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'financial'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Execução Financeira
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Progresso Físico</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={physicalData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold mb-4">Progresso Financeiro</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={financialData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Physical Tab */}
        {activeTab === 'physical' && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Marcos Físicos</h3>
              <button className="btn-primary text-sm">+ Adicionar Marco</button>
            </div>

            {milestones.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Nenhum marco físico cadastrado</p>
            ) : (
              <div className="space-y-4">
                {milestones.map(milestone => (
                  <div key={milestone.id} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">{milestone.description}</h4>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                        {milestone.status}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${milestone.actual_percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {milestone.actual_percentage}% / {milestone.target_percentage}% (Meta)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Itens Financeiros</h3>
              <button className="btn-primary text-sm">+ Adicionar Item</button>
            </div>

            {financialItems.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Nenhum item financeiro cadastrado</p>
            ) : (
              <div className="space-y-4">
                {financialItems.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">{item.description}</h4>
                      <span className={`px-2 py-1 rounded text-sm ${
                        item.status === 'PLANEJADO' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'PAGO' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Planejado</p>
                        <p className="font-bold">R$ {item.planned_amount?.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Gasto</p>
                        <p className="font-bold">R$ {item.spent_amount?.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Data</p>
                        <p className="font-bold">{item.payment_date ? new Date(item.payment_date).toLocaleDateString('pt-BR') : '-'}</p>
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
