# AI FinOps Copilot

AI FinOps Copilot is a production-minded portfolio MVP that turns cloud billing, utilization, inventory, and optimization signals into prioritized, owner-aware action plans.

AWS tools can identify an underutilized resource. This app adds the action layer: who owns it, why it matters, what it costs, the risk of changing it, a recommended next step, estimated savings, and a ticket-ready work item.

> Read-only MVP: no AWS credentials are required, no cloud APIs are called, and no destructive actions are available.

## What it solves

Cloud cost data is usually fragmented across billing exports, resource tags, CloudWatch, Compute Optimizer, and Trusted Advisor. The expensive part is often not detection—it is deciding what to do, routing the work to the right team, and explaining the trade-off. AI FinOps Copilot combines those signals into one reviewable queue.

### Differentiator from AWS Trusted Advisor

This project does not replace or imitate Trusted Advisor. Trusted Advisor and Compute Optimizer remain useful signal sources. AI FinOps Copilot combines those signals with cost history, utilization, ownership metadata, and deterministic policies, then uses an LLM only for explanation, prioritization, and report drafting.

Calculations and detection stay deterministic and auditable:

- Cost Analyzer aggregates monthly spend and service/team exposure.
- Usage Analyzer evaluates EC2, EBS, RDS, and S3 rules.
- Anomaly Detector compares NAT Gateway month-over-month cost.
- Optimization Recommender assigns severity, risk, savings, owners, and actions.
- Report Generator creates an executive summary and Jira/GitHub-style tickets.
- Groq explains the resulting evidence; it does not calculate the core findings.

## Product surfaces

- Dashboard with spend, savings, finding, anomaly, service-spend, and savings-opportunity views.
- Data workspace with included sample data and optional in-memory CSV/JSON overrides.
- Findings explorer with search and severity, service, and team filters.
- Groq-powered Copilot for grounded FinOps Q&A and ticket drafting.
- Copyable executive report with deterministic output and optional Groq refinement.
- Server routes at `/api/analyze`, `/api/copilot`, and `/api/report`.

## Detection rules

| Finding | Deterministic rule |
| --- | --- |
| Idle EC2 | Average CPU < 5% and maximum CPU < 15% |
| Unattached EBS | Inventory status is `unattached` |
| Over-provisioned RDS | Average CPU < 10% |
| NAT Gateway anomaly | Current-month cost is > 50% above previous month |
| S3 storage opportunity | Storage class is Standard and average object age > 60 days |
| High severity | Monthly savings > $100 or cost spike > 50% |
| Medium severity | Monthly savings from $30 through $100 |
| Low severity | Monthly savings < $30 |

The bundled sample includes 24 resources, five teams, 15 findings, and two month-over-month NAT cost spikes.

## Tech stack

- Next.js 16 App Router and TypeScript
- React 19
- Tailwind CSS 4
- Lucide icons and lightweight SVG/CSS charts
- Groq OpenAI-compatible chat completions API
- Local CSV and JSON sample files
- Vercel-ready Node.js route handlers

No database or paid third-party service is required for the MVP. Groq usage is optional for deterministic analysis and required only for Copilot/refinement features.

## Local setup

Requirements: Node.js 20.9+ and pnpm.

```bash
git clone <your-repository-url>
cd ai-finops-copilot
pnpm install
cp .env.example .env.local
```

Set your Groq values in `.env.local`:

