# SignCraft vs Documenso

Both SignCraft and Documenso are **open-source e-signature platforms**. Here's how they differ.

## Feature Comparison

| Feature | SignCraft | Documenso |
|---------|-----------|-----------|
| Electronic Signatures | Yes | Yes |
| AI Contract Review | Yes — clause-by-clause risk analysis | No |
| AI Contract Drafting | Yes — generate contracts from a prompt | No |
| Legal Templates | 9 built-in (NDA, SAFE, SaaS, etc.) | No built-in templates |
| Rich Text Editor | Yes — TipTap-based | No — PDF upload only |
| Embeddable Widget | Yes | Yes |
| License | MIT | AGPL-3.0 |
| Self-Hosted | Yes | Yes |
| Pricing | Free | Free (self-hosted) / $30+/mo (cloud) |

## Why Choose SignCraft Over Documenso?

### 1. AI Contract Intelligence
Documenso is a signing tool. SignCraft is a signing tool **with AI contract review and drafting built in**. Draft contracts from a prompt, then review every clause for risk before sending.

### 2. MIT vs AGPL License
Documenso uses AGPL-3.0, which requires you to open-source any modifications if you deploy them as a service. SignCraft uses MIT — no restrictions on commercial use, modification, or embedding.

### 3. Built-In Editor & Templates
Documenso requires you to upload a pre-made PDF. SignCraft has a rich text editor and 9 legal templates — you can draft, edit, and sign all in one place.

### 4. Legal-First Design
SignCraft was built specifically for legal contracts with features like clause analysis, risk flagging, and legal terminology support. It understands contract structure, not just signature placement.

## When Documenso Might Be Better

- You only need signature collection (no drafting/review)
- You prefer uploading existing PDFs over editing in-browser
- You want a more mature, VC-backed open-source project
- You need their specific integrations (Zapier, webhooks)

## Try SignCraft

```bash
git clone https://github.com/Steviewonders99/signcraft.git
cd signcraft && npm install && npm run dev
```
