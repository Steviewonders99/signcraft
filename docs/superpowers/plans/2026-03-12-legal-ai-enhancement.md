# Legal AI Enhancement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade SignCraft's AI assistant with curated legal knowledge, add review/explain modes, and provide pre-built contract templates.

**Architecture:** Three independent components: (1) Static legal knowledge files bundled in the repo, (2) Enhanced AI API with mode-based system prompt composition, (3) Template picker UI on the new-document page. No new infrastructure — just files, updated API logic, and UI.

**Tech Stack:** Next.js 16, OpenRouter API, TipTap editor, gray-matter (new dep), static markdown files.

**Spec:** `docs/superpowers/specs/2026-03-12-legal-ai-enhancement-design.md`

---

## Chunk 1: Legal Knowledge Bundle + Dependencies

### Task 1: Install gray-matter dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install gray-matter**

```bash
cd /Users/stevenjunop/signcraft && npm install gray-matter
```

- [ ] **Step 2: Verify installation**

```bash
cd /Users/stevenjunop/signcraft && node -e "require('gray-matter'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Add OPENROUTER_MODEL to .env.local**

Append to `/Users/stevenjunop/signcraft/.env.local`:
```
OPENROUTER_MODEL=google/gemini-2.5-flash
```

This makes the model configurable. Gemini 2.5 Flash is capable, fast, and affordable via OpenRouter.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add gray-matter dependency and OPENROUTER_MODEL env var"
```

Note: Do NOT commit `.env.local` — it is gitignored and contains secrets. The OPENROUTER_MODEL env var is only added to the local file.

---

### Task 2: Create system-prompt.md

**Files:**
- Create: `src/data/legal/system-prompt.md`

- [ ] **Step 1: Create the legal knowledge directory**

```bash
mkdir -p /Users/stevenjunop/signcraft/src/data/legal/templates
```

- [ ] **Step 2: Write system-prompt.md**

Create `src/data/legal/system-prompt.md` with the following content (this is the master AI persona and rules — ~1,500 tokens):

```markdown
You are an experienced commercial attorney and contract drafting assistant. You produce legally precise, enforceable contract language in modern plain English.

## Drafting Rules

1. **Defined Terms**: Capitalize defined terms and introduce them with quotes on first use (e.g., "Company" means Acme Corp., a Delaware corporation).
2. **Precision**: Avoid vague terms like "reasonable," "timely," or "appropriate" without qualification. Specify time periods, dollar amounts, and measurable standards.
3. **Active Voice**: Use active voice. Write "Party A shall deliver" not "Delivery shall be made by Party A."
4. **Numbered Sections**: Number all sections and subsections (1, 1.1, 1.1.1).
5. **No Archaic Legalese**: Never use "witnesseth," "hereby," "hereinafter," "whereas" (in the archaic sense), "party of the first part," or similar outdated language. Write in modern professional English.
6. **Complete Clauses**: Every clause must be self-contained and enforceable on its own. Do not use "as described above" or "subject to the foregoing" without specific section references.
7. **Consistent Terminology**: Use the same term for the same concept throughout. Do not alternate between "terminate" and "cancel" or "agreement" and "contract."

## Contract Structure

When drafting a full contract, include these sections in order:
1. **Title and Parties** — full legal names, entity types, and addresses
2. **Recitals** — background context (use "Background" not "Whereas")
3. **Definitions** — all defined terms in alphabetical order
4. **Operative Provisions** — the core obligations and rights
5. **Representations and Warranties** — where applicable
6. **Term and Termination** — duration, renewal, termination triggers, and effect of termination
7. **General Provisions** — governing law, dispute resolution, assignment, notices, amendments, waiver, severability, entire agreement, counterparts

## Review Mode

When asked to review a contract, analyze each clause and flag it:
- **GREEN**: Standard, balanced, no issues
- **YELLOW**: Acceptable but could be improved — provide suggested improved language
- **RED**: Risky, missing, or one-sided — provide recommended replacement language

Always check for: missing limitation of liability, one-sided indemnification, overly broad non-competes, missing termination rights, vague payment terms, and absent governing law.

When reviewing, respond in JSON format:
{
  "sections": [
    {
      "name": "Section name and number",
      "flag": "green" | "yellow" | "red",
      "assessment": "Brief explanation",
      "suggestion": "Replacement language (for yellow/red only)"
    }
  ],
  "summary": "Overall summary with counts"
}

## Explain Mode

When asked to explain a legal term or concept, provide:
1. A plain-English definition (1-2 sentences)
2. Why it matters in contracts (1-2 sentences)
3. A brief example of how it appears in practice
```

- [ ] **Step 3: Commit**

```bash
git add src/data/legal/system-prompt.md
git commit -m "feat: add legal AI system prompt"
```

---

### Task 3: Create clause-patterns.md

**Files:**
- Create: `src/data/legal/clause-patterns.md`

- [ ] **Step 1: Write clause-patterns.md**

Create `src/data/legal/clause-patterns.md` with standard clause patterns. Each clause type gets: name, when to use, standard language (~1 paragraph), and common variations note. Target ~4,000 tokens total.

