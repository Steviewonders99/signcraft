export const PLATFORM_ACCENTS = {
  hpm: { hsl: '142 71% 45%', hex: '#22c55e' },
  mixology: { hsl: '199 89% 48%', hex: '#0ea5e9' },
  darrow: { hsl: '263 70% 50%', hex: '#8b5cf6' },
} as const;

export type PlatformKey = keyof typeof PLATFORM_ACCENTS;

export function setAccent(hex: string) {
  document.documentElement.style.setProperty('--accent-hex', hex);
}
