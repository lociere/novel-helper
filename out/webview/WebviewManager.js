"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewManager = void 0;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
/**
 * 聚合面板管理器
 */
class WebviewManager {
    panel;
    extensionUri;
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    /**
     * 打开聚合面板
     */
    openPanel() {
        // 如果面板已存在，显示并返回
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }
        // 创建新面板
        this.panel = vscode.window.createWebviewPanel('novelHelperPanel', '小说助手', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        });
        // 设置面板内容
        this.panel.webview.html = this.getWebviewContent();
        // 监听面板关闭
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null);
        // 监听消息（从webview接收）
        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'updateConfig':
                    this.handleConfigUpdate(message.config);
                    return;
                case 'refreshTree':
                    vscode.commands.executeCommand('novel-helper.refreshTree');
                    return;
            }
        }, null);
    }
    /**
     * 处理配置更新
     * @param config 更新的配置
     */
    handleConfigUpdate(config) {
        if (config.typesetting) {
            extension_1.configManager.updateTypesetting(config.typesetting);
        }
        if (config.highlight) {
            extension_1.configManager.updateHighlight(config.highlight);
        }
        if (config.stats) {
            extension_1.configManager.updateStats(config.stats);
        }
        vscode.window.showInformationMessage('小说助手：配置已更新');
    }
    /**
     * 获取Webview内容
     */
    getWebviewContent() {
        // 简化版面板HTML（可根据需要扩展）
        return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>小说助手</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }
          .panel-section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
          h2 { color: #333; margin-bottom: 10px; }
          .config-item { margin: 10px 0; }
          label { display: inline-block; width: 120px; }
          select, input[type="number"], input[type="color"] { padding: 5px; width: 200px; }
          button { padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #005fa3; }
        </style>
      </head>
      <body>
        <div class="panel-section">
          <h2>排版设置</h2>
          <div class="config-item">
            <label>缩进类型：</label>
            <select id="indentType">
              <option value="space">空格</option>
              <option value="tab">制表符</option>
            </select>
          </div>
          <div class="config-item">
            <label>缩进数量：</label>
            <select id="indentCount">
              <option value="2">2</option>
              <option value="4">4</option>
            </select>
          </div>
          <div class="config-item">
            <label>行间空行：</label>
            <select id="lineGap">
              <option value="0">0行</option>
              <option value="1">1行</option>
              <option value="2">2行</option>
            </select>
          </div>
          <div class="config-item">
            <label>自动排版：</label>
            <input type="checkbox" id="autoFormatOnSave" checked>
          </div>
        </div>

        <div class="panel-section">
          <h2>高亮设置</h2>
          <div class="config-item">
            <label>角色名背景色：</label>
            <input type="color" id="characterColor" value="#e6f7ff">
          </div>
          <div class="config-item">
            <label>事物设定背景色：</label>
            <input type="color" id="thingColor" value="#f0fff4">
          </div>
        </div>

        <div class="panel-section">
          <h2>统计设置</h2>
          <div class="config-item">
            <label>统计空格：</label>
            <input type="checkbox" id="countSpace">
          </div>
          <div class="config-item">
            <label>速度计算窗口：</label>
            <select id="speedWindow">
              <option value="5">5分钟</option>
              <option value="10" selected>10分钟</option>
              <option value="15">15分钟</option>
            </select>
          </div>
        </div>

        <button id="saveConfig">保存设置</button>

        <script>
          // 初始化表单值
          const config = ${JSON.stringify(extension_1.configManager.getConfig())};
          document.getElementById('indentType').value = config.typesetting.indentType;
          document.getElementById('indentCount').value = config.typesetting.indentCount;
          document.getElementById('lineGap').value = config.typesetting.lineGap;
          document.getElementById('autoFormatOnSave').checked = config.typesetting.autoFormatOnSave;
          document.getElementById('characterColor').value = config.highlight.colors.character;
          document.getElementById('thingColor').value = config.highlight.colors.thing;
          document.getElementById('countSpace').checked = config.stats.countSpace;
          document.getElementById('speedWindow').value = config.stats.speedWindow;

          // 保存设置
          document.getElementById('saveConfig').addEventListener('click', () => {
            const newConfig = {
              typesetting: {
                indentType: document.getElementById('indentType').value,
                indentCount: parseInt(document.getElementById('indentCount').value),
                lineGap: parseInt(document.getElementById('lineGap').value),
                autoFormatOnSave: document.getElementById('autoFormatOnSave').checked
              },
              highlight: {
                colors: {
                  character: document.getElementById('characterColor').value,
                  thing: document.getElementById('thingColor').value
                }
              },
              stats: {
                countSpace: document.getElementById('countSpace').checked,
                speedWindow: parseInt(document.getElementById('speedWindow').value)
              }
            };
            
            // 发送消息到扩展
            window.acquireVsCodeApi().postMessage({
              command: 'updateConfig',
              config: newConfig
            });
          });
        </script>
      </body>
      </html>
    `;
    }
}
exports.WebviewManager = WebviewManager;
//# sourceMappingURL=WebviewManager.js.map