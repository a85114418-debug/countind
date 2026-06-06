import { useState, useCallback, useEffect } from 'react';
import type { AppMode, Settings, VisualEffect } from './types';
import { useAudioDetector } from './hooks/useAudioDetector';
import { useCountdownTimer } from './hooks/useCountdownTimer';
import { loadSettings, saveSettings } from './utils/storage';
import { closeAudioCtx } from './utils/beep';
import { CounterDial } from './components/CounterDial';
import { VolumeMeter } from './components/VolumeMeter';
import { ControlBar } from './components/ControlBar';
import { SettingsPanel } from './components/SettingsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { DebugPanel } from './components/DebugPanel';
import { ParticleEffect } from './components/ParticleEffect';
import './App.css';

const EFFECT_OPTIONS: { key: VisualEffect; label: string; icon: string }[] = [
  { key: 'none', label: '关闭特效', icon: '✕' },
  { key: 'snow', label: '飘雪', icon: '❄' },
  { key: 'sakura', label: '樱花', icon: '🌸' },
  { key: 'rain', label: '雨点', icon: '🌧' },
];

const MODE_OPTIONS: { key: AppMode; label: string; icon: string }[] = [
  { key: 'voice', label: '声控计数', icon: '🎤' },
  { key: 'countdown', label: '倒计数', icon: '⏱' },
];

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [orientationBlocked, setOrientationBlocked] = useState(false);

  // 始终初始化两个 hook（只有活跃模式的操作才会生效）
  const voice = useAudioDetector(settings);
  const countdown = useCountdownTimer(settings);

  // 根据当前模式选择状态和操作
  const isCountdown = settings.mode === 'countdown';
  const {
    status,
    count,
    isFlashing,
    logs,
  } = isCountdown
    ? countdown
    : voice;
  const activeReset = isCountdown ? countdown.reset : voice.reset;
  const activePause = isCountdown ? countdown.pause : voice.pause;
  const activeResume = isCountdown ? countdown.resume : voice.resume;

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [effectMenuOpen, setEffectMenuOpen] = useState(false);

  /** 切换模式 — 重置两边，切换后保存 */
  const handleModeChange = useCallback((newMode: AppMode) => {
    if (newMode === settings.mode) return;
    voice.reset();
    countdown.reset();
    closeAudioCtx();
    const next = { ...settings, mode: newMode };
    setSettings(next);
    saveSettings(next);
  }, [settings, voice, countdown]);

  const handleSettingsChange = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  const handleEffectChange = useCallback((v: VisualEffect) => {
    setSettings((prev) => {
      const next = { ...prev, visualEffect: v };
      saveSettings(next);
      return next;
    });
    setEffectMenuOpen(false);
  }, []);

  /** 启动按钮 — 根据模式分发 */
  const handleStart = useCallback(async () => {
    if (isCountdown) {
      countdown.start();
    } else {
      try { await voice.startListening(); } catch { /* 错误已在 hook 内记录 */ }
    }
  }, [isCountdown, countdown, voice]);

  const handleCalibrate = useCallback(async () => {
    await voice.calibrate();
  }, [voice.calibrate]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }, []);

  // 设备检测：移动端 vs 桌面端
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

  // 方向管理：移动端强制竖屏，桌面端强制横屏
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isMobile) {
        setOrientationBlocked(isLandscape);
      } else {
        setOrientationBlocked(false);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    if ('orientation' in screen && typeof (screen.orientation as any).lock === 'function') {
      const lockTarget = isMobile ? 'portrait' : 'landscape';
      (screen.orientation as any).lock(lockTarget).catch(() => {});
    }

    return () => window.removeEventListener('resize', checkOrientation);
  }, [isMobile]);

  const isRunning = status === 'listening' || status === 'paused';
  const currentEffect = EFFECT_OPTIONS.find((e) => e.key === settings.visualEffect) || EFFECT_OPTIONS[0];
  const displayTarget = isCountdown ? settings.countdownTotal : settings.target;

  /** 状态文本 */
  const statusLabel = (() => {
    if (status === 'idle') return isCountdown ? '就绪' : '未开始';
    if (status === 'listening') return isCountdown ? '倒计时中' : '监听中';
    if (status === 'paused') return '已暂停';
    return '已完成';
  })();

  return (
    <>
      {orientationBlocked && (
        <div className="rotate-overlay">
          <div className="rotate-icon">📱</div>
          <div className="rotate-text">请竖屏使用</div>
          <div className="rotate-sub">旋转设备以获得最佳体验</div>
        </div>
      )}
      <div className="app">
      <ParticleEffect effect={settings.visualEffect} />

      <header className="app-header">
        <h1>CountinD</h1>
        {/* 模式切换标签 */}
        <div className="mode-tabs">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`mode-tab ${settings.mode === opt.key ? 'active' : ''}`}
              onClick={() => handleModeChange(opt.key)}
            >
              <span className="mode-tab-icon">{opt.icon}</span>
              <span className="mode-tab-label">{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="header-status">
          状态：<span className={`status-dot status-${status}`} />
          {statusLabel}
        </div>
      </header>

      <main className="app-main">
        {/* 计数器表盘 */}
        <section className="section-dial">
          <CounterDial
            count={count}
            target={displayTarget}
            isFlashing={isFlashing}
            reverse={isCountdown}
          />
        </section>

        {/* 实时音量条 — 仅在声控模式显示 */}
        {!isCountdown && (
          <section className="section-volume">
            <VolumeMeter
              dbLevel={voice.dbLevel}
              threshold={settings.threshold}
              baseline={voice.baseline}
            />
          </section>
        )}

        {/* 特效切换按钮 */}
        <section className="section-effect">
          <div className="effect-toggle">
            <button
              className="effect-btn"
              onClick={() => setEffectMenuOpen(!effectMenuOpen)}
              title={currentEffect.label}
            >
              <span className="effect-icon">{currentEffect.icon}</span>
              <span className="effect-label">{currentEffect.label}</span>
            </button>
            {effectMenuOpen && (
              <div className="effect-menu">
                {EFFECT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    className={`effect-option ${settings.visualEffect === opt.key ? 'active' : ''}`}
                    onClick={() => handleEffectChange(opt.key)}
                  >
                    <span className="effect-icon">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 控制按钮 */}
        <section className="section-controls">
          <ControlBar
            status={status}
            onStart={handleStart}
            onPause={activePause}
            onResume={activeResume}
            onReset={activeReset}
          />
        </section>

        {/* 展开面板 */}
        <section className="section-panels">
          <div className="panel-tabs">
            <button
              className={`panel-tab ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(!showSettings)}
            >
              设置
            </button>
            <button
              className={`panel-tab ${showHistory ? 'active' : ''}`}
              onClick={() => setShowHistory(!showHistory)}
            >
              历史
            </button>
            <button
              className={`panel-tab ${showDebug ? 'active' : ''}`}
              onClick={() => setShowDebug(!showDebug)}
            >
              调试
            </button>
          </div>

          {showSettings && (
            <div className="panel-content">
              <SettingsPanel
                settings={settings}
                baseline={voice.baseline}
                onChange={handleSettingsChange}
                onCalibrate={handleCalibrate}
                disabled={isRunning}
              />
            </div>
          )}
          {showHistory && (
            <div className="panel-content">
              <HistoryPanel />
            </div>
          )}
          {showDebug && (
            <div className="panel-content">
              <DebugPanel
                status={status}
                dbLevel={isCountdown ? 0 : voice.dbLevel}
                baseline={isCountdown ? 0 : voice.baseline}
                count={count}
                logs={logs}
                onSimulate={isCountdown ? (() => {}) : voice.setSimulatedDb}
              />
            </div>
          )}
        </section>
      </main>
    </div>
    </>
  );
}
