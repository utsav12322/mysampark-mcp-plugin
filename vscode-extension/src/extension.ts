import * as vscode from 'vscode';

const SERVER_LABEL = 'mysampark-mcp';
const SERVER_URL = 'https://mcp.mysampark.com/api/mcp';
const SECRET_KEY = 'mysampark-mcp.apiToken';

/**
 * Prompts for the MySampark API token (from POST /api/token, see
 * docs/mcp-server-setup.md in the main repo) and stores it in VS Code's
 * encrypted SecretStorage — never written to settings.json or .vscode/mcp.json.
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
      onDidChangeEmitter.fire();
      vscode.window.showInformationMessage('MySampark token cleared.');
    })
  );
}

export function deactivate() {}
