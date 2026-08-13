# MySampark MCP Plugin

Connects Claude Code to your [MySampark](https://mysampark.com) account — manage
products and social media campaigns (Facebook, Instagram, and more) without
leaving the terminal.

## Install

```bash
claude plugin marketplace add utsav12322/mysampark-mcp-plugin
/plugin install mysampark-mcp@mysampark
```

## Authentication (one-time, after install)

Claude Code doesn't yet support per-user secrets in a plugin's checked-in
`.mcp.json` for HTTP servers, so the plugin can't prompt you for a token
automatically. Run this once, with your own MySampark API token (generate one
from your MySampark account at `https://mysampark.com`):

```bash
claude mcp remove mysampark-mcp    # drop the plugin's unauthenticated entry
claude mcp add --transport http mysampark-mcp https://mcp.mysampark.com/api/mcp \
  --header "Authorization: Bearer YOUR_TOKEN" --scope user
```

`--scope user` makes it available in every project, not just the current one.

## Available tools

- `list_products` — search/fetch products
- `create_product` — create a product
- `update_product` — update a product by ID
- `delete_product` — delete a product by ID
- `create_campaign` — create a social media campaign from product IDs
- `update_campaign_post` — update a single campaign post

## Example prompts

- "List my active MySampark products"
- "Add a new product: Blue T-shirt, ₹499, category Apparel"
- "Create a campaign for products 12, 15, and 20"

## Support

- Website: https://mysampark.com
- Issues: https://github.com/utsav12322/mysampark-mcp-plugin/issues

## Maintaining this repo

This repo holds all the *public-facing* MCP config in one place, separate
from the private application codebase:

- `server.json` — official [MCP Registry](https://registry.modelcontextprotocol.io)
  listing. To publish a change: bump `version`, then run `mcp-publisher publish`
  from this directory.
- `.claude-plugin/plugin.json` + `.mcp.json` — the Claude Code plugin itself
  (this repo root doubles as the plugin source).
- `.claude-plugin/marketplace.json` — a self-hosted marketplace listing that
  plugin, so `claude plugin marketplace add utsav12322/mysampark-mcp-plugin`
  works without waiting on a submission to a shared community marketplace.
- `vscode-extension/` — a separate, thin VS Code extension that prompts for
  and securely stores the API token, then auto-registers the same MCP server.
  See its own [README](vscode-extension/README.md) for build/publish steps.

**Testing the plugin locally from inside this repo:** don't run the
`## Authentication` commands above from this directory — `claude mcp remove
mysampark-mcp` with no `--scope` defaults to project scope and will strip the
entry straight out of this repo's checked-in `.mcp.json`. If that happens,
restore it with `git restore .mcp.json` before committing anything. Test
authentication from a separate, unrelated project directory instead.

The actual server lives at `https://mcp.mysampark.com/api/mcp`, in the
private `socialpilot-clone` repository.
