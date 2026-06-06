/** 应用运行状态 */
export type AppStatus = 'idle' | 'listening' | 'paused' | 'finished';

/** 应用模式 */
export type AppMode = 'voice' | 'countdown';

/** 提示音类型 */
export type SoundType = 'beep' | 'double-beep' | 'chime';

/** 计数记录 */
export interface CountRecord {
  id: string;
  count: number;
  timestamp: number;
  threshold: number;
  target: number;
  note?: string;
  mode?: AppMode;
}

/** 视觉特效类型 */
export type VisualEffect = 'none' | 'snow' | 'sakura' | 'rain';

/** 用户设置 */
export interface Settings {
  mode: AppMode;
  // 声控模式
  threshold: number;    // 触发阈值 (dB)
  target: number;       // 目标计数
  initialCount: number; // 初始值
  cooldownMs: number;   // 计数最小间隔 (ms)
  // 倒计数模式
  countdownTotal: number;    // 倒计数初始总数
  countdownInterval: number; // 递减间隔（秒）
  soundType: SoundType;      // 提示音类型
  soundVolume: number;       // 提示音音量 0-1
  // 通用
  visualEffect: VisualEffect; // 视觉特效
}

/** 调试日志 */
export interface LogEntry {
  id: string;
  time: number;
  message: string;
  level: 'info' | 'warn' | 'error';
}
