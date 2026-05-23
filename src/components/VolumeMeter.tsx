import './VolumeMeter.css';

interface Props {
  dbLevel: number;
  threshold: number;
  baseline: number;
}

/** 实时音量条，显示当前 dB 和阈值线 */
export function VolumeMeter({ dbLevel, threshold, baseline }: Props) {
  const effectiveThreshold = threshold + baseline;
  const height = Math.min(dbLevel, 100);

  return (
    <div className="volume-meter">
      <div className="vm-label">音量</div>
      <div className="vm-bar-track">
        <div
          className={`vm-bar-fill ${dbLevel > effectiveThreshold ? 'over' : ''}`}
          style={{ height: `${height}%` }}
        />
        {/* 阈值线 */}
        <div
          className="vm-threshold"
          style={{ bottom: `${effectiveThreshold}%` }}
        />
      </div>
      <div className="vm-value">
        {dbLevel.toFixed(1)} <span className="vm-unit">dB</span>
      </div>
    </div>
  );
}
