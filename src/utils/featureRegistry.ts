import * as vscode from 'vscode';

let featureDisposables: vscode.Disposable[] = [];

export const addFeatureDisposable = (d: vscode.Disposable): void => {
  featureDisposables.push(d);
};

export const disposeAllFeatures = (): void => {
  for (const d of featureDisposables) {
    try { d.dispose(); } catch { /* ignore */ }
  }
  featureDisposables = [];
};
