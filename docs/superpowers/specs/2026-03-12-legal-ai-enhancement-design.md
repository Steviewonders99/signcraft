# Legal AI Enhancement — Design Spec

## Goal

Upgrade SignCraft's AI drafting assistant from a generic 2-line system prompt to a legally knowledgeable assistant backed by curated open-source legal content, add contract review and explanation modes, and provide pre-built contract templates so users can start from real lawyer-vetted documents instead of blank pages.

## Architecture

Three independent components that enhance the existing system without replacing it:

1. **Legal Knowledge Bundle** — static markdown files bundled in the repo
2. **Enhanced AI Assistant** — upgraded system prompt composition, new modes, better model
3. **Template Picker UI** — template selection when creating new documents

All legal content is static (no database, no embeddings, no vector search). The AI system prompt is assembled server-side from the bundled files based on the request mode.

## Tech Stack

- Existing: Next.js 16, OpenRouter API, TipTap editor, Supabase
- New dependency: `gray-matter` for parsing YAML frontmatter from template markdown files. No other new dependencies.
- Model: Upgrade from `meta-llama/llama-3.1-8b-instruct:free` to a more capable model (e.g. `anthropic/claude-sonnet-4` or `google/gemini-2.5-flash`) for legal accuracy.

---

## Component 1: Legal Knowledge Bundle

### File Structure

```
src/data/legal/
├── system-prompt.md          # Master legal AI system prompt (~3-4K tokens)
├── clause-patterns.md        # Standard clause patterns by type
├── terminology.md            # Key legal terms & correct usage
└── templates/
    ├── mutual-nda.md
    ├── saas-terms.md
    ├── consulting-agreement.md
    ├── employment-agreement.md
    ├── advisor-agreement.md
    ├── ip-assignment.md
    ├── safe-note.md
    ├── service-agreement.md
    └── freelancer-contract.md
```

### system-prompt.md

The master system prompt defines the AI's legal persona and rules. Injected on every request. Contains:

- **Role:** Experienced commercial attorney drafting assistant
- **Writing rules:** Defined terms must be capitalized and introduced with quotes on first use (e.g., "Company" means...). Use precise legal language. Avoid vague terms like "reasonable" without qualification. Include governing law, severability, and entire agreement clauses by default. Use active voice. Number all sections.
- **Drafting standards:** Contracts must include: recitals/whereas clauses, definitions section, operative provisions, representations and warranties (where applicable), termination provisions, general provisions (assignment, notices, amendments, waiver).
- **Review guidelines:** When reviewing contracts, flag each clause as:
  - GREEN — standard, balanced, no issues
  - YELLOW — acceptable but could be improved, with suggested language
  - RED — risky, missing, or one-sided, with recommended replacement language
- **Anti-patterns:** Never use "witnesseth," "hereby," "hereinafter" or other archaic legalese. Write in modern plain English while maintaining legal precision.

### clause-patterns.md

Standard clause patterns organized by type. Each entry has:
- Clause name
- When to use it
- Standard balanced language (1-2 paragraph template)
- Common variations

Clause types covered:
- Indemnification (mutual and one-way)
- Limitation of liability (cap, consequential damages exclusion)
- Confidentiality / Non-disclosure
- Intellectual property ownership and licensing
- Termination (for cause, for convenience, effect of termination)
- Force majeure
- Non-compete / Non-solicitation
- Payment terms (net 30, milestone, subscription)
- Representations and warranties
- Governing law and dispute resolution (arbitration vs. litigation)
- Assignment
- Notices
- Severability
- Entire agreement / Integration
- Amendment / Modification
- Waiver

### terminology.md

Key legal terms with correct definitions and usage notes. Written as original content (not copied from any CC BY-SA source) to avoid copyleft licensing issues. ~100 most commonly used contract terms with:
- Term
- Definition
- Correct usage example
- Common misuse to avoid

Uses LexPredict and Black's Law Dictionary 2nd Ed (public domain) as **reference material** for accuracy, but all definitions are originally authored to keep the project under permissive licensing.

### Templates

Each template file is a complete, lawyer-vetted contract in markdown with variable placeholders using `{{Variable Name}}` syntax. Sourced from:

