import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tedService } from '../services/tedService';

export default function CreateTED() {
  const [formData, setFormData] = useState({
    number: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : undefined,
        status: 'PLANEJAMENTO'
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
            Voltar ao Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="section-title">Criar novo TED</h2>
          <p className="text-gray-500 mt-1">Preencha as informações do Termo de Execução Descentralizada</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          {/* Identification section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Identificação
            </h3>
            <div className="form-group">
              <label className="form-label">Número do TED *</label>
              <input
                type="text"
                name="number"
                className="form-input"
                value={formData.number}
                onChange={handleChange}
                placeholder="Ex: TED-2024-001"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Título *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                placeholder="Título do TED"
                required
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Descrição</label>
              <textarea
                name="description"
                className="form-input"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Descrição detalhada do TED"
              />
            </div>
          </div>

          {/* Dates section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Prazo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label className="form-label">Data de Início</label>
                <input
                  type="date"
                  name="start_date"
                  className="form-input"
                  value={formData.start_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Data de Término</label>
                <input
                  type="date"
                  name="end_date"
                  className="form-input"
                  value={formData.end_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Budget section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Financeiro
            </h3>
            <div className="form-group mb-0">
              <label className="form-label">Orçamento Total (R$)</label>
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

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Criando...</> : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Criar TED
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-secondary"
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
