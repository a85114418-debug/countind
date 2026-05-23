import './CounterDial.css';

interface Props {
  count: number;
  target: number;
  isFlashing: boolean;
}

/** 计数器表盘：蓝色荧光边框，加一时红色高亮闪烁 */
export function CounterDial({ count, target, isFlashing }: Props) {
  const progress = target > 0 ? Math.min(count / target, 1) : 0;
  // SVG 环形进度条参数
  const r = 78;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={`counter-dial ${isFlashing ? 'flash' : ''}`}>
      <svg viewBox="0 0 200 200" className="dial-svg">
        {/* 背景圆环 */}
        <circle
          cx="100" cy="100" r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="5"
        />
        {/* 进度圆环 */}
        <circle
          cx="100" cy="100" r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          className="progress-ring"
        />
      </svg>
      {/* 中心数字 */}
      <div className="dial-number">{count}</div>
      <div className="dial-target">/ {target}</div>
    </div>
  );
}
