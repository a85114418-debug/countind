import type { AppStatus } from '../types';
import './ControlBar.css';

interface Props {
  status: AppStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

/** 控制按钮栏：开启声控 / 暂停 / 继续 / 停止并重置 */
export function ControlBar({ status, onStart, onPause, onResume, onReset }: Props) {
  return (
    <div className="control-bar">
      {status === 'idle' && (
        <button className="ctrl-btn btn-start" onClick={onStart}>
          开启声控
        </button>
      )}
      {status === 'listening' && (
        <>
          <button className="ctrl-btn btn-pause" onClick={onPause}>
            暂停
          </button>
          <button className="ctrl-btn btn-reset" onClick={onReset}>
            停止并重置
          </button>
        </>
      )}
      {status === 'paused' && (
        <>
          <button className="ctrl-btn btn-start" onClick={onResume}>
            开始执行
          </button>
          <button className="ctrl-btn btn-reset" onClick={onReset}>
            停止并重置
          </button>
        </>
      )}
      {status === 'finished' && (
        <button className="ctrl-btn btn-reset" onClick={onReset}>
          停止并重置
        </button>
      )}
    </div>
  );
}