- **Bonterms** (CC BY 4.0) — Mutual NDA, Cloud/SaaS Terms, SLA
- **Papertrail** (CC0) — Employment agreement
- **Open-Source-Law / Y Combinator** (MIT) — SAFE note, advisor agreement
- **CommonAccord** (MIT) — Service agreement, consulting agreement, IP assignment

Each template file includes frontmatter:
```yaml
---
name: Mutual Non-Disclosure Agreement
category: General Business
description: Standard mutual NDA for sharing confidential information between two parties
source: Bonterms (CC BY 4.0)
variables:
  - Party A Name
  - Party A Address
  - Party B Name
  - Party B Address
  - Effective Date
  - Term (months)
  - Governing Law State
---
```

Contract categories:
- **SaaS / Tech:** SaaS Terms, SLA
- **General Business:** Mutual NDA, Service Agreement, Consulting Agreement, Freelancer Contract
- **Employment:** Employment Agreement
- **Startup / Fundraising:** SAFE Note, Advisor Agreement, IP Assignment

---

## Component 2: Enhanced AI Assistant

### API Route Changes

`/api/ai/draft` route updated to accept a `mode` parameter:

```typescript
interface AIRequest {
  prompt: string;
  context?: string;         // Current document content (existing)
  mode: 'draft' | 'review' | 'explain';  // New
}
```

### System Prompt Composition

The server-side route assembles the system prompt based on mode:

| Mode | Included Knowledge Files |
|------|-------------------------|
| `draft` | system-prompt.md + clause-patterns.md |
| `review` | system-prompt.md + clause-patterns.md (review section emphasized) |
| `explain` | system-prompt.md + terminology.md |

