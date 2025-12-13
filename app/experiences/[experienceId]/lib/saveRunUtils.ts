"use client";

import type { SavedRun, SimulationResult, AccountConfig, BootstrappedParams, ParsedTrade, CsvFormat } from "../types";

const CURRENT_VERSION = "1.0.0";

/**
 * Creates a SavedRun object from current simulation state
 */
export function createSavedRun(
	result: SimulationResult,
	trades: ParsedTrade[],
	accountConfig: AccountConfig,
	params: BootstrappedParams,
	csvFormat: CsvFormat,
	name?: string
): SavedRun {
	return {
		version: CURRENT_VERSION,
		timestamp: new Date().toISOString(),
		name: name || `Run ${new Date().toLocaleString()}`,
		trades,
		accountConfig,
		params,
		csvFormat,
		result,
	};
}

/**
 * Compresses data using the native CompressionStream API
 */
async function compressData(data: string): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(encoder.encode(data));
			controller.close();
		}
	});
	
	const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
	const reader = compressedStream.getReader();
	const chunks: Uint8Array[] = [];
	
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}
	
	const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	
	return result;
}

/**
 * Decompresses data using the native DecompressionStream API
 */
async function decompressData(data: Uint8Array): Promise<string> {
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(data);
			controller.close();
		}
	});
	
	const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
	const reader = decompressedStream.getReader();
	const decoder = new TextDecoder();
	let result = "";
	
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		result += decoder.decode(value, { stream: true });
	}
	
	return result;
}

/**
 * Exports a SavedRun to a compressed file and triggers download
 */
export async function exportRun(savedRun: SavedRun): Promise<void> {
	try {
		// Convert to JSON
		const jsonString = JSON.stringify(savedRun);
		
		// Compress with gzip
		const compressed = await compressData(jsonString);
		
		// Create blob and download
		const blob = new Blob([new Uint8Array(compressed) as unknown as BlobPart], { type: "application/gzip" });
		const url = URL.createObjectURL(blob);
		
		const filename = `${savedRun.name?.replace(/[^a-zA-Z0-9]/g, "_") || "simulation"}_${
			new Date().toISOString().split("T")[0]
		}.alphasolver`;
		
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	} catch (error) {
		throw new Error(`Failed to export run: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Imports a SavedRun from a compressed file
 */
export async function importRun(file: File): Promise<SavedRun> {
	try {
		const arrayBuffer = await file.arrayBuffer();
		const compressed = new Uint8Array(arrayBuffer);
		
		// Decompress
		const decompressed = await decompressData(compressed);
		
		// Parse JSON
		const savedRun = JSON.parse(decompressed) as SavedRun;
		
		// Validate structure
		if (!savedRun.version || !savedRun.result || !savedRun.accountConfig) {
			throw new Error("Invalid file format: missing required fields");
		}
		
		return savedRun;
	} catch (error) {
		throw new Error(`Failed to import run: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Estimates the file size of a SavedRun (compressed)
 */
export function estimateFileSize(result: SimulationResult): string {
	// Rough estimate based on equity curves size
	const numPaths = result.equityCurves?.length || 0;
	const avgDays = result.equityCurves?.[0]?.length || 100;
	
	// Each number is ~8 bytes, JSON overhead ~2x, gzip compression ~10x reduction
	const uncompressedBytes = numPaths * avgDays * 8 * 2;
	const compressedBytes = uncompressedBytes / 10;
	
	if (compressedBytes < 1024) {
		return `~${Math.round(compressedBytes)} B`;
	} else if (compressedBytes < 1024 * 1024) {
		return `~${(compressedBytes / 1024).toFixed(1)} KB`;
	} else {
		return `~${(compressedBytes / (1024 * 1024)).toFixed(1)} MB`;
	}
}
