'use client';

import { useState, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import type { User } from '@supabase/supabase-js';

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({ collapsed: false, toggle: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function AuthShell({ user, children }: { user: User; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-root)' }}>
        <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <main className={`flex-1 min-w-0 overflow-x-hidden overflow-y-auto transition-[margin-left] duration-200 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
