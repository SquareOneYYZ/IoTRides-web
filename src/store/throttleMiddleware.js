import { batch } from 'react-redux';

const interval = 1500;

export default () => (next) => {
  let buffer = [];
  let timer = null;

  function flush() {
    if (buffer.length > 0) {
      const latest = buffer[buffer.length - 1];
      batch(() => next(latest));
      buffer = [];
    }
    timer = null;
  }

  return (action) => {
    if (
      action.type === 'devices/update'
      || action.type === 'positions/update'
    ) {
      buffer.push(action);
      if (!timer) {
        timer = setTimeout(flush, interval);
      }
      return null;
    }
    return next(action);
  };
};
