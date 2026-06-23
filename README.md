# AI FinOps Copilot

AI FinOps Copilot is a production-minded portfolio MVP that turns cloud billing, utilization, inventory, and optimization signals into prioritized, owner-aware action plans.

AWS tools can identify an underutilized resource. This app adds the action layer: who owns it, why it matters, what it costs, the risk of changing it, a recommended next step, estimated savings, and a ticket-ready work item.

> Read-only MVP: no AWS credentials are required, no cloud APIs are called, and no destructive actions are available.

## What it solves

Cloud cost data is usually fragmented across billing exports, resource tags, CloudWatch, Compute Optimizer, and Trusted Advisor. The expensive part is often not detection, it is deciding what to do, routing the work to the right team, and explaining the trade-off. AI FinOps Copilot combines those signals into one reviewable queue.

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

- Upload-first home page with two clear starting choices: Sample Data or named Custom Upload.
- Full-width dashboard with expandable cost, savings, severity, service, team, and resource details.
- Embedded Groq Copilot beside the dashboard on desktop and below it on mobile.
- Findings explorer inside the dashboard, with a separate focused page still available.
- Three-dataset browser history with load, rename, and delete controls.
- Executive report with copy, Markdown download, high-severity findings, and an evidence table.
- Downloadable ZIP containing all five sample files in the documented upload schemas.
- Server routes at `/api/analyze`, `/api/copilot`, `/api/report`, and `/api/sample-data`.

## Product flow

1. Open the app on the Upload page.
2. Choose **Use Sample Data** or **Upload Custom Data**. History remains available below the two starting choices.
3. For a custom dataset, enter a name and select the five files together or one at a time.
4. The server returns parsed records, deterministic analysis, and a compact dataset summary.
5. The dataset becomes active, is added to browser history in localStorage, and opens on the dashboard.
6. The latest three datasets are retained. Adding a fourth removes the oldest.
7. The dashboard, embedded Copilot, Findings page, and Report all read the same active dataset.

Loading history switches every data-aware surface immediately. Clearing active data keeps history available for later loading.

## Dataset-grounded retrieval

The Copilot uses deterministic lexical retrieval instead of sending full files to Groq:

1. `buildDatasetChunks(activeDataset)` creates compact chunks from cost rows, inventory, metrics, optimizer recommendations, advisor findings, generated findings, and dashboard summaries.
2. Eight compact summary chunks are always included for current spend, previous spend, cost change, service cost, service increases, team cost, high severity findings, and savings.
3. `retrieveRelevantContext(question, chunks)` scores resource IDs, services, teams, severity, finding types, and month comparison terms.
4. Only the eight summary chunks plus up to four relevant detail chunks are sent to `/api/copilot`.
5. `buildCopilotPrompt(...)` combines those chunks with the compact dataset summary and strict grounding instructions.

No paid embeddings or external vector database are required. Groq output is limited to 650 tokens. If the retrieved context does not contain an answer, Copilot returns: `I could not find that in the active dataset.`

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
- Deterministic lexical RAG over the active browser dataset
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
pnpm test
pnpm check:copy
pnpm check:no-em-dash
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

Uploaded files must use those exact names. Select all five together or add them one at a time. Selecting the same exact file name again replaces the previous selection. Extra files are ignored with a warning. Each required file is limited to 2 MB and is processed in memory for one request. The built-in sample workflow remains available without uploading files.

Use **Download Sample Data** on the Upload page to download a ZIP with all five files. The ZIP export uses the documented schemas and can be uploaded back into the app as a valid custom dataset.

## Upload File Requirements

The upload workspace validates file presence, schemas, required values, formats, and related resource IDs in the browser before enabling **Analyze Custom Data**. The API repeats those checks before analysis. CSV column names and JSON field names are case-sensitive and must match the names below.

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
- Extra files are ignored with a warning and do not block an otherwise valid upload.
- Files may be selected together or one at a time; later selections are merged by exact file name.
- Validation errors identify the file, problem, and a suggested correction. Analysis remains disabled until every error is resolved.

## Demo questions

- “Why did my cloud bill increase?”
- “What should I fix first?”
- “Show me the high severity findings.”
- “Create an action plan for the DataTeam.”
- “Generate Jira tickets for high-priority savings.”
- “Which production change has the highest risk-adjusted savings?”

## Security and safety

- `GROQ_API_KEY` is read only inside server route handlers.
- `.env.local`, `.env`, and Vercel project files are gitignored.
- User questions are length-limited and wrapped in a safety-focused system prompt.
- Full raw files are never sent to Groq. Only the compact summary and top retrieved chunks are sent.
- Retrieved context is capped at 12 chunks and Groq output is capped at 650 tokens.
- Month comparison questions always receive compact current spend, previous spend, cost change, and service increase summaries.
- The LLM is told never to claim it changed AWS resources or created real tickets.
- The LLM is told not to add general cloud knowledge or external recommendations.
- The MVP is read-only and accepts no AWS credentials.
- Uploaded data is parsed in memory and retained only in browser localStorage for the latest three datasets.

## License

This portfolio project is provided for demonstration and learning purposes.
