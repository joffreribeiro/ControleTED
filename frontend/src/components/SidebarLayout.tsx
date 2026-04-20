import React from 'react';
import Sidebar from './Sidebar';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-root">
      <Sidebar />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}
