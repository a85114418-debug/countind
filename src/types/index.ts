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

/** 用户设置 */
export interface Settings {
  threshold: number;  // 触发阈值 (dB)
  target: number;     // 目标计数
  initialCount: number; // 初始值
}

/** 调试日志 */
export interface LogEntry {
  id: string;
  time: number;
  message: string;
  level: 'info' | 'warn' | 'error';
}
