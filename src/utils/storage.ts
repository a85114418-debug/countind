import type { Settings, CountRecord, LogEntry } from '../types';

const KEYS = {
  settings: 'countind_settings',
  records: 'countind_records',
  logs: 'countind_logs',
} as const;

/** 从 localStorage 读取用户设置，不存在则返回默认值 */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (raw) return JSON.parse(raw) as Settings;
  } catch { /* 数据损坏时回退默认值 */ }
  return { threshold: 30, target: 10, initialCount: 0, visualEffect: 'none', cooldownMs: 1000 };
}

/** 保存用户设置到 localStorage */
export function saveSettings(s: Settings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

/** 加载计数历史记录（按时间倒序） */
export function loadRecords(): CountRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.records);
    if (raw) return JSON.parse(raw) as CountRecord[];
  } catch { /* ignore */ }
  return [];
}

/** 保存一条计数记录（插入到列表头部） */
export function saveRecord(record: CountRecord): void {
  const records = loadRecords();
  records.unshift(record);
  // 最多保留 100 条
  if (records.length > 100) records.length = 100;
  localStorage.setItem(KEYS.records, JSON.stringify(records));
}

/** 删除指定 ID 的记录 */
export function deleteRecord(id: string): void {
  const records = loadRecords();
  const filtered = records.filter((r) => r.id !== id);
  localStorage.setItem(KEYS.records, JSON.stringify(filtered));
}

/** 更新指定记录的批注 */
export function updateRecordNote(id: string, note: string): void {
  const records = loadRecords();
  const target = records.find((r) => r.id === id);
  if (target) {
    target.note = note || undefined;
    localStorage.setItem(KEYS.records, JSON.stringify(records));
  }
}

/** 加载调试日志 */
export function loadLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.logs);
    if (raw) return JSON.parse(raw) as LogEntry[];
  } catch { /* ignore */ }
  return [];
}

/** 保存调试日志（最多 200 条） */
export function saveLogs(logs: LogEntry[]): void {
  const trimmed = logs.length > 200 ? logs.slice(-200) : logs;
  localStorage.setItem(KEYS.logs, JSON.stringify(trimmed));
}
