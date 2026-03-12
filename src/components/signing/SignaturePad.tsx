'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SignaturePadProps {
  onChange: (data: string) => void;
}

export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw faint rule line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.moveTo(20, canvas.offsetHeight - 20);
    ctx.lineTo(canvas.offsetWidth - 20, canvas.offsetHeight - 20);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    setIsDrawing(false);
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL());
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw rule line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.moveTo(20, canvas.offsetHeight - 20);
    ctx.lineTo(canvas.offsetWidth - 20, canvas.offsetHeight - 20);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    onChange('');
  }

  function handleTypedSignature(name: string) {
    setTypedName(name);
    // Generate typed signature as canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 32px Georgia, serif';
    ctx.fillText(name, 20, 60);
    onChange(canvas.toDataURL());
  }

  return (
    <div className="space-y-3">
      {/* Draw/Type toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        <button
          onClick={() => setMode('draw')}
          className={`px-4 py-1.5 text-xs font-medium transition-colors ${
            mode === 'draw' ? 'bg-white/10 text-foreground' : 'text-muted-foreground'
          }`}
        >
          Draw
        </button>
        <button
          onClick={() => setMode('type')}
          className={`px-4 py-1.5 text-xs font-medium transition-colors ${
            mode === 'type' ? 'bg-white/10 text-foreground' : 'text-muted-foreground'
          }`}
        >
          Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-32 rounded-lg border border-border cursor-crosshair"
            style={{ backgroundColor: 'var(--bg-elevated)', touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <p className="absolute bottom-2 left-3 text-[10px] text-muted-foreground/40">Sign here</p>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 text-xs"
            onClick={clearCanvas}
          >
            Clear
          </Button>
        </div>
      ) : (
        <Input
          value={typedName}
          onChange={(e) => handleTypedSignature(e.target.value)}
          placeholder="Type your full name"
          className="text-xl italic font-serif"
        />
      )}
    </div>
  );
}
