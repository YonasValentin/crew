#!/usr/bin/env node
// Installs crew: copies the skill into ~/.claude/skills/crew and registers the
// auto-induct Stop hook in ~/.claude/settings.json.
//
// No dependencies. Reads and writes settings.json through JSON.parse/stringify,
// so it can never leave the trailing comma that breaks Claude Code's parser.
//
// Usage:
//   node install.mjs            install
//   node install.mjs --dry-run  show what would change, write nothing

import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const dryRun = process.argv.includes("--dry-run");
const here = dirname(fileURLToPath(import.meta.url));
const claudeDir = join(homedir(), ".claude");
const target = join(claudeDir, "skills", "crew");
const settingsPath = join(claudeDir, "settings.json");
const hookPath = join(target, "hooks", "crew-induct.mjs");
const hookCommand = `node "${hookPath}"`;

const log = (...a) => console.log(...a);
const tag = dryRun ? "[dry-run] would" : "•";

// 1. Copy the skill into place.
const items = ["SKILL.md", "names.json", "crew.example.md", "hooks"];
log(`${tag} copy the skill to ${target}`);
if (!dryRun) {
  mkdirSync(target, { recursive: true });
  for (const item of items) {
    const src = join(here, item);
    if (existsSync(src)) cpSync(src, join(target, item), { recursive: true });
  }
}

// 2. Register the Stop hook, without disturbing the rest of settings.json.
let settings = {};
if (existsSync(settingsPath)) {
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch (e) {
    console.error(`\nCould not parse ${settingsPath}: ${e.message}`);
    console.error("Fix the JSON (a stray trailing comma is the usual cause) and run again.");
    process.exit(1);
  }
}
settings.hooks ??= {};
settings.hooks.Stop ??= [];

const already = JSON.stringify(settings.hooks.Stop).includes("crew-induct");
if (already) {
  log("• Stop hook already registered — leaving it alone");
} else {
  log(`${tag} add a Stop hook: ${hookCommand}`);
  if (!dryRun) {
    settings.hooks.Stop.push({
      hooks: [{ type: "command", command: hookCommand, timeout: 10 }],
    });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  }
}

log("");
if (dryRun) {
  log("Nothing was written. Drop --dry-run to install.");
} else {
  log("Done. Two things left, both yours to do:");
  log("  1. Restart Claude Code (or run /reload-plugins) so it sees the skill.");
  log("  2. Run  /crew assemble  once to cast the skills you already have.");
  log("     That also arms the auto-induct hook for skills you make later.");
  log("");
  log("To undo: node uninstall.mjs");
}
