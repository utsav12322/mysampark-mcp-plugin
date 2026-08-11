# MySampark MCP Plugin

Connects Claude Code to your [MySampark](https://mysampark.com) account — manage
products and social media campaigns (Facebook, Instagram, and more) without
leaving the terminal.

## Install

```bash
claude plugin marketplace add anthropics/claude-plugins-community
/plugin install mysampark-mcp@claude-community
```

## Authentication

The first time you use a tool, Claude Code opens your browser to sign in to
your MySampark account and approve access (OAuth 2.0). No token to copy or
paste.

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

- Docs: see `docs/mcp-server-setup.md` in the [main MySampark repository](https://github.com/utsav12322/socialpilot-clone)
- Issues: https://github.com/utsav12322/socialpilot-clone/issues

## Maintaining this repo

This repo holds all the *public-facing* MCP config in one place, separate
from the private application codebase:

- `server.json` — official [MCP Registry](https://registry.modelcontextprotocol.io)
  listing. To publish a change: bump `version`, then run `mcp-publisher publish`
  from this directory.
- `.claude-plugin/plugin.json` + `.mcp.json` — Claude Code Plugin Directory
  submission (`platform.claude.com/plugins/submit`).

The actual server lives at `https://mcp.mysampark.com/api/mcp`, in the
private `socialpilot-clone` repository.
