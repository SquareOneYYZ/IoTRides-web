import {
  useEffect, useRef, useState, useCallback,
} from 'react';

const usePositionWorker = () => {
  const workerRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [stats, setStats] = useState(null);
  const callbackRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./positionWorker.js', import.meta.url),
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === 'FEATURES_READY') {
        setFeatures(payload.features);
        setStats(payload.stats);

        if (callbackRef.current) {
          callbackRef.current(payload.features);
        }
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processPositions = useCallback((data, onComplete) => {
    if (!workerRef.current) return;

    callbackRef.current = onComplete;

    workerRef.current.postMessage({
      type: 'PROCESS_POSITIONS',
      payload: data,
    });
  }, []);

  const clearCache = useCallback(() => {
    workerRef.current?.postMessage({ type: 'CLEAR_CACHE' });
  }, []);

  return { features, stats, processPositions, clearCache };
};

export default usePositionWorker;
