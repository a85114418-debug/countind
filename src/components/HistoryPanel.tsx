import { useCallback, useEffect, useRef, useState } from 'react';
import type { CountRecord } from '../types';
import { deleteRecord, loadRecords, updateRecordNote } from '../utils/storage';
import './HistoryPanel.css';

export function HistoryPanel() {
  const [records, setRecords] = useState<CountRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => setRecords(loadRecords()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = (id: string) => {
    deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const startEdit = (r: CountRecord) => {
    setEditingId(r.id);
    setEditValue(r.note ?? '');
  };

  const commitEdit = (id: string) => {
    const trimmed = editValue.trim();
    updateRecordNote(id, trimmed);
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, note: trimmed || undefined } : r)),
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  if (records.length === 0) {
    return <div className="history-empty">暂无记录</div>;
  }

  return (
    <div className="history-panel" ref={panelRef}>
      <h3 className="hp-title">历史记录</h3>
      {records.map((r) => (
        <div key={r.id} className="hp-row">
          <div className="hp-top">
            <span className="hp-count">{r.count}</span>
            <div className="hp-meta">
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
            <div className="hp-actions">
              <button
                className="hp-action-btn hp-note-btn"
                title={r.note ? '编辑批注' : '添加批注'}
                onClick={() => startEdit(r)}
              >
                {r.note ? '✎' : '+'}
              </button>
              <button
                className="hp-action-btn hp-delete-btn"
                title="删除记录"
                onClick={() => handleDelete(r.id)}
              >
                ✕
              </button>
            </div>
          </div>

          {editingId === r.id ? (
            <div className="hp-note-edit">
              <textarea
                className="hp-note-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="添加批注…"
                rows={2}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    commitEdit(r.id);
                  }
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
              <div className="hp-note-actions">
                <button className="hp-note-save" onClick={() => commitEdit(r.id)}>保存</button>
                <button className="hp-note-cancel" onClick={cancelEdit}>取消</button>
              </div>
            </div>
          ) : r.note ? (
            <span
              className="hp-note"
              title="点击编辑批注"
              onClick={() => startEdit(r)}
            >
              {r.note}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
