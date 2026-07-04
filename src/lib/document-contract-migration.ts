import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { LEGACY_RELATION_KEYS, parseFrontmatterBlock, RELATED_DOCS_KEY, renderFrontmatterBlock, splitFrontmatter } from "./document-metadata.ts";

const SPEC_ID_RE = /^(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)(?:-[A-Z0-9]+)*-\d{3,}$/;
const STATUS_ALIASES: Record<string, string> = {
  已实现: "covered",
  完成: "covered",
  implemented: "covered",
  done: "covered",
};
const DEFAULT_DATE = "2026-07-01";

export function featureContext(path: string): string | undefined {
  const parts = path.split(/[\\/]/);
  const index = parts.indexOf("features");
  if (index === -1 || parts.length <= index + 1) {
    return undefined;
  }
  return parts[index + 1];
}

export function migrateBodyStatusAliases(body: string): string {
  let migrated = body;
  for (const [oldValue, newValue] of Object.entries(STATUS_ALIASES)) {
    migrated = migrated.replaceAll(`| ${oldValue} |`, `| ${newValue} |`);
    migrated = migrated.replaceAll(`| ${oldValue}\n`, `| ${newValue}\n`);
  }
  return migrated;
}

export function migrateFile(path: string, options: { dryRun?: boolean } = {}): boolean {
  const original = readFileSync(path, "utf8");
  const [lines, initialBody] = splitFrontmatter(original);
  const frontmatter = parseFrontmatterBlock(lines);
  const scalars = { ...frontmatter.scalars };
  const lists = Object.fromEntries(Object.entries(frontmatter.lists).map(([key, values]) => [key, [...values]]));
  let order = [...frontmatter.order];
  const context = featureContext(path);
  let body = initialBody;
  let changed = false;

  if (context && basename(path) === "tdd-evidence.md") {
    const defaults: Record<string, string> = {
      title: `${context} TDD Evidence`,
      status: "active",
      feature: context,
      created: DEFAULT_DATE,
      updated: DEFAULT_DATE,
    };
    for (const [key, value] of Object.entries(defaults)) {
      if (!scalars[key]) {
        scalars[key] = value;
        changed = true;
      }
    }
  }

  if (scalars.status && scalars.status in STATUS_ALIASES) {
    scalars.status = STATUS_ALIASES[scalars.status];
    changed = true;
  }

  const firstLegacyRelationIndex = order.findIndex((key) => LEGACY_RELATION_KEYS.includes(key));
  const relatedSpecs = lists.related_specs ?? [];
  if (relatedSpecs.length > 0) {
    const pathValues = relatedSpecs.filter((value) => !SPEC_ID_RE.test(value));
    const idValues = relatedSpecs.filter((value) => SPEC_ID_RE.test(value));
    if (idValues.length > 0) {
      lists.related_specs = pathValues;
      const existingIds = lists.related_spec_ids ?? [];
      lists.related_spec_ids = [...new Set([...existingIds, ...idValues])];
      if (!order.includes("related_spec_ids")) {
        const relatedIndex = order.includes("related_specs") ? order.indexOf("related_specs") + 1 : order.length;
        order.splice(relatedIndex, 0, "related_spec_ids");
      }
      changed = true;
    }
  }
  if (LEGACY_RELATION_KEYS.some((key) => key in lists)) {
    const relatedDocs = new Set(lists[RELATED_DOCS_KEY] ?? []);
    for (const key of LEGACY_RELATION_KEYS) {
      for (const value of lists[key] ?? []) {
        if (!SPEC_ID_RE.test(value)) {
          relatedDocs.add(value);
        }
      }
      delete lists[key];
    }
    lists[RELATED_DOCS_KEY] = [...relatedDocs].sort();
    order = order.filter((key) => !LEGACY_RELATION_KEYS.includes(key) && key !== RELATED_DOCS_KEY);
    const insertAt = firstLegacyRelationIndex >= 0 ? firstLegacyRelationIndex : order.length;
    order.splice(Math.min(insertAt, order.length), 0, RELATED_DOCS_KEY);
    changed = true;
  }

  const migratedBody = migrateBodyStatusAliases(body);
  if (migratedBody !== body) {
    body = migratedBody;
    changed = true;
  }

  if (lines.length === 0 && (Object.keys(scalars).length > 0 || Object.keys(lists).length > 0)) {
    order = [...Object.keys(scalars), ...Object.keys(lists).filter((key) => !(key in scalars))];
    changed = true;
  }

  if (!changed) {
    return false;
  }

  const migrated = `${renderFrontmatterBlock({ scalars, lists, order })}\n${body}`;
  if (migrated !== original && !options.dryRun) {
    writeFileSync(path, migrated, "utf8");
  }
  return migrated !== original;
}

function collectMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) {
    return results;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(path);
    }
  }
  return results.sort();
}

export function migrateRoot(root: string, options: { dryRun?: boolean } = {}): boolean {
  const features = join(root, "docs/coding-plugins/features");
  if (!existsSync(features)) {
    return false;
  }
  let changed = false;
  for (const path of collectMarkdownFiles(features)) {
    changed = migrateFile(path, options) || changed;
  }
  return changed;
}
