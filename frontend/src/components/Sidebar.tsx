import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const navGroups = [
  {
    label: 'Principal',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: (
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="2" y="2" width="5" height="5" rx="1"/>
            <rect x="8" y="2" width="5" height="5" rx="1"/>
            <rect x="2" y="8" width="5" height="5" rx="1"/>
            <rect x="8" y="8" width="5" height="5" rx="1"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Gestão',
    items: [
      {
        path: '/ted/new',
        label: 'Novo TED',
        icon: (
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="7.5" y1="2" x2="7.5" y2="13"/>
            <line x1="2" y1="7.5" x2="13" y2="7.5"/>
          </svg>
        ),
      },
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
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6l9-3 9 3v2l-9 3-9-3V6z" transform="scale(0.75) translate(2,2)"/>
            <rect x="4" y="8" width="7" height="5" rx="1"/>
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Controle TED</span>
          <span className="sidebar-brand-sub">Gestão de Termos</span>
        </div>
      </div>

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
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
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
