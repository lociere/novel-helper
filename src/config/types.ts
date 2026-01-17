export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface HighlightItem {
  path: string;
  range: Range;
}

/** 插件配置类型 */
export interface NovelHelperConfig {
  workspacePath: string;
  paragraphIndent: number;
  /**
   * 文本整体缩进空格数：对所有行生效（首行/折行/所有段落）。
   * 默认 0。
   */
  overallIndent: number;
  /** 段间距（段间空行数）。 */
  lineSpacing: number;
  /**
   * 段落识别策略：决定是否把“空行”作为段落分隔标准。
   * - anyBlankLine: 只要文档中出现过空行，就用空行分段（旧逻辑）
   * - requireAll: 只有当所有段落边界都有空行时才用空行分段，否则退化为“一行一段”
   * - majority: 当大多数段落边界都有空行时才用空行分段，否则退化为“一行一段”
   */
  paragraphSplitMode: 'anyBlankLine' | 'requireAll' | 'majority';
  /**
   * 当某一行本身带段首缩进（看起来是新段开头）时，即使段落间没有空行，也强制从该行开始新段落。
   */
  paragraphSplitOnIndentedLine: boolean;
  fontSize: number;
  /** VS Code 行高（editor.lineHeight）。0 表示不写入工作区设置。 */
  editorLineHeight: number;
  highlightColor: string;
  /**
   * 自动隐藏 VS Code 缩进参考线（避免出现竖线）。
   * 仅写入工作区设置，不影响全局用户设置。
   */
  autoDisableIndentGuides: boolean;
  /** 回车自动排版：自动插入段间空行与段首缩进。 */
  autoLayoutOnEnter: boolean;
  /**
   * VS Code 显示换行列宽（editor.wordWrapColumn）。
   * 0 表示不主动覆盖 editor.wordWrapColumn（仅启用 wordWrapColumn 模式）。
   */
  editorWordWrapColumn: number;
  /** 是否使用全角空格（U+3000）作为缩进单位。 */
  useFullWidthIndent: boolean;

  /** 是否开启自动保存（映射到 VS Code files.autoSave，工作区级别）。 */
  autoSaveEnabled: boolean;

  /** 自动保存延迟（毫秒），映射到 VS Code files.autoSaveDelay（工作区级别）。 */
  autoSaveDelayMs: number;
  /** highlightItems 的值采用可序列化的范围表示，便于写入配置文件 */
  highlightItems: { [key: string]: HighlightItem };
  editStartTime: number;
  totalEditTime: number;
  lastWordCount: number;
}

/** 默认配置 */
export const defaultConfig: NovelHelperConfig = {
  workspacePath: '',
  paragraphIndent: 2,
  overallIndent: 0,
  lineSpacing: 1,
  paragraphSplitMode: 'anyBlankLine',
  paragraphSplitOnIndentedLine: true,
  fontSize: 14,
  editorLineHeight: 0,
  highlightColor: '#FFD700',
  autoDisableIndentGuides: false,
  autoLayoutOnEnter: true,
  editorWordWrapColumn: 0,
  useFullWidthIndent: false,
  autoSaveEnabled: false,
  autoSaveDelayMs: 1000,
  highlightItems: {},
  editStartTime: 0,
  totalEditTime: 0,
  lastWordCount: 0
};
