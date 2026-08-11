import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as TOML from 'smol-toml';

const SERVER_NAME = 'mysampark-mcp';
const SERVER_URL = 'https://mcp.mysampark.com/api/mcp';

/**
 * Claude Code (the "Claude Code for VS Code" extension, and the CLI) reads
 * a plain .mcp.json at the workspace root — it does not consume VS Code's
 * native vscode.lm.registerMcpServerDefinitionProvider API at all, so we
 * write the file directly instead.
 */
export function syncClaudeCodeConfig(token: string | undefined): void {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    return; // No open folder — nothing to write into.
  }

  const filePath = path.join(folder.uri.fsPath, '.mcp.json');

  let config: any = {};
  if (fs.existsSync(filePath)) {
    try {
      config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      // Malformed existing file — don't touch it, avoid clobbering whatever
      // the user has there.
      return;
    }
  }

  config.mcpServers ??= {};

  if (!token) {
    delete config.mcpServers[SERVER_NAME];
  } else {
    config.mcpServers[SERVER_NAME] = {
      url: SERVER_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    };
  }

  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  ensureGitignored(folder.uri.fsPath, '.mcp.json');
}

/**
 * Codex (CLI and its VS Code extension) shares ~/.codex/config.toml — it
 * doesn't read vscode.lm-registered servers either, so we merge an entry
 * into that file directly.
 */
export function syncCodexConfig(token: string | undefined): void {
  const filePath = path.join(os.homedir(), '.codex', 'config.toml');

  let config: any = {};
  if (fs.existsSync(filePath)) {
    try {
      config = TOML.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      // Malformed existing file — leave it alone rather than risk data loss.
      return;
    }
  }

  config.mcp_servers ??= {};

  if (!token) {
    delete config.mcp_servers[SERVER_NAME];
  } else {
    config.mcp_servers[SERVER_NAME] = {
      url: SERVER_URL,
      http_headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, TOML.stringify(config), 'utf8');
}

/** Add a line to .gitignore if it's missing — a token-bearing .mcp.json
 *  should never land in version control. Best-effort; never throws. */
function ensureGitignored(folderPath: string, entry: string): void {
  try {
    const gitignorePath = path.join(folderPath, '.gitignore');
    const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
    const lines = existing.split('\n').map((l) => l.trim());
    if (lines.includes(entry)) {
      return;
    }
    const separator = existing.length && !existing.endsWith('\n') ? '\n' : '';
    fs.writeFileSync(gitignorePath, existing + separator + entry + '\n', 'utf8');
  } catch {
    // Best-effort only.
  }
}

/** Runs both syncs, surfacing failures without throwing. */
export function syncAllFileConfigs(token: string | undefined): void {
  try {
    syncClaudeCodeConfig(token);
  } catch (err) {
    vscode.window.showWarningMessage(`Couldn't update .mcp.json: ${err}`);
  }

  try {
    syncCodexConfig(token);
  } catch (err) {
    vscode.window.showWarningMessage(`Couldn't update ~/.codex/config.toml: ${err}`);
  }
}
