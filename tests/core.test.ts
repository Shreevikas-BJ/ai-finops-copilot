import assert from "node:assert/strict";
import test from "node:test";
import {
  createActiveDataset,
  createDatasetSummary,
  type ActiveDataset,
} from "../src/lib/active-dataset";
import { analyzeCosts } from "../src/lib/agents/cost-analyzer";
import { generateExecutiveReport } from "../src/lib/agents/report-generator";
import { calculateServiceCostChanges } from "../src/lib/cost-insights";
import {
  deleteDatasetFromHistory,
  EMPTY_DATASET_STORE,
  loadDatasetFromHistory,
  renameDatasetInHistory,
  saveDatasetToHistory,
} from "../src/lib/dataset-store";
import { parseCsvTable } from "../src/lib/csv";
import { buildDatasetChunks, retrieveRelevantContext } from "../src/lib/retrieval";
import { UPLOAD_FILE_REQUIREMENTS } from "../src/lib/upload-schema";
import { mergeUploadFiles, validateUploadContents } from "../src/lib/upload-validation";
import type {
  AnalysisResult,
  CostRecord,
  Datasets,
  Finding,
} from "../src/lib/types";

function valueFor(field: string) {
  const values: Record<string, string> = {
    account_id: "123456789012",
    avg_cpu_percent: "3",
    avg_memory_percent: "",
    avg_object_age_days: "",
    billing_month: "2026-05",
    business_criticality: "low",
    created_date: "2026-01-10T00:00:00Z",
    current_month_cost_usd: "140.25",
    environment: "production",
    max_cpu_percent: "10",
    metric_end: "2026-05-31",
    metric_start: "2026-05-01",
    network_in_gb: "",
    network_out_gb: "",
    object_count: "",
    previous_month_cost_usd: "100",
    production: "true",
    project: "warehouse",
    read_iops: "",
    region: "us-east-1",
    resource_id: "i-test-001",
    resource_name: "test-worker",
    resource_type: "EC2 Instance",
    service: "EC2",
    size_or_class: "m5.xlarge",
    status: "running",
    tags: "owner=tester",
    team: "DataTeam",
    usage_amount: "720",
    usage_type: "BoxUsage",
    usage_unit: "hours",
    write_iops: "",
  };
  return values[field] ?? "value";
}

function validUploadContents() {
  return UPLOAD_FILE_REQUIREMENTS.map((requirement) => {
    if (requirement.format === "CSV") {
      const row = requirement.requiredFields.map(valueFor);
      return {
        name: requirement.name,
        size: 512,
        content: `${requirement.requiredFields.map((field) => ` ${field} `).join(",")}\n${row.join(",")}`,
      };
    }
    const item = Object.fromEntries(
      requirement.requiredFields.map((field) => [
        field,
        field === "estimated_monthly_savings_usd" ? 82 : valueFor(field),
      ]),
    );
    return { name: requirement.name, size: 512, content: JSON.stringify([item]) };
  });
}

function finding(id: string, severity: "high" | "medium" | "low", savings: number): Finding {
  return {
    id,
    resourceId: id,
    resourceName: `Resource ${id}`,
    service: id.includes("rds") ? "RDS" : "EC2",
    owner: "Data owner",
    team: "DataTeam",
    region: "us-east-1",
    environment: "production",
    monthlyCost: savings * 2,
    issueType: id.includes("rds") ? "Over-provisioned RDS" : "Idle EC2",
    severity,
    estimatedSavings: savings,
    savingsPercent: 50,
    evidence: ["Low utilization for 30 days."],
    recommendedAction: "Review and rightsize after dependency validation.",
    risk: "medium",
    riskNote: "Validate dependencies before a production change.",
    ticketTitle: `Review ${id}`,
    ticketBody: `Review ${id} with DataTeam.`,
  };
}

const costs: CostRecord[] = [
  { month: "2026-04", resourceId: "i-1", resourceName: "worker", service: "EC2", owner: "Data owner", team: "DataTeam", monthlyCost: 100 },
  { month: "2026-05", resourceId: "i-1", resourceName: "worker", service: "EC2", owner: "Data owner", team: "DataTeam", monthlyCost: 120 },
  { month: "2026-04", resourceId: "rds-1", resourceName: "warehouse", service: "RDS", owner: "Data owner", team: "DataTeam", monthlyCost: 100 },
  { month: "2026-05", resourceId: "rds-1", resourceName: "warehouse", service: "RDS", owner: "Data owner", team: "DataTeam", monthlyCost: 200 },
];

