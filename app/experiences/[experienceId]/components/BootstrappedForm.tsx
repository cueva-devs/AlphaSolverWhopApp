"use client";

import { useState, useEffect } from "react";
import { Select, Button, Text, Callout } from "@whop/react/components";
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
		template: "Generic (Simple)",
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
				<Callout.Root color="red">
					<Callout.Text size="2">{errors.general}</Callout.Text>
				</Callout.Root>
			)}

			{/* Plan Limits Warning */}
			{(showUpgradeWarning ||
				formData.numPaths > planConfig.maxPaths ||
				formData.numDays > planConfig.maxDays) && (
				<Callout.Root color="amber">
					<Callout.Text size="2">
						Your current plan ({planConfig.label}) allows up to{" "}
						{planConfig.maxPaths} paths / {planConfig.maxDays} days. Upgrade
						on Whop to increase these limits.
					</Callout.Text>
				</Callout.Root>
			)}

			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					CSV File
				</Text>
				<input
					type="file"
					id="csvFile"
					name="csvFile"
					accept=".csv,text/csv"
					onChange={handleFileChange}
					className="w-full text-2 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:font-medium file:bg-gray-a4 file:text-gray-12 hover:file:bg-gray-a5"
				/>
				{errors.csvFile && (
					<Callout.Root color="red" className="mt-1">
						<Callout.Text size="1">{errors.csvFile}</Callout.Text>
					</Callout.Root>
				)}
				{csvFile && (
					<Text size="1" color="gray" className="mt-1">
						Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
					</Text>
				)}
				<Text size="1" color="gray" className="mt-1">
					Upload a CSV file containing your trade history
				</Text>
			</div>

			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Template
				</Text>
				<Select.Root
					value={formData.template}
					onValueChange={(value) => {
						handleChange({
							target: { name: "template", value },
						} as React.ChangeEvent<HTMLSelectElement>);
					}}
				>
					<Select.Trigger />
					<Select.Content>
						<Select.Item value="NinjaTrader">NinjaTrader</Select.Item>
						<Select.Item value="TradingView (Strategy Tester)">TradingView (Strategy Tester)</Select.Item>
						<Select.Item value="TradingView (Broker History)">TradingView (Broker History)</Select.Item>
						<Select.Item value="Rithmic / R|Trader">Rithmic / R|Trader</Select.Item>
						<Select.Item value="Tradovate">Tradovate</Select.Item>
						<Select.Item value="MetaTrader 4 (MT4)">MetaTrader 4 (MT4)</Select.Item>
						<Select.Item value="MetaTrader 5 (MT5)">MetaTrader 5 (MT5)</Select.Item>
						<Select.Item value="Generic (Simple)">Generic (Simple)</Select.Item>
						<Select.Item value="Custom">Custom</Select.Item>
					</Select.Content>
				</Select.Root>
				<Text size="1" color="gray" className="mt-1">
					Select the CSV format template or use Custom to specify column names
				</Text>
			</div>

			{formData.template === "Custom" && (
				<>
					<div>
						<Text size="2" weight="medium" className="mb-2 block">
							PNL Column Name
						</Text>
						<input
							type="text"
							id="pnlColumn"
							name="pnlColumn"
							value={formData.pnlColumn || ""}
							onChange={handleChange}
							placeholder="e.g., Profit, PnL, Net"
							className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
						/>
						{errors.pnlColumn && (
							<Callout.Root color="red" className="mt-1">
								<Callout.Text size="1">{errors.pnlColumn}</Callout.Text>
							</Callout.Root>
						)}
						<Text size="1" color="gray" className="mt-1">
							Name of the column containing profit/loss values
						</Text>
					</div>

					<div>
						<Text size="2" weight="medium" className="mb-2 block">
							Date Column Name
						</Text>
						<input
							type="text"
							id="dateColumn"
							name="dateColumn"
							value={formData.dateColumn || ""}
							onChange={handleChange}
							placeholder="e.g., Date, Time, DateTime"
							className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
						/>
						{errors.dateColumn && (
							<Callout.Root color="red" className="mt-1">
								<Callout.Text size="1">{errors.dateColumn}</Callout.Text>
							</Callout.Root>
						)}
						<Text size="1" color="gray" className="mt-1">
							Name of the column containing trade dates/times
						</Text>
					</div>

					<div>
						<Text size="2" weight="medium" className="mb-2 block">
							MFE Column Name
						</Text>
						<input
							type="text"
							id="mfeColumn"
							name="mfeColumn"
							value={formData.mfeColumn || ""}
							onChange={handleChange}
							placeholder="e.g., MFE, MaxFavorableExcursion"
							className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
						/>
						{errors.mfeColumn && (
							<Callout.Root color="red" className="mt-1">
								<Callout.Text size="1">{errors.mfeColumn}</Callout.Text>
							</Callout.Root>
						)}
						<Text size="1" color="gray" className="mt-1">
							Name of the column containing Maximum Favorable Excursion values
						</Text>
					</div>
				</>
			)}

			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Number of Paths
				</Text>
				<input
					type="number"
					id="numPaths"
					name="numPaths"
					value={formData.numPaths.toString()}
					onChange={handleChange}
					step="1"
					min="1"
					max={planConfig.maxPaths}
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
				/>
				{errors.numPaths && (
					<Callout.Root color="red" className="mt-1">
						<Callout.Text size="1">{errors.numPaths}</Callout.Text>
					</Callout.Root>
				)}
				<Text size="1" color="gray" className="mt-1">
					Number of simulation paths to generate from your trade data (max:{" "}
					{planConfig.maxPaths})
				</Text>
			</div>

			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Number of Days
				</Text>
				<input
					type="number"
					id="numDays"
					name="numDays"
					value={formData.numDays.toString()}
					onChange={handleChange}
					step="1"
					min="1"
					max={planConfig.maxDays}
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
				/>
				{errors.numDays && (
					<Callout.Root color="red" className="mt-1">
						<Callout.Text size="1">{errors.numDays}</Callout.Text>
					</Callout.Root>
				)}
				<Text size="1" color="gray" className="mt-1">
					Number of days to simulate (max: {planConfig.maxDays})
				</Text>
			</div>

			<Button
				type="submit"
				size="2"
				variant="solid"
				color="blue"
				className="w-full"
				disabled={isParsing}
				loading={isParsing}
			>
				{isParsing ? "Parsing CSV..." : "Run Simulation"}
			</Button>
		</form>
	);
}

