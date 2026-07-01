import './CounterDial.css';

interface Props {
  count: number;
  target: number;
  isFlashing: boolean;
  reverse?: boolean; // 逆时针进度（倒计时用）
}

/** 温暖手工渐变: 深棕 → 木质暖棕 → 琥珀橙 */
const DIAL_GRADIENT = [
  { offset: '0%', color: '#6B5437' },
  { offset: '50%', color: '#8B6F47' },
  { offset: '100%', color: '#D4875C' },
];

export function CounterDial({ count, target, isFlashing, reverse = false }: Props) {
  const rawProgress = target > 0 ? Math.min(count / target, 1) : 0;
  const progress = reverse ? 1 - rawProgress : rawProgress;
  const r = 78;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);
  const hasTarget = target > 0;

  return (
    <div className={`counter-dial ${isFlashing ? 'flash' : ''}`}>
      <svg viewBox="0 0 200 200" className="dial-svg">
        <defs>
          <linearGradient id="dial-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {DIAL_GRADIENT.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        {/* 背景圆环 */}
        <circle
          cx="100" cy="100" r={r}
          fill="none"
          stroke="var(--hairline-warm)"
          strokeWidth="6"
        />
        {/* 进度圆环 — 温暖手工渐变 */}
        {hasTarget && (
          <circle
            cx="100" cy="100" r={r}
            fill="none"
            stroke="url(#dial-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 100 100)"
            className="progress-ring"
          />
        )}
      </svg>
      {/* 中心数字 */}
      <div className="dial-number">{count}</div>
      <div className="dial-target">/ {target}</div>
    </div>
  );
}
