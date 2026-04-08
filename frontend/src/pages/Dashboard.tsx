import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tedService, TED } from '../services/tedService';

export default function Dashboard() {
  const [teds, setTeds] = useState<TED[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTEDs();
  }, []);

  const loadTEDs = async () => {
    try {
      setLoading(true);
      const data = await tedService.getAll();
      setTeds(data);
    } catch (err) {
      setError('Erro ao carregar TEDs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta TED?')) return;

    try {
      await tedService.delete(id);
      setTeds(teds.filter(ted => ted.id !== id));
    } catch (err) {
      setError('Erro ao deletar TED');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'PLANEJAMENTO': 'bg-yellow-100 text-yellow-800',
      'EXECUÇÃO': 'bg-blue-100 text-blue-800',
      'CONCLUÍDO': 'bg-green-100 text-green-800',
      'SUSPENSO': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totalBudget = teds.reduce((sum, t) => sum + (t.total_budget || 0), 0);
  const totalSpent = teds.reduce((sum, t) => sum + (t.total_spent || 0), 0);
  const tedsAtivos = teds.filter(t => t.status === 'EXECUÇÃO').length;
  const tedsConcluidos = teds.filter(t => t.status === 'CONCLUÍDO').length;

  const statCards = [
    {
      label: 'Orçamento Total',
      value: `R$ ${totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: 'Soma de todos os TEDs',
      color: '#0C447C',
      bg: '#E6F1FB',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="16" width="48" height="32" rx="5" stroke="currentColor" strokeWidth="3.5" fill="none"/>
          <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="3" fill="none"/>
          <line x1="8" y1="24" x2="56" y2="24" stroke="currentColor" strokeWidth="2.5"/>
          <line x1="8" y1="40" x2="56" y2="40" stroke="currentColor" strokeWidth="2.5"/>
        </svg>
      ),
    },
    {
      label: 'Total Executado',
      value: `R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: `${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0'}% do orçamento`,
      color: '#639922',
      bg: '#EAF3DE',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="8,48 22,30 32,38 44,20 56,28" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
          <circle cx="56" cy="28" r="4" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label: 'TEDs em Execução',
      value: String(tedsAtivos),
      sub: `de ${teds.length} total`,
      color: '#185FA5',
      bg: '#E6F1FB',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="3.5" fill="none"/>
          <polyline points="20,32 29,41 46,24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'TEDs Concluídos',
      value: String(tedsConcluidos),
      sub: `de ${teds.length} total`,
      color: '#854F0B',
      bg: '#FAEEDA',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="8" width="40" height="48" rx="5" stroke="currentColor" strokeWidth="3.5" fill="none"/>
          <line x1="20" y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="20" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="20" y1="38" x2="36" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Controle TED</h1>
          <div>
            <button onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }} className="btn-secondary">
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Termos de Execução</h2>
          <Link to="/ted/new" className="btn-primary">
            + Novo TED
          </Link>
        </div>

        {!loading && teds.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {statCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.07)',
                  padding: '20px 20px 16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Ícone marca d'água */}
                <div style={{
                  position: 'absolute',
                  right: '-8px',
                  bottom: '-8px',
                  width: '90px',
                  height: '90px',
                  color: card.color,
                  opacity: 0.08,
                  pointerEvents: 'none',
                }}>
                  {card.icon}
                </div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: card.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  {card.label}
                </p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2, marginBottom: '4px' }}>
                  {card.value}
                </p>
                <p style={{ fontSize: '12px', color: '#6b6b6b' }}>{card.sub}</p>
              </div>
            ))}
          </div>
        )}

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {loading ? (
          <p className="text-center text-gray-600">Carregando...</p>
        ) : teds.length === 0 ? (
          <div className="card text-center">
            <p className="text-gray-600 mb-4">Nenhum TED cadastrado</p>
            <Link to="/ted/new" className="btn-primary">
              Criar primeiro TED
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {teds.map(ted => (
              <div key={ted.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{ted.title}</h3>
                    <p className="text-sm text-gray-600">TED #{ted.number}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ted.status)}`}>
                    {ted.status}
                  </span>
                </div>

                <p className="text-gray-600 mb-3">{ted.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Execução Física</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${ted.physical_progress_percentage || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{ted.physical_progress_percentage || 0}%</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Execução Financeira</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${ted.financial_progress_percentage || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{ted.financial_progress_percentage || 0}%</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Orçamento</p>
                    <p className="font-bold">R$ {ted.total_budget?.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-600">Gasto: R$ {ted.total_spent?.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={`/ted/${ted.id}`} className="btn-secondary">
                    Detalhes
                  </Link>
                  <button
                    onClick={() => handleDelete(ted.id)}
                    className="btn-danger"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
