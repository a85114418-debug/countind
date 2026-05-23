import { useState, useCallback } from 'react';
import type { AppStatus, LogEntry } from '../types';
import './DebugPanel.css';

interface Props {
  status: AppStatus;
  dbLevel: number;
  baseline: number;
  count: number;
  logs: LogEntry[];
  onSimulate: (db: number | null) => void;
}

const STATUS_LABELS: Record<AppStatus, string> = {
  idle: '未开始',
  listening: '监听中',
  paused: '已暂停',
  finished: '已完成',
};

/** 调试面板：模拟音量 + 状态显示 + 日志 */
export function DebugPanel({ status, dbLevel, baseline, count, logs, onSimulate }: Props) {
  const [simEnabled, setSimEnabled] = useState(false);
  const [simValue, setSimValue] = useState(30);

  const toggleSim = useCallback(() => {
    if (simEnabled) {
      onSimulate(null);
      setSimEnabled(false);
    } else {
      onSimulate(simValue);
      setSimEnabled(true);
    }
  }, [simEnabled, simValue, onSimulate]);

  const handleSlider = useCallback(
    (val: number) => {
      setSimValue(val);
      if (simEnabled) onSimulate(val);
    },
    [simEnabled, onSimulate]
  );

  return (
    <div className="debug-panel">
      <h3 className="dp-title">调试面板</h3>

      {/* 状态指示 */}
      <div className="dp-status-row">
        <span>状态：</span>
        <span className={`dp-status dp-${status}`}>{STATUS_LABELS[status]}</span>
      </div>
      <div className="dp-info">
        当前音量：{dbLevel.toFixed(1)} dB | 基线：{baseline.toFixed(1)} dB | 计数：{count}
      </div>

      {/* 模拟音量 */}
      <div className="dp-sim">
        <label className="dp-sim-label">
          <input type="checkbox" checked={simEnabled} onChange={toggleSim} />
          模拟音量测试
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={simValue}
          onChange={(e) => handleSlider(Number(e.target.value))}
          className="dp-slider"
        />
        <span className="dp-sim-val">{simValue} dB</span>
      </div>

      {/* 错误日志 */}
      <div className="dp-logs">
        <div className="dp-logs-title">事件日志</div>
        <div className="dp-logs-list">
          {logs.length === 0 && <div className="dp-no-logs">暂无日志</div>}
          {logs
            .slice()
            .reverse()
            .map((log) => (
              <div key={log.id} className={`dp-log-item dp-log-${log.level}`}>
                <span className="dp-log-time">
                  {new Date(log.time).toLocaleTimeString('zh-CN')}
                </span>
                {log.message}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
