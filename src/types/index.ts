/** 应用运行状态 */
export type AppStatus = 'idle' | 'listening' | 'paused' | 'finished';

/** 计数记录 */
export interface CountRecord {
  id: string;
  count: number;
  timestamp: number;
  threshold: number;
  target: number;
}

/** 视觉特效类型 */
export type VisualEffect = 'none' | 'snow' | 'sakura' | 'rain';

/** 用户设置 */
export interface Settings {
  threshold: number;  // 触发阈值 (dB)
  target: number;     // 目标计数
  initialCount: number; // 初始值
  visualEffect: VisualEffect; // 视觉特效
  voiceEnabled: boolean; // 是否开启报数
  voiceLang: 'zh-CN' | 'en-US'; // 报数语言
  voiceURI: string; // 选择的语音 URI
  cooldownMs: number; // 计数最小间隔 (ms)
}

/** 调试日志 */
export interface LogEntry {
  id: string;
  time: number;
  message: string;
  level: 'info' | 'warn' | 'error';
}
