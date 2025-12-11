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
