/**
 * 语音播报工具 — Web Speech API 封装
 * 解决移动端语音列表异步加载和试听失效问题
 */

export interface VoiceOption {
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'unknown';
  voiceURI: string;
}

/** 唤醒语音引擎，触发移动端语音列表加载 */
export function warmupSpeech(): void {
  // 移动端 Chrome 需要一次真实的 speak 调用才能加载语音列表
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  u.rate = 1.5;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/** 获取可用语音列表 */
export function getVoiceOptions(langPrefix: string): VoiceOption[] {
  const allVoices = speechSynthesis.getVoices();
  const filtered = allVoices.filter((v) => v.lang.startsWith(langPrefix));
  return filtered.map((v) => {
    const nameLower = v.name.toLowerCase();
    let gender: VoiceOption['gender'] = 'unknown';
    // 通过常见关键词判断性别
    if (/male|男|xiao yi|yixi|kangkang/i.test(nameLower)) gender = 'male';
    else if (/female|女|xiaoxiao|ya ya|yaya|tingting/i.test(nameLower)) gender = 'female';
    return {
      name: v.name,
      lang: v.lang,
      gender,
      voiceURI: v.voiceURI,
    };
  });
}

/** 播报数字（带防抖保护） */
let speakTimer: ReturnType<typeof setTimeout> | null = null;
export function speakNumber(count: number, lang: string, voiceURI?: string): void {
  if (speakTimer) clearTimeout(speakTimer);
  speakTimer = setTimeout(() => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(count));
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voiceURI) {
      const voices = speechSynthesis.getVoices();
      const match = voices.find((v) => v.voiceURI === voiceURI);
      if (match) utterance.voice = match;
    }
    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('speakNumber error:', e.error);
      }
    };
    speechSynthesis.speak(utterance);
  }, 60);
}

/** 试听语音 */
export function previewVoice(voiceURI: string, lang: string): void {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(
    lang.startsWith('zh') ? '你好 这是语音测试' : 'Hello voice test'
  );
  utterance.lang = lang;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voices = speechSynthesis.getVoices();
  const match = voices.find((v) => v.voiceURI === voiceURI);
  if (match) utterance.voice = match;

  utterance.onerror = (e) => {
    console.warn('previewVoice error:', e.error);
    // 出错时回退到默认语音
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      const fallback = new SpeechSynthesisUtterance(
        lang.startsWith('zh') ? '你好 这是语音测试' : 'Hello voice test'
      );
      fallback.lang = lang;
      fallback.rate = 0.9;
      speechSynthesis.speak(fallback);
    }
  };

  // cancel 之后需要微小延迟再 speak
  setTimeout(() => speechSynthesis.speak(utterance), 50);
}