```bash
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Use a Groq model available to your account. Both values remain server-side; do not prefix them with `NEXT_PUBLIC_`.

Start the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

## Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project** and import `ai-finops-copilot`.
3. Keep the detected framework as Next.js and the project root as `.`.
4. Add `GROQ_API_KEY` and `GROQ_MODEL` under **Project Settings → Environment Variables** for Production and Preview.
5. Deploy. Vercel uses `pnpm-lock.yaml` and runs the Next.js production build automatically.

The app needs no AWS credentials, database, Vercel token, or custom build command. Git-connected feature branches receive preview deployments automatically.

## Sample files

The `data/` directory contains:

- `cost_usage.csv`
- `resource_inventory.csv`
- `cloudwatch_metrics.csv`
- `optimizer_recommendations.json`
- `trusted_advisor_findings.json`

Uploaded files must use those exact names and all five must be selected together. Each file is limited to 2 MB and is processed in memory for one request. The built-in sample workflow remains available without uploading files.

## Upload File Requirements

The upload workspace validates file presence, schemas, required values, formats, and related resource IDs in the browser before enabling **Analyze Upload**. CSV column names and JSON field names are case-sensitive and must match the names below.

### cost_usage.csv

Accepted format: CSV with a header row.

Required columns:

- `billing_month`
- `service`
- `resource_id`
- `resource_name`
- `account_id`
- `region`
- `usage_type`
- `usage_amount`
- `usage_unit`
- `current_month_cost_usd`
- `previous_month_cost_usd`
- `team`
- `environment`
- `project`

Purpose:

- Cost analysis
- Service spend reporting
- Monthly cost comparison
- Team and project cost allocation

### resource_inventory.csv

Accepted format: CSV with a header row.

Required columns:

- `resource_id`
- `resource_type`
- `resource_name`
- `status`
- `size_or_class`
- `region`
- `team`
- `environment`
- `project`
- `created_date`
- `production`
- `business_criticality`
- `tags`

Purpose:

- Resource ownership tracking
- Environment classification
- Risk and business context analysis

### cloudwatch_metrics.csv

Accepted format: CSV with a header row.

Required columns:

- `resource_id`
- `metric_start`
- `metric_end`
- `avg_cpu_percent`
- `max_cpu_percent`
- `avg_memory_percent`
- `network_in_gb`
- `network_out_gb`
- `read_iops`
- `write_iops`
- `object_count`
- `avg_object_age_days`

Purpose:

- Idle resource detection
- Rightsizing analysis
- Traffic and utilization analysis
- Storage optimization insights

### optimizer_recommendations.json

Accepted format: a JSON array of recommendation objects.

Expected structure:

```json
[
  {
    "resource_id": "i-ec2-001",
    "service": "EC2",
    "finding": "Over-provisioned",
    "current_type": "m5.xlarge",
    "recommended_type": "t3.medium",
    "estimated_monthly_savings_usd": 82,
    "confidence": "High",
    "reason": "Low CPU usage for 30 days."
  }
]
```

Purpose:

- Rightsizing recommendations
- Estimated savings analysis

### trusted_advisor_findings.json

Accepted format: a JSON array of finding objects.

Expected structure:

```json
[
  {
    "check_id": "TA-001",
    "category": "Cost Optimization",
    "resource_id": "vol-ebs-002",
    "service": "EBS",
    "status": "warning",
    "finding": "Unattached EBS volume",
    "estimated_monthly_savings_usd": 100,
    "recommended_action": "Delete volume if no dependency exists.",
    "risk": "Low",
    "owner": "Analytics"
  }
]
```

Purpose:

- Trusted Advisor-style optimization findings
- Cost-saving opportunities
- Operational recommendations

### Upload validation rules

- All five files must be present and use the exact expected file names.
- CSV files must contain every required column listed above.
- JSON files must parse successfully and contain a top-level array.
- Every JSON object must contain its documented required fields.
- `resource_id` is required and must match `resource_inventory.csv` across related files where applicable.
- `current_month_cost_usd`, `previous_month_cost_usd`, and `estimated_monthly_savings_usd` must be numeric without currency symbols.
- Dates must use `YYYY-MM-DD` and represent real calendar dates.
- `billing_month` must use `YYYY-MM`.
- Optional CloudWatch metric values may be blank or `null`; their columns must still be present.
- Validation errors identify the file, problem, and a suggested correction. Analysis remains disabled until every error is resolved.

## Demo questions

- “Why did my cloud bill increase?”
- “What should I fix first?”
- “Create an action plan for the DataTeam.”
- “Generate Jira tickets for high-priority savings.”
- “Which production change has the highest risk-adjusted savings?”

## Security and safety

- `GROQ_API_KEY` is read only inside server route handlers.
- `.env.local`, `.env`, and Vercel project files are gitignored.
- User questions are length-limited and wrapped in a safety-focused system prompt.
- The LLM is told never to claim it changed AWS resources or created real tickets.
- The MVP is read-only and accepts no AWS credentials.
- Uploaded data is parsed in memory and not stored.

## Screenshots

Create a `docs/screenshots/` directory when you are ready to add portfolio images. Recommended captures:

1. `dashboard.png` — 1440 × 1000, showing KPI cards and both charts.
2. `findings.png` — filterable findings with evidence and recommended actions.
3. `copilot.png` — one completed answer to “What should I fix first?”
4. `report.png` — executive report with ticket-ready action items.

Then embed them near the Product surfaces section with standard Markdown image links. Keep screenshots free of real API keys or customer cost data.

## Resume bullet

> Built a Vercel-ready AI FinOps action layer in Next.js and TypeScript that deterministically analyzes cloud cost, inventory, utilization, and optimization data, prioritizes 15 owner-aware savings findings, and uses Groq to generate grounded action plans and executive reports without exposing credentials or executing cloud changes.

## License

This portfolio project is provided for demonstration and learning purposes.
