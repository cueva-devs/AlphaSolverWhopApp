import { createClient } from "redis";
import { DAILY_CREDITS, CREDITS_KEY_PREFIX, CREDITS_EXPIRY_SECONDS } from "@/lib/constants";

type RedisClient = Awaited<ReturnType<typeof createClient>>;

export function getRedisConnectionUrl(): string | undefined {
	return process.env.KV_REDIS_URL || process.env.REDIS_URL;
}

/**
 * Vercel serverless: avoid a process-level TCP singleton (stale sockets, WATCH state).
 * Open → work → QUIT per operation.
 */
async function runWithRedis<T>(fn: (client: RedisClient) => Promise<T>): Promise<T> {
	const url = getRedisConnectionUrl();
	if (!url) {
		throw new Error(
			"Redis URL missing: set KV_REDIS_URL or REDIS_URL (Vercel Redis integration usually sets REDIS_URL).",
		);
	}
	const client = createClient({
		url,
		socket: {
			connectTimeout: 10_000,
			reconnectStrategy: false,
		},
	});
	client.on("error", (err) => console.error("Redis Client Error:", err));
	await client.connect();
	try {
		return await fn(client);
	} finally {
		try {
			if (client.isOpen) {
				await client.close();
			}
		} catch {
			try {
				client.destroy();
			} catch {
				/* ignore */
			}
		}
	}
}

function getTodayString(): string {
	return new Date().toISOString().split("T")[0];
}

export interface CreditsData {
	credits: number;
	lastReset: string;
}

export async function getUserCredits(userId: string): Promise<CreditsData> {
	const today = getTodayString();
	const key = `${CREDITS_KEY_PREFIX}${userId}`;

	return runWithRedis(async (client) => {
		const stored = await client.get(key);

		if (stored) {
			const data = JSON.parse(stored) as CreditsData;
			if (data.lastReset === today) {
				return data;
			}
		}

		const newData: CreditsData = { credits: DAILY_CREDITS, lastReset: today };
		await client.setEx(key, CREDITS_EXPIRY_SECONDS, JSON.stringify(newData));
		return newData;
	});
}

const CREDIT_TX_MAX_ATTEMPTS = 12;

export async function useCredit(userId: string): Promise<{
	success: boolean;
	credits: number;
	error?: string;
}> {
	const today = getTodayString();
	const key = `${CREDITS_KEY_PREFIX}${userId}`;

	return runWithRedis(async (client) => {
		for (let attempt = 0; attempt < CREDIT_TX_MAX_ATTEMPTS; attempt++) {
			await client.watch(key);

			try {
				const stored = await client.get(key);
				let data: CreditsData;

				if (stored) {
					data = JSON.parse(stored) as CreditsData;
					if (data.lastReset !== today) {
						data = { credits: DAILY_CREDITS, lastReset: today };
					}
				} else {
					data = { credits: DAILY_CREDITS, lastReset: today };
				}

				if (data.credits <= 0) {
					try {
						await client.unwatch();
					} catch {
						/* ignore */
					}
					return {
						success: false,
						credits: 0,
						error: "No credits remaining. Credits reset daily at midnight UTC.",
					};
				}

				data.credits -= 1;

				const multi = client.multi();
				multi.setEx(key, CREDITS_EXPIRY_SECONDS, JSON.stringify(data));
				const results = await multi.exec();

				if (results === null) {
					continue;
				}

				return {
					success: true,
					credits: data.credits,
				};
			} catch (error) {
				try {
					await client.unwatch();
				} catch {
					/* ignore */
				}
				throw error;
			}
		}

		throw new Error("Could not update credits (too much contention). Try again.");
	});
}
