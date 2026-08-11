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

- Docs: https://mysampark.com (see `docs/mcp-server-setup.md` in this repository)
- Issues: https://github.com/utsav12322/socialpilot-clone/issues
