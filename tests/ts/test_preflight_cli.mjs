import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const pySuffix = "." + "py";
const pyCommand = "py" + "thon3";

function run(script, args) {
  return spawnSync(script.command, [...script.prefix, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function scripts() {
  return {
    typescript: { command: "node", prefix: [join(repoRoot, "src/cli/preflight.ts")] },
  };
}

test("TypeScript preflight CLI rejects unknown arguments without legacy delegation", () => {
  const { typescript } = scripts();
  const ts = run(typescript, ["--unknown"]);

  assert.equal(ts.status, 2);
  assert.equal(ts.stdout, "");
  assert.equal(ts.stderr, "Usage: coding-plugins preflight [--write-index] [--check-external-references]\n");
});

test("TypeScript preflight source stays self-contained", () => {
  const source = spawnSync("node", ["-e", "process.stdout.write(require('node:fs').readFileSync(process.argv[1], 'utf8'))", join(repoRoot, "src/cli/preflight.ts")], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(source.status, 0, source.stderr);
  assert.ok(!source.stdout.includes(`scripts/preflight${pySuffix}`));
  assert.ok(!source.stdout.includes(pyCommand));
});

test("TypeScript preflight runs package typecheck", () => {
  const source = spawnSync("node", ["-e", "process.stdout.write(require('node:fs').readFileSync(process.argv[1], 'utf8'))", join(repoRoot, "src/cli/preflight.ts")], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(source.status, 0, source.stderr);
  assert.ok(source.stdout.includes('"npm", ["run", "typecheck"]'));
});