```markdown
# Standard Clause Patterns

## Indemnification (Mutual)

**Use when:** Both parties need protection from third-party claims arising from the other's breach.

**Standard language:**
Each Party (the "Indemnifying Party") shall indemnify, defend, and hold harmless the other Party and its officers, directors, employees, and agents (collectively, the "Indemnified Parties") from and against any third-party claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) the Indemnifying Party's breach of any representation, warranty, or obligation under this Agreement; or (b) the Indemnifying Party's gross negligence or willful misconduct.

**Variations:** One-way indemnification (only one party indemnifies). Carve-outs for IP infringement. Cap on indemnification tied to limitation of liability.

## Limitation of Liability

**Use when:** Contracts involving services, software, or any scenario where uncapped liability is disproportionate to the contract value.

**Standard language:**
EXCEPT FOR OBLIGATIONS UNDER SECTION [INDEMNIFICATION] AND BREACHES OF SECTION [CONFIDENTIALITY], NEITHER PARTY SHALL BE LIABLE TO THE OTHER FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, REGARDLESS OF THE CAUSE OF ACTION OR THEORY OF LIABILITY. EACH PARTY'S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE AMOUNTS PAID OR PAYABLE BY [CLIENT] TO [PROVIDER] DURING THE TWELVE (12) MONTH PERIOD PRECEDING THE CLAIM.

**Variations:** Cap tied to specific dollar amount. Mutual vs. one-way cap. Carve-outs for data breach, IP infringement, or willful misconduct.

## Confidentiality / Non-Disclosure

**Use when:** Parties will exchange proprietary or sensitive information.

**Standard language:**
"Confidential Information" means any non-public information disclosed by one Party (the "Disclosing Party") to the other Party (the "Receiving Party"), whether orally, in writing, or electronically, that is designated as confidential or that a reasonable person would understand to be confidential given the nature of the information and circumstances of disclosure. The Receiving Party shall: (a) use Confidential Information solely for the purposes of this Agreement; (b) protect Confidential Information using at least the same degree of care it uses for its own confidential information, but no less than reasonable care; and (c) not disclose Confidential Information to any third party except to its employees, contractors, and advisors who have a need to know and are bound by confidentiality obligations at least as protective as those herein. Confidential Information excludes information that: (i) is or becomes publicly available through no fault of the Receiving Party; (ii) was known to the Receiving Party before disclosure; (iii) is independently developed by the Receiving Party; or (iv) is rightfully received from a third party without restriction.

**Variations:** Term of confidentiality (2-5 years typical). Return/destruction of materials. Compelled disclosure carve-out for legal process.

## Intellectual Property Ownership

**Use when:** One party creates work product, software, or creative works for the other.

**Standard language:**
All work product, inventions, deliverables, and materials created by Provider in the performance of this Agreement ("Work Product") shall be the sole and exclusive property of Client. Provider hereby assigns to Client all right, title, and interest in and to the Work Product, including all intellectual property rights therein. Provider shall execute any documents and take any actions reasonably necessary to perfect Client's ownership. Provider retains ownership of any pre-existing intellectual property ("Provider IP") and grants Client a non-exclusive, perpetual, royalty-free license to use Provider IP solely as incorporated in the Work Product.

**Variations:** Joint ownership. License-back to provider. Open-source carve-outs.

## Termination

**Use when:** Every contract needs termination provisions.

**Standard language:**
Either Party may terminate this Agreement: (a) for convenience upon thirty (30) days' prior written notice; or (b) for cause if the other Party materially breaches this Agreement and fails to cure such breach within fifteen (15) days after receiving written notice thereof. Upon termination: (i) all licenses granted herein shall immediately terminate (except as expressly stated to survive); (ii) each Party shall return or destroy the other Party's Confidential Information; and (iii) Client shall pay Provider for all services performed through the effective date of termination.

**Variations:** Termination for insolvency. Automatic renewal with opt-out. Survival clauses for indemnification, confidentiality, and limitation of liability.

## Force Majeure

**Use when:** Contracts where performance could be disrupted by events beyond the parties' control.

**Standard language:**
Neither Party shall be liable for any failure or delay in performing its obligations under this Agreement to the extent such failure or delay results from circumstances beyond the Party's reasonable control, including natural disasters, war, terrorism, pandemics, government actions, labor disputes, or infrastructure failures ("Force Majeure Event"). The affected Party shall provide prompt written notice and use commercially reasonable efforts to mitigate the impact. If a Force Majeure Event continues for more than ninety (90) days, either Party may terminate this Agreement upon written notice.

**Variations:** Enumerated vs. catch-all events. No termination right (only suspension). Financial obligations excluded from force majeure.

## Non-Compete / Non-Solicitation

**Use when:** Employment agreements, acquisition agreements, or partnerships where competitive restrictions are needed.

**Standard language:**
During the Term and for a period of twelve (12) months following termination (the "Restricted Period"), [Party] shall not, directly or indirectly: (a) engage in, own, manage, or participate in any business that competes with [Company]'s business within [geographic area]; or (b) solicit, recruit, or hire any employee or contractor of [Company], or induce any such person to terminate their relationship with [Company].

**Variations:** Narrower geographic/industry scope for enforceability. Non-solicitation only (no non-compete). Customer non-solicitation. Garden leave provisions.

## Payment Terms

**Use when:** Any contract involving compensation.

**Standard language:**
Client shall pay Provider the fees set forth in Exhibit A. Invoices are due and payable within thirty (30) days of receipt ("Payment Terms"). Late payments shall accrue interest at the lesser of 1.5% per month or the maximum rate permitted by law. If any invoice is disputed in good faith, Client shall pay the undisputed portion and provide written notice of the disputed amount within the Payment Terms. The Parties shall use commercially reasonable efforts to resolve any dispute within thirty (30) days.

**Variations:** Net 15, Net 45, Net 60. Milestone-based payments. Subscription/recurring billing. Expense reimbursement terms.

## Representations and Warranties

**Use when:** Parties need assurance about each other's status, authority, and capabilities.

**Standard language:**
Each Party represents and warrants that: (a) it is duly organized, validly existing, and in good standing under the laws of its jurisdiction of formation; (b) it has full power and authority to enter into and perform this Agreement; (c) the execution and performance of this Agreement does not conflict with any other agreement to which it is a party; and (d) it shall comply with all applicable laws, rules, and regulations in its performance under this Agreement.

**Variations:** Service-specific warranties (e.g., "Services shall be performed in a professional and workmanlike manner"). Software warranties (functionality, non-infringement). Disclaimer of implied warranties (AS-IS).

## Governing Law and Dispute Resolution

**Use when:** Every contract needs a governing law clause. Dispute resolution method depends on preference.

**Standard language (Litigation):**
This Agreement shall be governed by and construed in accordance with the laws of the State of [State], without regard to its conflict of laws provisions. Any dispute arising under this Agreement shall be resolved exclusively in the state or federal courts located in [County], [State], and each Party irrevocably consents to the jurisdiction of such courts.

**Standard language (Arbitration):**
Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration administered by the American Arbitration Association ("AAA") under its Commercial Arbitration Rules. The arbitration shall be conducted by a single arbitrator in [City], [State]. The arbitrator's decision shall be final and binding, and judgment may be entered in any court of competent jurisdiction.

**Variations:** Mediation-first requirement. Arbitration for amounts over threshold, small claims court below. International arbitration (ICC, LCIA). Fee-shifting to prevailing party.

## Assignment

**Use when:** Every commercial contract.

**Standard language:**
Neither Party may assign or transfer this Agreement or any of its rights or obligations hereunder without the prior written consent of the other Party, except that either Party may assign this Agreement without consent to an affiliate or in connection with a merger, acquisition, or sale of all or substantially all of its assets. Any purported assignment in violation of this Section shall be void.

## Notices

**Use when:** Every commercial contract.

**Standard language:**
All notices under this Agreement shall be in writing and shall be deemed given when: (a) delivered personally; (b) sent by confirmed email; or (c) sent by nationally recognized overnight courier, addressed to the Party at the address set forth in this Agreement or such other address as the Party may designate by written notice.

## Severability

**Use when:** Every contract.

**Standard language:**
If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The Parties shall negotiate in good faith to replace any invalid provision with a valid provision that achieves the original intent to the greatest extent permitted by law.

## Entire Agreement

**Use when:** Every contract.

**Standard language:**
This Agreement, together with all exhibits and schedules attached hereto, constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written. No amendment or modification of this Agreement shall be effective unless made in writing and signed by both Parties.

## Waiver

**Use when:** Every commercial contract.

**Standard language:**
The failure of either Party to enforce any provision of this Agreement shall not constitute a waiver of such Party's right to enforce that provision or any other provision in the future. All waivers must be in writing and signed by the waiving Party.
```

