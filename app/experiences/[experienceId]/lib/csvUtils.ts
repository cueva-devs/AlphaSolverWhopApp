import type { ParsedTrade, CsvFormat } from "../types";

interface ParseOptions {
	template: CsvFormat;
	pnlColumn?: string;
	dateColumn?: string;
	mfeColumn?: string;
}

export async function parseTradeCsv(
	file: File,
	options: ParseOptions,
): Promise<ParsedTrade[]> {
	const text = await file.text();
	const lines = text.split("\n").filter((line) => line.trim() !== "");

	if (lines.length === 0) {
		throw new Error("CSV file is empty");
	}

	// Parse header row - keep original case for exact matching
	const headerLine = lines[0];
	const headers = parseCsvLine(headerLine).map((h) => h.trim());
	const headersLower = headers.map((h) => h.toLowerCase());

	// Determine column indices based on template
	let pnlIdx: number;
	let dateIdx: number;
	let mfeIdx: number = -1; // MFE is optional

	if (options.template === "NinjaTrader") {
		// NinjaTrader uses exact column names: "Entry time", "Profit", "MFE"
		pnlIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"profit",
		]);
		dateIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"entry time",
		]);
		mfeIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"mfe",
		]);
	} else if (options.template === "TradingView (Strategy Tester)") {
		// TradingView Strategy Tester: "Date/Time", "Profit"
		pnlIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"profit",
		]);
		dateIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"date/time",
			"datetime",
		]);
	} else if (options.template === "TradingView (Broker History)") {
		// TradingView Broker History: "Close Time", "Profit"
		pnlIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"profit",
		]);
		dateIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"close time",
		]);
	} else if (options.template === "Rithmic / R|Trader") {
		// Rithmic: "Entry Time", "Profit"
		pnlIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"profit",
		]);
		dateIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"entry time",
		]);
	} else if (options.template === "Tradovate") {
		// Tradovate: "Time", "P&L"
		pnlIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"p&l",
			"pnl",
			"profit",
		]);
		dateIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"time",
		]);
	} else if (options.template === "MetaTrader 4 (MT4)") {
		// MT4 Account History: "Time" / "Close Time", "Profit"
		pnlIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"profit",
			"p/l",
			"pnl",
		]);
		dateIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"close time",
			"time",
			"open time",
			"date",
		]);
	} else if (options.template === "MetaTrader 5 (MT5)") {
		// MT5 Account History: "Time", "Profit"
		pnlIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"profit",
			"p/l",
			"pnl",
		]);
		dateIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"time",
			"close time",
			"open time",
			"date",
		]);
	} else if (options.template === "Generic (Simple)") {
		// Generic: flexible column names
		pnlIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"pnl",
			"profit",
			"profit/loss",
			"net",
		]);
		dateIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"date",
			"time",
			"datetime",
			"timestamp",
		]);
		mfeIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			"mfe",
			"max favorable excursion",
			"max profit",
		]);
	} else {
		// Custom template - use provided column names
		if (!options.pnlColumn || !options.dateColumn) {
			throw new Error(
				"Custom template requires pnlColumn and dateColumn to be specified",
			);
		}
		pnlIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			options.pnlColumn,
		]);
		dateIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
			options.dateColumn,
		]);
		if (options.mfeColumn) {
			mfeIdx = findColumnIndexCaseInsensitive(headers, headersLower, [
				options.mfeColumn,
			]);
		}
	}

	// Validate required columns exist
	if (pnlIdx === -1) {
		throw new Error(
			`PNL column not found. Expected: ${options.pnlColumn || (options.template === "NinjaTrader" ? "Profit" : "pnl/profit")}`,
		);
	}
	if (dateIdx === -1) {
		throw new Error(
			`Date column not found. Expected: ${options.dateColumn || (options.template === "NinjaTrader" ? "Entry time" : "date/time")}`,
		);
	}
	// MFE is optional - don't throw error if not found

	// Parse data rows
	const trades: ParsedTrade[] = [];
	for (let i = 1; i < lines.length; i++) {
		const values = parseCsvLine(lines[i]);

		// Check if we have enough columns
		const maxRequiredIdx = Math.max(
			pnlIdx,
			dateIdx,
			mfeIdx >= 0 ? mfeIdx : -1,
		);
		if (values.length <= maxRequiredIdx) {
			continue; // Skip incomplete rows
		}

		const dateStr = values[dateIdx]?.trim() || "";
		const pnlStr = values[pnlIdx]?.trim() || "";
		const mfeStr = mfeIdx >= 0 ? values[mfeIdx]?.trim() || "" : "";

		// Date and PNL are required
		if (!dateStr || !pnlStr) {
			continue; // Skip rows with missing required values
		}

		// Parse PNL (handle currency formatting)
		const pnl = parseCurrencyValue(pnlStr);
		if (isNaN(pnl)) {
			throw new Error(
				`Invalid PNL value in row ${i + 1}: "${pnlStr}"`,
			);
		}

		// Parse MFE (optional, default to 0 if not present)
		let mfe = 0;
		if (mfeStr) {
			mfe = parseCurrencyValue(mfeStr);
			if (isNaN(mfe)) {
				mfe = 0; // Default to 0 if MFE can't be parsed
			}
		}

		trades.push({
			date: dateStr,
			pnl,
			mfe,
		});
	}

	if (trades.length === 0) {
		throw new Error("No valid trades found in CSV file");
	}

	return trades;
}

function parseCsvLine(line: string): string[] {
	const values: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++; // Skip next quote
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

	values.push(current); // Add last value
	return values;
}

function findColumnIndexCaseInsensitive(
	headers: string[],
	headersLower: string[],
	possibleNames: string[],
): number {
	for (const name of possibleNames) {
		const nameLower = name.toLowerCase();
		const idx = headersLower.indexOf(nameLower);
		if (idx !== -1) {
			return idx;
		}
	}
	return -1;
}

/**
 * Parse a currency string like '$252.60' or '($222.40)' into a float.
 * Handles:
 * - Dollar signs: $100.00 -> 100.00
 * - Parentheses for negative: ($100.00) -> -100.00
 * - Commas: $1,000.00 -> 1000.00
 */
function parseCurrencyValue(value: string): number {
	if (!value || value.trim() === "") {
		return 0.0;
	}

	const s = value.trim();

	// Check if negative (parentheses)
	const isNegative = s.startsWith("(") && s.endsWith(")");

	// Remove currency symbols, parentheses, commas
	const cleaned = s
		.replace(/\$/g, "")
		.replace(/\(/g, "")
		.replace(/\)/g, "")
		.replace(/,/g, "");

	try {
		const result = parseFloat(cleaned);
		if (isNaN(result)) {
			return 0.0;
		}
		return isNegative ? -result : result;
	} catch {
		return 0.0;
	}
}

