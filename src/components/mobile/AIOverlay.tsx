'use client';

import { AISidebar } from '@/components/editor/AISidebar';
import { X } from 'lucide-react';

interface AIOverlayProps {
  open: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

export function AIOverlay({ open, onClose, onInsert }: AIOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative rounded-t-2xl overflow-hidden"
        style={{ height: '60vh', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">AI Draft Assistant</span>
          <button onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-[calc(60vh-48px)]">
          <AISidebar onInsert={onInsert} />
        </div>
      </div>
    </div>
  );
}
