/**
 * 音频工具 — 初始化 AudioContext、AnalyserNode、RMS → dB 计算
 */

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaStreamAudioSourceNode | null = null;
let stream: MediaStream | null = null;

/** 请求麦克风权限并初始化音频管线，返回 analyser 节点 */
export async function initAudio(): Promise<AnalyserNode> {
  if (audioCtx && analyser) return analyser;

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.3;
  source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);
  return analyser;
}

/** 获取当前 RMS 音量（线性值 0–1），使用频域数据计算 */
export function getVolume(analyser: AnalyserNode): number {
  const data = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

/** 线性值转 dB（0 → -Infinity, 1 → 0），映射到 0–100 范围以便显示 */
export function toDecibel(linear: number): number {
  if (linear < 1e-6) return 0;
  // 20 * log10(linear) 范围大约是 -100 到 0，加 100 映射到 0–100
  const db = 20 * Math.log10(linear) + 100;
  return Math.max(0, Math.min(100, db));
}

/** 释放音频资源 */
export function closeAudio(): void {
  source?.disconnect();
  analyser?.disconnect();
  stream?.getTracks().forEach((t) => t.stop());
  void audioCtx?.close();
  audioCtx = null;
  analyser = null;
  source = null;
  stream = null;
}
