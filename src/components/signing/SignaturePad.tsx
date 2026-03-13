'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Pen, Type, X } from 'lucide-react';

interface SignaturePadProps {
  onChange: (data: string) => void;
}

function drawBaseline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const y = h - 28;
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.moveTo(24, y);
  ctx.lineTo(w - 24, y);
  ctx.stroke();
  // X marker
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillText('✕', 12, y + 5);
  ctx.restore();
}

export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);
    drawBaseline(ctx, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (mode === 'draw') {
      requestAnimationFrame(initCanvas);
    }
  }, [mode, initCanvas]);

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
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
    if (isDrawing) {
      setIsDrawing(false);
      setHasDrawn(true);
      if (canvasRef.current) {
        onChange(canvasRef.current.toDataURL());
      }
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBaseline(ctx, canvas.offsetWidth, canvas.offsetHeight);
    setHasDrawn(false);
    onChange('');
  }

  function handleTypedSignature(name: string) {
    setTypedName(name);
    if (!name) {
      onChange('');
      return;
    }
    // Render typed signature on a hidden canvas using the handwriting font
    const sigFont = getComputedStyle(document.documentElement).getPropertyValue('--font-signature').trim();
    const fontFamily = sigFont || '"Dancing Script", cursive';
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.font = `48px ${fontFamily}`;
    ctx.fillText(name, 24, 95);
    onChange(canvas.toDataURL());
  }

  function switchMode(next: 'draw' | 'type') {
    if (next === mode) return;
    setMode(next);
    setTypedName('');
    setHasDrawn(false);
    onChange('');
  }

  const canvasStyle: React.CSSProperties = {
    backgroundColor: 'oklch(0.11 0.005 285)',
    border: '1px solid oklch(1 0 0 / 8%)',
    boxShadow: 'inset 0 2px 12px oklch(0 0 0 / 25%), 0 0 0 1px oklch(1 0 0 / 3%)',
    touchAction: 'none',
  };

  return (
    <div className="space-y-2.5">
      {/* Label + pill toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'oklch(0.7 0 0)' }}>
          Signature
        </span>
        <div
          className="flex rounded-full p-0.5"
          style={{ backgroundColor: 'oklch(1 0 0 / 5%)', border: '1px solid oklch(1 0 0 / 8%)' }}
        >
          <button
            onClick={() => switchMode('draw')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all"
            style={{
              backgroundColor: mode === 'draw' ? 'oklch(1 0 0 / 10%)' : 'transparent',
              color: mode === 'draw' ? 'oklch(0.95 0 0)' : 'oklch(0.45 0 0)',
            }}
          >
            <Pen className="w-3 h-3" />
            Draw
          </button>
          <button
            onClick={() => switchMode('type')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all"
            style={{
              backgroundColor: mode === 'type' ? 'oklch(1 0 0 / 10%)' : 'transparent',
              color: mode === 'type' ? 'oklch(0.95 0 0)' : 'oklch(0.45 0 0)',
            }}
          >
            <Type className="w-3 h-3" />
            Type
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className="relative group">
          <canvas
            ref={canvasRef}
            className="w-full h-40 rounded-xl cursor-crosshair"
            style={canvasStyle}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasDrawn && (
            <p
              className="absolute bottom-9 left-1/2 -translate-x-1/2 text-[11px] pointer-events-none select-none tracking-wide"
              style={{ color: 'oklch(1 0 0 / 12%)' }}
            >
              Sign above the line
            </p>
          )}
          {hasDrawn && (
            <button
              onClick={clearCanvas}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'oklch(0 0 0 / 50%)' }}
            >
              <X className="w-3.5 h-3.5" style={{ color: 'oklch(0.7 0 0)' }} />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <input
            value={typedName}
            onChange={(e) => handleTypedSignature(e.target.value)}
            placeholder="Type your full name"
            className="w-full px-4 py-2.5 rounded-xl text-sm bg-transparent outline-none placeholder:text-[oklch(0.35_0_0)]"
            style={{
              border: '1px solid oklch(1 0 0 / 8%)',
              color: 'oklch(0.9 0 0)',
            }}
          />
          {/* Live signature preview */}
          <div
            className="relative w-full h-40 rounded-xl overflow-hidden"
            style={canvasStyle}
          >
            {/* Signature line + X */}
            <div
              className="absolute left-6 right-6"
              style={{ bottom: '28px', height: '1px', backgroundColor: 'oklch(1 0 0 / 12%)' }}
            />
            <span
              className="absolute text-sm select-none"
              style={{ left: '12px', bottom: '22px', color: 'oklch(1 0 0 / 15%)' }}
            >
              ✕
            </span>

            {typedName ? (
              <span
                className="absolute left-6 select-none"
                style={{
                  bottom: '34px',
                  fontFamily: 'var(--font-signature), "Dancing Script", cursive',
                  fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
                  color: '#ffffff',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                }}
              >
                {typedName}
              </span>
            ) : (
              <span
                className="absolute bottom-9 left-1/2 -translate-x-1/2 text-[11px] select-none tracking-wide"
                style={{ color: 'oklch(1 0 0 / 12%)' }}
              >
                Preview appears here
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
