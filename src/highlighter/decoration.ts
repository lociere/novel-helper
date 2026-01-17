import * as vscode from 'vscode';
import { readConfig } from '../config';

export class DecorationManager {
  private decorationType: vscode.TextEditorDecorationType;

  constructor() {
    this.decorationType = this.createDecorationType();
  }

  public get(): vscode.TextEditorDecorationType {
    return this.decorationType;
  }

  public recreate(): void {
    this.dispose();
    this.decorationType = this.createDecorationType();
  }

  public dispose(): void {
    try {
      this.decorationType.dispose();
    } catch {
      // ignore
    }
  }

  private createDecorationType(): vscode.TextEditorDecorationType {
    const cfg = readConfig();
    const color = cfg.highlightColor || '#FFD700';
    return vscode.window.createTextEditorDecorationType({
      isWholeLine: false,
      color,
      textDecoration: 'none'
    });
  }
}
