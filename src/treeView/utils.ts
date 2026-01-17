import * as path from 'path';

const TEXT_EXTS = ['.txt', '.md'];

export function isTextFile(fileName: string): boolean {
  return TEXT_EXTS.some(ext => fileName.endsWith(ext));
}

export function isConfigFile(fileName: string): boolean {
  return fileName === '.novel-helper.json' || fileName.startsWith('.');
}

/**
 * 根目录下的预定义文件夹
 */
export const PREDEFINED_ROOTS = ['大纲', '设定', '素材', '正文'];

export function resolveDirPath(root: string, elementLabel: string | undefined): string | undefined {
  if (!elementLabel) {return undefined;}
  if (PREDEFINED_ROOTS.includes(elementLabel)) {
    return path.join(root, elementLabel);
  }
  return undefined;
}
