---
name: crew
description: >-
  Gives your Claude Code skills memorable human characters so you remember they
  exist. Reads a skill's name and description, casts it as a person from an
  office-archetype name pool, and records the character in a roster (~/.claude/crew.md).
  Use when the user wants to see their crew, meet their skills, name or rename a
  skill's character, or run a fresh roster; when they just created a skill and want
  it cast; or when a system reminder notes that installed skills are missing from
  the crew roster. Triggers: "/crew", "show my crew", "meet the crew", "who's on my
  team", "name this skill", "assemble the crew".
---

# crew

Skills are easy to forget because their names are slugs (`code-review`,
`deep-research`). A character sticks where a slug slides off. This skill casts
each skill as a person — a name, a one-line role, a catchphrase — and keeps the
cast in a roster you can read at a glance.

The character sits *alongside* the skill. The slug stays the real, canonical
name; the persona is a mnemonic on top of it. You still invoke skills the normal
way.

## The name pool

Characters are drawn from `names.json` in this skill's own directory. It's an
office ensemble: every name is tagged with an archetype (reviewer, builder,
refactorer, debugger, and so on) so a skill gets a face whose job you already
understand. The pool is data, not code — anyone can add names or change the vibe.

A name is used once. The roster tracks who's taken; you never hand out the same
name twice.

## Modes

Read `$ARGUMENTS` to decide what to do.

### `/crew` (no arguments) — print the cast

Read `~/.claude/crew.md` and render it as a cast list. If the file doesn't exist
or has no characters yet, say so and offer to run `assemble`.

Render each character like this (plain text, monospaced):

```
  PRIYA    the gentle assassin
           "Polite right up until she finds the bug."
           → code-review · summon for a pre-PR review
```

Group by nothing; a flat list reads fine. Lead with a one-line header that counts
the crew ("Your crew — 9 characters").

### `/crew add [skill]` — cast one skill, you pick

This is the deliberate, interactive path. Use it when the user names a skill, or
right after they create one.

1. Find the skill. If `$ARGUMENTS` names one, use it. If not, look at the skill
   directories (`~/.claude/skills`, the project's `.claude/skills`) for skills not
   already in the roster, most-recently-created first, and confirm which one.
2. Read that skill's `SKILL.md` — its `name` and `description`, and skim the body
   if the description is thin.
3. Decide its archetype by what it actually does, and match it to an archetype in
   `names.json`.
4. Pull three unused names from that archetype (borrow from a neighbouring
   archetype if it's run dry). For each, write a short epithet and a catchphrase
   drawn from what *this* skill does — not a generic line.
5. Offer the three as a choice (use the question UI). Let the user pick one, ask
   for a re-roll, or type their own name.
6. Append the chosen character to `~/.claude/crew.md` under `## Crew`, in the
   entry format below. Never touch existing entries.

### `/crew assemble` — cast everyone at once

The first-run, bulk path. Use it to populate a fresh roster, or to catch up after
installing several skills.

1. Scan the skill directories for every skill with a `SKILL.md`.
2. Skip any already in the roster and any under the roster's `## Ignore` section.
3. For each remaining skill, pick the single best-fitting unused name yourself —
   no per-skill prompt. Asking the user to choose for thirty skills is a slog;
   assemble trades the choice for speed.
4. Write them all to `~/.claude/crew.md`, then print the full cast.

Tell the user they can re-roll any character later with `/crew add` after removing
its line, or just rename it by editing the file.

## Entry format

Every character is one block under `## Crew`:

```markdown
### PRIYA — the gentle assassin
> "Polite right up until she finds the bug."
- skill: code-review
- summon when: you want a review before opening a PR
```

- The heading is the name in caps, an em-dash, and the role.
- The blockquote is the catchphrase.
- `skill:` is the canonical slug — the skill's directory name. The auto-induct
  hook reads this line to know who's already cast, so it has to be exact.
- `summon when:` is the plain-language reason to reach for it.

Keep an `## Ignore` section at the bottom for skills the user doesn't want cast.
Both `assemble` and the hook leave those alone:

```markdown
## Ignore
- some-skill-you-dont-want-named
```

## When a system reminder mentions the roster

The auto-induct hook runs at the end of a turn. When it finds skills missing from
the roster, it leaves a factual note in your context naming them. That note is your
cue: run the `add` flow for those skills — offer the user three characters each (or
handle them one at a time if there are several), and record the picks. Don't act on
the note silently; the whole point is that the user chooses the name.

## Writing the characters

Match the voice in `names.json`: concrete, dry, a little funny. One clear image
per line. Avoid the tells of filler writing — no "powerful", no "seamless", no
three-adjective runs, no line that's trying too hard. A good catchphrase sounds
like something a tired coworker would actually say.
