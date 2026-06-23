#!/usr/bin/env node
// Removes crew: deletes ~/.claude/skills/crew and drops the auto-induct Stop
// hook from ~/.claude/settings.json. Leaves your roster (~/.claude/crew.md)
// alone, so you keep the characters if you reinstall later.

import { rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const claudeDir = join(homedir(), ".claude");
const target = join(claudeDir, "skills", "crew");
const settingsPath = join(claudeDir, "settings.json");

if (existsSync(target)) {
  rmSync(target, { recursive: true, force: true });
  console.log(`• removed ${target}`);
} else {
  console.log("• skill folder was not installed");
}

if (existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    const stop = settings.hooks?.Stop;
    if (Array.isArray(stop)) {
      const kept = stop.filter((e) => !JSON.stringify(e).includes("crew-induct"));
      if (kept.length !== stop.length) {
        settings.hooks.Stop = kept;
        writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
        console.log("• removed the Stop hook from settings.json");
      } else {
        console.log("• no crew Stop hook found in settings.json");
      }
    }
  } catch (e) {
    console.error(`Could not update ${settingsPath}: ${e.message}`);
    console.error("Remove the crew-induct Stop hook by hand.");
    process.exit(1);
  }
}

console.log("\nYour roster at ~/.claude/crew.md was left in place.");
