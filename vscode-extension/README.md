# MySampark MCP — VS Code Extension

Thin wrapper extension: install it, paste your MySampark API token once when
prompted, and every AI surface in VS Code is connected to your MySampark
account via MCP — no manual config editing, and it works across tools that
each have their own, mutually incompatible way of discovering MCP servers.

## What it does

On activation, registers an MCP server definition provider for
`https://mcp.mysampark.com/api/mcp` via VS Code's native `vscode.lm` API —
this is what **GitHub Copilot Chat** (Agent mode) reads. The first time a
tool is used, the extension prompts for your API token (from
`POST /api/token` — see `docs/mcp-server-setup.md` in the main
[socialpilot-clone](https://github.com/utsav12322/socialpilot-clone) repo)
and stores it in VS Code's encrypted `SecretStorage`.

**Claude Code** (the "Claude Code for VS Code" extension and its CLI),
**Codex** (VS Code extension and CLI), and **Antigravity IDE** (Google's VS
Code fork) each have their *own* MCP config file/schema and don't read
`vscode.lm` registrations at all — so the same token prompt also writes:

- `.mcp.json` at the workspace root (Claude Code) — `{ mcpServers: { url, headers } }`
- `~/.codex/config.toml` (Codex, shared with its CLI) — `[mcp_servers.*]` + `http_headers`
- `.agents/mcp_config.json` at the workspace root (Antigravity) — `{ mcpServers: { serverUrl, headers } }`

Both workspace files are auto-added to `.gitignore` since they contain the
token. All four surfaces stay in sync from the one prompt; running
**MySampark: Update API Token** or **MySampark: Sign Out** updates/clears
all of them at once.

## Commands

- **MySampark: Update API Token** — replace the stored token (e.g. after
  regenerating it)
- **MySampark: Sign Out** — clear the stored token

## Develop / test locally

```bash
cd vscode-extension
npm install
npm run compile
```

Press `F5` in VS Code (with this folder open) to launch an Extension
Development Host with the extension loaded, then check the MCP servers list
(Extensions view → MCP Servers, or Command Palette → "MCP: List Servers").

## Package and publish

```bash
npm install -g @vscode/vsce
vsce package    # produces mysampark-mcp-1.0.0.vsix — test by installing it locally first
vsce publish    # requires a Marketplace publisher account (Azure DevOps PAT)
```

See [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
for setting up the `mysampark` publisher account before running `vsce publish`.
