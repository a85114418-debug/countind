/**
 * 语音播报工具 — Web Speech API 封装
 * 解决移动端语音列表异步加载和试听失效问题
 * 中英文各精选 2 男 2 女（一细一粗），共 4 个音色
 */

export interface VoiceOption {
  name: string;
  lang: string;
  gender: 'male' | 'female';
  timbre: 'thin' | 'thick';
  voiceURI: string;
}

/** 唤醒语音引擎，触发移动端语音列表加载 */
export function warmupSpeech(): void {
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  u.rate = 1.5;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/** 判断音色细/粗 */
function classifyTimbre(name: string, gender: 'male' | 'female'): 'thin' | 'thick' {
  const n = name.toLowerCase();
  // 细音色关键词（年轻、纤细、高音）
  if (/xiao|yi\b|tong|qian|girl|young|high|thin|light|bright/i.test(n)) return 'thin';
  // 粗音色关键词（成熟、低沉、浑厚）
  if (/kang|yun|gang|feng|jian|tingting|deep|low|bass|thick|heavy|dark|rich/i.test(n)) return 'thick';
  return gender === 'female' ? 'thin' : 'thick';
}

const LANG_PREFIX: Record<string, string> = {
  'zh-CN': 'zh',
  'en-US': 'en',
};

/** 获取精选语音列表（每性别 2 个，一细一粗） */
export function getVoiceOptions(lang: string): VoiceOption[] {
  const allVoices = speechSynthesis.getVoices();
  const prefix = LANG_PREFIX[lang] || lang;
  const filtered = allVoices.filter((v) => v.lang.startsWith(prefix));

  const byGender: Record<string, SpeechSynthesisVoice[]> = { male: [], female: [] };
  for (const v of filtered) {
    const n = v.name.toLowerCase();
    if (/male|男|xiao yi|yixi|kangkang|yunyang|yunjian|yunfeng|yunxi/i.test(n)) {
      byGender.male.push(v);
    } else if (/female|女|xiaoxiao|ya\s*ya|yaya|tingting|meijia|sin-ji/i.test(n)) {
      byGender.female.push(v);
    } else if (/xiao|tong|girl|woman|lady|madam/i.test(n)) {
      byGender.female.push(v);
    } else {
      byGender.male.push(v);
    }
  }

  const result: VoiceOption[] = [];

  for (const gender of ['male', 'female'] as const) {
    const list = byGender[gender];
    // 去重（按 voiceURI）
    const seen = new Set<string>();
    const deduped = list.filter((v) => {
      if (seen.has(v.voiceURI)) return false;
      seen.add(v.voiceURI);
      return true;
    });

    // 分细/粗两组
    const thin = deduped.filter((v) => classifyTimbre(v.name, gender) === 'thin');
    const thick = deduped.filter((v) => classifyTimbre(v.name, gender) === 'thick');

    // 每组取第一个，不够则从另一组补
    const pickThin = thin[0] || thick[0] || deduped[0];
    const pickThick = thick[0] || thin[1] || thin[0] || deduped[1] || deduped[0];

    if (pickThin && pickThin.voiceURI !== pickThick?.voiceURI) {
      result.push({
        name: pickThin.name,
        lang: pickThin.lang,
        gender,
        timbre: 'thin',
        voiceURI: pickThin.voiceURI,
      });
    }
    if (pickThick && pickThick.voiceURI !== pickThin?.voiceURI) {
      result.push({
        name: pickThick.name,
        lang: pickThick.lang,
        gender,
        timbre: 'thick',
        voiceURI: pickThick.voiceURI,
      });
    }
  }

  return result;
}

const TIMBRE_LABEL: Record<string, string> = { thin: '细', thick: '粗' };

export function getTimbreLabel(t: 'thin' | 'thick'): string {
  return TIMBRE_LABEL[t];
}

/** 播报数字（快速报数） */
export function speakNumber(count: number, lang: string, voiceURI?: string): void {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(count));
  utterance.lang = lang;
  utterance.rate = 1.2;
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
}

/** 试听语音 */
export function previewVoice(voiceURI: string, lang: string): void {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(
    lang.startsWith('zh') ? '你好 这是语音测试' : 'Hello voice test'
  );
  utterance.lang = lang;
  utterance.rate = 1.2;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voices = speechSynthesis.getVoices();
  const match = voices.find((v) => v.voiceURI === voiceURI);
  if (match) utterance.voice = match;

  utterance.onerror = (e) => {
    console.warn('previewVoice error:', e.error);
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      const fallback = new SpeechSynthesisUtterance(
        lang.startsWith('zh') ? '你好 这是语音测试' : 'Hello voice test'
      );
      fallback.lang = lang;
      fallback.rate = 1.2;
      speechSynthesis.speak(fallback);
    }
  };

  setTimeout(() => speechSynthesis.speak(utterance), 50);
}
