import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tedService, TED, PhysicalMilestone, FinancialItem } from '../services/tedService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PAGAMENTO_STATUS_COLORS } from '../constants/tedStatus';
import { PIE_PROGRESS_COLORS } from '../constants/chartColors';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'EXECUÇÃO':     'badge-execucao',
    'CONCLUÍDO':    'badge-concluido',
    'PLANEJAMENTO': 'badge-planejamento',
    'SUSPENSO':     'badge-suspenso',
    'EM ANDAMENTO': 'badge-em-andamento',
    'PENDENTE':     'badge-pendente',
  };
  return (
    <span className={`badge ${map[status] || 'badge-planejamento'}`}>
      <span className="badge-dot" />{status}
    </span>
  );
}

function PagBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'PAGO':      'badge-pago',
    'PENDENTE':  'badge-pendente',
    'PLANEJADO': 'badge-planejado',
  };
  return <span className={`badge ${map[status] || 'badge-planejamento'}`}>{status}</span>;
}

function DonutChart({ value, color }: { value: number; color: string }) {
  const data = [{ value }, { value: 100 - value }];
  return (
    <div className="donut-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={38} outerRadius={52}
            startAngle={90} endAngle={-270}
            dataKey="value" stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#E9ECF0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <span className="donut-pct">{value}%</span>
      </div>
    </div>
  );
}

