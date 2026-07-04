import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

export function buildLockPath(targetRoot) {
  const digest = createHash("sha256").update(resolve(targetRoot), "utf8").digest("hex").slice(0, 16);
  return resolve(tmpdir(), `coding-plugins-build-${digest}.lock`);
}

function sleepSync(ms) {
  const signal = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(signal, 0, 0, ms);
}

function lockIsStale(lockPath) {
  try {
    const owner = JSON.parse(readFileSync(resolve(lockPath, "owner.json"), "utf8"));
    return !owner.created_at || Date.now() - owner.created_at > 600_000;
  } catch {
    return true;
  }
}

export function withBuildLock(targetRoot, fn) {
  const lockPath = buildLockPath(targetRoot);
  if (process.env.CODING_PLUGINS_BUILD_LOCK === lockPath) {
    return fn();
  }
  const started = Date.now();
  while (true) {
    try {
      mkdirSync(lockPath);
      writeFileSync(resolve(lockPath, "owner.json"), JSON.stringify({ pid: process.pid, root: targetRoot, created_at: Date.now() }), "utf8");
      break;
    } catch {
      if (existsSync(lockPath) && lockIsStale(lockPath)) {
        rmSync(lockPath, { recursive: true, force: true });
        continue;
      }
      if (Date.now() - started > 120_000) {
        throw new Error(`Timed out waiting for build/preflight lock: ${lockPath}`);
      }
      sleepSync(100);
    }
  }
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
    rmSync(lockPath, { recursive: true, force: true });
  }
}
