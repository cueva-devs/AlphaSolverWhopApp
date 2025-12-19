/**
 * AI Upload Column Mapping Schema
 * 
 * This schema is sent to an ML model along with CSV headers + sample rows.
 * The ML model fills in the column names and detected formats.
 * The filled schema is then used mechanically to parse the CSV.
 */

// PNL value formats
export type PnlFormat = 
  | "number"                  // 100.50, -50.25
  | "currency"                // $100.50, -$50.25
  | "currency_parentheses";   // $100.50, ($50.25) - parentheses = negative

// Date/time formats
export type DateFormat = 
  | "iso"           // 2024-01-15T09:30:00, 2024-01-15
  | "us"            // 01/15/2024, 01/15/2024 9:30 AM
  | "eu"            // 15/01/2024, 15-01-2024 09:30
  | "unix_seconds"  // 1705312200
  | "unix_ms"       // 1705312200000
  | "custom";       // Requires custom_pattern

// Column mapping for a numeric value (PNL, MFE)
export interface NumericColumnMapping {
  column: string;                    // Exact column header name from CSV
  format: PnlFormat;
  currency_symbol?: string;          // "$", "€", "£" - for parsing
  decimal_separator?: "." | ",";     // Regional format handling
  thousands_separator?: "," | "." | " " | "";
}

// Column mapping for date/time
export interface DateColumnMapping {
  column: string;                    // Exact column header name from CSV
  format: DateFormat;
  custom_pattern?: string;           // e.g., "MM/DD/YYYY HH:mm:ss" if format is "custom"
}

// Optional row filter (e.g., TradingView needs "Type" = "Exit")
export interface RowFilter {
  column: string;
  condition: "equals" | "contains" | "starts_with";
  value: string;
}

/**
 * The complete AI mapping schema.
 * ML model receives this as a template and fills in the values.
 */
export interface AiColumnMapping {
  // Required: Profit/Loss column
  pnl: NumericColumnMapping;
  
  // Required: Date/Time column  
  date: DateColumnMapping;
  
  // Optional: Maximum Favorable Excursion
  mfe?: NumericColumnMapping;
  
  // Optional: Row filtering (skip certain rows)
  row_filter?: RowFilter;
}

/**
 * Request payload sent to ML model
 */
export interface AiMappingRequest {
  headers: string[];           // CSV column headers
  sample_rows: string[][];     // 2-3 sample data rows for format inference
  schema_template: AiMappingSchemaTemplate;
}

/**
 * Template with descriptions for the ML model
 */
export interface AiMappingSchemaTemplate {
  pnl: {
    description: string;
    required: boolean;
    format_options: PnlFormat[];
  };
  date: {
    description: string;
    required: boolean;
    format_options: DateFormat[];
  };
  mfe: {
    description: string;
    required: boolean;
    format_options: PnlFormat[];
  };
  row_filter: {
    description: string;
    required: boolean;
  };
}

/**
 * The template we send to the ML model with instructions
 */
export const AI_MAPPING_TEMPLATE: AiMappingSchemaTemplate = {
  pnl: {
    description: "The column containing profit/loss value for each trade. Can be positive (profit) or negative (loss).",
    required: true,
    format_options: ["number", "currency", "currency_parentheses"],
  },
  date: {
    description: "The column containing the date and/or time of the trade. Preferably the exit/close time.",
    required: true,
    format_options: ["iso", "us", "eu", "unix_seconds", "unix_ms", "custom"],
  },
  mfe: {
    description: "Maximum Favorable Excursion - the highest unrealized profit during the trade before exit. Also known as 'Run-up' or 'Max Profit'.",
    required: false,
    format_options: ["number", "currency", "currency_parentheses"],
  },
  row_filter: {
    description: "If the CSV contains multiple row types (e.g., Entry and Exit rows), specify which rows to include. Only needed if rows should be filtered.",
    required: false,
  },
};

/**
 * Build the prompt context for the ML model
 */
export function buildAiMappingPrompt(headers: string[], sampleRows: string[][]): string {
  const headerList = headers.map((h, i) => `${i}: "${h}"`).join("\n");
  
  const sampleData = sampleRows.map((row, rowIdx) => {
    return `Row ${rowIdx + 1}: ${row.map((val, colIdx) => `[${colIdx}]="${val}"`).join(", ")}`;
  }).join("\n");

  return `Analyze this CSV and map columns to our trading analysis schema.

CSV HEADERS:
${headerList}

SAMPLE DATA:
${sampleData}

REQUIRED MAPPINGS:
1. pnl - Profit/Loss per trade (required)
   - Look for: "Profit", "P&L", "PnL", "Net P&L", "Net Profit", "Realized P/L"
   - Detect format: plain number (-50.25), currency ($100.50), or currency with parentheses for negative ($100.50 or ($50.25))

2. date - Trade date/time (required)
   - Look for: "Date", "Time", "Entry Time", "Exit Time", "Close Time", "Date/Time"
   - Detect format: ISO (2024-01-15), US (01/15/2024), EU (15/01/2024), unix timestamp

3. mfe - Maximum Favorable Excursion (optional)
   - Look for: "MFE", "Run-up", "Max Profit", "Unrealized High"
   - Same format detection as pnl

4. row_filter - Only if CSV has mixed row types (optional)
   - Example: TradingView has "Entry" and "Exit" rows, only "Exit" rows contain final P&L

Respond with a JSON object matching this exact structure:
{
  "pnl": { "column": "<exact header>", "format": "<number|currency|currency_parentheses>", "currency_symbol": "<if applicable>" },
  "date": { "column": "<exact header>", "format": "<iso|us|eu|unix_seconds|unix_ms|custom>", "custom_pattern": "<if custom>" },
  "mfe": { "column": "<exact header or null>", "format": "<format or null>" },
  "row_filter": { "column": "<header or null>", "condition": "<equals|contains|starts_with>", "value": "<filter value>" } or null
}`;
}

/**
 * Validate an AI mapping response
 */
export function validateAiMapping(mapping: unknown): mapping is AiColumnMapping {
  if (!mapping || typeof mapping !== "object") return false;
  
  const m = mapping as Record<string, unknown>;
  
  // Check required pnl
  if (!m.pnl || typeof m.pnl !== "object") return false;
  const pnl = m.pnl as Record<string, unknown>;
  if (typeof pnl.column !== "string" || !pnl.column) return false;
  if (!["number", "currency", "currency_parentheses"].includes(pnl.format as string)) return false;
  
  // Check required date
  if (!m.date || typeof m.date !== "object") return false;
  const date = m.date as Record<string, unknown>;
  if (typeof date.column !== "string" || !date.column) return false;
  if (!["iso", "us", "eu", "unix_seconds", "unix_ms", "custom"].includes(date.format as string)) return false;
  
  // mfe is optional but must be valid if present
  if (m.mfe !== null && m.mfe !== undefined) {
    if (typeof m.mfe !== "object") return false;
    const mfe = m.mfe as Record<string, unknown>;
    if (typeof mfe.column !== "string") return false;
  }
  
  return true;
}
