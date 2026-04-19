import { createClient, type RedisClientType } from "redis";
import { DAILY_CREDITS, CREDITS_KEY_PREFIX, CREDITS_EXPIRY_SECONDS } from "@/lib/constants";

function getRedisConnectionUrl(): string | undefined {
	return process.env.KV_REDIS_URL || process.env.REDIS_URL;
}

let redis: RedisClientType | null = null;
let isConnecting = false;

async function getRedisClient(): Promise<RedisClientType> {
	if (redis?.isOpen) {
		return redis;
	}

	if (isConnecting) {
		await new Promise(resolve => setTimeout(resolve, 100));
		if (redis?.isOpen) {
			return redis;
		}
	}

	isConnecting = true;
	try {
		const url = getRedisConnectionUrl();
		if (!url) {
			throw new Error(
				"Redis URL missing: set KV_REDIS_URL or REDIS_URL (Vercel Redis integration usually sets REDIS_URL).",
			);
		}
		redis = createClient({
			url,
			socket: {
				connectTimeout: 10_000,
				reconnectStrategy: false,
			},
		});
		redis.on("error", (err) => console.error("Redis Client Error:", err));
		await redis.connect();
		return redis;
	} catch (e) {
		try {
			await redis?.disconnect();
		} catch {
			/* ignore */
		}
		redis = null;
		throw e;
	} finally {
		isConnecting = false;
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

	const client = await getRedisClient();
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
}

export async function useCredit(userId: string): Promise<{
	success: boolean;
	credits: number;
	error?: string;
}> {
	const today = getTodayString();
	const key = `${CREDITS_KEY_PREFIX}${userId}`;

	const client = await getRedisClient();

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
			await client.unwatch();
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
			return useCredit(userId);
		}

		return {
			success: true,
			credits: data.credits,
		};
	} catch (error) {
		await client.unwatch();
		throw error;
	}
}
