"use client";

import { useState, useEffect } from "react";
import { RadioGroup, Select, Text, Button } from "@whop/react/components";
import type { AccountConfig, GameType, PropFirm, ChallengeSize, AccountRuleOverrides, AccountFeeOverrides } from "../types";
import { PROP_FIRMS, getPropFirmList, getChallengeList, getAccountConfig } from "../config/propFirmConfig";

interface RuleInputProps {
	label: string;
	ruleKey: string;
	defaultValue: number;
	overrideValue?: number;
	onChange: (key: string, value: number) => void;
	prefix?: string;
	suffix?: string;
	step?: number;
}

function RuleInput({ label, ruleKey, defaultValue, overrideValue, onChange, prefix, suffix, step = 100 }: RuleInputProps) {
	const currentValue = overrideValue !== undefined ? overrideValue : defaultValue;
	const isOverridden = overrideValue !== undefined;

	return (
		<div className="flex items-center justify-between gap-2">
			<Text size="1" color="gray" className="flex-shrink-0">
				{label}
			</Text>
			<div className="flex items-center gap-1">
				{prefix && <Text size="1" color="gray">{prefix}</Text>}
				<input
					type="number"
					value={currentValue}
					onChange={(e) => onChange(ruleKey, parseFloat(e.target.value) || 0)}
					step={step}
					className={`w-20 px-2 py-1 text-xs text-right rounded border ${
						isOverridden 
							? 'border-violet-500 bg-violet-500/10' 
							: 'border-gray-a5 bg-gray-a2'
					}`}
				/>
				{suffix && <Text size="1" color="gray">{suffix}</Text>}
			</div>
		</div>
	);
}

interface AccountConfigProps {
	config: AccountConfig;
	onChange: (config: AccountConfig) => void;
}

export default function AccountConfigPanel({
	config,
	onChange,
}: AccountConfigProps) {
	const [showAccountRules, setShowAccountRules] = useState(false);

	// Check if any overrides are set
	const hasOverrides = Boolean(
		(config.ruleOverrides && Object.keys(config.ruleOverrides).length > 0) ||
		(config.feeOverrides && Object.keys(config.feeOverrides).length > 0)
	);

	// Handle rule override changes
	const handleRuleChange = (key: string, value: number) => {
		const newOverrides = { ...config.ruleOverrides, [key]: value };
		onChange({ ...config, ruleOverrides: newOverrides as AccountRuleOverrides });
	};

	// Handle fee override changes
	const handleFeeChange = (key: string, value: number) => {
		const newOverrides = { ...config.feeOverrides, [key]: value };
		onChange({ ...config, feeOverrides: newOverrides as AccountFeeOverrides });
	};

	// Reset all overrides
	const handleResetOverrides = () => {
		onChange({ ...config, ruleOverrides: undefined, feeOverrides: undefined });
	};
	
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

			{/* Account Rules (Expandable & Editable) */}
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
					<div className="mt-2 p-3 bg-gray-a2 border border-gray-a5 rounded-md space-y-3">
						<div className="flex items-center justify-between">
							<Text size="1" weight="medium">
								{config.propFirm} {config.challenge} Rules
							</Text>
							{hasOverrides && (
								<Button
									type="button"
									variant="ghost"
									size="1"
									onClick={handleResetOverrides}
								>
									<Text size="1" color="red">Reset</Text>
								</Button>
							)}
						</div>
						<Text size="1" color="gray" className="block">
							Edit any value to override the default.
						</Text>
						
						{/* Rules */}
						<div className="space-y-2">
							<RuleInput
								label="Initial Balance (Eval)"
								ruleKey="Initial Balance (Eval)"
								defaultValue={accountRules.rules['Initial Balance (Eval)']}
								overrideValue={config.ruleOverrides?.['Initial Balance (Eval)']}
								onChange={handleRuleChange}
								prefix="$"
							/>
							<RuleInput
								label="Max Loss (Eval)"
								ruleKey="Max Loss (Eval)"
								defaultValue={accountRules.rules['Max Loss (Eval)']}
								overrideValue={config.ruleOverrides?.['Max Loss (Eval)']}
								onChange={handleRuleChange}
								prefix="$"
							/>
							<RuleInput
								label="Max Daily Loss"
								ruleKey="Maximum Daily Loss"
								defaultValue={accountRules.rules['Maximum Daily Loss']}
								overrideValue={config.ruleOverrides?.['Maximum Daily Loss']}
								onChange={handleRuleChange}
								prefix="$"
							/>
							<RuleInput
								label="Max Daily Win"
								ruleKey="Maximum Daily Win"
								defaultValue={accountRules.rules['Maximum Daily Win']}
								overrideValue={config.ruleOverrides?.['Maximum Daily Win']}
								onChange={handleRuleChange}
								prefix="$"
							/>
							<RuleInput
								label="Funding Target"
								ruleKey="Funding Target Balance"
								defaultValue={accountRules.rules['Funding Target Balance']}
								overrideValue={config.ruleOverrides?.['Funding Target Balance']}
								onChange={handleRuleChange}
								prefix="$"
							/>
							<RuleInput
								label="Profit Share %"
								ruleKey="Profit Share Fraction"
								defaultValue={accountRules.rules['Profit Share Fraction'] * 100}
								overrideValue={config.ruleOverrides?.['Profit Share Fraction'] !== undefined ? config.ruleOverrides['Profit Share Fraction'] * 100 : undefined}
								onChange={(key, val) => handleRuleChange(key, val / 100)}
								suffix="%"
								step={1}
							/>
							<RuleInput
								label="Min Winning Days"
								ruleKey="Minimum Winning Days for Payout"
								defaultValue={accountRules.rules['Minimum Winning Days for Payout']}
								overrideValue={config.ruleOverrides?.['Minimum Winning Days for Payout']}
								onChange={handleRuleChange}
								step={1}
							/>
							<RuleInput
								label="Winning Day Min P&L"
								ruleKey="Winning Day PnL Minimum"
								defaultValue={accountRules.rules['Winning Day PnL Minimum']}
								overrideValue={config.ruleOverrides?.['Winning Day PnL Minimum']}
								onChange={handleRuleChange}
								prefix="$"
							/>
						</div>

						{/* Fees */}
						<Text size="1" weight="medium" className="block pt-2 border-t border-gray-a5">
							Fees
						</Text>
						<div className="space-y-2">
							<RuleInput
								label="Eval Account Cost"
								ruleKey="Eval Acct Cost"
								defaultValue={accountRules.fees['Eval Acct Cost']}
								overrideValue={config.feeOverrides?.['Eval Acct Cost']}
								onChange={handleFeeChange}
								prefix="$"
							/>
							<RuleInput
								label="Monthly Eval Cost"
								ruleKey="Monthly Eval Cost"
								defaultValue={accountRules.fees['Monthly Eval Cost']}
								overrideValue={config.feeOverrides?.['Monthly Eval Cost']}
								onChange={handleFeeChange}
								prefix="$"
							/>
							<RuleInput
								label="Funded Setup Cost"
								ruleKey="Funded Acct Setup Cost"
								defaultValue={accountRules.fees['Funded Acct Setup Cost']}
								overrideValue={config.feeOverrides?.['Funded Acct Setup Cost']}
								onChange={handleFeeChange}
								prefix="$"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

