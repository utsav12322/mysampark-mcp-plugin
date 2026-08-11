<p align="center">
  <img src="icon.png" width="96" alt="MySampark logo" />
</p>

<h1 align="center">MySampark MCP</h1>

<p align="center">
  Connect your MySampark account to any AI assistant in your editor —
  manage products and social media campaigns without leaving the code.
</p>

---

## What this is

MySampark is a platform for managing product catalogs and social media
campaigns (Facebook, Instagram, and more). This extension connects that
account to the [Model Context Protocol](https://modelcontextprotocol.io)
(MCP), so any AI assistant that supports MCP — GitHub Copilot Chat, Claude
Code, Codex, or the AI features built into VS Code and Antigravity IDE — can
read and act on your MySampark data directly from a chat prompt.

**Install it once. Paste your token once. Every AI surface in the editor
picks it up automatically** — no manual JSON/TOML editing, no separate setup
per tool.

## Features

- 🔑 **One-time setup** — a single prompt for your API token, right after
  install
- 🔒 **Secure by default** — the token lives in VS Code's encrypted
  `SecretStorage`; it's written to config files only where a given tool
  *requires* a file (see [Supported surfaces](#supported-surfaces)), and
  those files are automatically added to `.gitignore`
- 🧩 **Multi-surface** — configures every AI assistant your editor exposes
  in one step, not just one
- 🛠️ **Six tools**: list/create/update/delete products, create campaigns,
  update campaign posts

## Install

1. Install **MySampark MCP** from the VS Code Marketplace (search
   "MySampark" in the Extensions view), or download the latest `.vsix` from
   [Releases](https://github.com/utsav12322/mysampark-mcp-plugin/releases)
   and use **Extensions: Install from VSIX...**
2. A notification appears: *"Connect your MySampark account to use its
   tools in chat."* Click **Enter API Token**.
3. Paste your token — generate one from your MySampark account
   (`POST /api/token`; see
   [`docs/mcp-server-setup.md`](https://github.com/utsav12322/socialpilot-clone/blob/main/docs/mcp-server-setup.md)
   in the main repo for the full API).

That's it. Ask your AI assistant something like *"List my MySampark
products"* to confirm it's connected.

## Supported surfaces

| Surface | How it connects |
|---|---|
| GitHub Copilot Chat (Agent mode) | VS Code's native `vscode.lm` provider API — no file written |
| VS Code's own MCP servers list | User-scope `mcp.json` |
| Claude Code (extension + CLI) | Workspace `.mcp.json` |
| Codex (extension + CLI) | `~/.codex/config.toml` |
| Antigravity IDE | `~/.gemini/config/mcp_config.json` + workspace `.agents/mcp_config.json` |

Each of these tools has its own, mutually incompatible way of discovering
MCP servers — this extension exists specifically to paper over that, from
one token prompt.

## Commands

Run from the Command Palette (`Cmd/Ctrl+Shift+P`):

| Command | Effect |
|---|---|
| **MySampark: Update API Token** | Replace the stored token everywhere (e.g. after regenerating it) |
| **MySampark: Sign Out** | Clear the token from every surface above |

## Available tools

| Tool | What it does |
|---|---|
| `list_products` | Search/fetch products |
| `create_product` | Create a product |
| `update_product` | Update a product by ID |
| `delete_product` | Delete a product by ID |
| `create_campaign` | Create a social media campaign from product IDs |
| `update_campaign_post` | Update a single campaign post |

## Example prompts

- "List my active MySampark products"
- "Add a new product: Blue T-shirt, ₹499, category Apparel"
- "Create a campaign for products 12, 15, and 20"
- "Mark product 42 as inactive"

## Privacy & security

- Your token is requested once and stored in VS Code's encrypted
  `SecretStorage` (backed by the OS keychain).
- Workspace config files this extension writes (`.mcp.json`,
  `.agents/mcp_config.json`) contain the token in plain text, by the
  requirements of the tools that read them — they are automatically added
  to that workspace's `.gitignore` so they're never committed.
- This extension only talks to `https://mcp.mysampark.com` — it makes no
  other network requests and collects no telemetry.
- Full server-side API docs: [mcp-server-setup.md](https://github.com/utsav12322/socialpilot-clone/blob/main/docs/mcp-server-setup.md).

## Troubleshooting

- **No prompt appeared on install** — run **MySampark: Update API Token**
  from the Command Palette manually.
- **A surface still doesn't see the server** — reload the window
  (`Developer: Reload Window`) after entering the token; some tools only
  read their config file at startup.
- **Token stopped working** — regenerate one from your MySampark account
  and run **MySampark: Update API Token** with the new value.

## Development

```bash
cd vscode-extension
npm install
npm run compile   # type-checks, then bundles src/extension.ts with esbuild
```

Press `F5` (with this folder open) to launch an Extension Development Host
with the extension loaded.

```bash
npx vsce package   # produces mysampark-mcp-<version>.vsix — install it
                    # locally (Extensions: Install from VSIX...) to test
                    # before publishing
npx vsce publish    # requires a Marketplace publisher account (Azure DevOps PAT)
```

See [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
for setting up the `mysampark` publisher account before running `vsce publish`.

## License

[MIT](LICENSE)

## Support

- Issues: [github.com/utsav12322/socialpilot-clone/issues](https://github.com/utsav12322/socialpilot-clone/issues)
- MCP server source: [socialpilot-clone](https://github.com/utsav12322/socialpilot-clone)
