import { parseCsvTable } from "@/lib/csv";
import {
  REQUIRED_UPLOAD_FILE_NAMES,
  UPLOAD_FILE_REQUIREMENTS,
  isRequiredUploadFileName,
  type UploadFileName,
} from "@/lib/upload-schema";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const OPTIONAL_METRIC_FIELDS = new Set([
  "avg_cpu_percent",
  "max_cpu_percent",
  "avg_memory_percent",
  "network_in_gb",
  "network_out_gb",
  "read_iops",
  "write_iops",
  "object_count",
  "avg_object_age_days",
]);

export type UploadValidationCode =
  | "duplicate_file"
  | "empty_file"
  | "file_too_large"
  | "invalid_billing_month"
  | "invalid_cost"
  | "invalid_date"
  | "invalid_json"
  | "invalid_json_structure"
  | "missing_columns"
  | "missing_file"
  | "missing_required_fields"
  | "resource_id_mismatch"
  | "unsupported_file";

export interface UploadValidationIssue {
  code: UploadValidationCode;
  fileName: string;
  message: string;
  resolution: string;
}

export interface UploadFileValidation {
  name: UploadFileName;
  status: "missing" | "invalid" | "valid";
  issueCount: number;
}

export interface UploadValidationReport {
  valid: boolean;
  issues: UploadValidationIssue[];
  files: UploadFileValidation[];
  selectedRequiredFiles: number;
}

interface UploadFileContent {
  name: string;
  content: string;
  size: number;
}

interface ParsedFile {
  resourceIds: Set<string>;
}

function addIssue(
  issues: UploadValidationIssue[],
  fileName: string,
  code: UploadValidationCode,
  message: string,
  resolution: string,
) {
  issues.push({ code, fileName, message, resolution });
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
}

function isNumeric(value: unknown) {
  return hasValue(value) && Number.isFinite(Number(value));
}

function isValidDate(value: unknown) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function rowList(indexes: number[]) {
  const visible = indexes.slice(0, 5).map((index) => index + 2);
  return `${visible.join(", ")}${indexes.length > visible.length ? ` and ${indexes.length - visible.length} more` : ""}`;
}

