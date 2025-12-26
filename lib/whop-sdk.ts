import { Whop } from "@whop/sdk";

// Validate required environment variables in production
const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
if (!webhookSecret && process.env.NODE_ENV === "production") {
	console.error("WHOP_WEBHOOK_SECRET is required in production");
}

const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
if (!appId && process.env.NODE_ENV === "production") {
	console.error("NEXT_PUBLIC_WHOP_APP_ID is required in production");
}

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey && process.env.NODE_ENV === "production") {
	console.error("WHOP_API_KEY is required in production");
}

export const whopsdk = new Whop({
	appID: appId,
	apiKey: apiKey,
	// Only encode if secret exists, otherwise pass empty string
	webhookKey: webhookSecret ? btoa(webhookSecret) : "",
});
