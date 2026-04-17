import { useState, useRef, useCallback } from 'react';

const CHUNK_SIZE = 200;
const PREFETCH_THRESHOLD = 50;

// ─── Console styling ────────────────────────────────────────────────────────
// Open browser DevTools → Console tab to see these logs
const LOG = {
  session: (msg, data) => console.log(`%c[SESSION] ${msg}`, 'color:#0ea5e9;font-weight:bold', data ?? ''),
  chunk:   (msg, data) => console.log(`%c[CHUNK]   ${msg}`, 'color:#8b5cf6;font-weight:bold', data ?? ''),
  buffer:  (msg, data) => console.log(`%c[BUFFER]  ${msg}`, 'color:#f59e0b;font-weight:bold', data ?? ''),
  play:    (msg, data) => console.log(`%c[PLAY]    ${msg}`, 'color:#10b981;font-weight:bold', data ?? ''),
  seek:    (msg, data) => console.log(`%c[SEEK]    ${msg}`, 'color:#f97316;font-weight:bold', data ?? ''),
  error:   (msg, data) => console.error(`[ERROR]   ${msg}`, data ?? ''),
  warn:    (msg, data) => console.warn(`[WARN]    ${msg}`, data ?? ''),
};

const useChunkedReplay = () => {
  const [positions, setPositions]           = useState([]);
  const [totalCount, setTotalCount]         = useState(0);
  const [isBuffering, setIsBuffering]       = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError]                   = useState(null);

  const sessionIdRef     = useRef(null);
  const loadedUpToRef    = useRef(0);
  const isFetchingRef    = useRef(false);
  const pendingResumeRef = useRef(null);
  // CRITICAL: totalCountRef mirrors state so fetchChunk/checkAndPrefetch
  // always see the latest value even inside stale closures.
  const totalCountRef    = useRef(0);

  // ─── reset ──────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    LOG.session('Resetting all replay state');
    sessionIdRef.current     = null;
    loadedUpToRef.current    = 0;
    isFetchingRef.current    = false;
    pendingResumeRef.current = null;
    totalCountRef.current    = 0;
    setPositions([]);
    setTotalCount(0);
    setIsBuffering(false);
    setError(null);
  }, []);

  // ─── fetchChunk ─────────────────────────────────────────────────────────
  const fetchChunk = useCallback(async (offset) => {
    if (!sessionIdRef.current) {
      LOG.warn('fetchChunk skipped — no sessionId', { offset });
      return;
    }
    if (isFetchingRef.current) {
      LOG.warn('fetchChunk skipped — already fetching', { offset });
      return;
    }
    if (totalCountRef.current > 0 && offset >= totalCountRef.current) {
      LOG.chunk(`fetchChunk skipped — offset ${offset} >= totalCount ${totalCountRef.current}`);
      return;
    }

    isFetchingRef.current = true;
    const url = `/api/replay/session/${sessionIdRef.current}/chunk?offset=${offset}&limit=${CHUNK_SIZE}`;
    LOG.chunk(`Fetching chunk`, { offset, limit: CHUNK_SIZE, url });
    console.time(`[CHUNK] offset=${offset}`);

    try {
      const response = await fetch(url);
      console.timeEnd(`[CHUNK] offset=${offset}`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const chunk = await response.json();

      if (!chunk || chunk.length === 0) {
        LOG.chunk('Empty chunk — all data loaded');
        return;
      }

      LOG.chunk(`Chunk received`, {
        offset,
        received: chunk.length,
        firstFixTime: chunk[0]?.fixTime,
        lastFixTime:  chunk[chunk.length - 1]?.fixTime,
      });

      setPositions((prev) => {
        const merged = [...prev, ...chunk];
        loadedUpToRef.current = merged.length;
        LOG.buffer('Buffer updated', {
          before: prev.length,
          after:  merged.length,
          total:  totalCountRef.current,
          pct:    `${((merged.length / (totalCountRef.current || 1)) * 100).toFixed(1)}%`,
        });
        return merged;
      });

      if (pendingResumeRef.current) {
        LOG.buffer('Buffer ready — auto-resuming playback');
        setIsBuffering(false);
        pendingResumeRef.current();
        pendingResumeRef.current = null;
      }
    } catch (err) {
      LOG.error('fetchChunk failed', { offset, error: err.message });
      setError(err.message);
    } finally {
      isFetchingRef.current = false;
    }
  }, []); // intentionally empty — uses only refs

  // ─── checkAndPrefetch ───────────────────────────────────────────────────
  const checkAndPrefetch = useCallback((currentIndex, onResume) => {
    const loaded = loadedUpToRef.current;
    const total  = totalCountRef.current;

    if (currentIndex >= loaded && loaded < total) {
      LOG.buffer(`UNDERRUN — pausing`, { currentIndex, loaded, total });
      pendingResumeRef.current = onResume;
      setIsBuffering(true);
      fetchChunk(loaded);
      return true; // caller must pause
    }

    if (loaded < total && currentIndex >= loaded - PREFETCH_THRESHOLD && !isFetchingRef.current) {
      LOG.buffer(`Pre-fetch triggered`, { currentIndex, loaded, remaining: loaded - currentIndex });
      fetchChunk(loaded);
    }

    return false;
  }, [fetchChunk]);

  // ─── seekTo ─────────────────────────────────────────────────────────────
  const seekTo = useCallback(async (targetIndex) => {
    const loaded = loadedUpToRef.current;
    LOG.seek(`seekTo`, { targetIndex, loaded });

    if (targetIndex < loaded) {
      LOG.seek('Target already in buffer — no fetch needed');
      return;
    }

    const chunkStart = Math.floor(targetIndex / CHUNK_SIZE) * CHUNK_SIZE;
    LOG.seek(`Seeking beyond buffer`, { targetIndex, chunkStart });

    setPositions((prev) => prev.slice(0, chunkStart));
    loadedUpToRef.current = chunkStart;
    setIsBuffering(true);
    await fetchChunk(chunkStart);
    setIsBuffering(false);
  }, [fetchChunk]);

  // ─── initSession ────────────────────────────────────────────────────────
  const initSession = useCallback(async (deviceId, from, to) => {
    LOG.session('initSession called', { deviceId, from, to });
    reset();
    setLoadingSession(true);
    setError(null);

    try {
      console.time('[SESSION] POST');
      const response = await fetch('/api/replay/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, from, to }),
      });
      console.timeEnd('[SESSION] POST');

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      LOG.session('Session response from server', data);

      // Handle different possible response shapes from server
      const sessionId = data.sessionId ?? data.id ?? data.session_id;
      const count     = data.totalCount ?? data.total ?? data.count ?? data.size ?? 0;

      if (!sessionId) {
        throw new Error(`Session response missing sessionId/id. Full response: ${JSON.stringify(data)}`);
      }

      sessionIdRef.current  = sessionId;
      totalCountRef.current = count;
      setTotalCount(count);

      LOG.session(`Session ready`, { sessionId, totalCount: count });

      if (count === 0) {
        LOG.warn('Server returned totalCount=0 — no positions in this date range');
        return false;
      }

      await fetchChunk(0);

      LOG.session('First chunk loaded, playback ready', {
        sessionId,
        totalCount: count,
        loadedSoFar: loadedUpToRef.current,
      });

      return true;
    } catch (err) {
      LOG.error('initSession failed', err.message);
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