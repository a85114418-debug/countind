import { useState, useCallback, useEffect } from 'react';
import type { Settings, VisualEffect } from './types';
import { useAudioDetector } from './hooks/useAudioDetector';
import { loadSettings, saveSettings } from './utils/storage';
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

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [isLandscape, setIsLandscape] = useState(false);
  const {
    status,
    count,
    dbLevel,
    baseline,
    logs,
    isFlashing,
    startListening,
    pause,
    resume,
    reset,
    calibrate,
    setSimulatedDb,
  } = useAudioDetector(settings);

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [effectMenuOpen, setEffectMenuOpen] = useState(false);

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

  const handleStart = useCallback(async () => {
    try {
      await startListening();
    } catch { /* hook 已记录错误 */ }
  }, [startListening]);

  const handleCalibrate = useCallback(async () => {
    await calibrate();
  }, [calibrate]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }, []);

  // 锁定竖屏方向 + 横屏提示
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    // Screen Orientation API — 强制锁定竖屏
    if ('orientation' in screen && typeof (screen.orientation as any).lock === 'function') {
      (screen.orientation as any).lock('portrait').catch(() => {
        // 部分浏览器不支持 lock，忽略
      });
    }

    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const isRunning = status === 'listening' || status === 'paused';
  const currentEffect = EFFECT_OPTIONS.find((e) => e.key === settings.visualEffect) || EFFECT_OPTIONS[0];

  return (
    <>
      {isLandscape && (
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
        <div className="header-status">
          状态：<span className={`status-dot status-${status}`} />
          {status === 'idle' && '未开始'}
          {status === 'listening' && '监听中'}
          {status === 'paused' && '已暂停'}
          {status === 'finished' && '已完成'}
        </div>
      </header>

      <main className="app-main">
        {/* 计数器表盘 */}
        <section className="section-dial">
          <CounterDial count={count} target={settings.target} isFlashing={isFlashing} />
        </section>

        {/* 实时音量条 */}
        <section className="section-volume">
          <VolumeMeter
            dbLevel={dbLevel}
            threshold={settings.threshold}
            baseline={baseline}
          />
        </section>

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
            onPause={pause}
            onResume={resume}
            onReset={reset}
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
                baseline={baseline}
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
                dbLevel={dbLevel}
                baseline={baseline}
                count={count}
                logs={logs}
                onSimulate={setSimulatedDb}
              />
            </div>
          )}
        </section>
      </main>
    </div>
    </>
  );
}
