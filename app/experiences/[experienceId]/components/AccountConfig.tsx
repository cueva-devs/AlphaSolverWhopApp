"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
		<div className="flex items-center justify-between gap-3">
			<span className="text-xs text-[var(--text-muted)] flex-shrink-0">
				{label}
			</span>
			<div className="flex items-center gap-1">
				{prefix && <span className="text-xs text-[var(--text-muted)]">{prefix}</span>}
				<input
					type="number"
					value={currentValue}
					onChange={(e) => onChange(ruleKey, parseFloat(e.target.value) || 0)}
					step={step}
					className={`input input-sm w-20 text-right font-mono ${isOverridden ? 'input-override' : ''}`}
				/>
				{suffix && <span className="text-xs text-[var(--text-muted)]">{suffix}</span>}
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

	return (
		<div className="space-y-5">
			{/* Game Type */}
			<div>
				<label className="section-label">Game Type</label>
				<div className="radio-group">
					<label className="radio-item">
						<input
							type="radio"
							name="gameType"
							value="combine"
							checked={config.gameType === "combine"}
							onChange={() => handleGameTypeChange("combine")}
							className="radio-input"
						/>
						<span className="radio-label">Combine + Funded</span>
					</label>
					<label className="radio-item">
						<input
							type="radio"
							name="gameType"
							value="combine_only"
							checked={config.gameType === "combine_only"}
							onChange={() => handleGameTypeChange("combine_only")}
							className="radio-input"
						/>
						<span className="radio-label">Combine Only</span>
					</label>
					<label className="radio-item">
						<input
							type="radio"
							name="gameType"
							value="funded_only"
							checked={config.gameType === "funded_only"}
							onChange={() => handleGameTypeChange("funded_only")}
							className="radio-input"
						/>
						<span className="radio-label">Funded Only</span>
					</label>
				</div>
			</div>

			{/* Prop Firm */}
			<div>
				<label className="section-label">Prop Firm</label>
				<select
					className="select"
					value={config.propFirm}
					onChange={(e) => handlePropFirmChange(e.target.value as PropFirm)}
				>
					{propFirmList.map((firm) => (
						<option key={firm} value={firm}>{firm}</option>
					))}
				</select>
			</div>

			{/* Challenge */}
			<div>
				<label className="section-label">Challenge</label>
				<select
					className="select"
					value={config.challenge}
					onChange={(e) => handleChallengeChange(e.target.value as ChallengeSize)}
				>
					{challengeList.map((challenge) => (
						<option key={challenge} value={challenge}>{challenge}</option>
					))}
				</select>
			</div>

			{/* Account Rules (Expandable & Editable) */}
			<div>
				<button
					type="button"
					className="expand-trigger"
					onClick={() => setShowAccountRules(!showAccountRules)}
				>
					<svg 
						className={`expand-icon ${showAccountRules ? 'expanded' : ''}`}
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						strokeWidth="2"
					>
						<path d="M9 18l6-6-6-6" />
					</svg>
					<span className="text-sm font-medium text-[var(--text-primary)]">
						Account Rules
					</span>
					{hasOverrides && (
						<span className="badge badge-accent text-[10px] ml-2">Modified</span>
					)}
				</button>
				
				<AnimatePresence>
					{showAccountRules && accountRules && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="overflow-hidden"
						>
							<div className="expand-content mt-3">
								<div className="flex items-center justify-between mb-3">
									<span className="text-xs font-medium text-[var(--text-primary)]">
										{config.propFirm} {config.challenge} Rules
									</span>
									{hasOverrides && (
										<button
											type="button"
											className="btn btn-ghost text-xs text-[var(--negative)]"
											onClick={handleResetOverrides}
										>
											Reset
										</button>
									)}
								</div>
								<p className="text-xs text-[var(--text-muted)] mb-4">
									Edit any value to override the default.
								</p>
								
								{/* Rules */}
								<div className="space-y-3">
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
								<div className="pt-4 mt-4 border-t border-[var(--border)]">
									<span className="text-xs font-medium text-[var(--text-primary)] block mb-3">
										Fees
									</span>
									<div className="space-y-3">
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
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
