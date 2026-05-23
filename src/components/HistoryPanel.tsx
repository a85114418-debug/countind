import { useEffect, useState } from 'react';
import type { CountRecord } from '../types';
import { loadRecords } from '../utils/storage';
import './HistoryPanel.css';

/** 历史记录面板 */
export function HistoryPanel() {
  const [records, setRecords] = useState<CountRecord[]>([]);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  if (records.length === 0) {
    return <div className="history-empty">暂无记录</div>;
  }

  return (
    <div className="history-panel">
      <h3 className="hp-title">历史记录</h3>
      {records.map((r) => (
        <div key={r.id} className="hp-row">
          <span className="hp-count">{r.count}</span>
          <span className="hp-detail">
            目标 {r.target} · 阈值 {r.threshold} dB
          </span>
          <span className="hp-time">
            {new Date(r.timestamp).toLocaleString('zh-CN', {
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
