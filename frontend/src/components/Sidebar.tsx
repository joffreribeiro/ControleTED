import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : {};
  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const links = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <rect x="2" y="2" width="5" height="5" rx="1"/>
          <rect x="9" y="2" width="5" height="5" rx="1"/>
          <rect x="2" y="9" width="5" height="5" rx="1"/>
          <rect x="9" y="9" width="5" height="5" rx="1"/>
        </svg>
      ),
    },
    {
      path: '/ted/new',
      label: 'Novo TED',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="8" y1="3" x2="8" y2="13"/>
          <line x1="3" y1="8" x2="13" y2="8"/>
        </svg>
      ),
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-name">Controle TED</span>
        <span className="sidebar-brand-sub">Gestão de Termos</span>
      </div>

      <nav className="sidebar-nav">
        {links.map(l => {
          const isActive =
            l.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(l.path);
          return (
            <Link key={l.path} to={l.path} className={`sidebar-link${isActive ? ' active' : ''}`}>
              <span className="sidebar-link-icon">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{user.name || 'Usuário'}</span>
            <button onClick={handleLogout} className="sidebar-logout">Sair</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
