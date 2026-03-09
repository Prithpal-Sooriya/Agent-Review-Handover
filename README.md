# Agent-Review-Handover

Agentic Handover of Code Reviews. Allow Agents to keep PRs up-to-date, resolve merge conflicts, tag
reviewers, resolve code comments, and more.

## Setup

### 1. Install Deno

This project uses [Deno](https://deno.com/) 2.x. Install it with one of the following:

**macOS / Linux (curl):**

```bash
curl -fsSL https://deno.land/install.sh | sh
```

Then add Deno to your PATH (if not already added by the installer). For zsh, add to `~/.zshrc`:

```bash
export PATH="$HOME/.deno/bin:$PATH"
```

Then run `source ~/.zshrc` or open a new terminal.

**macOS (Homebrew):**

```bash
brew install deno
```

**Windows (PowerShell):**

```powershell
irm https://deno.land/install.ps1 | iex
```

**Or use the official installer:** https://deno.land/#installation

### 2. Verify installation

```bash
deno --version
```

You should see Deno 2.x (e.g. `deno 2.x.x`).

### 3. Clone and run

From the project root:

```bash
# Run tests
deno task test

# Lint
deno task lint

# Format
deno task fmt

# Dev server (if applicable)
deno task dev
```

Dependencies are resolved automatically from `deno.json` (JSR and npm); no separate `npm install` is
required.
