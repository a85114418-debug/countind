/** 应用运行状态 */
export type AppStatus = 'idle' | 'listening' | 'paused' | 'finished';

/** 应用模式 */
export type AppMode = 'voice' | 'countdown';

/** 提示音类型 */
export type SoundType = 'beep' | 'double-beep' | 'chime';

/** 倒计数子模式 */
export type CountdownMode = 'fixed' | 'random';

/** 随机倒计数 — 总数来源 */
export type RandomTotalMode = 'manual' | 'range';

/** 随机倒计数 — 频率挡位 */
export type RandomTier = 'low' | 'mid' | 'high';

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
  countdownMode: CountdownMode;    // 倒计数子模式
  countdownTotal: number;          // 固定倒计数初始总数
  countdownInterval: number;       // 固定倒计数递减间隔（秒）
  // 随机倒计数
  randomTotalMode: RandomTotalMode; // 总数来源
  randomTotalManual: number;        // 手动输入总数
  randomRangeMin: number;           // 随机区间下限
  randomRangeMax: number;           // 随机区间上限
  randomTier: RandomTier;           // 频率挡位
  soundType: SoundType;             // 提示音类型
  soundVolume: number;              // 提示音音量 0-1
  // 通用
  visualEffect: VisualEffect;       // 视觉特效
}

/** 调试日志 */
export interface LogEntry {
  id: string;
  time: number;
  message: string;
  level: 'info' | 'warn' | 'error';
}