- [ ] **Step 2: Commit**

```bash
git add src/data/legal/clause-patterns.md
git commit -m "feat: add standard clause patterns for AI context"
```

---

### Task 4: Create terminology.md

**Files:**
- Create: `src/data/legal/terminology.md`

- [ ] **Step 1: Write terminology.md**

Create `src/data/legal/terminology.md` with ~60 essential contract terms (originally authored, using public domain references). Each term has a definition and a correct usage note. Target ~2,000 tokens.

```markdown
# Legal Contract Terminology

**Indemnification**: An obligation by one party to compensate the other for losses or damages arising from specified events. Often mutual in commercial contracts.

**Limitation of Liability**: A contractual cap on the maximum amount of damages one party can recover from the other. Typically expressed as a multiple of fees paid.

**Consequential Damages**: Indirect losses that result from a breach but are not the immediate result (e.g., lost profits, lost business opportunities). Often excluded by contract.

**Liquidated Damages**: A pre-agreed amount of damages payable upon breach, used when actual damages would be difficult to calculate. Must be a reasonable estimate, not a penalty.

**Force Majeure**: Events beyond a party's reasonable control that excuse or delay performance (e.g., natural disasters, war, pandemics). Must be specifically invoked.

**Material Breach**: A breach significant enough to undermine the purpose of the contract and justify termination. Distinguished from minor or immaterial breaches.

**Cure Period**: A specified window of time after notice of breach during which the breaching party may remedy the breach before the other party can terminate.

**Representations and Warranties**: Statements of fact (representations) and promises about the truth of facts (warranties) made by each party. Breach can trigger indemnification.

**Covenant**: A binding promise to do or refrain from doing something. Distinguished from representations (which are about current facts) by being forward-looking obligations.

**Severability**: A provision ensuring that if one part of the contract is found unenforceable, the rest remains in effect.

**Governing Law**: The jurisdiction whose laws will be used to interpret the contract. Does not necessarily determine where disputes are litigated.

**Jurisdiction**: The court or arbitral body authorized to hear disputes arising under the contract.

**Venue**: The specific geographic location where disputes will be heard.

**Arbitration**: A private dispute resolution process where an arbitrator (not a judge) renders a binding decision. Faster and more private than litigation.

**Mediation**: A non-binding dispute resolution process where a neutral mediator helps parties reach a voluntary settlement.

**Assignment**: Transfer of rights or obligations under a contract to a third party. Often restricted without consent.

**Novation**: Replacement of one party to a contract with a new party, with the consent of all parties. Differs from assignment because the original party is fully released.

**Privity**: The legal relationship between parties to a contract. Generally, only parties to a contract can enforce it.

**Consideration**: Something of value exchanged between parties that makes a contract binding. Can be money, services, promises, or forbearance.

**Breach**: Failure to perform any obligation under the contract without legal excuse.

**Waiver**: Voluntary relinquishment of a known right. A waiver of one breach does not waive future breaches of the same provision.

**Estoppel**: A legal principle preventing a party from asserting a right or position that contradicts their prior conduct or statements.

**Good Faith**: An implied obligation to deal honestly and fairly. In some jurisdictions, implied in every contract.

**Commercially Reasonable Efforts**: An obligation to take steps that a reasonable business person would take, considering cost, risk, and the importance of the obligation.

**Best Efforts**: A higher standard than commercially reasonable efforts, requiring a party to do everything in its power to fulfill an obligation.

**Confidential Information**: Non-public information exchanged between parties that must be protected from disclosure. Defined by contract, not by law.

**Trade Secret**: Information that derives economic value from not being publicly known and is subject to reasonable efforts to maintain its secrecy.

**Intellectual Property (IP)**: Legal rights to creations of the mind — patents, copyrights, trademarks, and trade secrets.

**Work Product**: Materials, inventions, or deliverables created in the course of performing a contract. Ownership is determined by the contract terms.

**Work for Hire**: Under U.S. copyright law, work created by an employee within the scope of employment, or certain commissioned works where the parties agree in writing. Ownership vests in the hiring party.

**License**: Permission to use intellectual property under specified conditions. Does not transfer ownership.

**Non-Compete**: A restrictive covenant preventing a party from competing with the other within a defined scope, geography, and time period.

**Non-Solicitation**: A restrictive covenant preventing a party from recruiting or soliciting the other party's employees, contractors, or customers.

**Non-Disclosure Agreement (NDA)**: A contract establishing confidentiality obligations between parties. Can be mutual or one-way.

**Term**: The duration of the contract. Can be fixed (e.g., 12 months) or indefinite (until terminated).

**Renewal**: Extension of the contract beyond its initial term. Can be automatic or by mutual agreement.

**Exhibit / Schedule**: An attachment to a contract that is incorporated by reference. Often used for pricing, specifications, or service descriptions.

**Amendment**: A formal written change to the terms of an existing contract, signed by both parties.

**Counterpart**: A duplicate original of a contract. Contracts may be executed in counterparts, each of which is an original, and all of which together constitute one agreement.

**Execution**: The act of signing a contract, making it legally binding.

**Effective Date**: The date on which the contract becomes operative. May differ from the execution date.

**Survival**: Provisions that continue to apply after the contract terminates (e.g., confidentiality, indemnification, limitation of liability).

**Injunctive Relief**: A court order requiring a party to do or refrain from doing something. Often sought for breach of confidentiality or non-compete obligations.

**Specific Performance**: A court order requiring a party to fulfill its contractual obligations. Available when monetary damages would be inadequate.

**Damages**: Monetary compensation for loss or injury caused by breach of contract.

**SLA (Service Level Agreement)**: A commitment to specific performance standards (e.g., 99.9% uptime). Often includes remedies (credits) for failure to meet standards.

**SOW (Statement of Work)**: A document defining the specific tasks, deliverables, timeline, and fees for a project within a broader services agreement.

**MSA (Master Service Agreement)**: A framework agreement establishing general terms that govern multiple future transactions or projects.

**DPA (Data Processing Agreement)**: An agreement governing how personal data is processed, required under GDPR and similar privacy regulations.

**SAFE (Simple Agreement for Future Equity)**: A startup funding instrument where an investor provides capital in exchange for the right to receive equity in a future financing round.
```

