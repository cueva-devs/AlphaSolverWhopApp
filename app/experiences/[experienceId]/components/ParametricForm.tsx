"use client";

import { useState, useEffect } from "react";
import { Button, Text, Callout } from "@whop/react/components";
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
					Stop Size
				</Text>
				<input
					type="number"
					id="stopSize"
					name="stopSize"
					value={formData.stopSize.toString()}
					onChange={handleChange}
					step="any"
					min="0"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
				/>
				{errors.stopSize && (
					<Callout.Root color="red" className="mt-1">
						<Callout.Text size="1">{errors.stopSize}</Callout.Text>
					</Callout.Root>
				)}
				<Text size="1" color="gray" className="mt-1">
					The size of your stop loss in dollars
				</Text>
			</div>

			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Take Profit Size
				</Text>
				<input
					type="number"
					id="takeProfitSize"
					name="takeProfitSize"
					value={formData.takeProfitSize.toString()}
					onChange={handleChange}
					step="any"
					min="0"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
				/>
				{errors.takeProfitSize && (
					<Callout.Root color="red" className="mt-1">
						<Callout.Text size="1">{errors.takeProfitSize}</Callout.Text>
					</Callout.Root>
				)}
				<Text size="1" color="gray" className="mt-1">
					The size of your take profit target in dollars
				</Text>
			</div>

			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Win Rate (%)
				</Text>
				<input
					type="number"
					id="winRate"
					name="winRate"
					value={formData.winRate.toString()}
					onChange={handleChange}
					step="0.1"
					min="0"
					max="100"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
				/>
				{errors.winRate && (
					<Callout.Root color="red" className="mt-1">
						<Callout.Text size="1">{errors.winRate}</Callout.Text>
					</Callout.Root>
				)}
				<Text size="1" color="gray" className="mt-1">
					Expected win rate percentage (0-100)
				</Text>
			</div>

			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Average MFE
				</Text>
				<input
					type="number"
					id="averageMFE"
					name="averageMFE"
					value={formData.averageMFE.toString()}
					onChange={handleChange}
					step="any"
					min="0"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
				/>
				{errors.averageMFE && (
					<Callout.Root color="red" className="mt-1">
						<Callout.Text size="1">{errors.averageMFE}</Callout.Text>
					</Callout.Root>
				)}
				<Text size="1" color="gray" className="mt-1">
					Average Maximum Favorable Excursion in dollars
				</Text>
			</div>

			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Trades Per Day
				</Text>
				<input
					type="number"
					id="tradesPerDay"
					name="tradesPerDay"
					value={formData.tradesPerDay.toString()}
					onChange={handleChange}
					step="1"
					min="1"
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
				/>
				{errors.tradesPerDay && (
					<Callout.Root color="red" className="mt-1">
						<Callout.Text size="1">{errors.tradesPerDay}</Callout.Text>
					</Callout.Root>
				)}
				<Text size="1" color="gray" className="mt-1">
					Average number of trades executed per day
				</Text>
			</div>

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
					Number of simulation paths to generate (max: {planConfig.maxPaths})
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
			>
				Run Simulation
			</Button>
		</form>
	);
}

