import './CounterDial.css';

interface Props {
  count: number;
  target: number;
  isFlashing: boolean;
}

/** Google 四色渐变 */
const GOOGLE_COLORS = [
  { offset: '0%', color: '#4285F4' },
  { offset: '25%', color: '#EA4335' },
  { offset: '50%', color: '#FBBC05' },
  { offset: '75%', color: '#34A853' },
  { offset: '100%', color: '#4285F4' },
];

export function CounterDial({ count, target, isFlashing }: Props) {
  const progress = target > 0 ? Math.min(count / target, 1) : 0;
  const r = 78;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);
  const hasTarget = target > 0;

  return (
    <div className={`counter-dial ${isFlashing ? 'flash' : ''}`}>
      <svg viewBox="0 0 200 200" className="dial-svg">
        <defs>
          <linearGradient id="google-rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
            {GOOGLE_COLORS.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        {/* 背景圆环 */}
        <circle
          cx="100" cy="100" r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="5"
        />
        {/* 进度圆环 — Google 彩虹渐变 */}
        {hasTarget && (
          <circle
            cx="100" cy="100" r={r}
            fill="none"
            stroke="url(#google-rainbow)"
            strokeWidth="5"
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
