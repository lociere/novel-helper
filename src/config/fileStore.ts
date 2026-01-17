import * as vscode from 'vscode';
import { pathExists, readTextFile, writeTextFile } from '../utils/workspaceFs';
import { defaultConfig, type NovelHelperConfig } from './types';
import { sanitizeConfig } from './sanitize';

/** 配置文件名称 */
export const CONFIG_FILE_NAME = '.novel-helper.json';

let cachedConfig: NovelHelperConfig = { ...defaultConfig };
let hasLoaded = false;
let configFileExists = false;
let configIsValid = true;
let loadingPromise: Promise<void> | undefined;

let pendingWriteConfig: NovelHelperConfig | undefined;
let writeTimer: NodeJS.Timeout | undefined;
let inFlightWrite: Promise<void> | undefined;

const getWorkspaceFolderUri = (): vscode.Uri | undefined => vscode.workspace.workspaceFolders?.[0]?.uri;

const getWorkspaceRootFsPath = (): string | undefined => getWorkspaceFolderUri()?.fsPath;

const getConfigFileUri = (): vscode.Uri | undefined => {
  const root = getWorkspaceFolderUri();
  if (!root) { return undefined; }
  return vscode.Uri.joinPath(root, CONFIG_FILE_NAME);
};

const initDefaultConfigForCurrentWorkspace = (): NovelHelperConfig => {
  const root = getWorkspaceRootFsPath();
  return { ...defaultConfig, workspacePath: root || '' };
};

const persistConfigToDisk = async (cfg: NovelHelperConfig): Promise<void> => {
  const uri = getConfigFileUri();
  if (!uri) { return; }
  await writeTextFile(uri, JSON.stringify(cfg, null, 2));
  configFileExists = true;
  configIsValid = true;
};

const scheduleConfigWrite = (cfg: NovelHelperConfig): void => {
  pendingWriteConfig = cfg;

  if (writeTimer) { return; }

  writeTimer = setTimeout(() => {
    writeTimer = undefined;

    const next = pendingWriteConfig;
    pendingWriteConfig = undefined;
    if (!next) { return; }

    inFlightWrite = persistConfigToDisk(next).catch(err => {
      console.error('[Novel Helper] 写入配置文件失败:', err);
      vscode.window.showErrorMessage('写入配置文件失败');
    }).finally(() => {
      inFlightWrite = undefined;
    });
  }, 200);
};

export const flushConfigWrites = async (): Promise<void> => {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = undefined;

    const next = pendingWriteConfig;
    pendingWriteConfig = undefined;
    if (next) {
      inFlightWrite = persistConfigToDisk(next).catch(err => {
        console.error('[Novel Helper] 写入配置文件失败:', err);
      }).finally(() => {
        inFlightWrite = undefined;
      });
    }
  }

  if (inFlightWrite) {
    await inFlightWrite;
  }
};

/** 获取工作区配置文件路径（fsPath），用于旧调用方兼容。 */
export const getConfigFilePath = (): string => getConfigFileUri()?.fsPath || '';

export const ensureConfigLoaded = async (): Promise<void> => {
  if (hasLoaded) { return; }
  if (loadingPromise) { return loadingPromise; }

  loadingPromise = (async () => {
    const uri = getConfigFileUri();
    if (!uri) {
      cachedConfig = { ...defaultConfig };
      configFileExists = false;
      configIsValid = true;
      hasLoaded = true;
      return;
    }

    const exists = await pathExists(uri);
    if (!exists) {
      cachedConfig = initDefaultConfigForCurrentWorkspace();
      configFileExists = false;
      configIsValid = true;
      hasLoaded = true;
      return;
    }

    try {
      const content = await readTextFile(uri);
      const parsed = JSON.parse(content);
      const { config: sanitized, changed } = sanitizeConfig(parsed);
      cachedConfig = sanitized;
      configFileExists = true;
      configIsValid = true;
      hasLoaded = true;

      if (changed) {
        await persistConfigToDisk(sanitized);
      }
    } catch (err) {
      console.error('[Novel Helper] 读取配置文件失败:', err);
      vscode.window.showErrorMessage('读取配置文件失败，使用默认配置');
      cachedConfig = initDefaultConfigForCurrentWorkspace();
      configFileExists = true;
      // 与旧行为保持一致：配置文件损坏时视为“未初始化”。
      configIsValid = false;
      hasLoaded = true;
    }
  })().finally(() => {
    loadingPromise = undefined;
  });

  return loadingPromise;
};

