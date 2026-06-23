#!/usr/bin/env node
// crew-induct: a Claude Code Stop hook.
//
// At the end of a turn it checks whether any installed skill is missing from
// your crew roster. If so, it hands Claude a factual note about it. Claude
// reads the note on its next turn and offers to give the new skill a character.
//
// It only DETECTS. The naming happens in the `crew` skill, where you pick.
//
// Why a Stop hook with additionalContext (not a blocking decision):
//   The official docs say Stop hooks may return `hookSpecificOutput.additionalContext`,
//   which is injected at the end of the turn and "the conversation continues so
//   Claude can act on the feedback." That is exactly the behaviour we want, and
//   unlike `decision: "block"` it does not read as an error.
//   https://docs.claude.com/en/docs/claude-code/hooks
//
// The note is phrased as a plain statement of fact, never as a command. The same
// docs warn that imperative, system-command-style text trips Claude's
// prompt-injection defences and gets surfaced to the user instead of used.
//
// Config (all optional, via env):
//   CREW_FILE        path to the roster      (default: ~/.claude/crew.md)
//   CREW_SKILL_DIRS  ':'-separated dirs to watch
//                    (default: ~/.claude/skills + <project>/.claude/skills)
//
// ponytail: watches your personal skill dirs, not the plugin cache — auto-naming
// every marketplace skill would be noise. Point CREW_SKILL_DIRS elsewhere if you
// disagree.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const MAX_NAMES_IN_NOTE = 5;

// ---- pure helpers (covered by --selftest) --------------------------------

// Every `skill: <slug>` value in the roster, however indented.
export function parseInducted(md) {
  const out = new Set();
  for (const m of md.matchAll(/^\s*-?\s*skill:\s*(\S+)/gim)) out.add(m[1]);
  return out;
}

// Bare list items under an `## Ignore` heading, until the next `##` heading.
export function parseIgnored(md) {
  const out = new Set();
  const lines = md.split("\n");
  let inSection = false;
  for (const line of lines) {
    if (/^##\s/.test(line)) inSection = /^##\s+ignore\b/i.test(line);
    else if (inSection) {
      const m = line.match(/^\s*-\s*(\S+)\s*$/);
      if (m) out.add(m[1]);
    }
  }
  return out;
}

// Slugs not yet inducted and not ignored. Slug === skill directory name.
export function computeDelta(presentSlugs, inducted, ignored) {
  return presentSlugs.filter((s) => !inducted.has(s) && !ignored.has(s));
}

// The factual note. No imperatives — see the prompt-injection warning above.
export function buildNote(delta, crewFile, max = MAX_NAMES_IN_NOTE) {
  if (delta.length === 0) return null;
  if (delta.length > max) {
    return (
      `State note: ${delta.length} installed skills are not in the crew roster ` +
      `(${crewFile}) yet. The crew skill's assemble step adds them in one pass.`
    );
  }
  return (
    `State note: these installed skills are not in the crew roster (${crewFile}) ` +
    `yet: ${delta.join(", ")}. The crew skill can give a skill a character and let ` +
    `you pick the name.`
  );
}

// ---- filesystem (not in selftest) ----------------------------------------

function skillDirs() {
  if (process.env.CREW_SKILL_DIRS) {
    return process.env.CREW_SKILL_DIRS.split(":").filter(Boolean);
  }
  const dirs = [join(homedir(), ".claude", "skills")];
  const project = process.env.CLAUDE_PROJECT_DIR;
  if (project) dirs.push(join(project, ".claude", "skills"));
  return dirs;
}

function presentSlugs(dirs) {
  const slugs = new Set();
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.isDirectory() && existsSync(join(dir, e.name, "SKILL.md"))) {
        slugs.add(e.name);
      }
    }
  }
  return [...slugs];
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// ---- main -----------------------------------------------------------------

function main() {
  const raw = readStdin();
  let input = {};
  try {
    input = raw ? JSON.parse(raw) : {};
  } catch {
    input = {};
  }

  // We injected last turn and Claude is mid-continuation — say nothing, or we loop.
  if (input.stop_hook_active === true) return;

  const crewFile = process.env.CREW_FILE || join(homedir(), ".claude", "crew.md");

  // Not set up yet: no roster file means the user hasn't started a crew.
  if (!existsSync(crewFile)) return;

  const md = readFileSync(crewFile, "utf8");
  const inducted = parseInducted(md);

  // Roster exists but is empty: stay quiet until the user runs an assemble,
  // so a fresh install doesn't dump every skill at once.
  if (inducted.size === 0) return;

  const ignored = parseIgnored(md);
  const delta = computeDelta(presentSlugs(skillDirs()), inducted, ignored);
  const note = buildNote(delta, crewFile);
  if (!note) return;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "Stop", additionalContext: note },
      suppressOutput: true,
    })
  );
}

// ---- selftest -------------------------------------------------------------

function selftest() {
  const assert = (cond, msg) => {
    if (!cond) {
      console.error("FAIL:", msg);
      process.exit(1);
    }
  };

  const roster = `
# crew
## Crew
### PRIYA — the gentle assassin
> "Polite right up until she finds the bug."
- skill: code-review
- summon when: pre-PR review

### HANK — the minimalist
- skill: ponytail

## Ignore
- secret-skill
`;

  const inducted = parseInducted(roster);
  assert(inducted.has("code-review"), "parses skill: under a heading");
  assert(inducted.has("ponytail"), "parses second inducted skill");
  assert(inducted.size === 2, "exactly two inducted, not the 'summon when' line");

  const ignored = parseIgnored(roster);
  assert(ignored.has("secret-skill"), "parses ignore-section entry");
  assert(!ignored.has("code-review"), "skill: lines are not ignore entries");

  const present = ["code-review", "ponytail", "secret-skill", "new-skill"];
  const delta = computeDelta(present, inducted, ignored);
  assert(delta.length === 1 && delta[0] === "new-skill", "delta = present − inducted − ignored");

  assert(buildNote([], "/x") === null, "no note when nothing is new");
  assert(buildNote(["a"], "/x").includes("a"), "small delta names the skill");
  assert(!buildNote(["a"], "/x").toLowerCase().includes("induct it"), "note is not an imperative command");
  const many = ["a", "b", "c", "d", "e", "f"];
  assert(buildNote(many, "/x").includes("assemble"), "big delta points at assemble instead of listing");
  assert(!buildNote(many, "/x").includes("a, b, c"), "big delta does not list every skill");

  console.log("ok — all crew-induct selftests passed");
}

if (process.argv.includes("--selftest")) selftest();
else main();
