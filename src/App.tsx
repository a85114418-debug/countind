import { useState, useCallback, useEffect } from 'react';
import type { AppMode, Settings, VisualEffect } from './types';
import { useAudioDetector } from './hooks/useAudioDetector';
import { useCountdownTimer } from './hooks/useCountdownTimer';
import { useRandomCountdown } from './hooks/useRandomCountdown';
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

  // 始终初始化所有 hook（只有活跃模式的操作才会生效）
  const voice = useAudioDetector(settings);
  const countdown = useCountdownTimer(settings);
  const random = useRandomCountdown(settings);

  // 根据当前模式选择状态和操作
  const isCountdown = settings.mode === 'countdown';
  const isRandom = isCountdown && settings.countdownMode === 'random';
  const activeCountdown = isRandom ? random : countdown;

  const {
    status,
    count,
    isFlashing,
    logs,
  } = isCountdown
    ? activeCountdown
    : voice;
  const activeReset = isCountdown ? activeCountdown.reset : voice.reset;
  const activePause = isCountdown ? activeCountdown.pause : voice.pause;
  const activeResume = isCountdown ? activeCountdown.resume : voice.resume;

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [effectMenuOpen, setEffectMenuOpen] = useState(false);

  /** 切换模式 — 重置三边，切换后保存 */
  const handleModeChange = useCallback((newMode: AppMode) => {
    if (newMode === settings.mode) return;
    voice.reset();
    countdown.reset();
    random.reset();
    closeAudioCtx();
    const next = { ...settings, mode: newMode };
    setSettings(next);
    saveSettings(next);
  }, [settings, voice, countdown, random]);

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
      if (isRandom) {
        random.start();
      } else {
        countdown.start();
      }
    } else {
      try { await voice.startListening(); } catch { /* 错误已在 hook 内记录 */ }
    }
  }, [isCountdown, isRandom, random, countdown, voice]);

  const handleCalibrate = useCallback(async () => {
    await voice.calibrate();
  }, [voice.calibrate]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }, []);

  // 方向管理：移动端强制竖屏，桌面端自由
  useEffect(() => {
    const checkOrientation = () => {
      // 检测是否为移动设备（屏幕宽度 < 1024px 视为移动设备）
      const isMobile = window.innerWidth < 1024;
      const isLandscape = window.innerWidth > window.innerHeight;

      // 仅在移动设备横屏时显示遮罩
      setOrientationBlocked(isMobile && isLandscape);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    // 尝试锁定竖屏（仅移动端浏览器支持，且仅在移动设备上执行）
    const isMobile = window.innerWidth < 1024;
    if (isMobile && 'orientation' in screen && typeof (screen.orientation as any).lock === 'function') {
      (screen.orientation as any).lock('portrait').catch(() => {});
    }

    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const isRunning = status === 'listening' || status === 'paused';
  const currentEffect = EFFECT_OPTIONS.find((e) => e.key === settings.visualEffect) || EFFECT_OPTIONS[0];
  const displayTarget = isCountdown ? activeCountdown.total : settings.target;

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