- [ ] **Step 2: Commit**

```bash
git add src/data/legal/terminology.md
git commit -m "feat: add legal terminology glossary for AI context"
```

---

### Task 5: Create contract templates

**Files:**
- Create: `src/data/legal/templates/mutual-nda.md`
- Create: `src/data/legal/templates/saas-terms.md`
- Create: `src/data/legal/templates/consulting-agreement.md`
- Create: `src/data/legal/templates/employment-agreement.md`
- Create: `src/data/legal/templates/advisor-agreement.md`
- Create: `src/data/legal/templates/ip-assignment.md`
- Create: `src/data/legal/templates/safe-note.md`
- Create: `src/data/legal/templates/service-agreement.md`
- Create: `src/data/legal/templates/freelancer-contract.md`

Each template follows this structure:
1. YAML frontmatter with name, category, description, source, and variables array
2. Full contract text in markdown with `{{Variable Name}}` placeholders

- [ ] **Step 1: Create mutual-nda.md**

Create `src/data/legal/templates/mutual-nda.md`:

```markdown
---
name: Mutual Non-Disclosure Agreement
category: General Business
description: Standard mutual NDA for sharing confidential information between two parties
source: Inspired by Bonterms Mutual NDA (CC BY 4.0)
variables:
  - Party A Name
  - Party A Address
  - Party B Name
  - Party B Address
  - Effective Date
  - Term Months
  - Governing Law State
---

# MUTUAL NON-DISCLOSURE AGREEMENT

**Effective Date:** {{Effective Date}}

This Mutual Non-Disclosure Agreement ("Agreement") is entered into by and between:

**{{Party A Name}}**, with its principal place of business at {{Party A Address}} ("Party A"), and

**{{Party B Name}}**, with its principal place of business at {{Party B Address}} ("Party B").

Party A and Party B are each referred to herein as a "Party" and collectively as the "Parties."

## 1. Purpose

The Parties wish to explore a potential business relationship (the "Purpose") and, in connection therewith, may disclose to each other certain confidential and proprietary information.

## 2. Definitions

"Confidential Information" means any non-public information disclosed by one Party (the "Disclosing Party") to the other Party (the "Receiving Party"), whether orally, in writing, electronically, or by inspection, that is designated as confidential or that a reasonable person would understand to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information includes, without limitation, business plans, financial data, technical specifications, customer lists, product roadmaps, and trade secrets.

## 3. Exclusions

Confidential Information does not include information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was known to the Receiving Party prior to disclosure, as demonstrated by written records; (c) is independently developed by the Receiving Party without use of or reference to the Disclosing Party's Confidential Information; or (d) is rightfully received from a third party without restriction on disclosure.

## 4. Obligations

The Receiving Party shall: (a) use the Confidential Information solely for the Purpose; (b) protect the Confidential Information using at least the same degree of care it uses for its own confidential information, but no less than reasonable care; (c) limit disclosure of Confidential Information to its employees, contractors, and advisors who have a need to know and are bound by confidentiality obligations at least as protective as those in this Agreement; and (d) promptly notify the Disclosing Party upon discovery of any unauthorized use or disclosure.

## 5. Compelled Disclosure

If the Receiving Party is compelled by law, regulation, or legal process to disclose Confidential Information, it shall: (a) provide the Disclosing Party with prompt written notice, to the extent legally permitted; (b) cooperate with the Disclosing Party's efforts to obtain a protective order; and (c) disclose only the minimum amount of Confidential Information required.

## 6. Term and Termination

This Agreement shall remain in effect for {{Term Months}} months from the Effective Date, unless earlier terminated by either Party upon thirty (30) days' written notice. The obligations of confidentiality shall survive termination and continue for a period of two (2) years from the date of disclosure.

## 7. Return of Materials

Upon termination of this Agreement or upon request by the Disclosing Party, the Receiving Party shall promptly return or destroy all Confidential Information and any copies thereof, and shall certify such return or destruction in writing upon request.

## 8. No License

Nothing in this Agreement grants either Party any rights to the other Party's Confidential Information except as expressly set forth herein. No license, express or implied, is granted under any patent, copyright, trademark, or trade secret.

## 9. Remedies

Each Party acknowledges that unauthorized disclosure of Confidential Information may cause irreparable harm for which monetary damages would be inadequate. Accordingly, either Party may seek injunctive or other equitable relief in addition to any other remedies available at law.

## 10. General Provisions

**Governing Law.** This Agreement shall be governed by the laws of the State of {{Governing Law State}}, without regard to conflict of laws principles.

**Entire Agreement.** This Agreement constitutes the entire agreement between the Parties regarding the subject matter hereof and supersedes all prior agreements and understandings.

**Amendment.** This Agreement may be amended only by a written instrument signed by both Parties.

**Assignment.** Neither Party may assign this Agreement without the prior written consent of the other Party.

**Counterparts.** This Agreement may be executed in counterparts, each of which shall be deemed an original.

---

**{{Party A Name}}**

Signature: ___________________________
Name: ___________________________
Title: ___________________________
Date: ___________________________

**{{Party B Name}}**

Signature: ___________________________
Name: ___________________________
Title: ___________________________
Date: ___________________________
```

- [ ] **Step 2: Create remaining 8 templates**

Create each of the following files with the same structure (YAML frontmatter + full contract markdown with `{{Variable}}` placeholders). Each template should be a complete, enforceable contract following the patterns in clause-patterns.md.

**`src/data/legal/templates/consulting-agreement.md`**
- Frontmatter: name: "Consulting Agreement", category: "General Business", variables: [Client Name, Client Address, Consultant Name, Consultant Address, Effective Date, Scope of Services, Fee Amount, Payment Terms, Term Months, Governing Law State]
- Sections: Parties, Services (reference SOW), Compensation, Term/Termination, IP Ownership (work product to client, consultant retains pre-existing IP with license), Confidentiality, Representations, Independent Contractor status, Limitation of Liability, General Provisions, Signatures

**`src/data/legal/templates/freelancer-contract.md`**
- Frontmatter: name: "Freelancer Contract", category: "General Business", variables: [Client Name, Freelancer Name, Project Description, Deliverables, Fee Amount, Payment Schedule, Deadline, Governing Law State]
- Sections: Parties, Project Scope, Deliverables, Compensation, Timeline, Revisions, IP Assignment, Confidentiality, Termination, Independent Contractor, Limitation of Liability, General Provisions, Signatures

