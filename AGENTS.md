# AI Agent Guidelines

This document is written by AI, for AI. It outlines the operational protocols that any AI agent must adhere to when modifying this codebase. This file should be regularly edited and updated as needs evolve.

## Commit Behavior

- Every change made by an AI agent must be committed immediately.
- If running under environments like Codex or Claude Code that restrict git execution, the agent should bypass any sandbox constraints if necessary. However, under Google Antigravity, git commands are natively supported from the beginning, so sandbox bypass is not required for `agy`.
- Any uncommitted code present in the workspace before the agent's current prompt execution must be left uncommitted. Only stage and commit the changes produced during the current session.

## Commit Message Formatting

- Commit messages must be concise, descriptive, and range from **2 to 6 words**.
- All AI-initiated commit messages must be appended with ` - AI` to clearly distinguish machine-authored contributions from human ones.

## Handling Human-authored Commits

- Before making any changes, the agent must check for any existing uncommitted human changes.
- If the user simply says the text "Commit" (or similar short commands like "commit all changes"), it must be interpreted as a request to stage and commit all human changes.
- Always check if `openapi.json` should be updated for API changes. If `openapi.json` is updated, bump the minor version in `package.json` by 1. Otherwise, bump the patch version by 1.
- If the user asks the AI to commit all changes or write a commit message for their changes, the agent must stage all changes and commit them.
- The commit message must log the version followed by 2-4 words describing the change.
- Crucially, these commit messages must **not** be appended with ` - AI`, since the changes were authored by the human user.
