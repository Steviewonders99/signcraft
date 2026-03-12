'use client';

export function AIFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-40 text-white font-bold text-sm"
      style={{ backgroundColor: 'var(--accent-hex)' }}
    >
      AI
    </button>
  );
}
