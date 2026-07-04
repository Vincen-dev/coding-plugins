import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

interface RepositoryRootOptions {
  requiredPaths?: string[];
  errorMessage?: string;
}

export function findRepositoryRoot(start: string, options: RepositoryRootOptions = {}): string {
  const requiredPaths = options.requiredPaths ?? ["package.json", "skills", "src"];
  let current = start;
  while (true) {
    if (requiredPaths.every((path) => existsSync(resolve(current, path)))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(options.errorMessage ?? "Unable to locate coding-plugins repository root.");
    }
    current = parent;
  }
}
