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

      // Handle chunked progressive updates
      if (type === 'FEATURES_CHUNK') {
        const { features: chunkFeatures, progress: chunkProgress, stats: chunkStats, isFirstChunk } = payload;

        // Reset accumulator on first chunk
        if (isFirstChunk) {
          accumulatedFeatures.current = [];
        }

        // Accumulate features
        accumulatedFeatures.current.push(...chunkFeatures);

        setFeatures([...accumulatedFeatures.current]);
        setStats(chunkStats);
        setProgress(chunkProgress);
        setIsLoading(true);

        // Call callback with accumulated features so far
        if (callbackRef.current) {
          callbackRef.current([...accumulatedFeatures.current]);
        }
      }

      // Handle completion
      if (type === 'PROCESSING_COMPLETE') {
        setStats(payload.stats);
        setProgress(100);
        setIsLoading(false);
      }

      // Legacy support for non-chunked responses
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

    // Only reset progress on initial load
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
