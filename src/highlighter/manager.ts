import * as vscode from 'vscode';
import { readConfig } from '../config';
import { debounce } from '../utils/async';
import { TEXT_DOCUMENT_SELECTORS } from '../utils/supportedDocuments';
import { removeHighlightItem, upsertHighlightItem } from './highlightStore';
import { DecorationManager } from './decoration';
import { HighlightMatcher, ValidatedHighlightItem } from './matcher';
import { getPersistedRange } from './utils';
import { registerHighlightCommands } from './commands';

export class HighlightManager implements vscode.Disposable {
  private decorationManager: DecorationManager;
  private matcher: HighlightMatcher;
  private highlightItems: { [key: string]: ValidatedHighlightItem } = {};
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.decorationManager = new DecorationManager();
    this.matcher = new HighlightMatcher();

    this.loadPersistedHighlights();
        
    // Initial update
    this.updateHighlights();

    this.registerEventListeners();
    this.registerDefinitionProvider();
        
    // Register commands externally but connected to this instance
    this.disposables.push(...registerHighlightCommands(this));
  }

  public getKeys(): string[] {
    return Object.keys(this.highlightItems);
  }

  public getItem(key: string): ValidatedHighlightItem | undefined {
    return this.highlightItems[key];
  }

  public addHighlight(text: string, selection: vscode.Selection, docPath: string): void {
    const serialRange = {
      start: { line: selection.start.line, character: selection.start.character },
      end: { line: selection.end.line, character: selection.end.character }
    };

    upsertHighlightItem(text, { path: docPath, range: serialRange });

    this.highlightItems[text] = { path: docPath, range: selection };
    this.matcher.clearCache(text); // Clear cache just in case
    this.updateHighlights();
  }

  public removeHighlight(key: string): void {
    removeHighlightItem(key);
    delete this.highlightItems[key];
    this.matcher.clearCache(key);
    this.updateHighlights();
  }

  public updateHighlights(): void {
    vscode.window.visibleTextEditors.forEach(editor => {
      this.updateEditorHighlights(editor);
    });
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.decorationManager.dispose();
  }

  private loadPersistedHighlights(): void {
    const cfg = readConfig();
    const items = cfg.highlightItems || {};
    try {
      Object.keys(items).forEach(key => {
        const v = items[key];
        const range = getPersistedRange(v.range);
        if (range) {
          this.highlightItems[key] = { path: v.path, range };
        }
      });
    } catch (e) {
      console.warn('[Novel Helper] Load highlights failed:', e);
    }
  }

  private updateEditorHighlights(editor: vscode.TextEditor): void {
    if (!editor || !editor.document) { return; }

    const document = editor.document;
    const text = document.getText();
    const decorations: vscode.DecorationOptions[] = [];
    const hoverMsg = new vscode.MarkdownString('按住 Ctrl 点击跳转到源位置');
    hoverMsg.isTrusted = false;

    Object.keys(this.highlightItems).forEach(key => {
      if (!key || !key.trim()) {return;}

      try {
        const ranges = this.matcher.findRanges(key, this.highlightItems[key], document, text);
                
        ranges.forEach(r => {
          decorations.push({
            range: r,
            hoverMessage: hoverMsg
          });
        });

      } catch (error) {
        console.error(`[Novel Helper] Error highlighting item: ${key}`, error);
        delete this.highlightItems[key];
      }
    });

    editor.setDecorations(this.decorationManager.get(), decorations);
  }

  private registerEventListeners(): void {
    const debouncedUpdate = debounce(() => this.updateHighlights(), 300);

    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(() => debouncedUpdate()),
      vscode.window.onDidChangeActiveTextEditor(() => debouncedUpdate()),
      vscode.window.onDidChangeVisibleTextEditors(() => debouncedUpdate()),
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('novel-helper.highlightColor')) {
          this.decorationManager.recreate();
          this.updateHighlights();
        }
      })
    );
  }

  private registerDefinitionProvider(): void {
    const provider = vscode.languages.registerDefinitionProvider(TEXT_DOCUMENT_SELECTORS, {
      provideDefinition: (document, position) => {
        const fullText = document.getText();
        for (const key of Object.keys(this.highlightItems)) {
          const item = this.highlightItems[key];
          if (!item || !item.path) { continue; }

          const ranges = this.matcher.findRanges(key, item, document, fullText);
          const hit = ranges.find(r => r.contains(position));
          if (hit) {
            return [{
              originSelectionRange: hit,
              targetUri: vscode.Uri.file(item.path),
              targetRange: item.range,
              targetSelectionRange: item.range
            }];
          }
        }
        return undefined;
      }
    });

    this.disposables.push(provider);
  }
}
