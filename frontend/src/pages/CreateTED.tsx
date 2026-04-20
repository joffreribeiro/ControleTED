import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tedService } from '../services/tedService';
import { TED_STATUS } from '../constants/tedStatus';

export default function CreateTED() {
  const [formData, setFormData] = useState({
    number: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.number.trim()) e.number = 'Campo obrigatório';
    if (!formData.title.trim())  e.title  = 'Campo obrigatório';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) { setErrors(ve); return; }
    setError('');
    setLoading(true);
    try {
      const data = {
        ...formData,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : undefined,
        status: TED_STATUS.PLANEJAMENTO,
      };
      await tedService.create(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar TED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 700 }}>

      <button className="back-link" onClick={() => navigate('/dashboard')}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 2 4 8 9 14"/>
        </svg>
        Voltar ao Dashboard
      </button>

      <h1 className="page-title">Novo TED</h1>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>
        Cadastre um novo Termo de Execução Descentralizada
      </p>

      {error && <div className="alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>

          <div className="form-grid-num-title form-group">
            <div>
              <label className="form-label">Nº do TED *</label>
              <input
                type="text"
                name="number"
                className={`form-input${errors.number ? ' error' : ''}`}
                value={formData.number}
                onChange={handleChange}
                placeholder="TED-2025-001"
              />
              {errors.number && <p className="form-error">{errors.number}</p>}
            </div>
            <div>
              <label className="form-label">Título *</label>
              <input
                type="text"
                name="title"
                className={`form-input${errors.title ? ' error' : ''}`}
                value={formData.title}
                onChange={handleChange}
                placeholder="Título do Termo de Execução"
              />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea
              name="description"
              className="form-input"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva o objetivo e escopo do TED"
              style={{ resize: 'vertical', lineHeight: 1.55 }}
            />
          </div>

          <div className="form-grid-3 form-group">
            <div>
              <label className="form-label">Data de Início</label>
              <input
                type="date"
                name="start_date"
                className="form-input"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="form-label">Data de Término</label>
              <input
                type="date"
                name="end_date"
                className="form-input"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="form-label">Orçamento (R$)</label>
              <input
                type="number"
                name="total_budget"
                className="form-input"
                value={formData.total_budget}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <hr className="divider" />

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar TED'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
