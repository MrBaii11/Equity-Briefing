import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { CompanyBundle, EquityBriefing } from "./types";

// Serverless platforms (Vercel, AWS Lambda) mount the app directory read-only;
// only the OS temp dir (/tmp) is writable there. Locally keep using ./.cache.
const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const CACHE_DIR =
  process.env.CACHE_DIR ||
  (IS_SERVERLESS
    ? path.join(os.tmpdir(), "equity-briefing-cache")
    : path.join(process.cwd(), ".cache"));
const TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry<T> = {
  savedAt: number;
  data: T;
};

async function ensureDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function fileFor(key: string) {
  const safe = key.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(CACHE_DIR, `${safe}.json`);
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(fileFor(key), "utf8");
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.savedAt > TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await ensureDir();
    const entry: CacheEntry<T> = { savedAt: Date.now(), data };
    await fs.writeFile(fileFor(key), JSON.stringify(entry), "utf8");
  } catch (err) {
    // Caching is best-effort; never fail the request because of it.
    console.warn(`[cache] failed to write ${key}:`, err);
  }
}

const CACHE_VER = "v3";

export async function getBundleCache(ticker: string) {
  return readCache<CompanyBundle>(`${CACHE_VER}_bundle_${ticker.toUpperCase()}`);
}

export async function setBundleCache(ticker: string, data: CompanyBundle) {
  return writeCache(`${CACHE_VER}_bundle_${ticker.toUpperCase()}`, data);
}

export async function getBriefingCache(ticker: string) {
  return readCache<EquityBriefing>(`${CACHE_VER}_briefing_${ticker.toUpperCase()}`);
}

export async function setBriefingCache(ticker: string, data: EquityBriefing) {
  return writeCache(`${CACHE_VER}_briefing_${ticker.toUpperCase()}`, data);
}
