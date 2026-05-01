import { batch } from 'react-redux';

const threshold = 3;
const interval = 1500;

export default () => (next) => {
  const buffer = [];
  let throttle = false;
  let counter = 0;

  setInterval(() => {
    if (throttle) {
      if (buffer.length > 0) {
        batch(() => buffer.splice(0, buffer.length).forEach((action) => next(action)));
      }
      if (buffer.length < threshold) {
        throttle = false;
      }
    } else {
      if (counter > threshold) {
        throttle = true;
      }
      counter = 0;
    }
  }, interval);

  return (action) => {
    if (action.type === 'devices/update' || action.type === 'positions/update') {
      if (throttle) {
        const existing = buffer.find((b) => b.type === action.type);
        if (existing) {
          const existingIds = new Set(existing.payload.map((p) => p.deviceId ?? p.id));
          const newItems = action.payload.filter((p) => !existingIds.has(p.deviceId ?? p.id));
          existing.payload = [...existing.payload, ...newItems];
        } else {
          buffer.push({ ...action, payload: [...action.payload] });
        }
        return null;
      }
      counter += 1;
      return next(action);
    }
    return next(action);
  };
};