/** 同步读取配置（未加载时会异步触发加载并返回兜底值）。 */
export const readConfig = (): NovelHelperConfig => {
  if (!hasLoaded) {
    void ensureConfigLoaded();
    return initDefaultConfigForCurrentWorkspace();
  }
  return cachedConfig;
};

/**
 * 同步写入配置：内存立即更新，落盘采用防抖。
 * 若配置尚未加载完成，会等待加载后再合并写入，避免覆盖真实值。
 */
export const writeConfig = (config: Partial<NovelHelperConfig>): void => {
  if (!hasLoaded) {
    void ensureConfigLoaded().then(() => writeConfig(config));
    return;
  }

  if (!getConfigFileUri()) {
    vscode.window.showErrorMessage('未找到工作区');
    return;
  }

  const currentConfig = readConfig();
  const { config: newConfig } = sanitizeConfig({ ...currentConfig, ...config });
  cachedConfig = newConfig;
  scheduleConfigWrite(newConfig);
};

export const invalidateConfigCache = (): void => {
  hasLoaded = false;
  loadingPromise = undefined;
  cachedConfig = { ...defaultConfig };
  configFileExists = false;
  configIsValid = true;

  pendingWriteConfig = undefined;
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = undefined;
  }
  inFlightWrite = undefined;
};

/** 删除工作区配置文件（.novel-helper.json），若不存在则跳过 */
export const deleteConfigFile = async (): Promise<void> => {
  const uri = getConfigFileUri();
  if (!uri) { return; }
  try {
    // 避免防抖写入在删除后“把文件又写回来”。
    await flushConfigWrites();
    await vscode.workspace.fs.delete(uri, { recursive: false, useTrash: true });
    invalidateConfigCache();
  } catch {
    // ignore
  }
};

/** 判断当前工作区是否已通过 Novel Helper 初始化（存在配置文件） */
export const isWorkspaceInitialized = (): boolean => {
  if (!hasLoaded) {
    void ensureConfigLoaded();
    return false;
  }

  if (!configFileExists) { return false; }
  if (!configIsValid) { return false; }
  const currentRoot = getWorkspaceRootFsPath();
  if (!currentRoot) { return false; }
  return typeof cachedConfig.workspacePath === 'string' && cachedConfig.workspacePath === currentRoot;
};

/**
 * 监听配置文件的外部变更（例如用户手动编辑 .novel-helper.json）。
 * 建议在激活后注册一次。
 */
export const registerConfigFileWatcher = (onChanged?: () => void): vscode.Disposable => {
  const folder = getWorkspaceFolderUri();
  if (!folder) {
    return new vscode.Disposable(() => { /* noop */ });
  }

  const pattern = new vscode.RelativePattern(folder, CONFIG_FILE_NAME);
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  const reload = async () => {
    invalidateConfigCache();
    await ensureConfigLoaded();
    onChanged?.();
  };

  const d1 = watcher.onDidChange(() => { void reload(); });
  const d2 = watcher.onDidCreate(() => { void reload(); });
  const d3 = watcher.onDidDelete(() => {
    invalidateConfigCache();
    onChanged?.();
  });

  const d4 = vscode.workspace.onDidChangeWorkspaceFolders(() => {
    void reload();
  });

  return vscode.Disposable.from(watcher, d1, d2, d3, d4);
};
