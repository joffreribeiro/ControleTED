import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-box">

        <div className="login-logo-wrap">
          <div className="login-logo-icon">
            <svg width="26" height="26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
              <path d="M5 3h10l5 5v14a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"/>
              <polyline points="14,3 14,9 20,9"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="16" y2="17"/>
            </svg>
          </div>
          <h1 className="login-title">Controle TED</h1>
          <p className="login-subtitle">Sistema de Gestão de Termos de Execução</p>
        </div>

        <div className="login-card">
          <h2 className="login-card-title">Acesso ao Sistema</h2>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-mail institucional</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.gov.br"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
          Não tem conta?{' '}
          <a href="/register" style={{ color: 'var(--color-primary-mid)', textDecoration: 'none', fontWeight: 500 }}>
            Cadastre-se
          </a>
        </p>

      </div>
    </div>
  );
}
