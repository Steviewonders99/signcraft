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

export type AIMode = 'draft' | 'review' | 'explain' | 'edit';

const MAX_TOKENS: Record<AIMode, number> = {
  draft: 4000,
  review: 8000,
  explain: 1500,
  edit: 8000,
};

const REVIEW_CONTEXT_LIMIT = 24000; // ~8,000 tokens ≈ 24,000 chars

const EDIT_INSTRUCTIONS = `
IMPORTANT: You are in EDIT MODE. The user will provide their full document content and an instruction describing what to change.

You MUST respond with ONLY a JSON object in this exact format:
{
  "edits": [
    {
      "search": "the exact text from the document to find and replace (copy it verbatim, include enough context to be unique)",
      "replace": "the new text that should replace it"
    }
  ],
  "summary": "Brief description of what was changed"
}

Rules:
- The "search" field must be an EXACT substring of the document. Copy it character-for-character.
- Include enough surrounding text in "search" to make it unique (at least a full sentence or paragraph).
- You can return multiple edits if the instruction requires changes to several sections.
- Do NOT include markdown code fences or any text outside the JSON.
- If you cannot find the section the user is referring to, respond with: {"edits": [], "summary": "Could not locate the specified section."}
`;

export function getSystemPrompt(mode: AIMode): string {
  switch (mode) {
    case 'draft':
      return `${systemPrompt}\n\n# Reference: Standard Clause Patterns\n\n${clausePatterns}`;
    case 'review':
      return `${systemPrompt}\n\nIMPORTANT: You are in REVIEW MODE. Analyze the contract and respond ONLY in the JSON format described in your Review Mode instructions.\n\n# Reference: Standard Clause Patterns\n\n${clausePatterns}`;
    case 'explain':
      return `${systemPrompt}\n\n# Reference: Legal Terminology\n\n${terminology}`;
    case 'edit':
      return `${systemPrompt}\n\n${EDIT_INSTRUCTIONS}\n\n# Reference: Standard Clause Patterns\n\n${clausePatterns}`;
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
