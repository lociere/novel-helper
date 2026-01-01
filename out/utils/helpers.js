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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentTimestamp = exports.formatNumber = exports.getSelectedText = exports.calculateWritingSpeed = exports.formatTime = exports.countWords = void 0;
const vscode = __importStar(require("vscode"));
const dayjs_1 = __importDefault(require("dayjs"));
/**
 * 计算文本字数（含中文、英文、数字，不含空格和换行）
 * @param text 文本内容
 * @returns 字数
 */
const countWords = (text) => {
    if (!text) {
        return 0;
    }
    // 移除空格和换行
    const cleanText = text.replace(/\s/g, '');
    return cleanText.length;
};
exports.countWords = countWords;
/**
 * 格式化时间（秒转时分秒）
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? `${h}小时` : ''}${m > 0 ? `${m}分钟` : ''}${s}秒`;
};
exports.formatTime = formatTime;
/**
 * 计算码字速度（字/分钟）
 * @param wordCount 字数变化
 * @param duration 时长（秒）
 * @returns 速度
 */
const calculateWritingSpeed = (wordCount, duration) => {
    if (duration === 0 || wordCount === 0) {
        return 0;
    }
    const minutes = duration / 60;
    return Math.round(wordCount / minutes);
};
exports.calculateWritingSpeed = calculateWritingSpeed;
/**
 * 获取选中的文本
 * @returns 选中的文本
 */
const getSelectedText = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return '';
    }
    const selection = editor.selection;
    if (selection.isEmpty) {
        return '';
    }
    return editor.document.getText(selection);
};
exports.getSelectedText = getSelectedText;
/**
 * 格式化数字（补零）
 * @param num 数字
 * @param length 长度
 * @returns 格式化后的字符串
 */
const formatNumber = (num, length = 2) => {
    return num.toString().padStart(length, '0');
};
exports.formatNumber = formatNumber;
/**
 * 获取当前时间戳（秒）
 * @returns 时间戳
 */
const getCurrentTimestamp = () => {
    return (0, dayjs_1.default)().unix();
};
exports.getCurrentTimestamp = getCurrentTimestamp;
//# sourceMappingURL=helpers.js.map