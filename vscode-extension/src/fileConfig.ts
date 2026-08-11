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

/**
 * Antigravity IDE (Google's VS Code fork) also doesn't read vscode.lm
 * registrations or .mcp.json. Its docs describe two config locations — a
 * global ~/.gemini/config/mcp_config.json and a workspace-local
 * .agents/mcp_config.json — but in testing, the "Manage MCPs" panel only
 * ever picked up the global one (freshly installed, it just contains a
 * placeholder comment, not valid JSON — treated as empty below). We write
 * both anyway, since the workspace-local one may matter for other surfaces.
 * Schema uses `serverUrl` (not `url`/`httpUrl` — explicitly rejected as
 * legacy fields per Antigravity's docs).
 */
export function syncAntigravityConfig(token: string | undefined): void {
  const globalPath = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json');
  writeAntigravityConfigFile(globalPath, token);

  const folder = vscode.workspace.workspaceFolders?.[0];
  if (folder) {
    const localPath = path.join(folder.uri.fsPath, '.agents', 'mcp_config.json');
    writeAntigravityConfigFile(localPath, token);
    ensureGitignored(folder.uri.fsPath, '.agents/mcp_config.json');
  }
}

function writeAntigravityConfigFile(filePath: string, token: string | undefined): void {
  let config: any = {};
  if (fs.existsSync(filePath)) {
    try {
      config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      // Freshly-installed Antigravity ships this file with a placeholder
      // comment instead of JSON — not something worth preserving.
      config = {};
    }
  }

  config.mcpServers ??= {};

  if (!token) {
    delete config.mcpServers[SERVER_NAME];
  } else {
    config.mcpServers[SERVER_NAME] = {
      serverUrl: SERVER_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/**
 * VS Code's own native MCP support also has a global "User scope" config —
 * separate from both the workspace .vscode/mcp.json and our vscode.lm
 * provider registration. Confirmed by hand-editing it: entries here show up
 * under "MCP SERVERS - INSTALLED" the same as our dynamic registration does,
 * so we keep both in sync rather than relying on just one.
 */
export function syncVSCodeUserConfig(token: string | undefined): void {
  const dataDir = userDataDirName();
  if (!dataDir) {
    return; // Unrecognized host app — don't guess at a path.
  }

  const base =
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support', dataDir)
      : process.platform === 'win32'
        ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), dataDir)
        : path.join(os.homedir(), '.config', dataDir);

  const filePath = path.join(base, 'User', 'mcp.json');

  let config: any = {};
  if (fs.existsSync(filePath)) {
    try {
      config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return; // Malformed — don't clobber whatever the user has there.
    }
  }

  config.servers ??= {};

  if (!token) {
    delete config.servers[SERVER_NAME];
  } else {
    config.servers[SERVER_NAME] = {
      type: 'http',
      url: SERVER_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    };
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/** Maps the running host app to its Application Support/config folder name.
 *  Returns undefined for anything not explicitly recognized. */
function userDataDirName(): string | undefined {
  switch (vscode.env.appName) {
    case 'Visual Studio Code':
      return 'Code';
    case 'Visual Studio Code - Insiders':
      return 'Code - Insiders';
    case 'Cursor':
      return 'Cursor';
    default:
      return undefined;
  }
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

/** Runs all syncs, surfacing failures without throwing. */
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

  try {
    syncAntigravityConfig(token);
  } catch (err) {
    vscode.window.showWarningMessage(`Couldn't update .agents/mcp_config.json: ${err}`);
  }

  try {
    syncVSCodeUserConfig(token);
  } catch (err) {
    vscode.window.showWarningMessage(`Couldn't update VS Code's user mcp.json: ${err}`);
  }
}
