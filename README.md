<h1 align="center">crew</h1>

<p align="center"><em>Your Claude Code skills, as people.</em></p>

<p align="center">
  <img src="assets/lottie-workteam.gif" width="340" alt="An animated crew working together around a desk">
</p>
<p align="center"><sub>Animation <a href="https://lottiefiles.com/free-animation/work-team-Hax1J0fGPK">"work team" by lu</a>, free via <a href="https://lottiefiles.com">LottieFiles</a>.</sub></p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-1f6feb.svg" alt="MIT license"></a>
  <a href="https://docs.anthropic.com/en/docs/claude-code"><img src="https://img.shields.io/badge/built%20for-Claude%20Code-d97757" alt="Built for Claude Code"></a>
  <img src="https://img.shields.io/badge/type-skill-111111" alt="Claude Code skill">
  <img src="https://img.shields.io/badge/dependencies-0-2ea043" alt="Zero dependencies">
  <img src="https://img.shields.io/badge/name%20pool-64-7d8a5c" alt="64 names in the pool">
</p>

You install a skill, name it something sensible like `code-review`, and a
month later you've forgotten it's there. The slug slides right off. So you do the
work by hand that the skill was built to do.

crew fixes it the way a mockumentary sitcom frames its cast: give everyone a face
and a bit. It turns each skill into a person with a name, a one-line role, and a
deadpan line to camera. "Priya, the gentle assassin" sticks where `code-review`
never did. Glance at the roster and the whole cast is right there, in faces you
remember.

The character rides *alongside* the skill. The slug stays the real name; the
person is just a handle for your memory. Nothing about how you invoke skills
changes.

## What it looks like

Ask to see the crew and you get the cast, not a list of slugs:

```
$ /crew

Your crew — 9 characters

  PRIYA     the gentle assassin
            "Polite right up until she finds the bug."
            → code-review · summon before you open a pull request

  HANK      the minimalist
            "His favorite pull request is the one with a red diff."
            → ponytail · summon when something smells over-built

  IRIS      the one who reads the docs
            "Reads the docs you skipped."
            → deep-research · summon for an answer with sources
```

Make a new skill and the next time the turn ends, crew notices and offers to cast
it. You pick the character; it never assigns one behind your back:

```
New skill: changelog-automation. Three candidates:

  1. MABEL — keeps the changelog honest
  2. WALT  — writes the docs nobody else wants to
  3. HANA  — cuts your paragraph in half and keeps the meaning

Pick one, ask for a re-roll, or type your own.
```

## How it works

crew is two moving parts and a text file.

- **The skill** does the casting. Three modes: `/crew` prints the cast,
  `/crew add` casts one skill and lets you pick the character, `/crew assemble`
  casts everyone at once for a fresh roster.
- **The roster** is `~/.claude/crew.md` — plain Markdown, one block per character.
  It's the single source of truth for who's been cast, and you can read or edit it
  by hand.
- **The hook** is the automatic part. It runs when a turn ends, checks whether any
  installed skill is missing from the roster, and if so leaves a note for the next
  turn. The skill picks it up and offers you the candidates. The hook only spots
  the gap; you still choose the name.

The names come from [`names.json`](./names.json), an office cast of 64 people
tagged by role — reviewers, builders, refactorers, debuggers, and so on. A skill
gets a character whose job you already understand. The pool is data, not code, so
adding your own people is a one-line change. Pull requests with new names are
welcome.

## Quick start

You need [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and Node 18
or newer.

**1. Get it.**

```bash
git clone https://github.com/YonasValentin/crew.git
cd crew
```

**2. Install it.**

```bash
node install.mjs
```

That copies the skill into `~/.claude/skills/crew` and adds the auto-induct hook to
`~/.claude/settings.json`. It reads and rewrites that file through a JSON parser, so
it won't touch your other hooks or leave broken JSON behind. Run it with
`--dry-run` first if you want to see the changes before they land.

**3. Cast your existing skills.** Restart Claude Code (or run `/reload-plugins`),
then:

```
/crew assemble
```

That gives every skill you already have a character, and arms the hook for the
skills you make later.

**4. See the result.**

```
/crew
```

To remove everything: `node uninstall.mjs`. Your roster stays put, so the cast
survives a reinstall.

## Why it's just a skill, with no program to run

A Claude Code skill is a Markdown file of instructions, not code that executes. The
whole job here is reading text, writing text, and keeping a roster, so there's
nothing to compile and nothing to depend on. Claude is the runtime. The one piece
of actual code is the hook, a single Node file with no packages, and it ships with
its own test:

```bash
node hooks/crew-induct.mjs --selftest
```

That's the appeal as something to fork: clone it, drop it in, edit the names, send
a PR. No build step stands between you and a change.

## Configuration

The hook reads two optional environment variables:

| Variable | Default | What it does |
|---|---|---|
| `CREW_FILE` | `~/.claude/crew.md` | Where the roster lives |
| `CREW_SKILL_DIRS` | `~/.claude/skills` and `<project>/.claude/skills` | Which directories to watch for new skills |

By default crew watches your own skill folders, not the plugin cache. Auto-casting
every marketplace skill you install would be noise. Point `CREW_SKILL_DIRS` wherever
you like if you disagree.

To stop crew from casting a particular skill, list it under `## Ignore` in your
roster. Both `assemble` and the hook leave those alone.

## License

MIT, except the hero animation, which is a free LottieFiles animation by lu under
the LottieFiles Simple License. See [LICENSE](./LICENSE).
