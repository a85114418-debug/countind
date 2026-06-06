import { useRef, useState, useCallback, useEffect } from 'react';
import type { AppStatus, LogEntry, Settings } from '../types';
import { initAudio, getVolume, toDecibel, closeAudio } from '../utils/audio';
import { saveRecord as persistRecord } from '../utils/storage';

/** 噪音校准采样时长（毫秒） */
const CALIBRATE_MS = 2000;
/** 音量显示更新间隔（毫秒），5fps */
const DISPLAY_INTERVAL = 200;

let logId = 0;
function makeLog(message: string, level: LogEntry['level'] = 'info'): LogEntry {
  return { id: String(++logId), time: Date.now(), message, level };
}

export function useAudioDetector(settings: Settings) {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [count, setCount] = useState(settings.initialCount);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [dbLevel, setDbLevel] = useState(0);
  const [baseline, setBaseline] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const lastSampleTimeRef = useRef(0);
  const lastDisplayTimeRef = useRef(0);
  const cooldownRef = useRef(false);
  const statusRef = useRef<AppStatus>('idle');
  const countRef = useRef(settings.initialCount);
  const logsRef = useRef<LogEntry[]>([]);
  const settingsRef = useRef(settings);
  const simulatedDbRef = useRef<number | null>(null);

  settingsRef.current = settings;

  /** 添加日志（同时更新 state 和 ref） */
  const addLog = useCallback((msg: string, level: LogEntry['level'] = 'info') => {
    const entry = makeLog(msg, level);
    logsRef.current = [...logsRef.current, entry];
    setLogs([...logsRef.current]);
  }, []);

  /** 噪音校准：采样 2 秒，计算环境噪音基线。若音频未初始化则自动初始化 */
  const calibrate = useCallback(async (): Promise<number> => {
    let analyser = analyserRef.current;
    if (!analyser) {
      try {
        analyser = await initAudio();
        analyserRef.current = analyser;
      } catch {
        addLog('校准失败：无法访问麦克风', 'error');
        return 0;
      }
    }
    addLog('开始环境噪音校准（2 秒）...');
    const samples: number[] = [];
    const start = Date.now();
    while (Date.now() - start < CALIBRATE_MS) {
      samples.push(toDecibel(getVolume(analyser)));
      await new Promise((r) => setTimeout(r, 80));
    }
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    setBaseline(avg);
    addLog(`校准完成，环境噪音基线: ${avg.toFixed(1)} dB`);
    return avg;
  }, [addLog]);

  /** 检测循环（RAF 驱动，与渲染帧同步） */
  const tickRaf = useCallback((timestamp: number) => {
    const analyser = analyserRef.current;
    if (!analyser || statusRef.current !== 'listening') return;

    // 限频 ~50ms (20fps)，与大多数麦克风刷新率匹配
    if (timestamp - lastSampleTimeRef.current < 50) {
      rafRef.current = requestAnimationFrame(tickRaf);
      return;
    }
    lastSampleTimeRef.current = timestamp;

    // 支持模拟音量（调试用）
    const simulated = simulatedDbRef.current;
    const rawDb = simulated !== null ? simulated : toDecibel(getVolume(analyser));

    // 显示更新降频到 ~5fps，减少 React 渲染压力
    if (timestamp - lastDisplayTimeRef.current >= DISPLAY_INTERVAL) {
      lastDisplayTimeRef.current = timestamp;
      setCurrentVolume(rawDb);
      setDbLevel(rawDb);
    }

    const { threshold } = settingsRef.current;
    const effectiveThreshold = threshold + baseline;

    if (!cooldownRef.current && rawDb > effectiveThreshold) {
      cooldownRef.current = true;
      countRef.current += 1;
      setCount(countRef.current);
      setIsFlashing(true);
      addLog(`触发! ${countRef.current} (音量: ${rawDb.toFixed(1)} dB)`);

      setTimeout(() => setIsFlashing(false), 300);

      if (countRef.current >= settingsRef.current.target) {
        setStatus('finished');
        statusRef.current = 'finished';
        addLog('已达到目标计数！');
        persistRecord({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          count: countRef.current,
          timestamp: Date.now(),
          threshold: settingsRef.current.threshold,
          target: settingsRef.current.target,
        });
        return;
      }

      setTimeout(() => {
        cooldownRef.current = false;
      }, settingsRef.current.cooldownMs);
    }

    rafRef.current = requestAnimationFrame(tickRaf);
  }, [baseline, addLog]);

  /** 开启声控监听 */
  const startListening = useCallback(async () => {
    try {
      const analyser = await initAudio();
      analyserRef.current = analyser;
      // 首次开启时自动校准
      await calibrate();
      statusRef.current = 'listening';
      setStatus('listening');
      addLog('开始监听...');
      rafRef.current = requestAnimationFrame(tickRaf);
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError'
          ? '有需要请随时开启'
          : '麦克风不可用';
      addLog(msg, 'error');
      throw new Error(msg);
    }
  }, [calibrate, tickRaf, addLog]);

  /** 暂停监听 */
  const pause = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    statusRef.current = 'paused';
    setStatus('paused');
    addLog('已暂停');
  }, [addLog]);

  /** 继续监听 */
  const resume = useCallback(() => {
    statusRef.current = 'listening';
    setStatus('listening');
    addLog('继续监听...');
    rafRef.current = requestAnimationFrame(tickRaf);
  }, [tickRaf, addLog]);

  /** 停止并重置 */
  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    cooldownRef.current = false;
    countRef.current = settingsRef.current.initialCount;
    setCount(settingsRef.current.initialCount);
    statusRef.current = 'idle';
    setStatus('idle');
    setCurrentVolume(0);
    setDbLevel(0);
    setIsFlashing(false);
    closeAudio();
    analyserRef.current = null;
    addLog('已重置');
  }, [addLog]);

  /** 设置模拟音量（调试用，传 null 切回真实麦克风） */
  const setSimulatedDb = useCallback((value: number | null) => {
    simulatedDbRef.current = value;
  }, []);

  // 同步 settings 变化到 ref
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      closeAudio();
    };
  }, []);

  return {
    status,
    count,
    currentVolume,
    dbLevel,
    baseline,
    logs,
    isFlashing,
    startListening,
    pause,
    resume,
    reset,
    calibrate,
    setSimulatedDb,
  } as const;
}
