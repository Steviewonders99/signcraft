'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Plus, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardActions() {
  return (
    <div className="flex gap-2">
      <Link href="/templates" className={cn(buttonVariants({ variant: 'outline' }))}>
        <LayoutTemplate className="w-4 h-4 mr-2" />
        Templates
      </Link>
      <Link href="/documents/new" className={cn(buttonVariants())}>
        <Plus className="w-4 h-4 mr-2" />
        New Contract
      </Link>
    </div>
  );
}
