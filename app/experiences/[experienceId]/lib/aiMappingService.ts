import type { AiColumnMapping, PnlFormat, DateFormat } from "./aiMappingSchema";
import type { ParsedTrade } from "../types";

/**
 * Client-side service for AI-powered CSV column mapping
 */

export interface AiMappingResult {
  success: boolean;
  mapping?: AiColumnMapping;
  headers?: string[];
  error?: string;
  details?: string[];
}

/**
 * Extract headers and sample rows from a CSV file
 */
export async function extractCsvPreview(file: File): Promise<{
  headers: string[];
  sampleRows: string[][];
}> {
  const text = await file.text();
  const lines = text.split("\n").filter(line => line.trim() !== "");
  
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  
  // Get 2-3 sample rows for format inference
  const sampleRows: string[][] = [];
  for (let i = 1; i < Math.min(4, lines.length); i++) {
    sampleRows.push(parseCsvLine(lines[i]));
  }

  return { headers, sampleRows };
}

/**
 * Call the AI mapping API to get column mappings
 */
export async function getAiColumnMapping(
  headers: string[],
  sampleRows: string[][]
): Promise<AiMappingResult> {
  try {
    const response = await fetch("/api/ai-mapping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headers, sampleRows }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to get AI mapping",
        details: data.details,
        mapping: data.mapping,
      };
    }

    return {
      success: true,
      mapping: data.mapping,
      headers: data.headers,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Parse a CSV file using an AI-generated column mapping
 */
export async function parseCsvWithAiMapping(
  file: File,
  mapping: AiColumnMapping
): Promise<ParsedTrade[]> {
  const text = await file.text();
  const lines = text.split("\n").filter(line => line.trim() !== "");

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Parse headers
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const headersLower = headers.map(h => h.toLowerCase());

  // Find column indices
  const pnlIdx = headersLower.indexOf(mapping.pnl.column.toLowerCase());
  const dateIdx = headersLower.indexOf(mapping.date.column.toLowerCase());
  const mfeIdx = mapping.mfe?.column 
    ? headersLower.indexOf(mapping.mfe.column.toLowerCase()) 
    : -1;
  const filterIdx = mapping.row_filter?.column
    ? headersLower.indexOf(mapping.row_filter.column.toLowerCase())
    : -1;

  if (pnlIdx === -1) {
    throw new Error(`PNL column "${mapping.pnl.column}" not found`);
  }
  if (dateIdx === -1) {
    throw new Error(`Date column "${mapping.date.column}" not found`);
  }

  const trades: ParsedTrade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);

    // Check if we have enough columns
    const maxIdx = Math.max(pnlIdx, dateIdx, mfeIdx, filterIdx);
    if (values.length <= maxIdx) {
      continue;
    }

    // Apply row filter if specified
    if (mapping.row_filter && filterIdx !== -1) {
      const filterValue = values[filterIdx]?.trim() || "";
      const targetValue = mapping.row_filter.value;
      
      let matches = false;
      switch (mapping.row_filter.condition) {
        case "equals":
          matches = filterValue.toLowerCase() === targetValue.toLowerCase();
          break;
        case "contains":
          matches = filterValue.toLowerCase().includes(targetValue.toLowerCase());
          break;
        case "starts_with":
          matches = filterValue.toLowerCase().startsWith(targetValue.toLowerCase());
          break;
      }
      
      if (!matches) continue;
    }

    const dateStr = values[dateIdx]?.trim() || "";
    const pnlStr = values[pnlIdx]?.trim() || "";
    const mfeStr = mfeIdx >= 0 ? values[mfeIdx]?.trim() || "" : "";

    if (!dateStr || !pnlStr) continue;

    // Parse PNL using detected format
    const pnl = parseNumericValue(pnlStr, mapping.pnl.format, mapping.pnl.currency_symbol);
    if (isNaN(pnl)) {
      throw new Error(`Invalid PNL value in row ${i + 1}: "${pnlStr}"`);
    }

    // Parse MFE if present
    let mfe = 0;
    if (mfeStr && mapping.mfe) {
      mfe = parseNumericValue(mfeStr, mapping.mfe.format, mapping.mfe.currency_symbol);
      if (isNaN(mfe)) mfe = 0;
    }

    // Parse date using detected format
    const parsedDate = parseDateValue(dateStr, mapping.date.format, mapping.date.custom_pattern);

    trades.push({
      date: parsedDate,
      pnl,
      mfe,
    });
  }

  if (trades.length === 0) {
    throw new Error("No valid trades found in CSV file");
  }

  return trades;
}

/**
 * Parse a numeric value based on detected format
 */
function parseNumericValue(
  value: string,
  format: PnlFormat,
  currencySymbol?: string
): number {
  let s = value.trim();
  
  // Check for parentheses (negative)
  const isNegative = s.startsWith("(") && s.endsWith(")");
  
  // Remove currency symbols, parentheses, commas
  if (currencySymbol) {
    s = s.replace(new RegExp(`\\${currencySymbol}`, "g"), "");
  }
  s = s.replace(/[$€£¥]/g, ""); // Common currency symbols
  s = s.replace(/[()]/g, "");
  s = s.replace(/,/g, "");
  s = s.trim();

  const num = parseFloat(s);
  return isNegative ? -Math.abs(num) : num;
}

/**
 * Parse a date value based on detected format
 */
function parseDateValue(
  value: string,
  format: DateFormat,
  customPattern?: string
): string {
  const s = value.trim();

  switch (format) {
    case "unix_seconds":
      return new Date(parseInt(s) * 1000).toISOString().split("T")[0];
    
    case "unix_ms":
      return new Date(parseInt(s)).toISOString().split("T")[0];
    
    case "iso":
      // Already in ISO format, just extract date part
      return s.split("T")[0].split(" ")[0];
    
    case "us":
      // MM/DD/YYYY or MM-DD-YYYY
      const usParts = s.split(/[\/\-\s]/);
      if (usParts.length >= 3) {
        const [month, day, year] = usParts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return s;
    
    case "eu":
      // DD/MM/YYYY or DD-MM-YYYY
      const euParts = s.split(/[\/\-\s]/);
      if (euParts.length >= 3) {
        const [day, month, year] = euParts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return s;
    
    case "custom":
      // For custom patterns, try to extract a reasonable date
      // This is a simplified handler - could be expanded
      return s.split(" ")[0];
    
    default:
      return s;
  }
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}
