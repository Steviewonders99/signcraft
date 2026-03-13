'use client';

import { Button } from '@/components/ui/button';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useSidebar } from './AuthShell';

export function NavToggle() {
  const { collapsed, toggle } = useSidebar();

  return (
    <Button
      variant="outline"
      size="icon"
      className="hidden md:inline-flex"
      onClick={toggle}
      title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
    >
      {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
    </Button>
  );
}
