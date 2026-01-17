# Change Log

All notable changes to the "novel-helper" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- TBD

## [0.1.1] - 2026-01-17

- 工程整理：抽取通用 `debounce`/`isThenable`，减少重复实现。
- 解耦：修复 `utils` 与 `config` 潜在循环依赖风险，降低初始化顺序问题。
- 一致性：高亮与格式化统一复用相同的文档选择器定义。
- 清理：移除未被引用的导出，收敛模块职责边界。

## [0.0.10] - 2026-01-16

- 修复：TypeScript 编译错误与若干运行时问题（createItems、highlighter、helpers、tree view、stats）。已通过 ESLint 且无警告。
- 排版策略调整：格式化输出改为“每段一行”（依赖 VS Code 软换行显示折行），并支持跳过 Markdown 标题等前缀行。
- 移除硬换行与段内行间距相关实现与配置项，配置面板仅保留 `editor.wordWrapColumn` 相关设置。
- 新增编辑行为增强：回车自动补段间空行与段首缩进（可开关）。
- 启动小说工作区后同步写入编辑器显示设置：`editor.wordWrap=wordWrapColumn`、`editor.wrappingIndent=none`，并支持同步 `editor.lineHeight`。

## [0.0.4] - 2026-01-14

- 统一配置面板的设置写入入口，使用 `updateNovelHelperSetting` 避免行为漂移。
- 改善配置面板类型定义，去除 `any`，并补全分类描述。

## [0.0.5] - 2026-01-14

- 修复硬换行首行/续行对齐：首段按首行可用列宽，余量按续行可用列宽拆分，避免续行沿用首行窄块导致右侧不齐。

## [0.0.6] - 2026-01-14

- 未初始化工作区时，仅在命令面板展示“初始化小说工作区”命令，其余命令隐藏，避免日常 VS Code 受影响。
- 基于 context key 控制命令显隐，初始化/关闭时自动更新状态。

## [0.0.7] - 2026-01-14

- 修复“关闭小说工作区”后状态栏等仍加载的问题：新增功能注册表，关闭/停用时统一卸载所有模块；激活时仅在已初始化工作区注册非命令模块。

## [0.0.8] - 2026-01-14

- 文案统一：将“初始化小说工作区”统一更名为“开启小说工作区”（命令/提示/树视图入口）。

## [0.0.9] - 2026-01-14

- 全局瘦身与整理：移除未使用的工具函数与重复逻辑，树视图工作区判定与初始化逻辑对齐（以 `.novel-helper.json` 为准）。
- 工程优化：移除冗余 activationEvents（onCommand），保持配置更简洁。