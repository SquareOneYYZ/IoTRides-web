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

      // Progressive chunk — initial load ke time aata hai (bade datasets)
      if (type === 'FEATURES_CHUNK') {
        const {
          features: chunkFeatures,
          progress: chunkProgress,
          stats: chunkStats,
          isFirstChunk,
        } = payload;

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

      // Initial chunked load complete
      if (type === 'PROCESSING_COMPLETE') {
        setStats(payload.stats);
        setProgress(100);
        setIsLoading(false);
      }

      // Single response — live updates ya chhota initial dataset
      if (type === 'FEATURES_READY') {
        const { features: newFeatures, isInitialLoad } = payload;

        setFeatures(newFeatures);
        setStats(payload.stats);
        setProgress(100);

        // IMPORTANT: isLoading sirf initial load ke time true karo
        // Live updates ke time isLoading touch mat karo
        // Yahi fix hai loader baar baar dikhne ka
        if (isInitialLoad) {
          setIsLoading(false);
        }

        if (callbackRef.current) {
          callbackRef.current(newFeatures);
        }
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processPositions = useCallback((data, onComplete, isInitialLoad = false) => {
    if (!workerRef.current) return;

    callbackRef.current = onComplete;

    // Sirf initial load pe progress reset karo
    // Live updates silently background mein hote hain
    if (isInitialLoad) {
      accumulatedFeatures.current = [];
      setProgress(0);
      setIsLoading(true);
    }

    workerRef.current.postMessage({
      type: 'PROCESS_POSITIONS',
      payload: { ...data, isInitialLoad },
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
