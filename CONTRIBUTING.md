# Contributing to SignCraft

Thanks for your interest in contributing to SignCraft! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/signcraft.git`
3. Install dependencies: `npm install`
4. Copy `.env.local.example` to `.env.local` and fill in your credentials
5. Run the dev server: `npm run dev`

## Development Workflow

1. Create a branch from `main`: `git checkout -b feature/your-feature`
2. Make your changes
3. Run the linter: `npm run lint`
4. Test your changes locally
5. Commit with a descriptive message
6. Push and open a Pull Request

## Commit Messages

Use conventional commit format:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `refactor:` — Code refactoring
- `style:` — Formatting, no code change
- `test:` — Adding tests

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Update documentation if needed
- Make sure the build passes

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── (auth)/       # Authenticated pages (dashboard, documents, templates)
│   ├── api/          # API routes (signing, AI, PDF, etc.)
│   ├── sign/         # Public signing page
│   └── embed/        # Embeddable signing widget
├── components/       # React components
│   ├── dashboard/    # Dashboard UI components
│   ├── editor/       # TipTap editor and toolbar
│   ├── layout/       # Shell, sidebar, navigation
│   └── signing/      # Signature pad, contract preview
├── lib/              # Shared utilities
│   ├── supabase-*.ts # Supabase client helpers
│   ├── pdf.ts        # PDF generation
│   ├── mailer.ts     # Email (SMTP)
│   ├── audit.ts      # Audit trail logging
│   └── notifications.ts # Email/SMS notifications
└── types/            # TypeScript types
```

## Areas for Contribution

- **Templates** — Add new legal contract templates
- **AI Prompts** — Improve contract drafting and review prompts
- **Internationalization** — Add support for other languages
- **Integrations** — Add new notification channels or storage providers
- **UI/UX** — Improve the signing experience
- **Documentation** — Improve setup guides and API docs

## Code of Conduct

Be respectful. Be constructive. We're all here to build something useful.

## Questions?

Open an issue or start a discussion. We're happy to help!
