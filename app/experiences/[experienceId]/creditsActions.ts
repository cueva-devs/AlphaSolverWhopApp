"use server";

import { DAILY_CREDITS } from "@/lib/constants";
import { useCredit } from "@/lib/credits-store";
import { resolveCreditsUserIdForAction } from "@/lib/credits-user";

export type ConsumeCreditResult =
	| { ok: true; credits: number; maxCredits: number }
	| { ok: false; error: string; credits?: number; maxCredits?: number };

export async function consumeCreditAction(iframeUserToken?: string | null): Promise<ConsumeCreditResult> {
	const userId = await resolveCreditsUserIdForAction(iframeUserToken ?? undefined);
	if (!userId) {
		return {
			ok: false,
			error: "Could not verify your Whop session. Open the app from Whop and try again.",
		};
	}

	try {
		const result = await useCredit(userId);
		if (!result.success) {
			return {
				ok: false,
				error: result.error ?? "No credits remaining.",
				credits: result.credits,
				maxCredits: DAILY_CREDITS,
			};
		}
		return { ok: true, credits: result.credits, maxCredits: DAILY_CREDITS };
	} catch (e) {
		console.error("consumeCreditAction:", e);
		return { ok: false, error: "Unable to use credit. Please try again." };
	}
}