const findings = [finding("rds-1", "high", 120), finding("i-1", "medium", 60), finding("i-2", "low", 15)];
const analysis: AnalysisResult = {
  generatedAt: "2026-06-22T12:00:00.000Z",
  dataMonth: "2026-05",
  previousMonth: "2026-04",
  totalMonthlySpend: 320,
  previousMonthlySpend: 200,
  monthChangePercent: 60,
  estimatedMonthlySavings: 195,
  estimatedYearlySavings: 2340,
  wasteFindings: 3,
  highRiskAnomalies: 1,
  resourceCount: 3,
  findings,
  serviceSpend: [
    { service: "RDS", cost: 200, percent: 62.5 },
    { service: "EC2", cost: 120, percent: 37.5 },
  ],
  serviceCostChanges: calculateServiceCostChanges(costs, "2026-05", "2026-04"),
  savingsByService: [
    { service: "RDS", savings: 120, findings: 1 },
    { service: "EC2", savings: 75, findings: 2 },
  ],
  teamExposure: [{ team: "DataTeam", monthlySpend: 320, potentialSavings: 195, findings: 3 }],
};

const datasets: Datasets = {
  costs,
  resources: [
    { resourceId: "i-1", resourceName: "worker", service: "EC2", resourceType: "EC2 Instance", status: "running", owner: "Data owner", team: "DataTeam", region: "us-east-1", environment: "production", criticality: "medium", objectAgeDays: 0 },
    { resourceId: "rds-1", resourceName: "warehouse", service: "RDS", resourceType: "RDS", status: "available", owner: "Data owner", team: "DataTeam", region: "us-east-1", environment: "production", criticality: "high", objectAgeDays: 0 },
    { resourceId: "i-2", resourceName: "batch", service: "EC2", resourceType: "EC2 Instance", status: "running", owner: "Data owner", team: "DataTeam", region: "us-east-1", environment: "development", criticality: "low", objectAgeDays: 0 },
  ],
  metrics: [],
  recommendations: [],
  trustedAdvisor: [],
};

function activeDataset(name = "QA Dataset"): ActiveDataset {
  return {
    version: 2,
    id: name,
    name,
    source: "custom",
    sourceLabel: "Custom Upload",
    loadedAt: "2026-06-22T12:00:00.000Z",
    fileNames: UPLOAD_FILE_REQUIREMENTS.map((item) => item.name),
    datasets,
    analysis,
    summary: createDatasetSummary(analysis),
  };
}

test("validates trimmed CSV headers, optional metric blanks, JSON arrays, and ISO dates", () => {
  const report = validateUploadContents(validUploadContents());
  assert.equal(report.valid, true);
  assert.equal(report.issues.length, 0);
  assert.equal(report.selectedRequiredFiles, 5);
});

test("reports missing files and missing CSV columns", () => {
  const files = validUploadContents().filter((file) => file.name !== "trusted_advisor_findings.json");
  const costFile = files.find((file) => file.name === "cost_usage.csv");
  assert.ok(costFile);
  costFile.content = costFile.content.replace("project", "project_missing");
  const report = validateUploadContents(files);
  assert.equal(report.valid, false);
  assert.ok(report.issues.some((issue) => issue.code === "missing_file"));
  assert.ok(report.issues.some((issue) => issue.code === "missing_columns"));
});

test("rejects a JSON object and warns without blocking on extra files", () => {
  const files = validUploadContents();
  const optimizer = files.find((file) => file.name === "optimizer_recommendations.json");
  assert.ok(optimizer);
  optimizer.content = "{";
  let report = validateUploadContents(files);
  assert.ok(report.issues.some((issue) => issue.code === "invalid_json"));

  optimizer.content = "{}";
  report = validateUploadContents(files);
  assert.ok(report.issues.some((issue) => issue.code === "invalid_json_structure"));

  optimizer.content = JSON.stringify([Object.fromEntries(UPLOAD_FILE_REQUIREMENTS[3].requiredFields.map((field) => [field, field === "estimated_monthly_savings_usd" ? 82 : valueFor(field)]))]);
  report = validateUploadContents([...files, { name: "notes.txt", size: 10, content: "ignored" }]);
  assert.equal(report.valid, true);
  assert.equal(report.warnings[0]?.code, "unsupported_file");
});

