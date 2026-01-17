import * as vscode from 'vscode';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

export const pathExists = async (uri: vscode.Uri): Promise<boolean> => {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
};

export const ensureDir = async (uri: vscode.Uri): Promise<void> => {
  try {
    await vscode.workspace.fs.createDirectory(uri);
  } catch {
    // ignore
  }
};

export const readTextFile = async (uri: vscode.Uri): Promise<string> => {
  const bytes = await vscode.workspace.fs.readFile(uri);
  return decoder.decode(bytes);
};

export const writeTextFile = async (uri: vscode.Uri, content: string): Promise<void> => {
  await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
};

export const writeTextFileIfMissing = async (uri: vscode.Uri, content: string): Promise<boolean> => {
  const exists = await pathExists(uri);
  if (exists) { return false; }
  await writeTextFile(uri, content);
  return true;
};
