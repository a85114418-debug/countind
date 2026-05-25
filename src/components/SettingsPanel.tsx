import { useState, useCallback, useEffect } from 'react';
import type { Settings } from '../types';
import './SettingsPanel.css';

interface Props {
  settings: Settings;
  baseline: number;
  onChange: (s: Settings) => void;
  onCalibrate: () => void;
  disabled: boolean;
}

function stripLeadingZeros(raw: string): string {
  const s = raw.replace(/^0+(?=\d)/, '');
  return s === '' ? '0' : s;
}

export function SettingsPanel({ settings, baseline, onChange, onCalibrate, disabled }: Props) {
  const [localThreshold, setLocalThreshold] = useState(String(settings.threshold));
  const [localTarget, setLocalTarget] = useState(String(settings.target));
  const [localInitial, setLocalInitial] = useState(String(settings.initialCount));
  const [localCooldown, setLocalCooldown] = useState(String(settings.cooldownMs));

  // 同步外部 settings 变化
  useEffect(() => { setLocalThreshold(String(settings.threshold)); }, [settings.threshold]);
  useEffect(() => { setLocalTarget(String(settings.target)); }, [settings.target]);
  useEffect(() => { setLocalInitial(String(settings.initialCount)); }, [settings.initialCount]);
  useEffect(() => { setLocalCooldown(String(settings.cooldownMs)); }, [settings.cooldownMs]);

  const handleThresholdBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localThreshold);
    const num = Math.max(0, Math.min(100, Number(cleaned) || 0));
    setLocalThreshold(String(num));
    onChange({ ...settings, threshold: num });
  }, [localThreshold, settings, onChange]);

  const handleTargetBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localTarget);
    const num = Math.max(1, Math.min(9999, Number(cleaned) || 1));
    setLocalTarget(String(num));
    onChange({ ...settings, target: num });
  }, [localTarget, settings, onChange]);

  const handleInitialBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localInitial);
    const num = Math.max(0, Math.min(9998, Number(cleaned) || 0));
    setLocalInitial(String(num));
    onChange({ ...settings, initialCount: num });
  }, [localInitial, settings, onChange]);

  const handleCooldownBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localCooldown);
    const num = Math.max(200, Math.min(5000, Number(cleaned) || 1000));
    setLocalCooldown(String(num));
    onChange({ ...settings, cooldownMs: num });
  }, [localCooldown, settings, onChange]);

  return (
    <div className="settings-panel">
      <h3 className="sp-title">设置</h3>

      <label className="sp-field">
        <span>触发阈值 (dB)</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localThreshold}
          onChange={(e) => setLocalThreshold(e.target.value)}
          onBlur={handleThresholdBlur}
          disabled={disabled}
        />
      </label>

      <label className="sp-field">
        <span>目标计数</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localTarget}
          onChange={(e) => setLocalTarget(e.target.value)}
          onBlur={handleTargetBlur}
          disabled={disabled}
        />
      </label>

      <label className="sp-field">
        <span>初始计数</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localInitial}
          onChange={(e) => setLocalInitial(e.target.value)}
          onBlur={handleInitialBlur}
          disabled={disabled}
        />
      </label>

      <label className="sp-field">
        <span>计数间隔 (ms)</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localCooldown}
          onChange={(e) => setLocalCooldown(e.target.value)}
          onBlur={handleCooldownBlur}
          disabled={disabled}
        />
      </label>

      <div className="sp-baseline">
        环境噪音基线：<strong>{baseline.toFixed(1)} dB</strong>
      </div>

      <button className="sp-calibrate-btn" onClick={onCalibrate} disabled={disabled}>
        环境噪音校准
      </button>
    </div>
  );
}
