import {
  useEffect, useRef, useState, useCallback,
} from 'react';

const usePositionWorker = () => {
  const workerRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const callbackRef = useRef(null);
  const accumulatedFeatures = useRef([]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./positionWorker.js', import.meta.url),
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      // Progressive chunked updates (initial load > 500 devices)
      if (type === 'FEATURES_CHUNK') {
        const {
          features: chunkFeatures,
          progress: chunkProgress,
          stats: chunkStats,
          isFirstChunk,
        } = payload;

        // Reset accumulator on first chunk so stale data doesn't persist
        if (isFirstChunk) {
          accumulatedFeatures.current = [];
        }

        accumulatedFeatures.current.push(...chunkFeatures);

        setFeatures([...accumulatedFeatures.current]);
        setStats(chunkStats);
        setProgress(chunkProgress);
        setIsLoading(true);

        if (callbackRef.current) {
          callbackRef.current([...accumulatedFeatures.current]);
        }
      }

      // Chunked load finished
      if (type === 'PROCESSING_COMPLETE') {
        setStats(payload.stats);
        setProgress(100);
        setIsLoading(false);
      }

      // Single-batch response (live updates or small initial load <= 500 devices)
      if (type === 'FEATURES_READY') {
        setFeatures(payload.features);
        setStats(payload.stats);
        setProgress(100);
        setIsLoading(false);

        if (callbackRef.current) {
          callbackRef.current(payload.features);
        }
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processPositions = useCallback((data, onComplete, skipProgressiveLoad = false) => {
    if (!workerRef.current) return;

    callbackRef.current = onComplete;

    // Only reset progress indicators on initial load
    // Live updates (skipProgressiveLoad=true) run silently in background
    if (!skipProgressiveLoad) {
      accumulatedFeatures.current = [];
      setProgress(0);
      setIsLoading(true);
    }

    workerRef.current.postMessage({
      type: 'PROCESS_POSITIONS',
      payload: { ...data, skipProgressiveLoad },
    });
  }, []);

  const clearCache = useCallback(() => {
    workerRef.current?.postMessage({ type: 'CLEAR_CACHE' });
  }, []);

  return {
    features,
    stats,
    isLoading,
    progress,
    processPositions,
    clearCache,
  };
};

export default usePositionWorker;
