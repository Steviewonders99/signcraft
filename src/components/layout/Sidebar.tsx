'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  Settings,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ user, collapsed, onToggle }: { user: User; collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-16' : 'md:w-64'} md:translate-x-0 w-64`}
        style={{ backgroundColor: 'var(--bg-card)', borderRight: '1px solid hsl(var(--border))' }}
      >
        <div className={`p-6 flex items-center ${collapsed ? 'md:justify-center md:px-3' : 'justify-between'}`}>
          <h1 className={`text-lg font-bold ${collapsed ? 'md:hidden' : ''}`}>SignCraft</h1>
          {collapsed && <span className="hidden md:block text-lg font-bold">S</span>}
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className={`flex-1 space-y-1 ${collapsed ? 'md:px-2' : 'px-3'}`}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? 'md:justify-center md:px-0' : ''
                } ${
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
                style={isActive ? { backgroundColor: 'hsl(var(--accent) / 0.15)', color: 'var(--accent-hex)' } : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-border space-y-3 ${collapsed ? 'md:px-2' : ''}`}>
          <p className={`text-xs text-muted-foreground truncate ${collapsed ? 'md:hidden' : ''}`}>{user.email}</p>
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Sign Out' : undefined}
            className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ${collapsed ? 'md:justify-center md:w-full' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={collapsed ? 'md:hidden' : ''}>Sign Out</span>
          </button>
          {/* Collapse / Expand toggle */}
          <button
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full rounded-lg px-2 py-1.5 hover:bg-white/5 ${collapsed ? 'justify-center' : ''}`}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
