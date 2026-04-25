import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout-root">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main
        className="layout-main"
        style={{ marginLeft: collapsed ? 56 : 228 }}
      >
        {children}
      </main>
    </div>
  );
}
