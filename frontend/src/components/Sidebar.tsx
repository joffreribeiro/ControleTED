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

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>

      {/* Botão toggle */}
      <button className="sidebar-toggle" onClick={onToggle} aria-label="Recolher menu">
        ☰
      </button>

      {/* Logo */}
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 100 100" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="70" width="40" height="12" rx="1" fill="rgba(255,255,255,0.85)"/>
              <rect x="20" y="55" width="15" height="12" rx="1" fill="rgba(255,255,255,0.7)"/>
              <rect x="42" y="55" width="15" height="12" rx="1" fill="rgba(255,255,255,0.7)"/>
              <rect x="65" y="55" width="15" height="12" rx="1" fill="rgba(255,255,255,0.7)"/>
              <rect x="30" y="40" width="15" height="12" rx="1" fill="rgba(255,255,255,0.5)"/>
              <rect x="55" y="40" width="15" height="12" rx="1" fill="rgba(255,255,255,0.5)"/>
              <rect x="25" y="28" width="12" height="9"  rx="1" fill="rgba(255,255,255,0.38)"/>
              <rect x="44" y="28" width="12" height="9"  rx="1" fill="rgba(255,255,255,0.38)"/>
              <rect x="63" y="28" width="12" height="9"  rx="1" fill="rgba(255,255,255,0.38)"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-title">Controle TED</span>
              <span className="sidebar-subtitle">GESTÃO DE TERMOS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navegação */}
      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.label} className="nav-group">
            {!collapsed && (
              <div className="nav-group-label">{group.label}</div>
            )}
            {group.items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item${isActive(item.path) ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-item-emoji">{item.emoji}</span>
                {!collapsed && <span className="nav-item-label">{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" title={collapsed ? (user.name || 'Usuário') : undefined}>
            {initials}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-username">{user.name || 'Usuário'}</span>
              <button onClick={handleLogout} className="sidebar-logout">Sair</button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
