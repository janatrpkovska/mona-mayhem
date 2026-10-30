import type { APIRoute } from 'astro';

export const prerender = false;

const CACHE_TTL_MS = 5 * 60 * 1000;
const STALE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const UPSTREAM_TIMEOUT_MS = 8_000;

type CacheEntry = {
	data: unknown;
	expiresAt: number;
	staleUntil: number;
};

const cache = new Map<string, CacheEntry>();

function jsonResponse(
	data: unknown,
	status: number,
	cacheStatus: 'HIT' | 'MISS' | 'STALE' | 'BYPASS',
	cacheControl = 'no-store',
): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Cache-Control': cacheControl,
			'Content-Type': 'application/json; charset=utf-8',
			'X-Cache': cacheStatus,
		},
	});
}

function cachedResponse(entry: CacheEntry, cacheStatus: 'HIT' | 'MISS' | 'STALE'): Response {
	const cacheControl =
		cacheStatus === 'STALE'
			? 'public, max-age=0, stale-if-error=1800'
			: `public, max-age=${Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000))}, stale-if-error=1800`;

	return jsonResponse(entry.data, 200, cacheStatus, cacheControl);
}

function getStaleEntry(key: string, now: number): CacheEntry | undefined {
	const entry = cache.get(key);
	if (!entry || now >= entry.staleUntil) {
		if (entry) cache.delete(key);
		return undefined;
	}

	return entry;
}

function setCacheEntry(key: string, data: unknown, now: number): CacheEntry {
	const entry = {
		data,
		expiresAt: now + CACHE_TTL_MS,
		staleUntil: now + CACHE_TTL_MS + STALE_TTL_MS,
	};

	cache.delete(key);
	cache.set(key, entry);

	if (cache.size > MAX_CACHE_ENTRIES) {
		const oldestKey = cache.keys().next().value;
		if (oldestKey !== undefined) cache.delete(oldestKey);
	}

	return entry;
}

function isValidUsername(username: string): boolean {
	return /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(username) && username.length <= 39;
}

export const GET: APIRoute = async ({ params }) => {
	const username = params.username;
	if (!username || !isValidUsername(username)) {
		return jsonResponse({ error: 'Invalid GitHub username' }, 400, 'BYPASS');
	}

	const key = username.toLowerCase();
	const now = Date.now();
	const cached = cache.get(key);
	if (cached && now < cached.expiresAt) {
		cache.delete(key);
		cache.set(key, cached);
		return cachedResponse(cached, 'HIT');
	}

	const staleEntry = getStaleEntry(key, now);
	try {
		const upstream = await fetch(`https://github.com/${encodeURIComponent(username)}.contribs`, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
		});

		if (upstream.status === 404) {
			cache.delete(key);
			return jsonResponse({ error: 'GitHub user not found' }, 404, 'BYPASS');
		}

		if (!upstream.ok) {
			if (
				(upstream.status === 403 || upstream.status === 429 || upstream.status >= 500) &&
				staleEntry &&
				Date.now() < staleEntry.staleUntil
			) {
				return cachedResponse(staleEntry, 'STALE');
			}

			const status = upstream.status === 429 ? 503 : 502;
			return jsonResponse({ error: 'GitHub contribution data is unavailable' }, status, 'BYPASS');
		}

		let data: unknown;
		try {
			data = await upstream.json();
		} catch {
			if (staleEntry && Date.now() < staleEntry.staleUntil) {
				return cachedResponse(staleEntry, 'STALE');
			}
			return jsonResponse({ error: 'GitHub returned invalid JSON' }, 502, 'BYPASS');
		}

		const entry = setCacheEntry(key, data, Date.now());
		return cachedResponse(entry, 'MISS');
	} catch (error) {
		if (staleEntry && Date.now() < staleEntry.staleUntil) {
			return cachedResponse(staleEntry, 'STALE');
		}

		const isTimeout = error instanceof Error && error.name === 'TimeoutError';
		return jsonResponse(
			{ error: isTimeout ? 'GitHub request timed out' : 'Unable to reach GitHub' },
			isTimeout ? 504 : 502,
			'BYPASS',
		);
	}
};
