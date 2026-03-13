export const ACCENT_PRESETS = [
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Yellow', hex: '#eab308' },
] as const;

export function setAccent(hex: string) {
  document.documentElement.style.setProperty('--accent-hex', hex);
  // Also update the oklch primary to keep buttons/rings in sync
  const oklch = hexToOklchApprox(hex);
  document.documentElement.style.setProperty('--primary', oklch);
  document.documentElement.style.setProperty('--ring', oklch);
  document.documentElement.style.setProperty('--sidebar-primary', oklch);
  document.documentElement.style.setProperty('--sidebar-ring', oklch);
}

export function setTheme(theme: 'light' | 'dark') {
  const html = document.documentElement;
  if (theme === 'light') {
    html.classList.remove('dark');
    document.body.style.setProperty('--bg-root', '#f4f4f5');
    document.body.style.setProperty('--bg-card', '#ffffff');
    document.body.style.setProperty('--bg-elevated', '#e4e4e7');
  } else {
    html.classList.add('dark');
    document.body.style.setProperty('--bg-root', '#09090b');
    document.body.style.setProperty('--bg-card', '#0f0f12');
    document.body.style.setProperty('--bg-elevated', '#161619');
  }
}

/** Rough hex → oklch string for CSS vars. Not perceptually perfect but good enough for accent theming. */
function hexToOklchApprox(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  // Approximate lightness from luminance
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const L = Math.cbrt(lum) * 0.85 + 0.1; // Scale to ~0.4-0.9 range
  return `oklch(${L.toFixed(2)} 0.18 145)`;
}
