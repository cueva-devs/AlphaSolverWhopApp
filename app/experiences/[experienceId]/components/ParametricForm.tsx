"use client";

import { useState, useEffect } from "react";
import type { ParametricParams } from "../types";
import type { PlanConfig } from "../config/planConfig";

interface ParametricFormProps {
	onSubmit: (params: ParametricParams) => void;
	planConfig: PlanConfig;
}

interface FormErrors {
	stopSize?: string;
	takeProfitSize?: string;
	winRate?: string;
	averageMFE?: string;
	tradesPerDay?: string;
	numPaths?: string;
	numDays?: string;
}

export default function ParametricForm({
	onSubmit,
	planConfig,
}: ParametricFormProps) {
	const [formData, setFormData] = useState<ParametricParams>({
		stopSize: 100,
		takeProfitSize: 200,
		winRate: 50,
		averageMFE: 150,
		tradesPerDay: 5,
		numPaths: Math.min(1000, planConfig.maxPaths),
		numDays: Math.min(30, planConfig.maxDays),
	});

	const [errors, setErrors] = useState<FormErrors>({});
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

		if (formData.stopSize <= 0) {
			newErrors.stopSize = "Stop size must be greater than 0";
		}

		if (formData.takeProfitSize <= 0) {
			newErrors.takeProfitSize = "Take profit size must be greater than 0";
		}

		if (formData.winRate < 0 || formData.winRate > 100) {
			newErrors.winRate = "Win rate must be between 0 and 100";
		}

		if (formData.averageMFE <= 0) {
			newErrors.averageMFE = "Average MFE must be greater than 0";
		}

		if (formData.tradesPerDay <= 0) {
			newErrors.tradesPerDay = "Trades per day must be greater than 0";
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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validate()) {
			onSubmit(formData);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
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

		// Clear error when user starts typing
		if (errors[name as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
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
					htmlFor="stopSize"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Stop Size
				</label>
				<input
					type="number"
					id="stopSize"
					name="stopSize"
					value={formData.stopSize}
					onChange={handleChange}
					step="any"
					min="0"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
				/>
				{errors.stopSize && (
					<p className="mt-1 text-xs text-red-9">{errors.stopSize}</p>
				)}
				<p className="mt-1 text-xs text-gray-9">
					The size of your stop loss in dollars
				</p>
			</div>

			<div>
				<label
					htmlFor="takeProfitSize"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Take Profit Size
				</label>
				<input
					type="number"
					id="takeProfitSize"
					name="takeProfitSize"
					value={formData.takeProfitSize}
					onChange={handleChange}
					step="any"
					min="0"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
				/>
				{errors.takeProfitSize && (
					<p className="mt-1 text-xs text-red-9">{errors.takeProfitSize}</p>
				)}
				<p className="mt-1 text-xs text-gray-9">
					The size of your take profit target in dollars
				</p>
			</div>

			<div>
				<label
					htmlFor="winRate"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Win Rate (%)
				</label>
				<input
					type="number"
					id="winRate"
					name="winRate"
					value={formData.winRate}
					onChange={handleChange}
					step="0.1"
					min="0"
					max="100"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
				/>
				{errors.winRate && (
					<p className="mt-1 text-xs text-red-9">{errors.winRate}</p>
				)}
				<p className="mt-1 text-xs text-gray-9">
					Expected win rate percentage (0-100)
				</p>
			</div>

			<div>
				<label
					htmlFor="averageMFE"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Average MFE
				</label>
				<input
					type="number"
					id="averageMFE"
					name="averageMFE"
					value={formData.averageMFE}
					onChange={handleChange}
					step="any"
					min="0"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
				/>
				{errors.averageMFE && (
					<p className="mt-1 text-xs text-red-9">{errors.averageMFE}</p>
				)}
				<p className="mt-1 text-xs text-gray-9">
					Average Maximum Favorable Excursion in dollars
				</p>
			</div>

			<div>
				<label
					htmlFor="tradesPerDay"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Trades Per Day
				</label>
				<input
					type="number"
					id="tradesPerDay"
					name="tradesPerDay"
					value={formData.tradesPerDay}
					onChange={handleChange}
					step="1"
					min="1"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:border-transparent"
				/>
				{errors.tradesPerDay && (
					<p className="mt-1 text-xs text-red-9">{errors.tradesPerDay}</p>
				)}
				<p className="mt-1 text-xs text-gray-9">
					Average number of trades executed per day
				</p>
			</div>

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
					Number of simulation paths to generate (max: {planConfig.maxPaths})
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
				className="w-full px-4 py-2 bg-gray-a4 hover:bg-gray-a5 border border-gray-a6 text-gray-12 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:ring-offset-2 focus:ring-offset-gray-a2"
			>
				Run Simulation
			</button>
		</form>
	);
}

