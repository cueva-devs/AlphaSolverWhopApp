import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";
import { getRedisConnectionUrl } from "@/lib/credits-store";
import { CREDITS_EXPIRY_SECONDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAuthorizedCron(request: NextRequest): boolean {
	const secret = process.env.CRON_SECRET?.trim();
	if (!secret) {
		return false;
	}
	const raw = request.headers.get("authorization")?.trim();
	if (!raw) {
		return false;
	}
	const m = /^Bearer\s+(\S+)/i.exec(raw);
	const token = m?.[1]?.trim();
	return token === secret;
}

/**
 * Vercel Cron: touches Redis so idle free-tier databases stay reachable.
 * Set CRON_SECRET in Vercel (Production); the platform sends Authorization: Bearer <CRON_SECRET>.
 * @see https://vercel.com/docs/cron-jobs#securing-cron-jobs
 */
export async function GET(request: NextRequest) {
	if (!isAuthorizedCron(request)) {
		if (!process.env.CRON_SECRET?.trim()) {
			console.error(
				"redis-keepalive: CRON_SECRET is empty — add it under Vercel → Env Vars for Production, then redeploy.",
			);
		}
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = getRedisConnectionUrl();
	if (!url) {
		return NextResponse.json({ error: "Redis URL not configured" }, { status: 500 });
	}

	const client = createClient({
		url,
		socket: {
			connectTimeout: 10_000,
			reconnectStrategy: false,
		},
	});
	client.on("error", (err) => console.error("Redis keepalive client:", err));

	try {
		await client.connect();
		await client.ping();
		await client.set("alphasolver:keepalive", new Date().toISOString(), {
			EX: CREDITS_EXPIRY_SECONDS,
		});
		await client.close();
		return NextResponse.json({ ok: true, at: new Date().toISOString() });
	} catch (e) {
		console.error("redis-keepalive failed:", e);
		try {
			client.destroy();
		} catch {
			/* ignore */
		}
		return NextResponse.json({ ok: false, error: "Redis unreachable" }, { status: 502 });
	}
}
