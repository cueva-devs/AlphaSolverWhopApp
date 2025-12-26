import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(request: NextRequest): Promise<Response> {
	try {
		// Validate the webhook to ensure it's from Whop
		const requestBodyText = await request.text();
		const headers = Object.fromEntries(request.headers);
		const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });

		// Handle the webhook event with error handling
		// waitUntil doesn't propagate errors, so we wrap with catch to ensure logging
		if (webhookData.type === "payment.succeeded") {
			waitUntil(
				handlePaymentSucceeded(webhookData.data).catch(err => {
					console.error("[WEBHOOK ERROR] payment.succeeded handler failed:", err);
					// Could add error reporting service here (e.g., Sentry)
				})
			);
		}

		// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
		return new Response("OK", { status: 200 });
	} catch (error) {
		// Log webhook validation errors
		console.error("[WEBHOOK ERROR] Failed to process webhook:", error);
		// Return 400 for validation errors so Whop knows the webhook wasn't processed
		return new Response("Invalid webhook", { status: 400 });
	}
}

async function handlePaymentSucceeded(payment: Payment) {
	// This is a placeholder for a potentially long running operation
	// In a real scenario, you might need to fetch user data, update a database, etc.
	console.log("[PAYMENT SUCCEEDED]", payment);
	
	// Add your payment handling logic here:
	// - Grant access to premium features
	// - Update user subscription status
	// - Send confirmation emails
	// etc.
}
