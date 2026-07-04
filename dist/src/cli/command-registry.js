#!/usr/bin/env node
import { COMMAND_REGISTRY } from "../lib/runtime/command-registry.js";
const args = process.argv.slice(2);
const formatIndex = args.indexOf("--format");
const format = formatIndex >= 0 ? args[formatIndex + 1] : "text";
if (args.some((arg, index) => arg !== "--format" && index !== formatIndex + 1)) {
    console.error("Usage: coding-plugins command-registry [--format text|json]");
    process.exit(2);
}
if (!["text", "json"].includes(format ?? "")) {
    console.error("Usage: coding-plugins command-registry [--format text|json]");
    process.exit(2);
}
if (format === "json") {
    console.log(JSON.stringify({ commands: COMMAND_REGISTRY }, null, 2));
}
else {
    for (const command of COMMAND_REGISTRY) {
        console.log(`${command.name}\t${command.script}\t${command.usage}`);
    }
}
