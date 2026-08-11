import * as vscode from 'vscode';
import { syncAllFileConfigs } from './fileConfig';

const SERVER_LABEL = 'mysampark-mcp';
const SERVER_URL = 'https://mcp.mysampark.com/api/mcp';
const SECRET_KEY = 'mysampark-mcp.apiToken';

/**
 * Prompts for the MySampark API token (from POST /api/token, see
 * docs/mcp-server-setup.md in the main repo) and stores it in VS Code's
 * encrypted SecretStorage for our own vscode.lm-based registration (used by
 * GitHub Copilot Chat) — AND writes it into .mcp.json / ~/.codex/config.toml,
 * since Claude Code and Codex each have their own config file and don't read
 * VS Code's native MCP provider API at all.
 */
async function promptForToken(secrets: vscode.SecretStorage): Promise<string | undefined> {
  const token = await vscode.window.showInputBox({
    title: 'MySampark API Token',
    prompt: 'Paste the token from your MySampark account (Settings → API Tokens → Generate)',
    password: true,
    ignoreFocusOut: true,
  });

  if (token) {
    await secrets.store(SECRET_KEY, token);
    syncAllFileConfigs(token);
  }

  return token;
}

export function activate(context: vscode.ExtensionContext) {
  const onDidChangeEmitter = new vscode.EventEmitter<void>();

  const provider: vscode.McpServerDefinitionProvider = {
    onDidChangeMcpServerDefinitions: onDidChangeEmitter.event,

    // Called whenever VS Code needs the current list of servers this
    // provider offers. We only ever offer the one, fixed MySampark server —
    // the token is resolved lazily below, not baked in here.
    provideMcpServerDefinitions: async () => {
      return [
        new vscode.McpHttpServerDefinition(
          SERVER_LABEL,
          vscode.Uri.parse(SERVER_URL),
          {},
          '1.0.0'
        ),
      ];
    },

    // Called right before VS Code actually starts/uses the server. This is
    // where we attach the Authorization header — prompting for the token
    // the first time, then reusing the stored one silently after that.
    resolveMcpServerDefinition: async (server) => {
      if (!(server instanceof vscode.McpHttpServerDefinition) || server.label !== SERVER_LABEL) {
        return server;
      }

      let token = await context.secrets.get(SECRET_KEY);
      if (!token) {
        token = await promptForToken(context.secrets);
      }

      if (!token) {
        // User cancelled the prompt — let VS Code surface its own
        // "couldn't start" error rather than silently connecting unauthenticated.
        throw new Error('MySampark API token is required to connect.');
      }

      server.headers = { ...server.headers, Authorization: `Bearer ${token}` };
      return server;
    },
  };

  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider('mysamparkMcpProvider', provider),

    vscode.commands.registerCommand('mysampark-mcp.updateToken', async () => {
      const token = await promptForToken(context.secrets);
      if (token) {
        onDidChangeEmitter.fire();
        vscode.window.showInformationMessage('MySampark token updated. Reconnect the server to use it.');
      }
    }),

    vscode.commands.registerCommand('mysampark-mcp.signOut', async () => {
      await context.secrets.delete(SECRET_KEY);
      syncAllFileConfigs(undefined);
      onDidChangeEmitter.fire();
      vscode.window.showInformationMessage('MySampark token cleared.');
    })
  );

  // Ask right away, once, instead of waiting for the user to find the MCP
  // servers list and start it manually — that's the whole point of this
  // extension over hand-editing .vscode/mcp.json. Doesn't block anything;
  // dismissing it just means the lazy prompt in resolveMcpServerDefinition
  // covers it whenever a tool actually gets used.
  context.secrets.get(SECRET_KEY).then((existing) => {
    if (existing) {
      return;
    }
    vscode.window
      .showInformationMessage(
        'Connect your MySampark account to use its tools in chat.',
        'Enter API Token'
      )
      .then((choice) => {
        if (choice === 'Enter API Token') {
          promptForToken(context.secrets).then((token) => {
            if (token) {
              onDidChangeEmitter.fire();
            }
          });
        }
      });
  });
}

export function deactivate() {}
