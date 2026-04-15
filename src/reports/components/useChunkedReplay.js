import { useState, useRef, useCallback, useEffect } from 'react';

const CHUNK_SIZE = 200;
const PREFETCH_THRESHOLD = 50; 

const useChunkedReplay = () => {
  const [positions, setPositions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState(null);

  const sessionIdRef = useRef(null);
  const loadedUpToRef = useRef(0);      
  const isFetchingRef = useRef(false);  
  const pendingResumeRef = useRef(null);

  const reset = useCallback(() => {
    sessionIdRef.current = null;
    loadedUpToRef.current = 0;
    isFetchingRef.current = false;
    pendingResumeRef.current = null;
    setPositions([]);
    setTotalCount(0);
    setIsBuffering(false);
    setError(null);
  }, []);

  const fetchChunk = useCallback(async (offset) => {
    if (!sessionIdRef.current || isFetchingRef.current) return;
    if (offset >= totalCount && totalCount > 0) return;

    isFetchingRef.current = true;
    try {
      const url = `/api/replay/session/${sessionIdRef.current}/chunk?offset=${offset}&limit=${CHUNK_SIZE}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(await response.text());

      const chunk = await response.json();
      if (!chunk || chunk.length === 0) return;

      setPositions((prev) => {
        const merged = [...prev, ...chunk];
        loadedUpToRef.current = merged.length;
        return merged;
      });

      if (pendingResumeRef.current) {
        setIsBuffering(false);
        pendingResumeRef.current();
        pendingResumeRef.current = null;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      isFetchingRef.current = false;
    }
  }, [totalCount]);

  const checkAndPrefetch = useCallback((currentIndex, onResume) => {
    const loaded = loadedUpToRef.current;
    const total = totalCount;

    if (currentIndex >= loaded && loaded < total) {
      pendingResumeRef.current = onResume;
      setIsBuffering(true);
      fetchChunk(loaded);
      return true; 
    }

    if (
      loaded < total
      && currentIndex >= loaded - PREFETCH_THRESHOLD
      && !isFetchingRef.current
    ) {
      fetchChunk(loaded);
    }

    return false; 
  }, [totalCount, fetchChunk]);

  const seekTo = useCallback(async (targetIndex) => {
    const loaded = loadedUpToRef.current;
    if (targetIndex < loaded) return;
    const chunkStart = Math.floor(targetIndex / CHUNK_SIZE) * CHUNK_SIZE;
    setPositions((prev) => prev.slice(0, chunkStart));
    loadedUpToRef.current = chunkStart;

    setIsBuffering(true);
    await fetchChunk(chunkStart);
    setIsBuffering(false);
  }, [fetchChunk]);

  const initSession = useCallback(async (deviceId, from, to) => {
    reset();
    setLoadingSession(true);
    setError(null);

    try {
      const response = await fetch('/api/replay/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, from, to }),
      });

      if (!response.ok) throw new Error(await response.text());

      const { sessionId, totalCount: count } = await response.json();
      sessionIdRef.current = sessionId;
      setTotalCount(count);

      await fetchChunk(0);

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoadingSession(false);
    }
  }, [reset, fetchChunk]);

  return {
    positions,
    totalCount,
    isBuffering,
    loadingSession,
    error,
    initSession,
    checkAndPrefetch,
    seekTo,
    reset,
  };
};

export default useChunkedReplay;