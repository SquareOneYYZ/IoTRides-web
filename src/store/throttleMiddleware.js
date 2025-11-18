import { batch } from 'react-redux';

const THRESHOLD = 3;
const INTERVAL = 1500;
const EXPIRE_TIME = 15000;

export default () => (next) => {
  const buffer = [];
  let throttle = false;
  let counter = 0;

  const deviceLastUpdate = {};

  const timer = setInterval(() => {
    const now = Date.now();
    console.log('throttleMiddleware');
    Object.keys(deviceLastUpdate).forEach((deviceId) => {
      if (now - deviceLastUpdate[deviceId] > EXPIRE_TIME) {
        next({ type: 'devices/expire', id: deviceId });
        delete deviceLastUpdate[deviceId];
      }
    });

    if (throttle) {
      if (buffer.length < THRESHOLD) {
        throttle = false;
      }

      if (buffer.length > 0) {
        batch(() => {
          for (let i = 0; i < buffer.length; i += 1) {
            next(buffer[i]);
          }
          buffer.length = 0;
        });
      }
    } else {
      if (counter > THRESHOLD) {
        throttle = true;
      }
      counter = 0;
    }
  }, INTERVAL);

  const unsubscribeCleanup = () => clearInterval(timer);

  unsubscribeCleanup();
  return (action) => {
    if (action.type === 'devices/update') {
      const id = action.payload?.id;
      if (id) deviceLastUpdate[id] = Date.now();
    }

    if (
      action.type === 'devices/update'
      || action.type === 'positions/update'
    ) {
      if (throttle) {
        if (buffer.length < 2000) buffer.push(action);
        return null;
      }

      counter += 1;
      return next(action);
    }

    return next(action);
  };
};
