# Tools, plugins and installation

## Required capabilities, not a plugin shopping list
Claude Code or its existing editor integration for planning; Cursor Agent for implementation; Git; a compatible Node/npm runtime; Playwright and Vitest in the app. Codex is useful as an independent reviewer but optional. No purchased shader plugin, Blender addon, MCP bundle, pstack, No Mistakes or grill-me installation is required to achieve this workflow.

The uploaded reel's tool claims were supplied as context, not independently reverified package installation instructions. Do not run third-party plugin setup solely because the reel recommends it. Native rules + our written contracts are enough. If you add a plugin later, inspect its source/license, exact publisher, requested permissions and file changes; pin it, preserve existing configuration, and do not grant GitHub write or unrestricted shell access for convenience.

## First inspect your own terminal
    command -v claude
    command -v codex
    claude --version
    codex --version

Claude.app is not proof of a claude terminal command. A Cursor Codex extension is not proof of codex CLI. If the CLIs are missing, use their official setup pages, not a lookalike marketplace listing:
- https://code.claude.com/docs/en/quickstart
- https://developers.openai.com/codex/cli

Official docs currently show Claude's native installer and an npm package option; Codex supports npm install -g @openai/codex. Installation changes global tools and can involve account authorization; this package does not run it for you. Inspect downloaded installer code before execution where practical. Sign in through each tool's legitimate interactive flow; never paste tokens into the repo or chat.

## Models
Use /model in Claude Code to verify the requested Fable 5.2 or account-specific model. No guessed --model fable-5.2 flag. A reviewer run through Aside is not a run through your Claude Code subscription. Log substitutions clearly. Use at most a few specialists with bounded tasks; rate-limit/credit failures should trigger a fallback, not unsafe bypass flags.

## App libraries, at M01
Core: react, react-dom, typescript, vite, schema validation; vitest; @playwright/test and @axe-core/playwright. Optional visual tier: three, @react-three/fiber, @react-three/drei; postprocessing only after core correctness and performance. Use one motion approach (CSS first), not overlapping animation frameworks. Verify peer versions and licenses before install, commit the lockfile, use npm ci in CI.

## Codex review
From the repo, launch codex interactively and paste prompts/02_CODEX_REVIEW.md plus request id/SHA. For automation, official docs support codex exec --sandbox read-only with the prompt on stdin and -o for the final message. scripts/codex-review.sh prepares a request-specific prompt and uses that mode; it cannot authenticate a missing account or auto-approve its own output. It writes a candidate report for the independent reviewer to validate/import, never a guessed PASS. It does not use deprecated --full-auto or danger-full-access.