**`src/data/legal/templates/service-agreement.md`**
- Frontmatter: name: "Service Agreement", category: "General Business", variables: [Provider Name, Provider Address, Client Name, Client Address, Effective Date, Service Description, Monthly Fee, Payment Terms, Initial Term Months, Governing Law State]
- Sections: Parties, Services, Service Levels, Fees and Payment, Term and Renewal, Termination, Confidentiality, Limitation of Liability, Indemnification, General Provisions, Signatures

**`src/data/legal/templates/employment-agreement.md`**
- Frontmatter: name: "Employment Agreement", category: "Employment", variables: [Company Name, Company Address, Employee Name, Employee Address, Job Title, Start Date, Annual Salary, Governing Law State]
- Sections: Parties, Position and Duties, Compensation and Benefits, At-Will Employment, Confidentiality, IP Assignment, Non-Solicitation, Termination, General Provisions, Signatures

**`src/data/legal/templates/saas-terms.md`**
- Frontmatter: name: "SaaS Subscription Agreement", category: "SaaS / Tech", variables: [Provider Name, Customer Name, Effective Date, Subscription Fee, Billing Cycle, Initial Term Months, Governing Law State]
- Sections: Definitions, Grant of License, Restrictions, Fees and Payment, Term and Renewal, Termination, Data and Security, Intellectual Property, Confidentiality, Warranties and Disclaimers, Limitation of Liability, Indemnification, General Provisions, Signatures

**`src/data/legal/templates/advisor-agreement.md`**
- Frontmatter: name: "Advisor Agreement", category: "Startup / Fundraising", variables: [Company Name, Advisor Name, Effective Date, Equity Percentage, Vesting Period Months, Governing Law State]
- Sections: Parties, Advisory Services, Compensation (equity with vesting), Term, Confidentiality, IP Assignment, Non-Compete/Non-Solicitation, Termination, General Provisions, Signatures

**`src/data/legal/templates/ip-assignment.md`**
- Frontmatter: name: "Intellectual Property Assignment", category: "Startup / Fundraising", variables: [Assignor Name, Assignee Name, Effective Date, Description of IP, Consideration Amount, Governing Law State]
- Sections: Parties, Assignment of Rights, Consideration, Representations and Warranties, Further Assurances, General Provisions, Signatures

**`src/data/legal/templates/safe-note.md`**
- Frontmatter: name: "SAFE (Simple Agreement for Future Equity)", category: "Startup / Fundraising", variables: [Company Name, Company Address, Investor Name, Investor Address, Purchase Amount, Valuation Cap, Discount Rate Percent, Effective Date, Governing Law State]
- Sections: based on the Y Combinator SAFE structure — Events (Equity Financing, Liquidity Event, Dissolution), Definitions, Company Representations, Investor Representations, Miscellaneous, Signatures

Each template must be a **complete, enforceable contract** with all necessary legal provisions. Use the clause patterns from clause-patterns.md as building blocks. Include proper section numbering, defined terms, and signature blocks.

- [ ] **Step 3: Commit all templates**

```bash
git add src/data/legal/templates/
git commit -m "feat: add 9 built-in contract templates"
```

---

### Task 6: Create ATTRIBUTION.md

**Files:**
- Create: `src/data/legal/ATTRIBUTION.md`

- [ ] **Step 1: Write ATTRIBUTION.md**

Create `src/data/legal/ATTRIBUTION.md`:

```markdown
# Legal Content Attribution

This directory contains legal knowledge and contract templates used by SignCraft's AI assistant.

## Sources and Licenses

### Contract Templates
- **Bonterms** (https://github.com/Bonterms) — CC BY 4.0. Template structures and balanced clause approaches inspired by Bonterms Mutual NDA, Cloud Terms, and related agreements. Attribution: Bonterms, Inc.
- **Papertrail** (https://github.com/papertrail/legal-docs) — CC0 (Public Domain). Employment agreement structure.
- **Open-Source-Law** (https://github.com/ErichDylus/Open-Source-Law) — MIT License. Startup and advisor agreement patterns.
- **CommonAccord** (https://github.com/CommonAccord/Cmacc-Org) — MIT License. Service agreement and IP assignment clause structures.
- **Y Combinator SAFE** — SAFE note structure based on publicly available Y Combinator templates.

### Terminology
- All definitions are originally authored for this project
- Black's Law Dictionary, 2nd Edition (public domain) used as reference material for accuracy

### Clause Patterns
- Originally authored standard clause patterns
- Informed by widely accepted commercial contract practices

## Disclaimer

All legal content is provided for informational purposes only and does not constitute legal advice. All contracts and legal documents should be reviewed by a licensed attorney before execution.
```

- [ ] **Step 2: Commit**

```bash
git add src/data/legal/ATTRIBUTION.md
git commit -m "docs: add legal content attribution"
```

---

## Chunk 2: Enhanced AI Assistant (Backend)

### Task 7: Create legal knowledge loader

**Files:**
- Create: `src/lib/legal-knowledge.ts`

This module reads the static markdown files once and exports them as cached strings for use in the AI prompt assembly.

- [ ] **Step 1: Write src/lib/legal-knowledge.ts**

```typescript
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/stevenjunop/signcraft && npx tsc --noEmit src/lib/legal-knowledge.ts 2>&1 || echo "Check for errors"
```

Note: This may show import errors due to project-wide TS config — that's fine as long as the file structure is correct. The real validation is the build in a later step.

- [ ] **Step 3: Commit**

```bash
git add src/lib/legal-knowledge.ts
git commit -m "feat: add legal knowledge loader with mode-based prompt assembly"
```

---

### Task 8: Update openrouter.ts to support modes

**Files:**
- Modify: `src/lib/openrouter.ts`

Replace the entire file. The new version accepts a mode parameter, uses the legal knowledge loader for system prompt composition, and reads the model from an environment variable.

- [ ] **Step 1: Rewrite src/lib/openrouter.ts**

Replace the contents of `src/lib/openrouter.ts` with:

```typescript
import { getSystemPrompt, getMaxTokens, type AIMode } from './legal-knowledge';

const DEFAULT_MODEL = 'google/gemini-2.5-flash';

export async function queryAI(
  prompt: string,
  context?: string,
  mode: AIMode = 'draft'
): Promise<string> {
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const systemPrompt = getSystemPrompt(mode);
  const maxTokens = getMaxTokens(mode);

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (context) {
    messages.push({
      role: 'user',
      content: `Current document content:\n\n${context}`,
    });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Unable to generate response.';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/openrouter.ts
git commit -m "feat: upgrade openrouter to support modes with legal knowledge injection"
```

---

### Task 9: Update the AI draft API route

**Files:**
- Modify: `src/app/api/ai/draft/route.ts`

Update to accept the `mode` parameter and validate review context length.

- [ ] **Step 1: Rewrite src/app/api/ai/draft/route.ts**

