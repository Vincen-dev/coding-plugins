import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  checkCodexHookConfigDeclared,
  checkManifestAssetPaths,
  checkManifestVersions,
  checkNpmPackageManifest,
  checkPlatformEntrypoints,
  checkRequiredPluginFiles,
  currentManifestVersion,
  normalizeManifestAssetPath,
} from "../../src/lib/manifest-checks.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeValidFixture(root, version = "1.2.3") {
  mkdirSync(join(root, ".codex-plugin"), { recursive: true });
  mkdirSync(join(root, ".claude-plugin"), { recursive: true });
  mkdirSync(join(root, ".agents", "skills"), { recursive: true });
  mkdirSync(join(root, "skills"), { recursive: true });
  mkdirSync(join(root, "assets"), { recursive: true });
  mkdirSync(join(root, "bin"), { recursive: true });
  mkdirSync(join(root, "dist"), { recursive: true });
  mkdirSync(join(root, "dist", "src", "cli", "release"), { recursive: true });
  mkdirSync(join(root, "dist", "src", "cli", "workflow"), { recursive: true });
  mkdirSync(join(root, "dist", "src", "cli", "documents"), { recursive: true });
  mkdirSync(join(root, "dist", "skills", "using-coding-plugins", "scripts"), { recursive: true });

  for (const path of ["README.md", "INSTALL.md", "SECURITY.md", "GEMINI.md"]) {
    writeFileSync(join(root, path), "# Plugin\n", "utf8");
  }
  writeFileSync(join(root, "assets/logo.svg"), "<svg></svg>\n", "utf8");
  writeFileSync(join(root, "bin/coding-plugins.js"), "#!/usr/bin/env node\n", "utf8");
  writeFileSync(join(root, "dist/index.d.ts"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/index.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/bump-version.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/doctor.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/preflight.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/prepare-release.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/start.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/documents/doctor.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/release/bump-version.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/release/preflight.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/release/prepare-release.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/src/cli/workflow/start.js"), "export {};\n", "utf8");
  writeFileSync(join(root, "dist/skills/using-coding-plugins/scripts/workflow-mode.js"), "export {};\n", "utf8");

  writeJson(join(root, "plugin.json"), { version, skills: "skills/" });
  writeJson(join(root, "gemini-extension.json"), { version, contextFileName: "GEMINI.md" });
  writeJson(join(root, ".codex-plugin/plugin.json"), {
    version,
    hooks: "./hooks/hooks-codex.json",
    interface: { logo: "./assets/logo.svg" },
  });
  writeJson(join(root, ".claude-plugin/plugin.json"), { version });
  writeJson(join(root, "package.json"), {
    name: "@vincen-dev/coding-plugins",
    version,
    type: "module",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    bin: { "coding-plugins": "./bin/coding-plugins.js" },
    scripts: {
      build: "node dist/src/cli/release/build-dist.js",
      "test:ts": "npm run preflight",
      typecheck: "tsc --noEmit",
      preflight: "node src/cli/preflight.ts",
    },
    devDependencies: {
      "@types/node": "^22.0.0",
      typescript: "^5.8.0",
    },
    files: [
      "bin/",
      "dist/",
      "skills/",
      "hooks/",
      "assets/",
      ".codex-plugin/",
      ".claude-plugin/",
      ".opencode/",
      ".agents/skills",
      "plugin.json",
      "gemini-extension.json",
      "GEMINI.md",
      "INSTALL.md",
      "SECURITY.md",
      "README.md",
      "LICENSE",
      "RELEASE-NOTES.md",
      "!skills/**/scripts/fixtures/",
      "!skills/**/scripts/fixtures/**",
      "!**/__pycache__/",
      `!**/*.${"py"}`,
      "!**/*.pyc",
    ],
    publishConfig: { access: "public", provenance: true },
  });
}

test("TypeScript manifest checks accept a valid plugin fixture", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-manifest-valid-"));
  try {
    writeValidFixture(root);

    checkRequiredPluginFiles(root);
    checkManifestVersions(root);
    checkNpmPackageManifest(root);
    checkPlatformEntrypoints(root);
    checkCodexHookConfigDeclared(root);
    checkManifestAssetPaths(root);
    assert.equal(currentManifestVersion(root), "1.2.3");
    assert.equal(normalizeManifestAssetPath("./assets/logo.svg"), "assets/logo.svg");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("TypeScript manifest checks reject mismatched versions", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-manifest-invalid-"));
  try {
    writeValidFixture(root);
    const packageJsonPath = join(root, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    packageJson.version = "1.2.4";
    writeJson(packageJsonPath, packageJson);

    assert.throws(() => checkManifestVersions(root), /Manifest versions differ/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("TypeScript platform checks accept .agents/skills text fallback", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-manifest-agents-"));
  try {
    mkdirSync(join(root, ".agents"), { recursive: true });
    mkdirSync(join(root, "skills"), { recursive: true });
    writeFileSync(join(root, ".agents/skills"), "../skills\n", "utf8");
    writeFileSync(join(root, "GEMINI.md"), "# Plugin\n", "utf8");
    writeJson(join(root, "plugin.json"), { version: "1.2.3", skills: "skills/" });
    writeJson(join(root, "gemini-extension.json"), { version: "1.2.3", contextFileName: "GEMINI.md" });

    checkPlatformEntrypoints(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("TypeScript manifest-check CLI reports success for the repository", () => {
  const result = spawnSync("node", [join(repoRoot, "src/cli/manifest-check.ts"), "--root", repoRoot], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "Manifest checks passed\n");
});

test("TypeScript package declares typecheck toolchain", () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.match(String(packageJson.devDependencies?.typescript ?? ""), /^\^5\./);
  assert.match(String(packageJson.devDependencies?.["@types/node"] ?? ""), /^\^22\./);
});
