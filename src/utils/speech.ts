/**
 * 语音播报工具 — Web Speech API 封装
 */

export interface VoiceOption {
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'unknown';
  voiceURI: string;
}

/** 获取可用的语音列表，按语言过滤并按性别分组 */
export function getVoiceOptions(langPrefix: string): VoiceOption[] {
  const voices = speechSynthesis.getVoices();
  return voices
    .filter((v) => v.lang.startsWith(langPrefix))
    .map((v) => ({
      name: v.name,
      lang: v.lang,
      gender: v.name.toLowerCase().includes('male') ? 'male' as const
        : v.name.toLowerCase().includes('female') ? 'female' as const
        : 'unknown' as const,
      voiceURI: v.voiceURI,
    }));
}

/** 播报数字 */
export function speakNumber(count: number, lang: string, voiceURI?: string): void {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(count));
  utterance.lang = lang;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  if (voiceURI) {
    const voices = speechSynthesis.getVoices();
    const match = voices.find((v) => v.voiceURI === voiceURI);
    if (match) utterance.voice = match;
  }

  speechSynthesis.speak(utterance);
}

/** 试听语音 */
export function previewVoice(voiceURI: string, lang: string): void {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(
    lang.startsWith('zh') ? '你好，这是语音测试' : 'Hello, this is a voice test'
  );
  utterance.lang = lang;
  utterance.rate = 0.9;
  const voices = speechSynthesis.getVoices();
  const match = voices.find((v) => v.voiceURI === voiceURI);
  if (match) utterance.voice = match;
  speechSynthesis.speak(utterance);
}
