/**
 * 提示音生成 — 使用 Web Audio API 播放短促音效
 */

import type { SoundType } from '../types';

let audioCtx: AudioContext | null = null;

/** 获取或创建 AudioContext（延迟初始化，需要用户交互后调用） */
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** 播放单次正弦波 beep */
function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  delay: number = 0,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.05);
}

/** 播放提示音 */
export function playSound(type: SoundType, volume: number): void {
  const ctx = getAudioContext();
  const vol = Math.max(0, Math.min(1, volume));

  switch (type) {
    case 'beep':
      // 短促单音 880Hz
      playTone(ctx, 880, 0.12, vol);
      break;

    case 'double-beep':
      // 两个快速连续的音
      playTone(ctx, 660, 0.08, vol, 0);
      playTone(ctx, 880, 0.08, vol, 0.12);
      break;

    case 'chime':
      // 较长的上升音
      playTone(ctx, 523, 0.10, vol, 0);
      playTone(ctx, 659, 0.10, vol, 0.08);
      playTone(ctx, 784, 0.15, vol, 0.16);
      break;
  }
}

/** 播放完成音（倒计时结束） */
export function playFinishSound(type: SoundType, volume: number): void {
  const ctx = getAudioContext();
  const vol = Math.max(0, Math.min(1, volume));

  switch (type) {
    case 'beep':
      // 长音 440Hz
      playTone(ctx, 440, 0.4, vol);
      break;
    case 'double-beep':
      playTone(ctx, 440, 0.3, vol, 0);
      playTone(ctx, 880, 0.4, vol, 0.25);
      break;
    case 'chime':
      playTone(ctx, 523, 0.2, vol, 0);
      playTone(ctx, 659, 0.2, vol, 0.15);
      playTone(ctx, 784, 0.2, vol, 0.30);
      playTone(ctx, 1047, 0.4, vol, 0.45);
      break;
  }
}

/** 释放 AudioContext 资源 */
export function closeAudioCtx(): void {
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}
