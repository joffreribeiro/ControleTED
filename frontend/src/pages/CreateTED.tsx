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
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Controle TED</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Criar novo TED</h2>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="card">
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

          <div className="form-group">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Data de Início</label>
              <input
                type="date"
                name="start_date"
                className="form-input"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
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

          <div className="form-group">
            <label className="form-label">Orçamento Total (R$)</label>
            <input
              type="number"
              name="total_budget"
              className="form-input"
              value={formData.total_budget}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="flex gap-4">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Criando...' : 'Criar TED'}
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
