"use client";

import { useState } from "react";
import { RadioGroup, Select, Text, Heading, Collapsible } from "@whop/react/components";
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
					<Select.Trigger size="2" />
					<Select.Content>
						<Select.Item value="Topstep">Topstep</Select.Item>
						<Select.Item value="Apex">Apex</Select.Item>
						<Select.Item value="FTMO">FTMO</Select.Item>
						<Select.Item value="E8">E8</Select.Item>
						<Select.Item value="Custom">Custom</Select.Item>
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
					onValueChange={(value) =>
						handleChallengeChange(value as ChallengeSize)
					}
				>
					<Select.Trigger size="2" />
					<Select.Content>
						<Select.Item value="10k">10k</Select.Item>
						<Select.Item value="25k">25k</Select.Item>
						<Select.Item value="50k">50k</Select.Item>
						<Select.Item value="100k">100k</Select.Item>
						<Select.Item value="150k">150k</Select.Item>
						<Select.Item value="250k">250k</Select.Item>
						<Select.Item value="300k">300k</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			{/* Account Rules (Expandable) */}
			<Collapsible.Root open={showAccountRules} onOpenChange={setShowAccountRules}>
				<Collapsible.Trigger asChild>
					<button
						type="button"
						className="flex items-center gap-2"
					>
						<Text size="2" weight="medium">
							Account Rules
						</Text>
					</button>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<div className="mt-2 p-3 bg-gray-a2 border border-gray-a5 rounded-md">
						<Text size="1" weight="medium" className="mb-2 block">
							Default Topstep Rules:
						</Text>
						<ul className="list-disc list-inside space-y-1">
							<li>
								<Text size="1" color="gray">
									Initial Balance: $50,000
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Max Loss (Eval): $2,000
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Max Daily Loss: $1,000
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Max Daily Win: $5,000
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Funding Target: $52,500 (5%)
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Profit Share: 90%
								</Text>
							</li>
							<li>
								<Text size="1" color="gray">
									Min Winning Days: 5
								</Text>
							</li>
						</ul>
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
		</div>
	);
}

