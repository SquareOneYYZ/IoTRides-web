import { batch } from 'react-redux';

const THRESHOLD = 200;
const INTERVAL = 1000;

export default () => (next) => {
  // Use Map instead of Array — auto-deduplicates by deviceId
  // This prevents stacking 50 updates for the same device
  const buffer = new Map();
  let throttle = false;
  let counter = 0;
  let flushTimer = null;

  const flush = () => {
    if (buffer.size === 0) return;
    const actions = Array.from(buffer.values());
    buffer.clear();
    batch(() => actions.forEach((action) => next(action)));
    flushTimer = null;
  };

  const scheduleFlush = () => {
    if (flushTimer) return;
    // Flush buffered actions every 100ms — fast enough for live updates
    flushTimer = setTimeout(flush, 100);
  };

  // Every second: evaluate whether to throttle or release
  setInterval(() => {
    if (throttle) {
      if (buffer.size < THRESHOLD) {
        throttle = false;
      }
      flush();
    } else if (counter > THRESHOLD) {
      throttle = true;
    }
    counter = 0;
  }, INTERVAL);

  return (action) => {
    if (action.type === 'devices/update' || action.type === 'positions/update') {
      counter += 1;

      if (throttle) {
        // Key by type + deviceId so duplicate updates overwrite, not stack
        const key = `${action.type}-${action.payload?.id}`;
        buffer.set(key, action);
        scheduleFlush();
        return null;
      }

      return next(action);
    }

    // All other actions pass through immediately
    return next(action);
  };
};
