import type { ParsedTrade, BootstrappedParams } from "../types";

interface ParseOptions {
	template: BootstrappedParams["template"];
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

	// Parse header row
	const headerLine = lines[0];
	const headers = parseCsvLine(headerLine).map((h) => h.trim().toLowerCase());

	// Determine column indices based on template
	let pnlIdx: number;
	let dateIdx: number;
	let mfeIdx: number;

	if (options.template === "NinjaTrader") {
		pnlIdx = findColumnIndex(headers, ["pnl", "profit", "profit/loss"]);
		dateIdx = findColumnIndex(headers, ["date", "time", "datetime"]);
		mfeIdx = findColumnIndex(headers, ["mfe", "max favorable excursion"]);
	} else if (options.template === "Generic") {
		pnlIdx = findColumnIndex(headers, ["pnl", "profit", "profit/loss", "net"]);
		dateIdx = findColumnIndex(headers, ["date", "time", "datetime", "timestamp"]);
		mfeIdx = findColumnIndex(headers, [
			"mfe",
			"max favorable excursion",
			"max profit",
		]);
	} else {
		// Custom template - use provided column names
		if (!options.pnlColumn || !options.dateColumn || !options.mfeColumn) {
			throw new Error(
				"Custom template requires pnlColumn, dateColumn, and mfeColumn to be specified",
			);
		}
		pnlIdx = findColumnIndex(headers, [options.pnlColumn.toLowerCase()]);
		dateIdx = findColumnIndex(headers, [options.dateColumn.toLowerCase()]);
		mfeIdx = findColumnIndex(headers, [options.mfeColumn.toLowerCase()]);
	}

	// Validate required columns exist
	if (pnlIdx === -1) {
		throw new Error(
			`PNL column not found. Expected: ${options.pnlColumn || "pnl/profit"}`,
		);
	}
	if (dateIdx === -1) {
		throw new Error(
			`Date column not found. Expected: ${options.dateColumn || "date/time"}`,
		);
	}
	if (mfeIdx === -1) {
		throw new Error(
			`MFE column not found. Expected: ${options.mfeColumn || "mfe"}`,
		);
	}

	// Parse data rows
	const trades: ParsedTrade[] = [];
	for (let i = 1; i < lines.length; i++) {
		const values = parseCsvLine(lines[i]);

		if (values.length <= Math.max(pnlIdx, dateIdx, mfeIdx)) {
			continue; // Skip incomplete rows
		}

		const dateStr = values[dateIdx]?.trim() || "";
		const pnlStr = values[pnlIdx]?.trim() || "";
		const mfeStr = values[mfeIdx]?.trim() || "";

		if (!dateStr || !pnlStr || !mfeStr) {
			continue; // Skip rows with missing values
		}

		const pnl = parseFloat(pnlStr);
		const mfe = parseFloat(mfeStr);

		if (isNaN(pnl) || isNaN(mfe)) {
			throw new Error(
				`Invalid numeric value in row ${i + 1}: PNL="${pnlStr}", MFE="${mfeStr}"`,
			);
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

function findColumnIndex(
	headers: string[],
	possibleNames: string[],
): number {
	for (const name of possibleNames) {
		const idx = headers.indexOf(name.toLowerCase());
		if (idx !== -1) {
			return idx;
		}
	}
	return -1;
}

