# Change Log

All notable changes to the "novel-helper" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release
- 修复：TypeScript 编译错误与若干运行时问题（createItems、highlighter、helpers、tree view、stats）。 已通过 ESLint 且无警告（2026-01-07）。

## [0.0.4] - 2026-01-14

- 统一配置面板的设置写入入口，使用 `updateNovelHelperSetting` 避免行为漂移。
- 改善配置面板类型定义，去除 `any`，并补全分类描述。

## [0.0.5] - 2026-01-14

- 修复硬换行首行/续行对齐：首段按首行可用列宽，余量按续行可用列宽拆分，避免续行沿用首行窄块导致右侧不齐。