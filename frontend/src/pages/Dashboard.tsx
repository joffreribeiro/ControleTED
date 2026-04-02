import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tedService, TED } from '../services/tedService';

export default function Dashboard() {
  const [teds, setTeds] = useState<TED[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

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

  const getStatusBadgeClass = (status: string) => {
    const classes: { [key: string]: string } = {
      'PLANEJAMENTO': 'badge-yellow',
      'EXECUÇÃO': 'badge-blue',
      'CONCLUÍDO': 'badge-green',
      'SUSPENSO': 'badge-red',
    };
    return classes[status] || 'badge-gray';
  };

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
          <div className="flex items-center gap-4">
            {user?.name && (
              <span className="text-sm text-gray-600">
                Olá, <span className="font-semibold text-gray-800">{user.name}</span>
              </span>
            )}
            <button onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }} className="btn-secondary text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h2 className="section-title">Termos de Execução</h2>
            <p className="text-gray-500 mt-1">{teds.length} TED{teds.length !== 1 ? 's' : ''} cadastrado{teds.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/ted/new" className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo TED
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <span className="spinner mr-3 w-5 h-5" />
            Carregando TEDs...
          </div>
        ) : teds.length === 0 ? (
          <div className="card text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2 font-medium">Nenhum TED cadastrado</p>
            <p className="text-gray-400 text-sm mb-6">Comece criando o primeiro Termo de Execução Descentralizada.</p>
            <Link to="/ted/new" className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar primeiro TED
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {teds.map(ted => (
              <div key={ted.id} className="card-hover">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{ted.title}</h3>
                      <span className={getStatusBadgeClass(ted.status)}>{ted.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">TED #{ted.number}</p>
                  </div>
                </div>

                {ted.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ted.description}</p>
                )}

                <div className="grid grid-cols-3 gap-6 mb-5">
                  {/* Physical progress */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Execução Física</p>
                      <p className="text-xs font-bold text-blue-700">{ted.physical_progress_percentage || 0}%</p>
                    </div>
                    <div className="progress-bar h-2.5">
                      <div
                        className="progress-fill bg-blue-500 h-2.5"
                        style={{ width: `${ted.physical_progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial progress */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Execução Financeira</p>
                      <p className="text-xs font-bold text-emerald-700">{ted.financial_progress_percentage || 0}%</p>
                    </div>
                    <div className="progress-bar h-2.5">
                      <div
                        className="progress-fill bg-emerald-500 h-2.5"
                        style={{ width: `${ted.financial_progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Orçamento</p>
                    <p className="font-bold text-gray-800">R$ {ted.total_budget?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Gasto: R$ {ted.total_spent?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Link to={`/ted/${ted.id}`} className="btn-secondary text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Detalhes
                  </Link>
                  <button
                    onClick={() => handleDelete(ted.id)}
                    className="btn-danger text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
