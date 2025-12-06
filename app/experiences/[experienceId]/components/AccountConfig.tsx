"use client";

import { useState } from "react";
import type { AccountConfig, GameType, PropFirm, ChallengeSize } from "../types";

interface AccountConfigProps {
	config: AccountConfig;
	onChange: (config: AccountConfig) => void;
}

export default function AccountConfigPanel({
	config,
	onChange,
}: AccountConfigProps) {
	const [showAccountRules, setShowAccountRules] = useState(false);

	const handleGameTypeChange = (gameType: GameType) => {
		onChange({ ...config, gameType });
	};

	const handlePropFirmChange = (propFirm: PropFirm) => {
		onChange({ ...config, propFirm });
	};

	const handleChallengeChange = (challenge: ChallengeSize) => {
		onChange({ ...config, challenge });
	};

	return (
		<div className="space-y-4">
			{/* Game Type */}
			<div>
				<label className="block text-sm font-medium text-gray-11 mb-2">
					Game Type
				</label>
				<div className="space-y-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="gameType"
							value="combine"
							checked={config.gameType === "combine"}
							onChange={() => handleGameTypeChange("combine")}
							className="w-4 h-4 text-blue-600 bg-gray-a3 border-gray-a5 focus:ring-blue-500"
						/>
						<span className="text-sm text-gray-12">Combine + Funded</span>
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="gameType"
							value="combine_only"
							checked={config.gameType === "combine_only"}
							onChange={() => handleGameTypeChange("combine_only")}
							className="w-4 h-4 text-blue-600 bg-gray-a3 border-gray-a5 focus:ring-blue-500"
						/>
						<span className="text-sm text-gray-12">Combine Only</span>
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="gameType"
							value="funded_only"
							checked={config.gameType === "funded_only"}
							onChange={() => handleGameTypeChange("funded_only")}
							className="w-4 h-4 text-blue-600 bg-gray-a3 border-gray-a5 focus:ring-blue-500"
						/>
						<span className="text-sm text-gray-12">Funded Only</span>
					</label>
				</div>
			</div>

			{/* Prop Firm */}
			<div>
				<label
					htmlFor="propFirm"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Prop Firm
				</label>
				<select
					id="propFirm"
					value={config.propFirm}
					onChange={(e) => handlePropFirmChange(e.target.value as PropFirm)}
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="Topstep">Topstep</option>
					<option value="Apex">Apex</option>
					<option value="FTMO">FTMO</option>
					<option value="E8">E8</option>
					<option value="Custom">Custom</option>
				</select>
			</div>

			{/* Challenge */}
			<div>
				<label
					htmlFor="challenge"
					className="block text-sm font-medium text-gray-11 mb-1"
				>
					Challenge
				</label>
				<select
					id="challenge"
					value={config.challenge}
					onChange={(e) =>
						handleChallengeChange(e.target.value as ChallengeSize)
					}
					className="w-full px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="10k">10k</option>
					<option value="25k">25k</option>
					<option value="50k">50k</option>
					<option value="100k">100k</option>
					<option value="150k">150k</option>
					<option value="250k">250k</option>
					<option value="300k">300k</option>
				</select>
			</div>

			{/* Account Rules (Expandable) */}
			<div>
				<button
					type="button"
					onClick={() => setShowAccountRules(!showAccountRules)}
					className="flex items-center gap-2 text-sm font-medium text-gray-11 hover:text-gray-12 transition-colors"
				>
					<span>{showAccountRules ? "▼" : "▶"}</span>
					<span>Account Rules</span>
				</button>
				{showAccountRules && (
					<div className="mt-2 p-3 bg-gray-a3 border border-gray-a5 rounded-md text-xs text-gray-10">
						<p className="mb-2">Default Topstep Rules:</p>
						<ul className="list-disc list-inside space-y-1">
							<li>Initial Balance: $50,000</li>
							<li>Max Loss (Eval): $2,000</li>
							<li>Max Daily Loss: $1,000</li>
							<li>Max Daily Win: $5,000</li>
							<li>Funding Target: $52,500 (5%)</li>
							<li>Profit Share: 90%</li>
							<li>Min Winning Days: 5</li>
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}

