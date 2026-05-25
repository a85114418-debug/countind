/**
 * 语音播报工具 — Web Speech API 封装
 * 中英文各精选 2 个女声（一细一粗）
 */

export interface VoiceOption {
  name: string;
  lang: string;
  gender: 'male' | 'female';
  timbre: 'thin' | 'thick';
  voiceURI: string;
}

/* ---------- 性别识别关键词 ---------- */
const MALE_NAMES = /\b(male|男|boy|man|guy|gentleman|daniel|david|tom\b|james|michael|alex|fred|henry|william|george|mark|john|paul|peter|robert|steven|brian|chris|kevin|andrew|scott|eric|jason|matthew|ryan|adam|patrick|samuel|nathan|justin|brandon|aaron|gary|larry|bruce|ralph|arthur|ralf|li-mu|sin-ji|xiao\s*yi|yixi|kangkang|yunyang|yunjian|yunfeng|yunxi|yunxiang)\b/i;
const FEMALE_NAMES = /\b(female|女|girl|woman|lady|madam|samantha|susan|karen|lisa|mary|zira|catherine|victoria|moira|fiona|alice|sarah|emma|olivia|mia|charlotte|amelia|harper|evelyn|abigail|emily|elizabeth|sofia|ella|scarlett|grace|chloe|penelope|layla|riley|zoe|nora|lily|hannah|lillian|aubrey|ellie|stella|natalie|hazel|violet|aurora|savannah|audrey|brooklyn|bella|claire|skylar|kathy|xiaoxiao|ya\s*ya|yaya|tingting|meijia|mei-jia)\b/i;

/* ---------- 音色粗细关键词 ---------- */
const THIN_PATTERN = /\b(xiao|yi\b|tong|qian|girl|young|high|thin|light|bright|soprano|zira)\b/i;
const THICK_PATTERN = /\b(kang|yun|gang|feng|jian|tingting|deep|low|bass|thick|heavy|dark|rich|mature)\b/i;

/** 唤醒语音引擎，触发移动端语音列表加载 */
export function warmupSpeech(): void {
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  u.rate = 1.5;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function classifyGender(name: string): 'male' | 'female' {
  if (MALE_NAMES.test(name)) return 'male';
  if (FEMALE_NAMES.test(name)) return 'female';
  return 'male';
}

function classifyTimbre(name: string, gender: 'male' | 'female'): 'thin' | 'thick' {
  if (THIN_PATTERN.test(name)) return 'thin';
  if (THICK_PATTERN.test(name)) return 'thick';
  return gender === 'female' ? 'thin' : 'thick';
}

const LANG_PREFIX: Record<string, string> = { 'zh-CN': 'zh', 'en-US': 'en' };

/** 获取精选语音列表（仅女声，最多 2 个：一细一粗） */
export function getVoiceOptions(lang: string): VoiceOption[] {
  const allVoices = speechSynthesis.getVoices();
  const prefix = LANG_PREFIX[lang] || lang;
  const filtered = allVoices.filter((v) => v.lang.startsWith(prefix));

  // 只保留女声
  const females = filtered.filter((v) => classifyGender(v.name) === 'female');
  // 去重
  const seen = new Set<string>();
  const deduped = females.filter((v) => {
    if (seen.has(v.voiceURI)) return false;
    seen.add(v.voiceURI);
    return true;
  });
  if (deduped.length === 0) return [];

  // 按粗细打分
  const scored = deduped.map((v) => ({
    v,
    timbre: classifyTimbre(v.name, 'female'),
  }));

  const result: VoiceOption[] = [];
  const added = new Set<string>();
  const push = (item: typeof scored[0]) => {
    if (!item || added.has(item.v.voiceURI)) return;
    added.add(item.v.voiceURI);
    result.push({
      name: item.v.name,
      lang: item.v.lang,
      gender: 'female' as const,
      timbre: item.timbre,
      voiceURI: item.v.voiceURI,
    });
  };

  const thinPick = scored.find((s) => s.timbre === 'thin');
  const thickPick = scored.find((s) => s.timbre === 'thick');

  if (thinPick) push(thinPick);
  if (thickPick) push(thickPick);

  // 若某类缺失，用另一类的第二个补齐
  if (!thickPick) {
    const spare = scored.find((s) => s.timbre === 'thin' && !added.has(s.v.voiceURI));
    if (spare) push({ v: spare.v, timbre: 'thick' });
  }
  if (!thinPick) {
    const spare = scored.find((s) => s.timbre === 'thick' && !added.has(s.v.voiceURI));
    if (spare) push({ v: spare.v, timbre: 'thin' });
  }

  return result;
}

const TIMBRE_LABEL: Record<string, string> = { thin: '细', thick: '粗' };

export function getTimbreLabel(t: 'thin' | 'thick'): string {
  return TIMBRE_LABEL[t];
}

/** 播报数字 */
export function speakNumber(count: number, lang: string, voiceURI?: string): void {
  const utterance = new SpeechSynthesisUtterance(String(count));
  utterance.lang = lang;
  utterance.rate = 1.2;
  utterance.pitch = 1;
  utterance.volume = 1;
  if (voiceURI) applyVoice(utterance, voiceURI);
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

/** 试听语音 — 不 cancel，直接队列播放确保移动端有声音 */
export function previewVoice(voiceURI: string, lang: string): void {
  const utterance = new SpeechSynthesisUtterance(
    lang.startsWith('zh') ? '你好 这是语音测试' : 'Hello voice test'
  );
  utterance.lang = lang;
  utterance.rate = 1.2;
  utterance.pitch = 1;
  utterance.volume = 1;
  if (voiceURI) applyVoice(utterance, voiceURI);

  // 移动端 cancel 后再 speak 有时会吞掉声音，直接 speak 让浏览器排队
  speechSynthesis.speak(utterance);
}

/** 将指定 voice 绑定到 utterance，URI 匹配失败时降级按名称查找 */
function applyVoice(utterance: SpeechSynthesisUtterance, voiceURI: string): void {
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return;
  let match = voices.find((v) => v.voiceURI === voiceURI);
  if (!match) {
    try {
      const decoded = decodeURIComponent(voiceURI).toLowerCase();
      match = voices.find(
        (v) => v.name.toLowerCase().includes(decoded) || decoded.includes(v.name.toLowerCase())
      );
    } catch { /* 非合法编码，跳过 */ }
  }
  if (match) utterance.voice = match;
}