The knowledge files are read once at module load (they're static files) and cached in memory. No filesystem reads per request. If any knowledge file fails to load, log an error and fall back to a minimal default system prompt. The API must not crash.

### Token Budget

Estimated token counts per knowledge file:
- `system-prompt.md`: ~1,500 tokens (role, rules, guidelines)
- `clause-patterns.md`: ~4,000 tokens (16 clause types, kept concise — name + 1 paragraph each)
- `terminology.md`: ~2,000 tokens (100 terms, definition only — no examples in prompt, examples kept in file for reference)

**Per-mode prompt budget:**

| Mode | System Prompt | Knowledge | Document Context | User Message | Total |
|------|--------------|-----------|-----------------|-------------|-------|
| `draft` | 1,500 | 4,000 | 0-2,000 | ~100 | ~7,600 max |
| `review` | 1,500 | 4,000 | 2,000-8,000 | ~100 | ~13,600 max |
| `explain` | 1,500 | 2,000 | 0 | ~100 | ~3,600 max |

**Max tokens per mode (response):**
- `draft`: 4,000
- `review`: 8,000
- `explain`: 1,500

**Document size limit for review mode:** 8,000 tokens (~6,000 words). If the document exceeds this, return an error: "Document too long for full review. Please select a section to review."

These budgets fit comfortably within any modern model's context window (Claude Sonnet: 200K, Gemini Flash: 1M).

### Mode Behavior

**Draft mode** (default, existing behavior enhanced):
- User asks to draft a clause or contract section
- AI responds with ready-to-insert legal text
- Uses clause-patterns.md for standard language patterns

**Review mode** (new):
- User clicks "Review contract" or types "review this contract"
- The current document content is sent as context
- AI performs clause-by-clause analysis
- The AI is instructed to respond in JSON:
  ```json
  {
    "sections": [
      {
        "name": "Indemnification (Section 7)",
        "flag": "red",
        "assessment": "One-sided indemnification favoring only Party A.",
        "suggestion": "Add mutual indemnification: \"Each Party shall indemnify...\""
      }
    ],
    "summary": "3 issues found: 1 red, 2 yellow."
  }
  ```
- The frontend parses this JSON and renders colored badges. If JSON parsing fails (LLM didn't conform), fall back to rendering the raw response as plain text.

**Explain mode** (new):
- User types "What does [term] mean?" in the chat (no editor click interaction — keep it simple)
- AI explains in plain English using terminology.md definitions
- Provides usage context specific to the user's contract type

### Model Selection

Upgrade from `meta-llama/llama-3.1-8b-instruct:free` to a model with stronger legal reasoning. The model is configured as an environment variable `OPENROUTER_MODEL` with a sensible default, so users can change it without code changes.

### Quick Prompts Update

Current quick prompts: `['Draft TOS', 'Payment terms', 'IP clause', 'Termination', 'Non-compete', 'Review gaps']`

Updated to reflect new modes:
```typescript
const QUICK_PROMPTS = [
  { label: 'Draft NDA', mode: 'draft' },
  { label: 'Draft TOS', mode: 'draft' },
  { label: 'Payment clause', mode: 'draft' },
  { label: 'IP clause', mode: 'draft' },
  { label: 'Review contract', mode: 'review' },
  { label: 'Explain term', mode: 'explain' },
];
```

### AISidebar UI Changes

- Add a mode indicator/switcher at the top (3 pill buttons: Draft / Review / Explain)
- Review mode responses render with colored badges (green/yellow/red) instead of plain text
- Quick prompts filter based on active mode

---

## Component 3: Template Picker UI

### User Flow

The template picker is built into the `/documents/new` page itself (not a modal on the documents list). The page now has two steps: pick template, then edit.

1. User clicks "New Document" (existing link navigates to `/documents/new`)
3. User selects a template (or "Blank Document")
4. If template selected: variable fill form appears with fields from the template's frontmatter
5. User fills variables and clicks "Create"
6. Document is created with template content and variables substituted, editor opens

### Template Picker (Step 1 of /documents/new)

- Grid layout of template cards
- Each card shows: template name, category badge, 1-line description
- "Blank Document" card always first (with a + icon)
- Category filter tabs at top: All | SaaS/Tech | General Business | Employment | Startup

### Variable Fill Form

After selecting a template:
- Simple form with labeled inputs for each variable from the template frontmatter
- Pre-filled defaults where sensible (e.g., today's date for Effective Date)
- "Create Document" button at bottom

### Template Loading

Templates are loaded server-side via a new API route:

- `GET /api/templates/builtin` — returns list of all built-in templates (name, category, description, variables)
- `GET /api/templates/builtin/[slug]` — returns full template content with frontmatter parsed

**Markdown-to-TipTap conversion pipeline:**

1. `gray-matter` parses YAML frontmatter, yielding the content string and metadata
2. Regex pre-pass converts `{{Variable Name}}` placeholders to `<variable-tag name="Variable Name"></variable-tag>` HTML elements
3. For filled variables: the regex replaces `{{Variable Name}}` with the user's value directly (plain text)
4. For unfilled variables: the regex produces the `<variable-tag>` HTML element
5. A lightweight markdown-to-HTML conversion using a simple regex-based converter (headings, bold, italic, lists, paragraphs — no full remark/rehype dependency needed since templates are controlled content)
6. TipTap's built-in `editor.commands.setContent(html)` parses the HTML, including `<variable-tag>` elements via the existing `parseHTML` rule in the VariableTag extension

**Note:** The VariableTag extension's `parseHTML` method must be updated to also match `<variable-tag>` elements (currently it only handles the NodeView rendering). Add:
```typescript
parseHTML() {
  return [{ tag: 'variable-tag' }];
}
```

Variable placeholders that the user leaves empty become VariableTag nodes in the editor (interactive, editable). Filled variables become plain text.

### Relationship to Existing Templates

The existing `templates` database table stores user-created templates. Built-in templates are separate (static files). In the picker UI, both appear:
- "Built-in Templates" section (from static files)
- "My Templates" section (from database, if any exist)

---

## What We're NOT Building

- No pgvector / RAG / embeddings
- No fine-tuned models
- No real-time collaboration
- No template marketplace or sharing
- No AI-powered variable extraction from uploaded documents
- No jurisdiction-specific legal databases

## Open Source Attribution

All bundled legal content is from permissively licensed sources:
- Bonterms: CC BY 4.0 (attribution required — include in template footer)
- CommonAccord: MIT
- Papertrail: CC0 (public domain)
- Open-Source-Law: MIT
- Terminology: originally authored (using public domain Black's Law Dictionary 2nd Ed as reference)

No CC BY-SA content is bundled to avoid copyleft obligations on AI-generated output.

An `ATTRIBUTION.md` file in `src/data/legal/` will list all sources and licenses.