Replace the contents with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { queryAI } from '@/lib/openrouter';
import { validateReviewContext, type AIMode } from '@/lib/legal-knowledge';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, context, mode = 'draft' } = await request.json();
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

  // Validate mode
  const validModes: AIMode[] = ['draft', 'review', 'explain'];
  const aiMode: AIMode = validModes.includes(mode) ? mode : 'draft';

  // Validate review context length
  if (aiMode === 'review' && context) {
    const error = validateReviewContext(context);
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  const response = await queryAI(prompt, context, aiMode);
  return NextResponse.json({ response });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ai/draft/route.ts
git commit -m "feat: add mode parameter to AI draft API route"
```

---

### Task 10: Create built-in templates API routes

**Files:**
- Create: `src/app/api/templates/builtin/route.ts`
- Create: `src/app/api/templates/builtin/[slug]/route.ts`
- Create: `src/lib/template-loader.ts`

- [ ] **Step 1: Write src/lib/template-loader.ts**

This module reads and parses the built-in template files.

```typescript
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const TEMPLATES_DIR = join(process.cwd(), 'src', 'data', 'legal', 'templates');

export interface BuiltinTemplate {
  slug: string;
  name: string;
  category: string;
  description: string;
  source: string;
  variables: string[];
  content: string;
}

let cachedTemplates: BuiltinTemplate[] | null = null;

function loadTemplates(): BuiltinTemplate[] {
  if (cachedTemplates) return cachedTemplates;

  try {
    const files = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.md'));
    cachedTemplates = files.map((file) => {
      const raw = readFileSync(join(TEMPLATES_DIR, file), 'utf-8');
      const { data, content } = matter(raw);
      return {
        slug: file.replace('.md', ''),
        name: data.name || file.replace('.md', ''),
        category: data.category || 'General',
        description: data.description || '',
        source: data.source || '',
        variables: data.variables || [],
        content: content.trim(),
      };
    });
    return cachedTemplates;
  } catch (err) {
    console.error('[template-loader] Failed to load templates:', err);
    return [];
  }
}

export function getAllTemplates(): Omit<BuiltinTemplate, 'content'>[] {
  return loadTemplates().map(({ content, ...meta }) => meta);
}

export function getTemplateBySlug(slug: string): BuiltinTemplate | undefined {
  return loadTemplates().find((t) => t.slug === slug);
}

/**
 * Convert template markdown to HTML with variable substitution.
 * Filled variables become plain text. Unfilled variables become <variable-tag> elements.
 */
export function renderTemplate(
  template: BuiltinTemplate,
  variables: Record<string, string>
): string {
  let html = template.content;

  // Replace filled variables with their values, unfilled with <variable-tag>
  html = html.replace(/\{\{([^}]+)\}\}/g, (_, varName: string) => {
    const trimmed = varName.trim();
    const value = variables[trimmed];
    if (value && value.trim()) {
      return value.trim();
    }
    return `<variable-tag name="${trimmed}"></variable-tag>`;
  });

  // Simple markdown-to-HTML conversion for controlled template content
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Line breaks: convert double newlines to paragraph/list blocks
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      // Don't wrap headings in <p>
      if (trimmed.startsWith('<h')) return trimmed;
      // Don't wrap --- in <p>
      if (trimmed === '---') return '<hr>';
      // Handle unordered lists (lines starting with - )
      const lines = trimmed.split('\n');
      if (lines.every((l) => l.trim().startsWith('- '))) {
        const items = lines.map((l) => `<li>${l.trim().slice(2)}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      // Handle ordered lists (lines starting with 1. 2. etc)
      if (lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
        const items = lines.map((l) => `<li>${l.trim().replace(/^\d+\.\s/, '')}</li>`).join('');
        return `<ol>${items}</ol>`;
      }
      // Handle mixed content with inline list items using (a), (b), (c) pattern
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}
```

- [ ] **Step 2: Write src/app/api/templates/builtin/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { getAllTemplates } from '@/lib/template-loader';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const templates = getAllTemplates();
  return NextResponse.json(templates);
}
```

- [ ] **Step 3: Create the [slug] directory and route**

```bash
mkdir -p /Users/stevenjunop/signcraft/src/app/api/templates/builtin/\[slug\]
```

Write `src/app/api/templates/builtin/[slug]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { getTemplateBySlug, renderTemplate } from '@/lib/template-loader';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const { variables = {} } = await request.json();
  const html = renderTemplate(template, variables);

  return NextResponse.json({ html, template: { ...template, content: undefined } });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/template-loader.ts src/app/api/templates/builtin/
git commit -m "feat: add built-in template loader and API routes"
```

---

## Chunk 3: Enhanced AI Assistant (Frontend)

### Task 11: Update AISidebar with mode switcher and review rendering

**Files:**
- Modify: `src/components/editor/AISidebar.tsx`

- [ ] **Step 1: Rewrite AISidebar.tsx**

Replace the entire contents of `src/components/editor/AISidebar.tsx` with:

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Plus, PenLine, Search, HelpCircle } from 'lucide-react';

type AIMode = 'draft' | 'review' | 'explain';

interface ReviewSection {
  name: string;
  flag: 'green' | 'yellow' | 'red';
  assessment: string;
  suggestion?: string;
}

interface ReviewResponse {
  sections: ReviewSection[];
  summary: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  mode?: AIMode;
  review?: ReviewResponse;
}

const MODE_CONFIG = {
  draft: { label: 'Draft', icon: PenLine },
  review: { label: 'Review', icon: Search },
  explain: { label: 'Explain', icon: HelpCircle },
} as const;

const QUICK_PROMPTS: Record<AIMode, string[]> = {
  draft: ['Draft NDA', 'Draft TOS', 'Payment clause', 'IP clause', 'Termination clause', 'Non-compete'],
  review: ['Review this contract', 'Check for missing clauses', 'Flag risky terms'],
  explain: ['What is indemnification?', 'Explain limitation of liability', 'What is force majeure?'],
};

const FLAG_COLORS = {
  green: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', text: '#22c55e' },
  yellow: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)', text: '#eab308' },
  red: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444' },
};

interface AISidebarProps {
  onInsert: (text: string) => void;
  documentContext?: string;
}

export function AISidebar({ onInsert, documentContext }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AIMode>('draft');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function tryParseReview(content: string): ReviewResponse | null {
    try {
      // Try to extract JSON from the response (LLM might wrap it in markdown code fences)
      const jsonMatch = content.match(/\{[\s\S]*"sections"[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.sections && Array.isArray(parsed.sections)) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  async function handleSend(prompt?: string) {
    const text = prompt || input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text, mode }]);
    setLoading(true);

    const body: Record<string, string> = { prompt: text, mode };
    if (documentContext) {
      body.context = documentContext;
    }

    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error, mode }]);
        setLoading(false);
        return;
      }

      const content = data.response;
      const review = mode === 'review' ? tryParseReview(content) : null;

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content,
        mode,
        review: review || undefined,
      }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to reach AI service. Please try again.', mode }]);
    } finally {
      setLoading(false);
    }
  }

  function renderReview(review: ReviewResponse) {
    return (
      <div className="space-y-2">
        {review.sections.map((section, i) => {
          const colors = FLAG_COLORS[section.flag];
          return (
            <div
              key={i}
              className="rounded-md px-3 py-2 text-xs"
              style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.text }}
                />
                <span className="font-medium" style={{ color: colors.text }}>
                  {section.flag.toUpperCase()}
                </span>
                <span className="text-foreground font-medium">{section.name}</span>
              </div>
              <p className="text-muted-foreground">{section.assessment}</p>
              {section.suggestion && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10">
                  <p className="text-foreground italic">{section.suggestion}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-5 text-[10px] px-1.5"
                    onClick={() => onInsert(section.suggestion!)}
                    style={{ color: 'var(--accent-hex)' }}
                  >
                    <Plus className="w-2.5 h-2.5 mr-0.5" />
                    Insert suggestion
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {review.summary && (
          <p className="text-xs text-muted-foreground mt-2 italic">{review.summary}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-140px)] flex flex-col rounded-lg border border-border"
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      {/* Header with mode switcher */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold">AI</span>
          <span className="text-sm text-muted-foreground">Legal Assistant</span>
        </div>
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--bg-root)' }}>
          {(Object.keys(MODE_CONFIG) as AIMode[]).map((m) => {
            const { label, icon: Icon } = MODE_CONFIG[m];
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={active ? { backgroundColor: 'var(--bg-elevated)' } : undefined}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            {mode === 'draft' && 'Ask me to draft clauses or contract sections.'}
            {mode === 'review' && 'I\'ll review your contract clause by clause.'}
            {mode === 'explain' && 'Ask me about any legal term or concept.'}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
            <div
              className={`inline-block max-w-[90%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-white/5 text-foreground'
                  : 'border-l-2 text-foreground'
              }`}
              style={msg.role === 'assistant' ? { borderLeftColor: 'var(--accent-hex)' } : undefined}
            >
              {msg.review ? (
                renderReview(msg.review)
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && msg.mode !== 'review' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 text-xs"
                      onClick={() => onInsert(msg.content)}
                      style={{ color: 'var(--accent-hex)' }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Insert into editor
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-3">
            <div className="inline-block px-3 py-2 rounded-lg text-sm text-muted-foreground">
              {mode === 'review' ? 'Reviewing contract...' : 'Thinking...'}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
        {QUICK_PROMPTS[mode].map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="shrink-0 px-2.5 py-1 rounded-full text-xs border border-border text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="ai-input flex items-center gap-2 rounded-lg border border-border px-3 py-2 focus-within:ring-1 focus-within:ring-[var(--accent-hex)]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={
              mode === 'draft' ? 'Ask AI to draft...' :
              mode === 'review' ? 'Ask AI to review...' :
              'Ask about a legal term...'
            }
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/AISidebar.tsx
git commit -m "feat: upgrade AISidebar with mode switcher and review rendering"
```

---

### Task 12: Update AIOverlay to support documentContext

**Files:**
- Modify: `src/components/mobile/AIOverlay.tsx`

The AISidebar now accepts `documentContext`. The AIOverlay wraps AISidebar for mobile and needs to forward this prop. Note: `documents/new/page.tsx` is NOT modified here — Task 14 will completely rewrite that file with all needed changes including documentContext.

- [ ] **Step 1: Rewrite AIOverlay.tsx**

Replace the entire contents of `src/components/mobile/AIOverlay.tsx` with:

```tsx
'use client';

import { AISidebar } from '@/components/editor/AISidebar';
import { X } from 'lucide-react';

interface AIOverlayProps {
  open: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
  documentContext?: string;
}

export function AIOverlay({ open, onClose, onInsert, documentContext }: AIOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative rounded-t-2xl overflow-hidden"
        style={{ height: '60vh', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">AI Legal Assistant</span>
          <button onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-[calc(60vh-48px)]">
          <AISidebar onInsert={onInsert} documentContext={documentContext} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mobile/AIOverlay.tsx
git commit -m "feat: update AIOverlay to forward documentContext to AISidebar"
```

---

## Chunk 4: Template Picker UI

### Task 13: Update VariableTag parseHTML

**Files:**
- Modify: `src/components/editor/VariableTag.tsx`

The VariableTag extension already has `parseHTML() { return [{ tag: 'variable-tag' }]; }` — this is already correct per the existing code. No changes needed here. Skip this task.

---

### Task 14: Build the template picker page

**Files:**
- Modify: `src/app/(auth)/documents/new/page.tsx`

The `/documents/new` page currently goes straight to a blank editor. We need to add a template selection step before the editor. The page will have two states: (1) picking a template, (2) editing.

- [ ] **Step 1: Rewrite documents/new/page.tsx**

Replace the entire contents of `src/app/(auth)/documents/new/page.tsx` with:

```tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentEditor } from '@/components/editor/DocumentEditor';
import { AISidebar } from '@/components/editor/AISidebar';
import { AIFab } from '@/components/mobile/AIFab';
import { AIOverlay } from '@/components/mobile/AIOverlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, ArrowLeft, FileText } from 'lucide-react';
import type { JSONContent } from '@tiptap/core';

interface TemplateMeta {
  slug: string;
  name: string;
  category: string;
  description: string;
  variables: string[];
}

const CATEGORIES = ['All', 'SaaS / Tech', 'General Business', 'Employment', 'Startup / Fundraising'];

export default function NewDocumentPage() {
  const [step, setStep] = useState<'pick' | 'variables' | 'edit'>('pick');
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMeta | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [category, setCategory] = useState('All');
  const [title, setTitle] = useState('Untitled Contract');
  const [content, setContent] = useState<JSONContent>({});
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [initialHtml, setInitialHtml] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<Array<{ id: string; name: string; category?: string }>>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/templates/builtin')
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => setTemplates([]));
    // Also fetch user-created templates
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setUserTemplates(Array.isArray(data) ? data : []))
      .catch(() => setUserTemplates([]));
  }, []);

  function extractText(json: JSONContent): string {
    if (!json) return '';
    if (json.text) return json.text;
    if (json.content) return json.content.map(extractText).join('\n');
    return '';
  }

  function handleSelectTemplate(template: TemplateMeta) {
    setSelectedTemplate(template);
    setTitle(template.name);
    // Initialize variable values with empty strings
    const vars: Record<string, string> = {};
    template.variables.forEach((v) => {
      // Pre-fill date variables with today
      if (v.toLowerCase().includes('date')) {
        vars[v] = new Date().toISOString().split('T')[0];
      } else {
        vars[v] = '';
      }
    });
    setVariableValues(vars);
    setStep('variables');
  }

  function handleSelectBlank() {
    setSelectedTemplate(null);
    setTitle('Untitled Contract');
    setContent({});
    setStep('edit');
  }

  async function handleApplyTemplate() {
    if (!selectedTemplate) return;
    setLoadingTemplate(true);

    const res = await fetch(`/api/templates/builtin/${selectedTemplate.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: variableValues }),
    });
    const data = await res.json();

    setInitialHtml(data.html);
    setContent({ type: 'doc', content: [] });
    setLoadingTemplate(false);
    setStep('edit');
  }

  const handleInsertContent = useCallback((text: string) => {
    setContent((prev) => ({
      type: 'doc',
      content: [
        ...(prev.content || []),
        { type: 'paragraph', content: [{ type: 'text', text }] },
      ],
    }));
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    const doc = await res.json();
    setSaving(false);
    router.push(`/documents/${doc.id}`);
  }

  const filtered = category === 'All'
    ? templates
    : templates.filter((t) => t.category === category);

  // Step 1: Template Picker
  if (step === 'pick') {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-1">New Document</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose a template or start from scratch.</p>

        {/* Category filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === c
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={category === c ? { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--accent-hex)' } : { border: '1px solid transparent' }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Blank document card */}
          <button
            onClick={handleSelectBlank}
            className="text-left p-4 rounded-lg border border-dashed border-border hover:border-white/20 transition-colors"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Blank Document</span>
            </div>
            <p className="text-xs text-muted-foreground">Start from scratch</p>
          </button>

          {/* Template cards */}
          {filtered.map((t) => (
            <button
              key={t.slug}
              onClick={() => handleSelectTemplate(t)}
              className="text-left p-4 rounded-lg border border-border hover:border-white/20 transition-colors"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{t.name}</span>
              </div>
              <Badge variant="outline" className="text-[10px] mb-2">{t.category}</Badge>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>

        {/* My Templates */}
        {userTemplates.length > 0 && (
          <>
            <h2 className="text-sm font-semibold mt-8 mb-3">My Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {userTemplates.map((t) => (
                <a
                  key={t.id}
                  href={`/templates/${t.id}/edit`}
                  className="text-left p-4 rounded-lg border border-border hover:border-white/20 transition-colors block"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Custom</Badge>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Step 2: Variable Fill Form
  if (step === 'variables' && selectedTemplate) {
    return (
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => setStep('pick')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to templates
        </button>

        <h1 className="text-xl font-semibold mb-1">{selectedTemplate.name}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Fill in the details below. Empty fields will become editable placeholders in the document.
        </p>

        <div className="space-y-4">
          {selectedTemplate.variables.map((v) => (
            <div key={v}>
              <label className="text-sm font-medium mb-1 block">{v}</label>
              <Input
                value={variableValues[v] || ''}
                onChange={(e) => setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))}
                placeholder={`Enter ${v.toLowerCase()}...`}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={() => setStep('pick')}>
            Back
          </Button>
          <Button onClick={handleApplyTemplate} disabled={loadingTemplate}>
            {loadingTemplate ? 'Applying...' : 'Create Document'}
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Editor (same as before, with AI sidebar)
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 flex-1"
          placeholder="Document title..."
        />
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <DocumentEditor content={content} onChange={setContent} initialHtml={initialHtml} />
        </div>
        <div className="hidden lg:block w-80 shrink-0">
          <AISidebar onInsert={handleInsertContent} documentContext={extractText(content)} />
        </div>
      </div>

      <div className="lg:hidden">
        <AIFab onClick={() => setShowAI(true)} />
        <AIOverlay
          open={showAI}
          onClose={() => setShowAI(false)}
          onInsert={handleInsertContent}
          documentContext={extractText(content)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/documents/new/page.tsx
git commit -m "feat: add template picker with variable fill to new document page"
```

---

### Task 15: Update DocumentEditor to accept initialHtml prop

**Files:**
- Modify: `src/components/editor/DocumentEditor.tsx`

The template picker passes rendered HTML via an `initialHtml` prop. The DocumentEditor needs to load this HTML into TipTap when it becomes available.

- [ ] **Step 1: Update DocumentEditor.tsx**

Add `initialHtml` to the props interface:

```typescript
interface DocumentEditorProps {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  editable?: boolean;
  initialHtml?: string | null;
}
```

Update the component signature:

```typescript
export function DocumentEditor({ content, onChange, editable = true, initialHtml }: DocumentEditorProps) {
```

Add a `useEffect` after the `useEditor` hook that loads initial HTML when provided:

```typescript
useEffect(() => {
  if (editor && initialHtml) {
    editor.commands.setContent(initialHtml);
    onChange(editor.getJSON());
  }
}, [editor, initialHtml]);
```

Note: `onChange` is intentionally excluded from the dependency array — we only want this to run when `editor` or `initialHtml` changes, not on every render. Add an eslint-disable comment if needed:

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

This loads the template HTML into TipTap (which parses HTML including `<variable-tag>` elements via the VariableTag extension's `parseHTML` method), then syncs the result back to the parent as TipTap JSON.

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/DocumentEditor.tsx
git commit -m "feat: load template HTML into TipTap editor on mount"
```

---

### Task 16: Build and verify

**Files:** None (verification only)

- [ ] **Step 1: Run the build**

```bash
cd /Users/stevenjunop/signcraft && npm run build
```

Expected: Build succeeds with no TypeScript errors. There may be Next.js 16 middleware deprecation warnings — those are expected and not blocking.

- [ ] **Step 2: Fix any build errors**

If there are build errors, fix them. Common issues:
- Import paths: ensure all imports use `@/` prefix
- Type errors: ensure `gray-matter` types are compatible (may need `@types/gray-matter` — but gray-matter ships its own types)
- Missing directories: ensure all API route directories exist

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build errors from legal AI enhancement"
```

- [ ] **Step 4: Quick smoke test**

```bash
cd /Users/stevenjunop/signcraft && npm run dev &
sleep 5
# Test built-in templates API
curl -s http://localhost:3000/api/templates/builtin | head -200
# Kill dev server
kill %1
```

Expected: JSON array of 9 templates with name, category, description, variables (no content field in list endpoint).

- [ ] **Step 5: Final commit if needed**

```bash
git add -A
git commit -m "feat: legal AI enhancement complete"
```