function validateCsv(
  file: UploadFileContent,
  requiredFields: readonly string[],
  issues: UploadValidationIssue[],
): ParsedFile {
  const table = parseCsvTable(file.content);
  const missingColumns = requiredFields.filter((field) => !table.headers.includes(field));
  if (missingColumns.length > 0) {
    addIssue(
      issues,
      file.name,
      "missing_columns",
      `Missing required columns: ${missingColumns.join(", ")}.`,
      "Add the columns to the header row using the exact names shown in Upload Requirements.",
    );
  }
  if (table.rows.length === 0) {
    addIssue(
      issues,
      file.name,
      "empty_file",
      "The CSV contains no data rows.",
      "Keep the header row and add at least one resource row.",
    );
  }

  const valueFields = requiredFields.filter(
    (field) => file.name !== "cloudwatch_metrics.csv" || !OPTIONAL_METRIC_FIELDS.has(field),
  );
  const missingValues = valueFields.flatMap((field) => {
    if (!table.headers.includes(field)) return [];
    const rows = table.rows
      .map((row, index) => ({ index, value: row[field] }))
      .filter(({ value }) => !hasValue(value))
      .map(({ index }) => index);
    return rows.length > 0 ? [`${field} (rows ${rowList(rows)})`] : [];
  });
  if (missingValues.length > 0) {
    addIssue(
      issues,
      file.name,
      "missing_required_fields",
      `Required values are missing: ${missingValues.join("; ")}.`,
      "Fill the named values. Only metric value columns may be blank or null.",
    );
  }

  if (file.name === "cost_usage.csv") {
    const invalidMonths = table.rows
      .map((row, index) => ({ index, value: row.billing_month }))
      .filter(
        ({ value }) =>
          hasValue(value) && !/^\d{4}-(0[1-9]|1[0-2])$/.test(value),
      )
      .map(({ index }) => index);
    if (invalidMonths.length > 0) {
      addIssue(
        issues,
        file.name,
        "invalid_billing_month",
        `billing_month must use YYYY-MM in rows ${rowList(invalidMonths)}.`,
        "Example: use 2026-05 for May 2026.",
      );
    }

    const costFields = ["current_month_cost_usd", "previous_month_cost_usd"];
    const invalidCosts = costFields.flatMap((field) => {
      if (!table.headers.includes(field)) return [];
      const rows = table.rows
        .map((row, index) => ({ index, value: row[field] }))
        .filter(({ value }) => hasValue(value) && !isNumeric(value))
        .map(({ index }) => index);
      return rows.length > 0 ? [`${field} (rows ${rowList(rows)})`] : [];
    });
    if (invalidCosts.length > 0) {
      addIssue(
        issues,
        file.name,
        "invalid_cost",
        `Cost fields must be numeric: ${invalidCosts.join("; ")}.`,
        "Remove currency symbols and commas; use values such as 82 or 82.50.",
      );
    }
  }

  const dateFields =
    file.name === "resource_inventory.csv"
      ? ["created_date"]
      : file.name === "cloudwatch_metrics.csv"
        ? ["metric_start", "metric_end"]
        : [];
  const invalidDates = dateFields.flatMap((field) => {
    if (!table.headers.includes(field)) return [];
    const rows = table.rows
      .map((row, index) => ({ index, value: row[field] }))
      .filter(({ value }) => hasValue(value) && !isValidDate(value))
      .map(({ index }) => index);
    return rows.length > 0 ? [`${field} (rows ${rowList(rows)})`] : [];
  });
  if (invalidDates.length > 0) {
    addIssue(
      issues,
      file.name,
      "invalid_date",
      `Dates must use YYYY-MM-DD: ${invalidDates.join("; ")}.`,
      "Use a real calendar date such as 2026-05-31.",
    );
  }

  return {
    resourceIds: new Set(
      table.rows.map((row) => row.resource_id?.trim()).filter((value): value is string => Boolean(value)),
    ),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateJson(
  file: UploadFileContent,
  requiredFields: readonly string[],
  issues: UploadValidationIssue[],
): ParsedFile {
  let value: unknown;
  try {
    value = JSON.parse(file.content);
  } catch {
    addIssue(
      issues,
      file.name,
      "invalid_json",
      "The file is not valid JSON.",
      "Check commas, quotes, and brackets. The top level must look like [ { ... } ].",
    );
    return { resourceIds: new Set() };
  }
  if (!Array.isArray(value)) {
    addIssue(
      issues,
      file.name,
      "invalid_json_structure",
      "The JSON top level must be an array.",
      "Wrap recommendation or finding objects in square brackets: [ { ... } ].",
    );
    return { resourceIds: new Set() };
  }

  const invalidItems = value
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !isRecord(item))
    .map(({ index }) => index + 1);
  if (invalidItems.length > 0) {
    addIssue(
      issues,
      file.name,
      "invalid_json_structure",
      `Array items must be JSON objects. Invalid items: ${invalidItems.slice(0, 5).join(", ")}.`,
      "Replace primitive values with objects that follow the documented example.",
    );
  }

  const objects = value.filter(isRecord);
  const missingFields = requiredFields.flatMap((field) => {
    const items = objects
      .map((item, index) => ({ index, value: item[field] }))
      .filter(({ value: fieldValue }) => !hasValue(fieldValue))
      .map(({ index }) => index + 1);
    return items.length > 0 ? [`${field} (items ${items.slice(0, 5).join(", ")})`] : [];
  });
  if (missingFields.length > 0) {
    addIssue(
      issues,
      file.name,
      "missing_required_fields",
      `Required fields are missing: ${missingFields.join("; ")}.`,
      "Add the named keys to each object using the exact field names in Upload Requirements.",
    );
  }

  const invalidSavings = objects
    .map((item, index) => ({ index, value: item.estimated_monthly_savings_usd }))
    .filter(({ value: savings }) => hasValue(savings) && !isNumeric(savings))
    .map(({ index }) => index + 1);
  if (invalidSavings.length > 0) {
    addIssue(
      issues,
      file.name,
      "invalid_cost",
      `estimated_monthly_savings_usd must be numeric in items ${invalidSavings.slice(0, 5).join(", ")}.`,
      "Use a number without a currency symbol, such as 100 or 82.50.",
    );
  }

  return {
    resourceIds: new Set(
      objects
        .map((item) => String(item.resource_id ?? "").trim())
        .filter(Boolean),
    ),
  };
}

export function validateUploadContents(files: UploadFileContent[]): UploadValidationReport {
  const issues: UploadValidationIssue[] = [];
  const byName = new Map<string, UploadFileContent[]>();
  files.forEach((file) => byName.set(file.name, [...(byName.get(file.name) ?? []), file]));

  files.forEach((file) => {
    if (!isRequiredUploadFileName(file.name)) {
      addIssue(
        issues,
        file.name,
        "unsupported_file",
        `${file.name} is not one of the five supported upload files.`,
        "Remove it and upload only the exact file names listed in Upload Requirements.",
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      addIssue(
        issues,
        file.name,
        "file_too_large",
        "The file exceeds the 2 MB upload limit.",
        "Reduce the file to the MVP sample size or remove unnecessary rows.",
      );
    }
  });

  REQUIRED_UPLOAD_FILE_NAMES.forEach((name) => {
    const matches = byName.get(name) ?? [];
    if (matches.length === 0) {
      addIssue(
        issues,
        name,
        "missing_file",
        `${name} is missing.`,
        "Select all five required files together, including this file.",
      );
    } else if (matches.length > 1) {
      addIssue(
        issues,
        name,
        "duplicate_file",
        `${name} was selected more than once.`,
        "Keep one copy of the file and select the set again.",
      );
    }
  });

  const parsed = new Map<UploadFileName, ParsedFile>();
  UPLOAD_FILE_REQUIREMENTS.forEach((requirement) => {
    const file = byName.get(requirement.name)?.[0];
    if (!file) return;
    const result = requirement.format === "CSV"
      ? validateCsv(file, requirement.requiredFields, issues)
      : validateJson(file, requirement.requiredFields, issues);
    parsed.set(requirement.name, result);
  });

  const inventoryIds = parsed.get("resource_inventory.csv")?.resourceIds;
  if (inventoryIds && inventoryIds.size > 0) {
    REQUIRED_UPLOAD_FILE_NAMES
      .filter((name) => name !== "resource_inventory.csv")
      .forEach((name) => {
        const resourceIds = parsed.get(name)?.resourceIds;
        if (!resourceIds) return;
        const unmatched = [...resourceIds].filter((resourceId) => !inventoryIds.has(resourceId));
        if (unmatched.length > 0) {
          addIssue(
            issues,
            name,
            "resource_id_mismatch",
            `${unmatched.length} resource_id value${unmatched.length === 1 ? " does" : "s do"} not exist in resource_inventory.csv: ${unmatched.slice(0, 3).join(", ")}${unmatched.length > 3 ? "…" : ""}.`,
            "Add the resources to the inventory or correct the IDs so related files use the same value.",
          );
        }
      });
  }

  const filesStatus = REQUIRED_UPLOAD_FILE_NAMES.map((name) => {
    const fileIssues = issues.filter((issue) => issue.fileName === name);
    return {
      name,
      status: !byName.has(name) ? "missing" as const : fileIssues.length > 0 ? "invalid" as const : "valid" as const,
      issueCount: fileIssues.length,
    };
  });

  return {
    valid: issues.length === 0,
    issues,
    files: filesStatus,
    selectedRequiredFiles: REQUIRED_UPLOAD_FILE_NAMES.filter((name) => byName.has(name)).length,
  };
}

export async function validateUploadFiles(files: File[]): Promise<UploadValidationReport> {
  const contents = await Promise.all(
    files.map(async (file) => ({ name: file.name, content: await file.text(), size: file.size })),
  );
  return validateUploadContents(contents);
}
