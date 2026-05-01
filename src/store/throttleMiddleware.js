import { batch } from 'react-redux';

const threshold = 3;
const interval = 1500;

export default () => (next) => {
  const buffer = [];
  let throttle = false;
  let counter = 0;
  let intervalId = null;

  const flushBuffer = () => {
    if (buffer.length === 0) return;

    const merged = buffer.reduce((acc, action) => {
      if (!acc) return action;
      return {
        ...action,
        payload: [
          ...Object.values(
            [...(acc.payload || []), ...(action.payload || [])]
              .reduce((map, item) => {
                map[item.id] = item;
                return map;
              }, {}),
          ),
        ],
      };
    }, null);

    buffer.length = 0;
    if (merged) batch(() => next(merged));
  };

  intervalId = setInterval(() => {
    if (throttle) {
      if (buffer.length < threshold) {
        throttle = false;
        flushBuffer();
      } else {
        flushBuffer();
      }
    } else {
      if (counter > threshold) {
        throttle = true;
      }
      counter = 0;
    }
  }, interval);

  next({ type: '@@throttleMiddleware/init', intervalId });

  return (action) => {
    if (action.type === 'devices/update' || action.type === 'positions/update') {
      if (throttle) {
        buffer.push(action);
        return null;
      }
      counter += 1;
      return next(action);
    }
    return next(action);
  };
};