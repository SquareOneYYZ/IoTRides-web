import { batch } from 'react-redux';

const threshold = 3;
const interval = 1500;

export default () => (next) => {
  const buffer = [];
  let throttle = false;
  let counter = 0;

  const intervalId = setInterval(() => {
  setInterval(() => {
    if (throttle) {
      if (buffer.length < threshold) {
        throttle = false;
      }
      if (buffer.length > 0) {
        const latest = buffer[buffer.length - 1];
        buffer.length = 0;
        batch(() => next(latest));
      }
      batch(() => buffer.splice(0, buffer.length).forEach((action) => next(action)));
    } else {
      if (counter > threshold) {
        throttle = true;
      }
      counter = 0;
    }
  }, interval);
  const cleanup = () => clearInterval(intervalId);
  const middleware = (action) => {
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

  middleware.cleanup = cleanup;
  return middleware;
};
