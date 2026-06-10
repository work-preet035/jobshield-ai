# JobShield AI

> A cybersecurity web application that detects recruitment scams, fake recruiters, LinkedIn phishing, and fraudulent job offers — powered by a rule-based threat engine and AI-assisted analysis.

![Threat Scanner](screenshots/scanner.png)

---

## What It Does

Job seekers are a prime target for social engineering attacks. JobShield AI lets you paste any recruiter message, job posting, LinkedIn DM, or suspicious email and get back:

| Output | Description |
|---|---|
| **Risk Score** | 0–100 numeric score based on weighted detection rules |
| **Threat Level** | LOW / MEDIUM / HIGH / CRITICAL classification |
| **Red Flags** | Each detected indicator with severity, category, and matched text |
| **Recommendations** | Concrete actions to take based on the specific threat pattern |
| **AI Explanation** | GPT-powered plain-English explanation of what the threat means and what to do |

---

## Detection Engine

13 rule-based indicators across 6 attack categories:

| Category | Indicators |
|---|---|
| **Financial Fraud** | Payment/fee requests, interview fees, unrealistic salaries |
| **Identity Theft** | SSN requests, bank details, credential harvesting |
| **Social Engineering** | Generic greetings, urgency language, pressure tactics |
| **Phishing Infrastructure** | Free email domains used for corporate recruitment |
| **Off-Platform Communication** | Telegram/WhatsApp recruitment (avoids accountability) |
| **Financial Crime** | Money mule / package reshipping schemes |

Scoring is additive and weighted by severity. Critical indicators (payment requests, credential theft, money mules) carry heavy weights; multiple matches compound. A single critical-severity indicator can push the score to HIGH territory on its own.

---

## Tech Stack

**Frontend**
- React 18 + Vite
- TanStack React Query — data fetching & cache
- shadcn/ui + Tailwind CSS
- Wouter — client-side routing
- date-fns, lucide-react

**Backend**
- Node.js 24 + Express 5
- PostgreSQL + Drizzle ORM
- Zod — input/output validation
- OpenAI API (`gpt-4o-mini`) — streaming AI explanations
- pino — structured JSON logging

**Tooling**
- pnpm workspaces (monorepo)
- Orval — OpenAPI → React Query hooks + Zod schemas codegen
- TypeScript 5 across the full stack

---

## Project Structure

```
jobshield-ai/
├── artifacts/
│   ├── api-server/          # Express 5 backend
│   │   └── src/
│   │       ├── routes/      # analyses, stats, indicators, explain
│   │       └── lib/
│   │           ├── detector.ts    # Rule engine (13 indicators)
│   │           └── indicators.ts  # Indicator registry
│   └── jobshield/           # React + Vite frontend
│       └── src/
│           ├── pages/       # Scanner, Results, History, Dashboard, Indicators
│           └── components/  # ThreatBadge, AIExplanation, Layout
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 contract (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validation schemas
│   └── db/                  # Drizzle ORM schema + client
└── scripts/                 # Utility scripts
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyses` | Submit content for analysis |
| `GET` | `/api/analyses` | List all past analyses |
| `GET` | `/api/analyses/recent` | 5 most recent analyses |
| `GET` | `/api/analyses/:id` | Single analysis detail |
| `DELETE` | `/api/analyses/:id` | Delete an analysis |
| `POST` | `/api/analyses/:id/explain` | Stream AI explanation (SSE) |
| `GET` | `/api/stats` | Aggregate statistics |
| `GET` | `/api/indicators` | All detection rules |
| `GET` | `/api/healthz` | Health check |

---

## Running Locally

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database
- OpenAI API key

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/jobshield-ai.git
cd jobshield-ai

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env: set DATABASE_URL and OPENAI_API_KEY

# Push database schema
pnpm --filter @workspace/db run push

# Start the API server (port 5000)
pnpm --filter @workspace/api-server run dev

# Start the frontend (separate terminal)
pnpm --filter @workspace/jobshield run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI explanations |

---

## Detection Logic

The rule engine (`artifacts/api-server/src/lib/detector.ts`) works as follows:

1. Each of the 13 indicators defines a regex test and a weight (10–45)
2. Input text is matched against all rules simultaneously
3. Matched rules contribute their weight to a raw score
4. Score is capped at 100 and mapped to a threat level:
   - 0–25 → LOW
   - 26–50 → MEDIUM
   - 51–75 → HIGH
   - 76–100 → CRITICAL

Rules are designed to minimize false positives on legitimate job postings. A real recruiter from Acme Corp with a corporate email, a named greeting, and standard language will score near 0.

---

## AI Explanation Feature

When triggered on a result page, the app streams a GPT-4o-mini response via Server-Sent Events. The model receives:
- The risk score and threat level
- All matched red flags with their matched text
- The first 800 characters of the content

The model returns a 2–3 paragraph plain-English analysis explaining what the scammer wants, why the detected patterns are dangerous, and what to do right now.

---

## Roadmap

- [ ] URL reputation check via VirusTotal API
- [ ] Screenshot analysis (upload image of a message)
- [ ] Browser extension for real-time LinkedIn scanning
- [ ] Threat intelligence feed integration
- [ ] Multi-agent investigation workflow (LangGraph)
- [ ] Export reports as PDF

---

## Use Cases

- **Job seekers** verifying suspicious recruiter outreach
- **University career centers** screening job postings before sharing with students
- **Security awareness training** — real examples of recruitment phishing
- **SOC teams** investigating social engineering incidents targeting employees

---

## Ethics

This tool is designed for defensive use only — to protect job seekers from being defrauded. It does not store personally identifiable information, does not share analysis data with third parties, and the AI explanations are generated per-request with no retention.

See [ETHICS.md](ETHICS.md) for the full policy.

---

## License

MIT

---

## Author

Built as a cybersecurity portfolio project demonstrating:
- Real-world threat detection engineering
- Contract-first API design with OpenAPI + codegen
- AI integration for security analysis
- Production-grade monorepo architecture
