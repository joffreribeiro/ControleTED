import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard', label: 'Dashboard', emoji: '📊' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { path: '/ted/new', label: 'Novo TED', emoji: '📋' },
    ],
  },
];

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

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  return (
    <aside className="sidebar">
      {/* Cabeçalho / Logo */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <svg viewBox="0 0 100 100" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="70" width="40" height="12" rx="1" fill="rgba(255,255,255,0.8)"/>
            <rect x="20" y="55" width="15" height="12" rx="1" fill="rgba(255,255,255,0.65)"/>
            <rect x="42" y="55" width="15" height="12" rx="1" fill="rgba(255,255,255,0.65)"/>
            <rect x="65" y="55" width="15" height="12" rx="1" fill="rgba(255,255,255,0.65)"/>
            <rect x="30" y="40" width="15" height="12" rx="1" fill="rgba(255,255,255,0.5)"/>
            <rect x="55" y="40" width="15" height="12" rx="1" fill="rgba(255,255,255,0.5)"/>
            <rect x="25" y="28" width="12" height="9" rx="1" fill="rgba(255,255,255,0.4)"/>
            <rect x="44" y="28" width="12" height="9" rx="1" fill="rgba(255,255,255,0.4)"/>
            <rect x="63" y="28" width="12" height="9" rx="1" fill="rgba(255,255,255,0.4)"/>
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Controle TED</span>
          <span className="sidebar-brand-sub">Gestão de Termos</span>
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.label} className="nav-group">
            <div className="nav-group-label">{group.label}</div>
            {group.items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item${isActive(item.path) ? ' active' : ''}`}
              >
                <span className="nav-item-emoji">{item.emoji}</span>
                <span className="nav-item-label">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Rodapé com usuário */}
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
