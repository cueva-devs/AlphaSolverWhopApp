"use client";

import type { SavedRun, SimulationResult, AccountConfig, BootstrappedParams, ParsedTrade, CsvFormat } from "../types";

const CURRENT_VERSION = "1.0.0";

// Magic bytes to identify gzip compressed data
const GZIP_MAGIC = [0x1f, 0x8b]; // gzip magic number

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
 * Check if CompressionStream API is available
 * Not available in Safari < 16.4 and some older browsers
 */
function isCompressionSupported(): boolean {
	return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

/**
 * Compresses data using the native CompressionStream API if available,
 * otherwise returns uncompressed data
 */
async function compressData(data: string): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const encoded = encoder.encode(data);
	
	// Fallback for browsers without CompressionStream (e.g., Safari < 16.4)
	if (!isCompressionSupported()) {
		console.warn("CompressionStream not available, saving uncompressed data");
		return encoded;
	}
	
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(encoded);
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
 * Check if data is gzip compressed by looking at magic bytes
 */
function isGzipCompressed(data: Uint8Array): boolean {
	return data.length >= 2 && data[0] === GZIP_MAGIC[0] && data[1] === GZIP_MAGIC[1];
}

/**
 * Decompresses data using the native DecompressionStream API if compressed,
 * otherwise returns the data as-is (for backwards compatibility)
 */
async function decompressData(data: Uint8Array): Promise<string> {
	const decoder = new TextDecoder();
	
	// Check if data is actually compressed
	if (!isGzipCompressed(data)) {
		// Data is not gzip compressed, return as-is
		return decoder.decode(data);
	}
	
	// Fallback for browsers without DecompressionStream
	if (!isCompressionSupported()) {
		throw new Error(
			"This file was saved with compression, but your browser doesn't support decompression. " +
			"Please try opening it in Chrome, Edge, or Safari 16.4+."
		);
	}
	
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(data);
			controller.close();
		}
	});
	
	const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
	const reader = decompressedStream.getReader();
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
