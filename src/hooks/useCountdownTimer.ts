import { useRef, useState, useCallback, useEffect } from 'react';
import type { AppStatus, LogEntry, Settings, SoundType } from '../types';
import { playSound, playFinishSound } from '../utils/beep';
import { saveRecord as persistRecord } from '../utils/storage';

let logId = 0;
function makeLog(message: string, level: LogEntry['level'] = 'info'): LogEntry {
  return { id: String(++logId), time: Date.now(), message, level };
}

interface CountdownReturn {
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

export function useCountdownTimer(settings: Settings): CountdownReturn {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [count, setCount] = useState(settings.countdownTotal);
  const [isFlashing, setIsFlashing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const intervalRef = useRef<number | null>(null);
  const statusRef = useRef<AppStatus>('idle');
  const countRef = useRef(settings.countdownTotal);
  const logsRef = useRef<LogEntry[]>([]);
  const settingsRef = useRef(settings);

  settingsRef.current = settings;

  /** 添加日志 */
  const addLog = useCallback((msg: string, level: LogEntry['level'] = 'info') => {
    const entry = makeLog(msg, level);
    logsRef.current = [...logsRef.current, entry];
    setLogs([...logsRef.current]);
  }, []);

  /** 递减一次 */
  const tick = useCallback(() => {
    const s = settingsRef.current;
    const next = countRef.current - 1;
    countRef.current = next;
    setCount(next);
    setIsFlashing(true);
    addLog(`递减 → ${next}`);

    // 播放提示音
    playSound(s.soundType, s.soundVolume);

    // 闪烁 300ms
    setTimeout(() => setIsFlashing(false), 300);

    if (next <= 0) {
      // 到达 0，停止
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      statusRef.current = 'finished';
      setStatus('finished');
      addLog('倒计时结束！');
      playFinishSound(s.soundType, s.soundVolume);
      persistRecord({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        count: s.countdownTotal,
        timestamp: Date.now(),
        threshold: 0,
        target: s.countdownTotal,
        mode: 'countdown',
      });
    }
  }, [addLog]);

  /** 启动倒计时 */
  const start = useCallback(() => {
    const s = settingsRef.current;
    // 重置到初始值
    countRef.current = s.countdownTotal;
    setCount(s.countdownTotal);
    statusRef.current = 'listening';
    setStatus('listening');
    addLog(`开始倒计时 — 从 ${s.countdownTotal} 开始，间隔 ${s.countdownInterval} 秒`);

    // 先 tick 一次，立即显示第一次递减
    tick();

    // 启动定时器
    const ms = Math.max(100, s.countdownInterval * 1000);
    intervalRef.current = window.setInterval(tick, ms);
  }, [tick, addLog]);

  /** 暂停 */
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    statusRef.current = 'paused';
    setStatus('paused');
    addLog('已暂停');
  }, [addLog]);

  /** 继续 */
  const resume = useCallback(() => {
    const s = settingsRef.current;
    statusRef.current = 'listening';
    setStatus('listening');
    addLog('继续倒计时...');
    const ms = Math.max(100, s.countdownInterval * 1000);
    intervalRef.current = window.setInterval(tick, ms);
  }, [tick, addLog]);

  /** 重置 */
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const s = settingsRef.current;
    countRef.current = s.countdownTotal;
    setCount(s.countdownTotal);
    setStatus('idle');
    statusRef.current = 'idle';
    setIsFlashing(false);
    addLog('已重置');
  }, [addLog]);

  // 同步 settings 变化
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    status,
    count,
    total: settings.countdownTotal,
    isFlashing,
    logs,
    start,
    pause,
    resume,
    reset,
  } as const;
}
