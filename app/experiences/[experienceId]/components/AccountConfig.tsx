"use client";

import { useState, useEffect } from "react";
import { RadioGroup, Select, Text, Button } from "@whop/react/components";
import type { AccountConfig, GameType, PropFirm, ChallengeSize } from "../types";
import { PROP_FIRMS, getPropFirmList, getChallengeList, getAccountConfig } from "../config/propFirmConfig";

interface AccountConfigProps {
	config: AccountConfig;
	onChange: (config: AccountConfig) => void;
}

export default function AccountConfigPanel({
	config,
	onChange,
}: AccountConfigProps) {
	const [showAccountRules, setShowAccountRules] = useState(false);
	
	const propFirmList = getPropFirmList();
	const challengeList = getChallengeList(config.propFirm);
	const accountRules = getAccountConfig(config.propFirm, config.challenge);

	// When prop firm changes, reset challenge to first available
	useEffect(() => {
		const challenges = getChallengeList(config.propFirm);
		if (challenges.length > 0 && !challenges.includes(config.challenge)) {
			onChange({ ...config, challenge: challenges[0] });
		}
	}, [config.propFirm]);

	const handleGameTypeChange = (gameType: GameType) => {
		onChange({ ...config, gameType });
	};

	const handlePropFirmChange = (propFirm: PropFirm) => {
		const challenges = getChallengeList(propFirm);
		const newChallenge = challenges.length > 0 ? challenges[0] : config.challenge;
		onChange({ ...config, propFirm, challenge: newChallenge });
	};

	const handleChallengeChange = (challenge: ChallengeSize) => {
		onChange({ ...config, challenge });
	};

	const formatCurrency = (value: number) => {
		if (value >= 99999) return "No limit";
		return `$${value.toLocaleString()}`;
	};

	return (
		<div className="space-y-4">
			{/* Game Type */}
			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Game Type
				</Text>
				<RadioGroup.Root
					value={config.gameType}
					onValueChange={(value) => handleGameTypeChange(value as GameType)}
				>
					<div className="flex items-center gap-2">
						<RadioGroup.Item value="combine" id="combine" />
						<label htmlFor="combine">
							<Text size="2">Combine + Funded</Text>
						</label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroup.Item value="combine_only" id="combine_only" />
						<label htmlFor="combine_only">
							<Text size="2">Combine Only</Text>
						</label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroup.Item value="funded_only" id="funded_only" />
						<label htmlFor="funded_only">
							<Text size="2">Funded Only</Text>
						</label>
					</div>
				</RadioGroup.Root>
			</div>

			{/* Prop Firm */}
			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Prop Firm
				</Text>
				<Select.Root
					value={config.propFirm}
					onValueChange={(value) => handlePropFirmChange(value as PropFirm)}
				>
					<Select.Trigger />
					<Select.Content>
						{propFirmList.map((firm) => (
							<Select.Item key={firm} value={firm}>{firm}</Select.Item>
						))}
					</Select.Content>
				</Select.Root>
			</div>

			{/* Challenge */}
			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Challenge
				</Text>
				<Select.Root
					value={config.challenge}
					onValueChange={(value) => handleChallengeChange(value as ChallengeSize)}
				>
					<Select.Trigger />
					<Select.Content>
						{challengeList.map((challenge) => (
							<Select.Item key={challenge} value={challenge}>{challenge}</Select.Item>
						))}
					</Select.Content>
				</Select.Root>
			</div>

			{/* Account Rules (Expandable) */}
			<div>
				<Button
					type="button"
					variant="ghost"
					size="2"
					onClick={() => setShowAccountRules(!showAccountRules)}
					className="flex items-center gap-2 p-0 h-auto"
				>
					<Text size="2" weight="medium">
						{showAccountRules ? "▼" : "▶"} Account Rules
					</Text>
				</Button>
				{showAccountRules && accountRules && (
					<div className="mt-2 p-3 bg-gray-a2 border border-gray-a5 rounded-md">
						<Text size="1" weight="medium" className="mb-2 block">
							{config.propFirm} {config.challenge} Rules:
						</Text>
						<ul className="list-disc list-inside space-y-1">
							<li>
								<Text size="1" color="gray">
									Initial Balance: {formatCurrency(accountRules.rules['Initial Balance (Eval)'])}
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Max Loss (Eval): {formatCurrency(accountRules.rules['Max Loss (Eval)'])}
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Max Daily Loss: {formatCurrency(accountRules.rules['Maximum Daily Loss'])}
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Max Daily Win: {formatCurrency(accountRules.rules['Maximum Daily Win'])}
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Funding Target: {formatCurrency(accountRules.rules['Funding Target Balance'])}
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Profit Share: {(accountRules.rules['Profit Share Fraction'] * 100).toFixed(0)}%
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Min Winning Days: {accountRules.rules['Minimum Winning Days for Payout']}
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Eval Cost: {formatCurrency(accountRules.fees['Eval Acct Cost'])}/month
								</Text>
							</li>
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}

