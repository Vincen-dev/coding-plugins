import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export interface BuildLockOptions {
  timeoutMs?: number;
  staleMs?: number;
  pollMs?: number;
}

export function buildLockPath(root: string): string {
  const digest = createHash("sha256").update(resolve(root), "utf8").digest("hex").slice(0, 16);
  return join(tmpdir(), `coding-plugins-build-${digest}.lock`);
}

function sleepSync(ms: number): void {
  const signal = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(signal, 0, 0, ms);
}

function isStale(lockPath: string, staleMs: number): boolean {
  if (!existsSync(join(lockPath, "owner.json"))) {
    return true;
  }
  try {
    const owner = JSON.parse(readFileSync(join(lockPath, "owner.json"), "utf8")) as { created_at?: number };
    return !owner.created_at || Date.now() - owner.created_at > staleMs;
  } catch {
    return true;
  }
}

export function withBuildLock<T>(root: string, fn: () => T, options: BuildLockOptions = {}): T {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const staleMs = options.staleMs ?? 600_000;
  const pollMs = options.pollMs ?? 100;
  const lockPath = buildLockPath(root);
  if (process.env.CODING_PLUGINS_BUILD_LOCK === lockPath) {
    return fn();
  }
  const start = Date.now();
  let acquired = false;

  while (!acquired) {
    try {
      mkdirSync(lockPath);
      writeFileSync(join(lockPath, "owner.json"), JSON.stringify({ pid: process.pid, root: resolve(root), created_at: Date.now() }), "utf8");
      acquired = true;
    } catch (error) {
      if (existsSync(lockPath) && isStale(lockPath, staleMs)) {
        rmSync(lockPath, { recursive: true, force: true });
        continue;
      }
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timed out waiting for build/preflight lock: ${lockPath}`);
      }
      sleepSync(pollMs);
    }
  }

  try {
    const previousLock = process.env.CODING_PLUGINS_BUILD_LOCK;
    process.env.CODING_PLUGINS_BUILD_LOCK = lockPath;
    try {
      return fn();
    } finally {
      if (previousLock === undefined) {
        delete process.env.CODING_PLUGINS_BUILD_LOCK;
      } else {
        process.env.CODING_PLUGINS_BUILD_LOCK = previousLock;
      }
    }
  } finally {
    rmSync(lockPath, { recursive: true, force: true });
  }
}
