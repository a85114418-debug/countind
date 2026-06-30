import { useRef, useState, useCallback, useEffect } from 'react';
import type { AppStatus, LogEntry, Settings } from '../types';
import { playSound, playFinishSound } from '../utils/beep';
import { saveRecord as persistRecord } from '../utils/storage';

let logId = 0;
function makeLog(message: string, level: LogEntry['level'] = 'info'): LogEntry {
  return { id: String(++logId), time: Date.now(), message, level };
}

export interface RandomCountdownReturn {
  status: AppStatus;
  count: number;
  total: number;
  isFlashing: boolean;
  logs: LogEntry[];
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

/** 根据用户输入的频率（秒）生成随机间隔（ms），±50% 范围内随机 */
function randomInterval(frequencySec: number): number {
  const centerMs = frequencySec * 1000;
  const spreadMs = centerMs * 0.5;
  const minMs = Math.max(50, centerMs - spreadMs);
  const maxMs = Math.min(20000, centerMs + spreadMs);
  return minMs + Math.random() * (maxMs - minMs);
}

/**
 * 随机频率倒计数 hook — 接口兼容 useCountdownTimer
 *
 * 与固定间隔倒计时的区别：
 *  1. 总数可手动输入或从区间随机抽取
 *  2. 每次递减间隔随机生成，在用户输入频率的 ±50% 范围内
 */
export function useRandomCountdown(settings: Settings): RandomCountdownReturn {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const timerRef = useRef<number | null>(null);
  const statusRef = useRef<AppStatus>('idle');
  const countRef = useRef(0);
  const initialTotalRef = useRef(0);
  const logsRef = useRef<LogEntry[]>([]);
  const settingsRef = useRef(settings);

  settingsRef.current = settings;

  /** 添加日志 */
  const addLog = useCallback((msg: string, level: LogEntry['level'] = 'info') => {
    const entry = makeLog(msg, level);
    logsRef.current = [...logsRef.current, entry];
    setLogs([...logsRef.current]);
  }, []);

  /** 根据配置确定本次倒计时的总数 */
  const resolveTotal = useCallback((): number => {
    const s = settingsRef.current;
    if (s.randomTotalMode === 'manual') {
      return s.randomTotalManual;
    }
    // 区间模式 — 自动矫正反转区间
    let min = s.randomRangeMin;
    let max = s.randomRangeMax;
    if (min > max) [min, max] = [max, min];
    const picked = min + Math.floor(Math.random() * (max - min + 1));
    addLog(`随机抽取总数: ${picked} (区间 ${min}-${max})`);
    return picked;
  }, [addLog]);

  // 使用 ref 保持 tick 引用稳定，避免 setTimeout 闭包过期
  const tickRef = useRef<() => void>(() => {});

  /** 递减一次，然后按随机间隔调度下一次 */
  const tick = useCallback(() => {
    if (statusRef.current !== 'listening') return;

    const next = countRef.current - 1;
    countRef.current = next;
    setCount(next);
    setIsFlashing(true);

    const s = settingsRef.current;
    addLog(`随机倒计数 → ${next}`);
    playSound(s.soundType, s.soundVolume);

    setTimeout(() => setIsFlashing(false), 300);

    if (next <= 0) {
      statusRef.current = 'finished';
      setStatus('finished');
      addLog('随机倒计时结束！');
      playFinishSound(s.soundType, s.soundVolume);
      persistRecord({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        count: initialTotalRef.current,
        timestamp: Date.now(),
        threshold: 0,
        target: initialTotalRef.current,
        mode: 'countdown',
      });
      return;
    }

    // 下一 tick 使用随机间隔（基于用户输入的频率）
    const delay = randomInterval(s.randomFrequency);
    timerRef.current = window.setTimeout(() => tickRef.current(), delay);
  }, [addLog]);

  tickRef.current = tick;

  /** 启动倒计时：确定总数 → 立即首次 tick */
  const start = useCallback(() => {
    const newTotal = resolveTotal();
    initialTotalRef.current = newTotal;
    countRef.current = newTotal;
    setCount(newTotal);
    setTotal(newTotal);
    statusRef.current = 'listening';
    setStatus('listening');

    const s = settingsRef.current;
    const centerMs = s.randomFrequency * 1000;
    const spreadMs = centerMs * 0.5;
    addLog(
      `随机倒计时开始 — 总数 ${newTotal}` +
      `，频率 ${s.randomFrequency.toFixed(1)}s（${(centerMs - spreadMs).toFixed(0)}–${(centerMs + spreadMs).toFixed(0)}ms）`,
    );

    tickRef.current();
  }, [resolveTotal, addLog]);

  /** 暂停 */
  const pause = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    statusRef.current = 'paused';
    setStatus('paused');
    addLog('已暂停');
  }, [addLog]);

  /** 继续 */
  const resume = useCallback(() => {
    statusRef.current = 'listening';
    setStatus('listening');
    addLog('继续随机倒计时...');
    tickRef.current();
  }, [addLog]);

  /** 重置 */
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    countRef.current = 0;
    setCount(0);
    setTotal(0);
    initialTotalRef.current = 0;
    statusRef.current = 'idle';
    setStatus('idle');
    setIsFlashing(false);
    addLog('已重置');
  }, [addLog]);

  // 同步 settings
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // 卸载清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    status,
    count,
    total,
    isFlashing,
    logs,
    start,
    pause,
    resume,
    reset,
  };
}
