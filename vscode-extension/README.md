# MySampark MCP — VS Code Extension

Thin wrapper extension: install it, paste your MySampark API token once when
prompted, and VS Code is connected to your MySampark account via MCP — no
manual `.vscode/mcp.json` editing.

## What it does

On activation, registers an MCP server definition provider for
`https://mcp.mysampark.com/api/mcp`. The first time VS Code needs to start
that server, the extension prompts for your API token (from
`POST /api/token` — see `docs/mcp-server-setup.md` in the main
[socialpilot-clone](https://github.com/utsav12322/socialpilot-clone) repo)
and stores it in VS Code's encrypted `SecretStorage` — never in
`settings.json`, never in plain text.

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