function fmtBRL(n?: number) {
  return (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
}

export default function TEDDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ted, setTed] = useState<TED | null>(null);
  const [milestones, setMilestones] = useState<PhysicalMilestone[]>([]);
  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'physical' | 'financial'>('overview');

  useEffect(() => { loadTED(); }, [id]);

  const loadTED = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const data = await tedService.getById(parseInt(id));
      setTed(data);
      setMilestones(data.physical_milestones || []);
      setFinancialItems(data.financial_items || []);
    } catch {
      setError('Erro ao carregar TED');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="page-content">
      <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p>
    </div>
  );

  if (error || !ted) return (
    <div className="page-content">
      <div className="alert-error">{error || 'TED não encontrado'}</div>
      <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>← Voltar</button>
    </div>
  );

  const phys = ted.physical_progress_percentage || 0;
  const fin  = ted.financial_progress_percentage || 0;

  const statusMap: Record<string, string> = {
    'EXECUÇÃO':     'badge-execucao',
    'CONCLUÍDO':    'badge-concluido',
    'PLANEJAMENTO': 'badge-planejamento',
    'SUSPENSO':     'badge-suspenso',
  };

  return (
    <div className="page-content">

      {/* Back */}
      <button className="back-link" onClick={() => navigate('/dashboard')}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 2 4 8 9 14"/>
        </svg>
        Voltar ao Dashboard
      </button>

      {/* Header card */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>
              {ted.number}
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 5 }}>{ted.title}</h1>
            {ted.description && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{ted.description}</p>
            )}
          </div>
          <span className={`badge badge-lg ${statusMap[ted.status] || 'badge-planejamento'}`} style={{ flexShrink: 0, marginLeft: 20 }}>
            <span className="badge-dot" />{ted.status}
          </span>
        </div>

        <div className="info-grid">
          <div className="info-cell">
            <p className="info-cell-label">Data Início</p>
            <p className="info-cell-value">{fmtDate(ted.start_date)}</p>
          </div>
          <div className="info-cell">
            <p className="info-cell-label">Data Término</p>
            <p className="info-cell-value">{fmtDate(ted.end_date)}</p>
          </div>
          <div className="info-cell">
            <p className="info-cell-label">Orçamento Total</p>
            <p className="info-cell-value" style={{ fontFamily: 'var(--font-mono)' }}>R$ {fmtBRL(ted.total_budget)}</p>
          </div>
          <div className="info-cell">
            <p className="info-cell-label">Total Gasto</p>
            <p className="info-cell-value" style={{ fontFamily: 'var(--font-mono)' }}>R$ {fmtBRL(ted.total_spent)}</p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="tab-switch">
        {(['overview', 'physical', 'financial'] as const).map(t => (
          <button
            key={t}
            className={`tab-btn${activeTab === t ? ' active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {{ overview: 'Visão Geral', physical: 'Execução Física', financial: 'Execução Financeira' }[t]}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <div className="card">
            <p className="card-title" style={{ marginBottom: 16 }}>Execução Física</p>
            <div className="progress-card-inner">
              <DonutChart value={phys} color="#185FA5" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Progresso geral</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary-mid)', fontFamily: 'var(--font-mono)' }}>{phys}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill progress-fill-blue" style={{ width: `${phys}%` }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  {milestones.filter(m => m.status === 'CONCLUÍDO').length} de {milestones.length} marcos concluídos
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="card-title" style={{ marginBottom: 16 }}>Execução Financeira</p>
            <div className="progress-card-inner">
              <DonutChart value={fin} color="#639922" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Progresso geral</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>{fin}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8, background: 'var(--color-success-bg)' }}>
                  <div className="progress-fill progress-fill-green" style={{ width: `${fin}%` }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  R$ {fmtBRL(ted.total_spent)} de R$ {fmtBRL(ted.total_budget)} executados
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <p className="card-title" style={{ marginBottom: 14 }}>Marcos Físicos — Resumo</p>
            {milestones.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
                Nenhum marco cadastrado
              </p>
            ) : (
              <div className="milestones-grid">
                {milestones.map(m => (
                  <div key={m.id} className="milestone-mini">
                    <p className="milestone-mini-title">{m.description}</p>
                    <div className="progress-bar" style={{ height: 4, marginBottom: 6 }}>
                      <div className="progress-fill progress-fill-blue" style={{ width: `${m.actual_percentage}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {m.actual_percentage}%
                      </span>
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHYSICAL */}
      {activeTab === 'physical' && (
        <div className="table-card">
          <div className="card-header">
            <span className="card-title">Marcos Físicos</span>
            <button className="btn btn-primary btn-sm">+ Adicionar Marco</button>
          </div>
          {milestones.length === 0 ? (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Nenhum marco físico cadastrado</p>
            </div>
          ) : (
            <table className="ted-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th className="text-right">Meta</th>
                  <th className="text-right">Realizado</th>
                  <th>Progresso</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500 }}>{m.description}</td>
                    <td><StatusBadge status={m.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="td-mono">{m.target_percentage}%</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="td-mono" style={{ fontWeight: 700, color: 'var(--color-primary-mid)' }}>
                        {m.actual_percentage}%
                      </span>
                    </td>
                    <td style={{ minWidth: 160 }}>
                      <div className="progress-bar" style={{ height: 6 }}>
                        <div className="progress-fill progress-fill-blue" style={{ width: `${m.actual_percentage}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* FINANCIAL */}
      {activeTab === 'financial' && (
        <div className="table-card">
          <div className="card-header">
            <span className="card-title">Itens Financeiros</span>
            <button className="btn btn-primary btn-sm">+ Adicionar Item</button>
          </div>
          {financialItems.length === 0 ? (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Nenhum item financeiro cadastrado</p>
            </div>
          ) : (
            <table className="ted-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th className="text-right">Planejado</th>
                  <th className="text-right">Realizado</th>
                  <th className="text-right">Variação</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {financialItems.map(item => {
                  const variacao = (item.spent_amount || 0) - (item.planned_amount || 0);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.description}</td>
                      <td><PagBadge status={item.status} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="td-mono">R$ {fmtBRL(item.planned_amount)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="td-mono" style={{ fontWeight: 700 }}>R$ {fmtBRL(item.spent_amount)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="td-mono" style={{
                          color: variacao > 0 ? 'var(--color-danger)' : variacao < 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                        }}>
                          {variacao > 0 ? '+' : ''}{fmtBRL(variacao)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{fmtDate(item.payment_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="td-mono" style={{ fontWeight: 700 }}>
                      R$ {fmtBRL(financialItems.reduce((s, i) => s + (i.planned_amount || 0), 0))}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="td-mono" style={{ fontWeight: 700 }}>
                      R$ {fmtBRL(financialItems.reduce((s, i) => s + (i.spent_amount || 0), 0))}
                    </span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
