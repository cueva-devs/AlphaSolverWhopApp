"use client";

import { useState, useEffect } from "react";
import type { BootstrappedParams, ParsedTrade } from "../types";
import { parseTradeCsv } from "../lib/csvUtils";
import type { PlanConfig } from "../config/planConfig";

interface BootstrappedFormProps {
	onSubmit: (params: BootstrappedParams, trades: ParsedTrade[]) => void;
	planConfig: PlanConfig;
}

interface FormErrors {
	csvFile?: string;
	pnlColumn?: string;
	dateColumn?: string;
	mfeColumn?: string;
	numPaths?: string;
	numDays?: string;
	general?: string;
}

export default function BootstrappedForm({
	onSubmit,
	planConfig,
}: BootstrappedFormProps) {
	const [formData, setFormData] = useState<BootstrappedParams>({
		template: "Generic",
		numPaths: Math.min(1000, planConfig.maxPaths),
		numDays: Math.min(30, planConfig.maxDays),
	});

	const [csvFile, setCsvFile] = useState<File | null>(null);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isParsing, setIsParsing] = useState(false);
	const [showUpgradeWarning, setShowUpgradeWarning] = useState(false);

	// Update form data if plan limits change
	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			numPaths: Math.min(prev.numPaths, planConfig.maxPaths),
			numDays: Math.min(prev.numDays, planConfig.maxDays),
		}));
	}, [planConfig.maxPaths, planConfig.maxDays]);

	const validate = (): boolean => {
		const newErrors: FormErrors = {};

		if (!csvFile) {
			newErrors.csvFile = "Please select a CSV file";
		}

		if (formData.template === "Custom") {
			if (!formData.pnlColumn?.trim()) {
				newErrors.pnlColumn = "PNL column name is required";
			}
			if (!formData.dateColumn?.trim()) {
				newErrors.dateColumn = "Date column name is required";
			}
			if (!formData.mfeColumn?.trim()) {
				newErrors.mfeColumn = "MFE column name is required";
			}
		}

		if (formData.numPaths <= 0) {
			newErrors.numPaths = "Number of paths must be greater than 0";
		} else if (formData.numPaths > planConfig.maxPaths) {
			newErrors.numPaths = `Your current plan allows up to ${planConfig.maxPaths} paths. Upgrade on Whop to increase this limit.`;
		}

		if (formData.numDays <= 0) {
			newErrors.numDays = "Number of days must be greater than 0";
		} else if (formData.numDays > planConfig.maxDays) {
			newErrors.numDays = `Your current plan allows up to ${planConfig.maxDays} days. Upgrade on Whop to increase this limit.`;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validate() || !csvFile) {
			return;
		}

		setIsParsing(true);
		setErrors({});

		try {
			const trades = await parseTradeCsv(csvFile, {
				template: formData.template,
				pnlColumn: formData.pnlColumn,
				dateColumn: formData.dateColumn,
				mfeColumn: formData.mfeColumn,
			});

			onSubmit(formData, trades);
		} catch (error) {
			setErrors({
				general:
					error instanceof Error
						? error.message
						: "Failed to parse CSV file. Please check the file format.",
			});
		} finally {
			setIsParsing(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
				setErrors({ csvFile: "Please select a valid CSV file" });
				setCsvFile(null);
			} else {
				setCsvFile(file);
				setErrors((prev) => ({ ...prev, csvFile: undefined }));
			}
		}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		if (name === "template") {
			setFormData((prev) => ({
				...prev,
				template: value as BootstrappedParams["template"],
				// Clear custom columns when switching away from Custom
				...(value !== "Custom" && {
					pnlColumn: undefined,
					dateColumn: undefined,
					mfeColumn: undefined,
				}),
			}));
		} else {
			const numValue = parseFloat(value);
			const newValue = isNaN(numValue) ? value : numValue;

			setFormData((prev) => ({
				...prev,
				[name]: newValue,
			}));

			// Check for plan limit warnings
			if (name === "numPaths" && typeof newValue === "number") {
				setShowUpgradeWarning(newValue > planConfig.maxPaths);
			} else if (name === "numDays" && typeof newValue === "number") {
				setShowUpgradeWarning(newValue > planConfig.maxDays);
			}
		}
		// Clear errors when user changes input
		if (errors[name as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{errors.general && (
				<div className="p-3 bg-red-a2 border border-red-a5 rounded-md text-red-11 text-sm">
					{errors.general}
				</div>
			)}

			{/* Plan Limits Warning */}
			{(showUpgradeWarning ||
				formData.numPaths > planConfig.maxPaths ||
				formData.numDays > planConfig.maxDays) && (
				<div className="p-3 bg-yellow-a2 border border-yellow-a5 rounded-lg">
					<p className="text-xs text-yellow-11">
						Your current plan ({planConfig.label}) allows up to{" "}
						{planConfig.maxPaths} paths / {planConfig.maxDays} days. Upgrade
						on Whop to increase these limits.
					</p>
				</div>
			)}

			<div>
				<label
					htmlFor="csvFile"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					CSV File
				</label>
				<input
					type="file"
					id="csvFile"
					name="csvFile"
					accept=".csv,text/csv"
					onChange={handleFileChange}
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-a4 file:text-gray-12 hover:file:bg-gray-a5 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
				/>
				{errors.csvFile && (
					<p className="mt-1 text-xs text-red-9">{errors.csvFile}</p>
				)}
				{csvFile && (
					<p className="mt-1 text-xs text-gray-9">
						Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
					</p>
				)}
				<p className="mt-1 text-xs text-gray-9">
					Upload a CSV file containing your trade history
				</p>
			</div>

			<div>
				<label
					htmlFor="template"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Template
				</label>
				<select
					id="template"
					name="template"
					value={formData.template}
					onChange={handleChange}
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
				>
					<option value="NinjaTrader">NinjaTrader</option>
					<option value="Generic">Generic</option>
					<option value="Custom">Custom</option>
				</select>
				<p className="mt-1 text-xs text-gray-9">
					Select the CSV format template or use Custom to specify column names
				</p>
			</div>

			{formData.template === "Custom" && (
				<>
					<div>
						<label
							htmlFor="pnlColumn"
							className="block text-sm font-medium text-gray-11 mb-1"
						>
							PNL Column Name
						</label>
						<input
							type="text"
							id="pnlColumn"
							name="pnlColumn"
							value={formData.pnlColumn || ""}
							onChange={handleChange}
							placeholder="e.g., Profit, PnL, Net"
							className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
						/>
						{errors.pnlColumn && (
							<p className="mt-1 text-xs text-red-9">{errors.pnlColumn}</p>
						)}
						<p className="mt-1 text-xs text-gray-9">
							Name of the column containing profit/loss values
						</p>
					</div>

					<div>
						<label
							htmlFor="dateColumn"
							className="block text-sm font-medium text-gray-11 mb-1"
						>
							Date Column Name
						</label>
						<input
							type="text"
							id="dateColumn"
							name="dateColumn"
							value={formData.dateColumn || ""}
							onChange={handleChange}
							placeholder="e.g., Date, Time, DateTime"
							className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
						/>
						{errors.dateColumn && (
							<p className="mt-1 text-xs text-red-9">{errors.dateColumn}</p>
						)}
						<p className="mt-1 text-xs text-gray-9">
							Name of the column containing trade dates/times
						</p>
					</div>

					<div>
						<label
							htmlFor="mfeColumn"
							className="block text-sm font-medium text-gray-11 mb-1"
						>
							MFE Column Name
						</label>
						<input
							type="text"
							id="mfeColumn"
							name="mfeColumn"
							value={formData.mfeColumn || ""}
							onChange={handleChange}
							placeholder="e.g., MFE, MaxFavorableExcursion"
							className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
						/>
						{errors.mfeColumn && (
							<p className="mt-1 text-xs text-red-9">{errors.mfeColumn}</p>
						)}
						<p className="mt-1 text-xs text-gray-9">
							Name of the column containing Maximum Favorable Excursion values
						</p>
					</div>
				</>
			)}

			<div>
				<label
					htmlFor="numPaths"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Number of Paths
				</label>
				<input
					type="number"
					id="numPaths"
					name="numPaths"
					value={formData.numPaths}
					onChange={handleChange}
					step="1"
					min="1"
					max={planConfig.maxPaths}
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
				/>
				{errors.numPaths && (
					<p className="mt-1 text-xs text-red-9">{errors.numPaths}</p>
				)}
				<p className="mt-1 text-xs text-gray-9">
					Number of simulation paths to generate from your trade data (max:{" "}
					{planConfig.maxPaths})
				</p>
			</div>

			<div>
				<label
					htmlFor="numDays"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Number of Days
				</label>
				<input
					type="number"
					id="numDays"
					name="numDays"
					value={formData.numDays}
					onChange={handleChange}
					step="1"
					min="1"
					max={planConfig.maxDays}
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
				/>
				{errors.numDays && (
					<p className="mt-1 text-xs text-red-9">{errors.numDays}</p>
				)}
				<p className="mt-1 text-xs text-gray-9">
					Number of days to simulate (max: {planConfig.maxDays})
				</p>
			</div>

			<button
				type="submit"
				disabled={isParsing}
				className="w-full px-4 py-2 bg-gray-a4 hover:bg-gray-a5 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-a6 text-gray-12 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:ring-offset-2 focus:ring-offset-gray-a2"
			>
				{isParsing ? "Parsing CSV..." : "Run Simulation"}
			</button>
		</form>
	);
}

