import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const workflow = readFileSync(join(repoRoot, ".github/workflows/release.yml"), "utf8");

function stepScript(name) {
  const marker = `      - name: ${name}\n`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, `release workflow step must exist: ${name}`);
  const remainder = workflow.slice(start + marker.length);
  const nextStep = remainder.indexOf("      - name: ");
  const block = nextStep === -1 ? remainder : remainder.slice(0, nextStep);
  const match = block.match(/        run: \|\n((?:          .*\n)+)/);
  assert.ok(match, `release workflow step must expose a multiline script: ${name}`);
  return match[1].replace(/^ {10}/gm, "");
}

test("VC-005 release workflow shell scripts are syntactically valid", () => {
  for (const name of ["Verify tag matches manifest version", "Create GitHub Release"]) {
    assert.doesNotThrow(
      () => execFileSync("bash", ["-n"], { cwd: repoRoot, input: stepScript(name) }),
      `${name} must be valid Bash`,
    );
  }
});

test("VC-005 release workflow accepts the package version tag", () => {
  const packageVersion = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;
  const script = stepScript("Verify tag matches manifest version").replace(
    "${{ github.ref_name }}",
    `v${packageVersion}`,
  );
  assert.doesNotThrow(
    () => execFileSync("bash", ["-e"], { cwd: repoRoot, input: script }),
    "tag verification must accept the package version",
  );
});
