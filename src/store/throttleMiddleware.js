import { batch } from 'react-redux';

const THRESHOLD = 200;
const INTERVAL = 1000;
const FLUSH_DELAY = 100;

export default () => (next) => {
  const buffer = new Map();
  let throttle = false;
  let counter = 0;
  let flushTimer = null;

  const flush = () => {
    if (buffer.size === 0) return;
    const actions = Array.from(buffer.values());
    buffer.clear();
    flushTimer = null;
    batch(() => actions.forEach((action) => next(action)));
  };

  const scheduleFlush = () => {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, FLUSH_DELAY);
  };

  setInterval(() => {
    if (throttle) {
      if (buffer.size < THRESHOLD) {
        throttle = false;
      }
      flush();
    } else {
      if (counter > THRESHOLD) {
        throttle = true;
      }
      counter = 0;
    }
  }, INTERVAL);

  return (action) => {
    if (action.type === 'devices/update' || action.type === 'positions/update') {
      counter += 1;
      if (throttle) {
        const key = `${action.type}-${action.payload?.id ?? action.payload?.deviceId ?? Math.random()}`;
        buffer.set(key, action);
        scheduleFlush();
        return null;
      }
      return next(action);
    }
    return next(action);
  };
};
