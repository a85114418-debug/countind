import type { Settings } from '../types';
import './SettingsPanel.css';

interface Props {
  settings: Settings;
  baseline: number;
  onChange: (s: Settings) => void;
  onCalibrate: () => void;
  disabled: boolean;
}

/** 设置面板：阈值、目标值、初始值输入 + 噪音校准按钮 */
export function SettingsPanel({ settings, baseline, onChange, onCalibrate, disabled }: Props) {
  return (
    <div className="settings-panel">
      <h3 className="sp-title">设置</h3>

      <label className="sp-field">
        <span>触发阈值 (dB)</span>
        <input
          type="number"
          min={0}
          max={100}
          value={settings.threshold}
          onChange={(e) =>
            onChange({ ...settings, threshold: Number(e.target.value) || 0 })
          }
          disabled={disabled}
        />
      </label>

      <label className="sp-field">
        <span>目标计数</span>
        <input
          type="number"
          min={1}
          max={9999}
          value={settings.target}
          onChange={(e) =>
            onChange({ ...settings, target: Math.max(1, Number(e.target.value) || 1) })
          }
          disabled={disabled}
        />
      </label>

      <label className="sp-field">
        <span>初始计数</span>
        <input
          type="number"
          min={0}
          max={9998}
          value={settings.initialCount}
          onChange={(e) =>
            onChange({ ...settings, initialCount: Number(e.target.value) || 0 })
          }
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
