# SignCraft — Open-Source AI Contract Review & E-Signature Platform

> The free, open-source alternative to DocuSign, Adobe Sign, and PandaDoc —
> with AI-powered contract analysis built in.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Steviewonders99/signcraft)

## Why SignCraft?

Most e-signature tools just collect signatures. SignCraft **reviews your contracts before you sign them**.

- **AI Contract Review** — Clause-by-clause risk analysis with green/yellow/red flags
- **AI Drafting** — Generate NDAs, SaaS agreements, employment contracts, and 6+ contract types from a prompt
- **E-Signatures** — Send, sign, and countersign with full audit trail and legal compliance
- **9 Legal Templates** — NDA, SAFE, SaaS Terms, IP Assignment, Consulting Agreement, and more
- **Embeddable Signing** — Drop a signing widget into any website or pitch deck
- **100% Self-Hostable** — Your contracts never leave your server
- **No Vendor Lock-in** — MIT license, works with any LLM via OpenRouter

## Comparison

| Feature | SignCraft | DocuSign | Adobe Sign | PandaDoc |
|---------|-----------|----------|------------|----------|
| E-Signatures | Yes | Yes | Yes | Yes |
| AI Contract Review | Yes | No | No | No |
| AI Clause Drafting | Yes | No | No | No |
| Self-Hosted | Yes | No | No | No |
| Open Source | Yes | No | No | No |
| Embeddable Widget | Yes | No | No | No |
| Free | Yes | $10-60/mo | $15-30/mo | $19-65/mo |

## Features

### AI-Powered Contract Drafting
Describe what you need in plain English and SignCraft generates a complete, legally-structured contract. Choose from templates or start from scratch.

### Intelligent Contract Review
Before you sign, SignCraft's AI analyzes every clause and flags potential risks:
- **Green** — Standard, fair terms
- **Yellow** — Clauses that need attention
- **Red** — Potentially unfavorable or risky terms

### Full E-Signature Workflow
1. Draft or upload a contract
2. Pre-sign as sender (optional)
3. Send to recipient via email
4. Recipient reviews, signs electronically
5. Countersign if needed
6. Both parties receive executed copies

### Legal Templates
Built-in templates for common agreements:
- Non-Disclosure Agreement (NDA)
- SAFE (Simple Agreement for Future Equity)
- SaaS Terms of Service
- Consulting Agreement
- Employment Agreement
- IP Assignment
- Freelance Contract
- Partnership Agreement
- Lease Agreement

### Audit Trail
Every action is logged with timestamps, IP addresses, and user agents — meeting ESIGN Act and UETA compliance requirements.

### Embeddable Signing
Embed a signing experience directly into your website, pitch deck, or application with a single URL.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Editor:** TipTap (rich text)
- **Database:** Supabase (PostgreSQL + Auth)
- **AI:** OpenRouter (compatible with GPT-4, Claude, Gemini, and more)
- **PDF:** react-pdf/renderer
- **Email:** Nodemailer (Gmail SMTP or any SMTP provider)
- **SMS:** Twilio (optional)
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

## Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenRouter](https://openrouter.ai) API key

### 1. Clone and install

```bash
git clone https://github.com/Steviewonders99/signcraft.git
cd signcraft
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI (OpenRouter — works with any model)
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=google/gemini-2.5-flash

# Email (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

Run the Supabase migrations:

```bash
npx supabase db push
```

Or manually run the SQL files in `supabase/migrations/` in your Supabase SQL editor.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Steviewonders99/signcraft)

1. Click the button above or run:
   ```bash
   vercel --prod
   ```
2. Add your environment variables in the Vercel dashboard
3. Add your Vercel URL to Supabase Auth redirect URLs

### Self-Hosted

SignCraft is a standard Next.js application. Deploy it anywhere that runs Node.js:

```bash
npm run build
npm start
```

## Email Setup

SignCraft uses Gmail SMTP by default. To set it up:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Generate an [App Password](https://myaccount.google.com/apppasswords)
4. Add the credentials to your `.env.local`

You can also use any SMTP provider by modifying `src/lib/mailer.ts`.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE) for details.

Unlike most e-signature platforms that use AGPL (which restricts commercial use), SignCraft uses the MIT license. Use it however you want — commercial, personal, modified, redistributed. No restrictions.

## Alternatives

Looking for comparisons? See how SignCraft stacks up:

- [SignCraft vs DocuSign](comparisons/vs-docusign.md)
- [SignCraft vs Adobe Sign](comparisons/vs-adobe-sign.md)
- [SignCraft vs PandaDoc](comparisons/vs-pandadoc.md)
- [SignCraft vs Documenso](comparisons/vs-documenso.md)

---

Built with AI by [Steven Junop](https://github.com/Steviewonders99)
