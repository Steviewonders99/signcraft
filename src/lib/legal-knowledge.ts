import { readFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'src', 'data', 'legal');

const DEFAULT_SYSTEM_PROMPT =
  'You are a legal contract drafting assistant. Write clear, professional contract language.';

function loadFile(filename: string): string {
  try {
    return readFileSync(join(DATA_DIR, filename), 'utf-8');
  } catch (err) {
    console.error(`[legal-knowledge] Failed to load ${filename}:`, err);
    return '';
  }
}

// Load once at module level — these are static files
const systemPrompt = loadFile('system-prompt.md') || DEFAULT_SYSTEM_PROMPT;
const clausePatterns = loadFile('clause-patterns.md');
const terminology = loadFile('terminology.md');

export type AIMode = 'draft' | 'review' | 'explain';

const MAX_TOKENS: Record<AIMode, number> = {
  draft: 4000,
  review: 8000,
  explain: 1500,
};

const REVIEW_CONTEXT_LIMIT = 24000; // ~8,000 tokens ≈ 24,000 chars

export function getSystemPrompt(mode: AIMode): string {
  switch (mode) {
    case 'draft':
      return `${systemPrompt}\n\n# Reference: Standard Clause Patterns\n\n${clausePatterns}`;
    case 'review':
      return `${systemPrompt}\n\nIMPORTANT: You are in REVIEW MODE. Analyze the contract and respond ONLY in the JSON format described in your Review Mode instructions.\n\n# Reference: Standard Clause Patterns\n\n${clausePatterns}`;
    case 'explain':
      return `${systemPrompt}\n\n# Reference: Legal Terminology\n\n${terminology}`;
    default:
      return systemPrompt;
  }
}

export function getMaxTokens(mode: AIMode): number {
  return MAX_TOKENS[mode];
}

export function validateReviewContext(context: string): string | null {
  if (context.length > REVIEW_CONTEXT_LIMIT) {
    return 'Document too long for full review. Please select a section to review.';
  }
  return null;
}
