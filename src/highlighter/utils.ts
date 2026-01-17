import * as vscode from 'vscode';

export const HIGHLIGHT_MAX_DOC_CHARS = 1_000_000;
export const HIGHLIGHT_MAX_MATCHES_PER_ITEM = 2_000;
export const HIGHLIGHT_MAX_KEY_LENGTH = 200;

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getPersistedRange(range: unknown): vscode.Range | null {
  try {
    if (range instanceof vscode.Range) {
      return range;
    }
    const r = range as { start: { line: number; character: number }; end: { line: number; character: number } };
    return new vscode.Range(
      new vscode.Position(r.start.line, r.start.character),
      new vscode.Position(r.end.line, r.end.character)
    );
  } catch {
    return null;
  }
}