test("merges files selected one by one and replaces an exact file name", () => {
  const first = { name: "cost_usage.csv", version: 1 };
  const second = { name: "resource_inventory.csv", version: 1 };
  const replacement = { name: "cost_usage.csv", version: 2 };
  const merged = mergeUploadFiles(mergeUploadFiles([], [first]), [second, replacement]);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((file) => file.name === "cost_usage.csv")?.version, 2);
});

test("parses and trims CSV headers", () => {
  const table = parseCsvTable(" resource_id , current_month_cost_usd \n i-1 , 42.5 ");
  assert.deepEqual(table.headers, ["resource_id", "current_month_cost_usd"]);
  assert.equal(table.rows[0].resource_id, "i-1");
});

test("calculates current spend, previous spend, and service increases", () => {
  const result = analyzeCosts(costs);
  assert.equal(result.totalMonthlySpend, 320);
  assert.equal(result.previousMonthlySpend, 200);
  assert.equal(result.serviceSpend[0].service, "RDS");
  const changes = calculateServiceCostChanges(costs, "2026-05", "2026-04");
  assert.equal(changes[0].service, "RDS");
  assert.equal(changes[0].change, 100);
});

test("creates an active dataset and computes severity counts", () => {
  const summary = createDatasetSummary(analysis);
  assert.deepEqual(
    [summary.highSeverityCount, summary.mediumSeverityCount, summary.lowSeverityCount],
    [1, 1, 1],
  );
  const active = createActiveDataset({
    name: "  Named Upload  ",
    source: "custom",
    payload: { analysis, datasets, summary, fileNames: UPLOAD_FILE_REQUIREMENTS.map((item) => item.name) },
  });
  assert.equal(active.name, "Named Upload");
  assert.equal(active.summary.costChange, 120);
});

test("saves only three datasets and supports load, rename, and delete", () => {
  let store = EMPTY_DATASET_STORE;
  for (const name of ["one", "two", "three", "four"]) {
    store = saveDatasetToHistory(store, activeDataset(name));
  }
  assert.deepEqual(store.history.map((item) => item.name), ["four", "three", "two"]);
  const loaded = loadDatasetFromHistory(store, "two");
  assert.equal(loaded.loaded, true);
  assert.equal(loaded.store.activeId, "two");
  const renamed = renameDatasetInHistory(loaded.store, "two", "Renamed two");
  assert.equal(renamed.history.find((item) => item.id === "two")?.name, "Renamed two");
  const deleted = deleteDatasetFromHistory(renamed, "two");
  assert.equal(deleted.activeId, null);
  assert.equal(deleted.history.some((item) => item.id === "two"), false);
});

test("always retrieves compact summaries and answers month-over-month wording", () => {
  const chunks = buildDatasetChunks(activeDataset());
  const context = retrieveRelevantContext("What is the major difference in two months?", chunks, 12);
  assert.equal(context.length <= 12, true);
  assert.equal(context.filter((chunk) => chunk.mandatory).length, 8);
  assert.ok(context.some((chunk) => chunk.id === "summary:current-spend"));
  assert.ok(context.some((chunk) => chunk.id === "summary:previous-spend"));
  assert.ok(context.some((chunk) => chunk.id === "summary:cost-change" && chunk.score >= 2));
  assert.match(context.find((chunk) => chunk.id === "summary:top-service-increases")?.text ?? "", /RDS increased \$100\.00/);
});

test("generates a dataset-aware report with top cost increases", () => {
  const report = generateExecutiveReport(analysis, {
    datasetName: "QA Dataset",
    dataSource: "Custom Upload",
    generatedAt: "2026-06-22T12:00:00.000Z",
    serviceCostChanges: calculateServiceCostChanges(costs, "2026-05", "2026-04"),
  });
  assert.match(report.markdown, /## Top cost increases/);
  assert.match(report.markdown, /RDS.*increased \$100/);
  assert.match(report.markdown, /Data source used:\*\* Custom Upload/);
});
