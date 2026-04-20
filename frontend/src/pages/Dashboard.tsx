import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tedService, TED } from '../services/tedService';
import { TED_STATUS } from '../constants/tedStatus';
import { STAT_CARD_COLORS } from '../constants/chartColors';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'EXECUÇÃO':     'badge-execucao',
    'CONCLUÍDO':    'badge-concluido',
    'PLANEJAMENTO': 'badge-planejamento',
    'SUSPENSO':     'badge-suspenso',
  };
  return (
    <span className={`badge ${map[status] || 'badge-planejamento'}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

function ProgressCell({ value, color }: { value: number; color: 'blue' | 'green' }) {
  return (
    <div className="progress-wrap">
      <div className="progress-bar">
        <div
          className={`progress-fill progress-fill-${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="progress-pct">{value}%</span>
    </div>
  );
}

const FILTER_OPTIONS = ['TODOS', 'EXECUÇÃO', 'PLANEJAMENTO', 'CONCLUÍDO', 'SUSPENSO'];

export default function Dashboard() {
  const [teds, setTeds] = useState<TED[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('TODOS');

  useEffect(() => { loadTEDs(); }, []);

  const loadTEDs = async () => {
    try {
      setLoading(true);
      const data = await tedService.getAll();
      setTeds(data);
    } catch {
      setError('Erro ao carregar TEDs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este TED?')) return;
    try {
      await tedService.delete(id);
      setTeds(teds.filter(t => t.id !== id));
    } catch {
      setError('Erro ao excluir TED');
    }
  };

  const totalBudget = teds.reduce((s, t) => s + (t.total_budget || 0), 0);
  const totalSpent  = teds.reduce((s, t) => s + (t.total_spent  || 0), 0);
  const emExecucao  = teds.filter(t => t.status === TED_STATUS.EXECUCAO).length;
  const concluidos  = teds.filter(t => t.status === TED_STATUS.CONCLUIDO).length;

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statCards = [
    {
      label: 'Orçamento Total',
      value: `R$ ${fmtBRL(totalBudget)}`,
      sub: `${teds.length} TED${teds.length !== 1 ? 's' : ''} cadastrados`,
      color: STAT_CARD_COLORS.orcamento,
    },
    {
      label: 'Total Executado',
      value: `R$ ${fmtBRL(totalSpent)}`,
      sub: `${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0'}% do orçamento`,
      color: STAT_CARD_COLORS.executado,
    },
    {
      label: 'Em Execução',
      value: String(emExecucao),
      sub: `de ${teds.length} total`,
      color: STAT_CARD_COLORS.emExecucao,
    },
    {
      label: 'Concluídos',
      value: String(concluidos),
      sub: `de ${teds.length} total`,
      color: STAT_CARD_COLORS.concluidos,
    },
  ];

  const filtered = filter === 'TODOS' ? teds : teds.filter(t => t.status === filter);

  return (
    <div className="page-content">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Termos de Execução Descentralizada</p>
        </div>
        <div className="page-actions">
          <Link to="/ted/new" className="btn btn-primary">+ Novo TED</Link>
        </div>
      </div>

      {/* Stat Cards */}
      {!loading && teds.length > 0 && (
        <div className="stat-grid">
          {statCards.map(card => (
            <div key={card.label} className="stat-card">
              <p className="stat-label" style={{ color: card.color }}>{card.label}</p>
              <p className="stat-value">{card.value}</p>
              <p className="stat-sub">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <div className="alert-error">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div className="empty-state">
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Carregando...</p>
        </div>
      ) : teds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3 className="empty-title">Nenhum TED cadastrado</h3>
          <p className="empty-sub">Comece criando o primeiro Termo de Execução.</p>
          <Link to="/ted/new" className="btn btn-primary">+ Criar primeiro TED</Link>
        </div>
      ) : (
        <>
          {/* Filter row */}
          <div className="filter-row">
            {FILTER_OPTIONS.map(s => (
              <button
                key={s}
                className={`filter-btn${filter === s ? ' active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
            <span className="filter-count">
              {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">Nenhum TED com status "{filter}"</h3>
              <p className="empty-sub">Tente selecionar outro filtro.</p>
            </div>
          ) : (
            <div className="table-card">
              <table className="ted-table">
                <thead>
                  <tr>
                    <th>Nº TED</th>
                    <th>Título / Descrição</th>
                    <th>Status</th>
                    <th>Exec. Física</th>
                    <th>Exec. Financeira</th>
                    <th>Orçamento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ted => (
                    <tr key={ted.id}>
                      <td><span className="td-number">{ted.number}</span></td>
                      <td style={{ maxWidth: 260 }}>
                        <div className="td-title-main">{ted.title}</div>
                        <div className="td-title-sub">{ted.description}</div>
                      </td>
                      <td><StatusBadge status={ted.status} /></td>
                      <td style={{ minWidth: 140 }}>
                        <ProgressCell value={ted.physical_progress_percentage || 0} color="blue" />
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <ProgressCell value={ted.financial_progress_percentage || 0} color="green" />
                      </td>
                      <td>
                        <div className="td-mono" style={{ fontWeight: 600 }}>
                          R$ {ted.total_budget?.toLocaleString('pt-BR')}
                        </div>
                        <div className="td-mono" style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
                          Gasto: R$ {ted.total_spent?.toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/ted/${ted.id}`} className="btn btn-secondary btn-sm">
                            Detalhes
                          </Link>
                          <button
                            onClick={() => handleDelete(ted.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      Total ({teds.length} TEDs)
                    </td>
                    <td>
                      <div className="td-mono" style={{ fontWeight: 700 }}>
                        R$ {totalBudget.toLocaleString('pt-BR')}
                      </div>
                      <div className="td-mono" style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
                        Gasto: R$ {totalSpent.toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
