import { useState, useCallback, useEffect } from 'react';
import type { Settings } from '../types';
import { getVoiceOptions, previewVoice, warmupSpeech, type VoiceOption } from '../utils/speech';
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

const LANG_OPTIONS = [
  { value: 'zh-CN' as const, label: '中文' },
  { value: 'en-US' as const, label: 'English' },
];

function simplifyName(name: string): string {
  return name
    .replace(/Google\s+/i, '')
    .replace(/\bdefault\b/i, '')
    .replace(/male|female/i, '')
    .replace(/\s+/g, ' ')
    .trim() || name;
}

export function SettingsPanel({ settings, baseline, onChange, onCalibrate, disabled }: Props) {
  const [localThreshold, setLocalThreshold] = useState(String(settings.threshold));
  const [localTarget, setLocalTarget] = useState(String(settings.target));
  const [localInitial, setLocalInitial] = useState(String(settings.initialCount));
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);

  const refreshVoices = useCallback(() => {
    setVoicesLoading(true);
    const list = getVoiceOptions(settings.voiceLang);
    setVoices(list);
    setVoicesLoading(false);
  }, [settings.voiceLang]);

  // 唤醒语音引擎 + 监听 voiceschanged（先注册监听再预热，避免竞态）
  useEffect(() => {
    const onVoicesChanged = () => refreshVoices();
    speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    warmupSpeech();
    refreshVoices();
    // 手机端 voiceschanged 可能不触发，轮询兜底
    const t1 = setTimeout(refreshVoices, 300);
    const t2 = setTimeout(refreshVoices, 800);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [refreshVoices]);

  // 切换语言后延迟刷新（等待 voiceschanged 或超时）
  useEffect(() => {
    refreshVoices();
    const t = setTimeout(refreshVoices, 500);
    return () => clearTimeout(t);
  }, [settings.voiceLang, refreshVoices]);

  // 当前语音不在列表中时自动选择第一个
  useEffect(() => {
    if (voices.length > 0 && settings.voiceURI && !voices.find((v) => v.voiceURI === settings.voiceURI)) {
      onChange({ ...settings, voiceURI: voices[0].voiceURI });
    }
    if (voices.length > 0 && !settings.voiceURI) {
      onChange({ ...settings, voiceURI: voices[0].voiceURI });
    }
  }, [voices, settings, onChange]);

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

  const maleVoices = voices.filter((v) => v.gender === 'male');
  const femaleVoices = voices.filter((v) => v.gender === 'female');
  const unknownVoices = voices.filter((v) => v.gender === 'unknown');

  const renderVoiceRow = (v: VoiceOption) => (
    <div
      key={v.voiceURI}
      className={`sp-voice-row ${settings.voiceURI === v.voiceURI ? 'active' : ''}`}
      onClick={() => onChange({ ...settings, voiceURI: v.voiceURI })}
    >
      <span className="sp-voice-name">{simplifyName(v.name)}</span>
      <button
        className="sp-voice-preview"
        onClick={(e) => { e.stopPropagation(); previewVoice(v.voiceURI, settings.voiceLang); }}
      >
        试听
      </button>
    </div>
  );

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

      <div className="sp-baseline">
        环境噪音基线：<strong>{baseline.toFixed(1)} dB</strong>
      </div>

      <button className="sp-calibrate-btn" onClick={onCalibrate} disabled={disabled}>
        环境噪音校准
      </button>

      {/* === 语音报数 === */}
      <div className="sp-section-title">
        <span>语音报数</span>
        {voices.length > 0 && (
          <span className="sp-voice-count">{voices.length} 个</span>
        )}
      </div>

      <label className="sp-field">
        <span>开启报数</span>
        <label className="sp-toggle">
          <input
            type="checkbox"
            checked={settings.voiceEnabled}
            onChange={(e) => onChange({ ...settings, voiceEnabled: e.target.checked })}
          />
          <span className="sp-toggle-slider" />
        </label>
      </label>

      <label className="sp-field">
        <span>报数语言</span>
        <select
          className="sp-select"
          value={settings.voiceLang}
          onChange={(e) =>
            onChange({
              ...settings,
              voiceLang: e.target.value as 'zh-CN' | 'en-US',
              voiceURI: '',
            })
          }
        >
          {LANG_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>

      {voicesLoading && voices.length === 0 && (
        <div className="sp-voice-empty">正在加载语音列表...</div>
      )}
      {!voicesLoading && voices.length === 0 && (
        <div className="sp-voice-empty">
          未检测到可用语音
          <button className="sp-voice-refresh" onClick={refreshVoices}>刷新</button>
        </div>
      )}

      {maleVoices.length > 0 && (
        <div className="sp-voice-group">
          <div className="sp-voice-group-label">男声</div>
          {maleVoices.map(renderVoiceRow)}
        </div>
      )}
      {femaleVoices.length > 0 && (
        <div className="sp-voice-group">
          <div className="sp-voice-group-label">女声</div>
          {femaleVoices.map(renderVoiceRow)}
        </div>
      )}
      {unknownVoices.length > 0 && (
        <div className="sp-voice-group">
          <div className="sp-voice-group-label">通用</div>
          {unknownVoices.map(renderVoiceRow)}
        </div>
      )}
    </div>
  );
}
