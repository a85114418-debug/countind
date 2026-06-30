import { useState, useCallback, useEffect } from 'react';
import type { Settings, SoundType, CountdownMode, RandomTotalMode } from '../types';
import './SettingsPanel.css';

interface Props {
  settings: Settings;
  baseline: number;
  onChange: (s: Settings) => void;
  onCalibrate: () => void;
  disabled: boolean;
}

const SOUND_OPTIONS: { key: SoundType; label: string }[] = [
  { key: 'beep', label: '短促单音' },
  { key: 'double-beep', label: '双连音' },
  { key: 'chime', label: '上升音' },
];

function stripLeadingZeros(raw: string): string {
  const s = raw.replace(/^0+(?=\d)/, '');
  return s === '' ? '0' : s;
}

export function SettingsPanel({ settings, baseline, onChange, onCalibrate, disabled }: Props) {
  const [localThreshold, setLocalThreshold] = useState(String(settings.threshold));
  const [localTarget, setLocalTarget] = useState(String(settings.target));
  const [localInitial, setLocalInitial] = useState(String(settings.initialCount));
  const [localCooldown, setLocalCooldown] = useState(String(settings.cooldownMs));
  const [localTotal, setLocalTotal] = useState(String(settings.countdownTotal));
  const [localInterval, setLocalInterval] = useState(String(settings.countdownInterval));
  const [localRandomManual, setLocalRandomManual] = useState(String(settings.randomTotalManual));
  const [localRandomMin, setLocalRandomMin] = useState(String(settings.randomRangeMin));
  const [localRandomMax, setLocalRandomMax] = useState(String(settings.randomRangeMax));
  const [localFrequency, setLocalFrequency] = useState(String(settings.randomFrequency));

  // 同步外部 settings 变化
  useEffect(() => { setLocalThreshold(String(settings.threshold)); }, [settings.threshold]);
  useEffect(() => { setLocalTarget(String(settings.target)); }, [settings.target]);
  useEffect(() => { setLocalInitial(String(settings.initialCount)); }, [settings.initialCount]);
  useEffect(() => { setLocalCooldown(String(settings.cooldownMs)); }, [settings.cooldownMs]);
  useEffect(() => { setLocalTotal(String(settings.countdownTotal)); }, [settings.countdownTotal]);
  useEffect(() => { setLocalInterval(String(settings.countdownInterval)); }, [settings.countdownInterval]);
  useEffect(() => { setLocalRandomManual(String(settings.randomTotalManual)); }, [settings.randomTotalManual]);
  useEffect(() => { setLocalRandomMin(String(settings.randomRangeMin)); }, [settings.randomRangeMin]);
  useEffect(() => { setLocalRandomMax(String(settings.randomRangeMax)); }, [settings.randomRangeMax]);
  useEffect(() => { setLocalFrequency(String(settings.randomFrequency)); }, [settings.randomFrequency]);

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

  const handleTotalBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localTotal);
    const num = Math.max(1, Math.min(9999, Number(cleaned) || 1));
    setLocalTotal(String(num));
    onChange({ ...settings, countdownTotal: num });
  }, [localTotal, settings, onChange]);

  const handleIntervalBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localInterval);
    const num = Math.max(1, Math.min(3600, Number(cleaned) || 1));
    setLocalInterval(String(num));
    onChange({ ...settings, countdownInterval: num });
  }, [localInterval, settings, onChange]);

  const handleRandomManualBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localRandomManual);
    const num = Math.max(1, Math.min(9999, Number(cleaned) || 1));
    setLocalRandomManual(String(num));
    onChange({ ...settings, randomTotalManual: num });
  }, [localRandomManual, settings, onChange]);

  const handleRandomMinBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localRandomMin);
    const num = Math.max(1, Math.min(9999, Number(cleaned) || 1));
    setLocalRandomMin(String(num));
    onChange({ ...settings, randomRangeMin: num });
  }, [localRandomMin, settings, onChange]);

  const handleRandomMaxBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localRandomMax);
    const num = Math.max(1, Math.min(9999, Number(cleaned) || 1));
    setLocalRandomMax(String(num));
    onChange({ ...settings, randomRangeMax: num });
  }, [localRandomMax, settings, onChange]);

  const handleFrequencyBlur = useCallback(() => {
    const cleaned = stripLeadingZeros(localFrequency);
    const num = Math.max(0.1, Math.min(10, Number(cleaned) || 2));
    setLocalFrequency(String(num));
    onChange({ ...settings, randomFrequency: num });
  }, [localFrequency, settings, onChange]);

  const isCountdown = settings.mode === 'countdown';

  return (
    <div className="settings-panel">
      <h3 className="sp-title">{isCountdown ? '倒计时设置' : '声控设置'}</h3>

      {isCountdown ? (
        <>
          {/* 倒计数子模式切换 */}
          <div className="sp-submode-tabs">
            <button
              className={`sp-submode-tab ${settings.countdownMode === 'fixed' ? 'active' : ''}`}
              onClick={() => onChange({ ...settings, countdownMode: 'fixed' as CountdownMode })}
              disabled={disabled}
            >
              固定间隔
            </button>
            <button
              className={`sp-submode-tab ${settings.countdownMode === 'random' ? 'active' : ''}`}
              onClick={() => onChange({ ...settings, countdownMode: 'random' as CountdownMode })}
              disabled={disabled}
            >
              随机频率
            </button>
          </div>

          {settings.countdownMode === 'fixed' ? (
            <>
              <label className="sp-field">
                <span>计数总数</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={localTotal}
                  onChange={(e) => setLocalTotal(e.target.value)}
                  onBlur={handleTotalBlur}
                  disabled={disabled}
                />
              </label>

              <label className="sp-field">
                <span>递减间隔 (秒)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={localInterval}
                  onChange={(e) => setLocalInterval(e.target.value)}
                  onBlur={handleIntervalBlur}
                  disabled={disabled}
                />
              </label>
            </>
          ) : (
            <>
              {/* 总数来源 */}
              <div className="sp-section-label">总数来源</div>
              <div className="sp-totalmode-tabs">
                <button
                  className={`sp-totalmode-tab ${settings.randomTotalMode === 'manual' ? 'active' : ''}`}
                  onClick={() => onChange({ ...settings, randomTotalMode: 'manual' as RandomTotalMode })}
                  disabled={disabled}
                >
                  手动输入
                </button>
                <button
                  className={`sp-totalmode-tab ${settings.randomTotalMode === 'range' ? 'active' : ''}`}
                  onClick={() => onChange({ ...settings, randomTotalMode: 'range' as RandomTotalMode })}
                  disabled={disabled}
                >
                  随机区间
                </button>
              </div>

              {settings.randomTotalMode === 'manual' ? (
                <label className="sp-field">
                  <span>计数总数</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={localRandomManual}
                    onChange={(e) => setLocalRandomManual(e.target.value)}
                    onBlur={handleRandomManualBlur}
                    disabled={disabled}
                  />
                </label>
              ) : (
                <label className="sp-field">
                  <span>随机区间</span>
                  <div className="sp-range-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={localRandomMin}
                      onChange={(e) => setLocalRandomMin(e.target.value)}
                      onBlur={handleRandomMinBlur}
                      disabled={disabled}
                      placeholder="最小"
                    />
                    <span className="sp-range-sep">–</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={localRandomMax}
                      onChange={(e) => setLocalRandomMax(e.target.value)}
                      onBlur={handleRandomMaxBlur}
                      disabled={disabled}
                      placeholder="最大"
                    />
                  </div>
                </label>
              )}

              {/* 随机频率 */}
              <label className="sp-field">
                <span>随机频率 (秒)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  value={localFrequency}
                  onChange={(e) => setLocalFrequency(e.target.value)}
                  onBlur={handleFrequencyBlur}
                  disabled={disabled}
                  placeholder="0.1–10"
                />
              </label>
            </>
          )}

          <label className="sp-field">
            <span>提示音类型</span>
            <select
              className="sp-select"
              value={settings.soundType}
              onChange={(e) => onChange({ ...settings, soundType: e.target.value as SoundType })}
              disabled={disabled}
            >
              {SOUND_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="sp-field">
            <span>提示音音量</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.soundVolume}
              onChange={(e) => onChange({ ...settings, soundVolume: Number(e.target.value) })}
              className="sp-slider"
              disabled={disabled}
            />
            <span className="sp-slider-val">{Math.round(settings.soundVolume * 100)}%</span>
          </label>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
