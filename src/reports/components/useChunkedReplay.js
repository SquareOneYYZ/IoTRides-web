import { useState, useRef, useCallback } from 'react';

const BASE_URL = 'http://localhost:8082';
export const CHUNK_SIZE = 500;
const LONG_RANGE_HOURS = 24;
const PREFETCH_THRESHOLD = 100;
const LS_KEY = 'replay_session';

export const LOG = {
  mode:     (msg, d) => console.log(`%c[MODE]     ${msg}`, 'color:#06b6d4;font-weight:bold', d ?? ''),
  session:  (msg, d) => console.log(`%c[SESSION]  ${msg}`, 'color:#0ea5e9;font-weight:bold', d ?? ''),
  overview: (msg, d) => console.log(`%c[OVERVIEW] ${msg}`, 'color:#8b5cf6;font-weight:bold', d ?? ''),
  chunk:    (msg, d) => console.log(`%c[CHUNK]    ${msg}`, 'color:#a855f7;font-weight:bold', d ?? ''),
  buffer:   (msg, d) => console.log(`%c[BUFFER]   ${msg}`, 'color:#f59e0b;font-weight:bold', d ?? ''),
  play:     (msg, d) => console.log(`%c[PLAY]     ${msg}`, 'color:#10b981;font-weight:bold', d ?? ''),
  slider:   (msg, d) => console.log(`%c[SLIDER]   ${msg}`, 'color:#f97316;font-weight:bold', d ?? ''),
  old:      (msg, d) => console.log(`%c[OLD-API]  ${msg}`, 'color:#64748b;font-weight:bold', d ?? ''),
  warn:     (msg, d) => console.warn(`[WARN]     ${msg}`, d ?? ''),
  error:    (msg, d) => console.error(`[ERROR]    ${msg}`, d ?? ''),
};

export const isLongRange = (from, to) => {
  if (!from || !to) return false;
  const diffHours = (new Date(to) - new Date(from)) / (1000 * 60 * 60);
  const long = diffHours > LONG_RANGE_HOURS;
  LOG.mode(`Range = ${diffHours.toFixed(1)}h → ${long ? 'SESSION API' : 'OLD API'}`, { from, to });
  return long;
};

const lsSave = (payload) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...payload, savedAt: new Date().toISOString() }));
    LOG.session('Saved to localStorage', payload);
  } catch (e) {
    LOG.warn('localStorage write failed', e.message);
  }
};

const lsLoad = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    LOG.session('Loaded from localStorage', data);
    return data;
  } catch (e) {
    return null;
  }
};

const lsClear = () => {
  try {
    localStorage.removeItem(LS_KEY);
    LOG.session('Cleared localStorage');
  } catch (e) { /* silent */ }
};

const useReplaySession = () => {
  const [positions, setPositions]               = useState([]);
  const [overviewPositions, setOverviewPositions] = useState([]);
  const [totalCount, setTotalCount]             = useState(0);
  const [isBuffering, setIsBuffering]           = useState(false);
  const [loadingSession, setLoadingSession]     = useState(false);
  const [loadingOverview, setLoadingOverview]   = useState(false);
  const [error, setError]                       = useState(null);
  const [isLongRangeMode, setIsLongRangeMode]   = useState(false);

  const sessionIdRef     = useRef(null);
  const loadedUpToRef    = useRef(0);
  const totalCountRef    = useRef(0);
  const isFetchingRef    = useRef(false);
  const pendingResumeRef = useRef(null);

  const reset = useCallback(() => {
    LOG.session('Reset');
    sessionIdRef.current     = null;
    loadedUpToRef.current    = 0;
    totalCountRef.current    = 0;
    isFetchingRef.current    = false;
    pendingResumeRef.current = null;
    lsClear();
    setPositions([]);
    setOverviewPositions([]);
    setTotalCount(0);
    setIsBuffering(false);
    setError(null);
    setIsLongRangeMode(false);
  }, []);

  const fetchChunk = useCallback(async (offset, mode = 'append') => {
    if (!sessionIdRef.current) {
      LOG.warn('fetchChunk: no sessionId', { offset });
      return null;
    }
    if (isFetchingRef.current) {
      LOG.warn('fetchChunk: already fetching', { offset });
      return null;
    }
    if (totalCountRef.current > 0 && offset >= totalCountRef.current) {
      LOG.chunk(`offset ${offset} >= totalCount ${totalCountRef.current} — done`);
      return null;
    }

    isFetchingRef.current = true;
    const url = `/api/replay/session/${sessionIdRef.current}/chunk?offset=${offset}&limit=${CHUNK_SIZE}`;
    LOG.chunk(`Fetching [${mode}]`, { offset, url });
    console.time(`[CHUNK] offset=${offset}`);

    try {
      const res = await fetch(url);
      console.timeEnd(`[CHUNK] offset=${offset}`);

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const chunk = await res.json();

      if (!chunk || chunk.length === 0) {
        LOG.chunk('Empty chunk — end of data');
        return [];
      }

      LOG.chunk('Received', {
        offset,
        count:        chunk.length,
        firstFixTime: chunk[0]?.fixTime,
        lastFixTime:  chunk[chunk.length - 1]?.fixTime,
      });

      if (mode === 'replace') {
        setPositions(chunk);
        loadedUpToRef.current = chunk.length;
        LOG.buffer('Buffer replaced', { length: chunk.length });
      } else {
        setPositions((prev) => {
          const merged = [...prev, ...chunk];
          loadedUpToRef.current = merged.length;
          LOG.buffer('Buffer appended', {
            before: prev.length,
            after:  merged.length,
            total:  totalCountRef.current,
            pct:    `${((merged.length / (totalCountRef.current || 1)) * 100).toFixed(1)}%`,
          });
          return merged;
        });
      }

      if (pendingResumeRef.current) {
        LOG.buffer('Resuming playback after buffer refill');
        setIsBuffering(false);
        pendingResumeRef.current();
        pendingResumeRef.current = null;
      }

      return chunk;
    } catch (err) {
      LOG.error('fetchChunk failed', { offset, error: err.message });
      setError(err.message);
      return null;
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const fetchOverview = useCallback(async (sessionId) => {
    const url = `/api/replay/session/${sessionId}/overview`;
    LOG.overview('Fetching', { url });
    console.time('[OVERVIEW]');
    setLoadingOverview(true);

    try {
      const res = await fetch(url);
      console.timeEnd('[OVERVIEW]');

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const data = await res.json();
      const pts = Array.isArray(data) ? data : (data.positions ?? data.data ?? []);

      LOG.overview('Received', { points: pts.length });
      setOverviewPositions(pts);
      return pts;
    } catch (err) {
      LOG.error('fetchOverview failed', err.message);
      setOverviewPositions([]);
      return [];
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const checkAndPrefetch = useCallback((currentIndex, onResume) => {
    const loaded = loadedUpToRef.current;
    const total  = totalCountRef.current;

    if (currentIndex >= loaded && loaded < total) {
      LOG.buffer('UNDERRUN — pausing', { currentIndex, loaded, total });
      pendingResumeRef.current = onResume;
      setIsBuffering(true);
      fetchChunk(loaded, 'append');
      return true;
    }

    if (loaded < total && currentIndex >= loaded - PREFETCH_THRESHOLD && !isFetchingRef.current) {
      LOG.buffer('Pre-fetch', { currentIndex, loaded, remaining: loaded - currentIndex });
      fetchChunk(loaded, 'append');
    }

    return false;
  }, [fetchChunk]);

  const sliderSeek = useCallback(async (sliderValue) => {
    LOG.slider('Seek', { sliderValue, total: totalCountRef.current });
    const offset = Math.floor(sliderValue / CHUNK_SIZE) * CHUNK_SIZE;
    LOG.slider('Aligned offset', { sliderValue, offset });
    setIsBuffering(true);
    await fetchChunk(offset, 'replace');
    setIsBuffering(false);
  }, [fetchChunk]);

  const initLongRange = useCallback(async (deviceId, from, to) => {
    LOG.session('initLongRange', { deviceId, from, to });
    setLoadingSession(true);
    setError(null);
    setIsLongRangeMode(true);

    try {
      LOG.session(`POST /api/replay/session`);
      console.time('[SESSION] POST');

      const sessionRes = await fetch(`/api/replay/session`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deviceId, from, to }),
      });
      console.timeEnd('[SESSION] POST');

      if (!sessionRes.ok) {
        throw new Error(`HTTP ${sessionRes.status}: ${await sessionRes.text()}`);
      }

      const data = await sessionRes.json();
      LOG.session('Response', data);

      const sessionId = data.sessionId ?? data.id ?? data.session_id;
      const count     = data.totalCount ?? data.total ?? data.count ?? data.size ?? 0;

      if (!sessionId) {
        throw new Error(`No sessionId in response. Keys: ${Object.keys(data).join(', ')}`);
      }

      sessionIdRef.current  = sessionId;
      totalCountRef.current = count;
      setTotalCount(count);
      lsSave({ sessionId, totalCount: count, deviceId, from, to });

      LOG.session('Session ready', { sessionId, totalCount: count });

      if (count === 0) {
        LOG.warn('totalCount = 0 — no data in range');
        return false;
      }

      fetchOverview(sessionId);
      await fetchChunk(0, 'append');

      LOG.session('initLongRange complete', {
        sessionId,
        totalCount: count,
        loaded: loadedUpToRef.current,
      });

      return true;
    } catch (err) {
      LOG.error('initLongRange failed', err.message);
      setError(err.message);
      lsClear();
      return false;
    } finally {
      setLoadingSession(false);
    }
  }, [fetchOverview, fetchChunk]);

  const initOldApi = useCallback(async (deviceId, from, to) => {
    LOG.old('initOldApi (range <= 24h)', { deviceId, from, to });
    setLoadingSession(true);
    setError(null);
    setIsLongRangeMode(false);
    lsClear();

    try {
      const query = new URLSearchParams({ deviceId, from, to });
      const url   = `/api/positions?${query.toString()}`;
      LOG.old(`GET ${url}`);
      console.time('[OLD-API]');

      const res = await fetch(url);
      console.timeEnd('[OLD-API]');

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const data = await res.json();
      LOG.old('Received', { count: data.length });

      if (!data.length) {
        LOG.warn('0 positions returned');
        return false;
      }

      setPositions(data);
      setTotalCount(data.length);
      totalCountRef.current = data.length;
      loadedUpToRef.current = data.length;

      return true;
    } catch (err) {
      LOG.error('initOldApi failed', err.message);
      setError(err.message);
      return false;
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const init = useCallback(async (deviceId, from, to) => {
    reset();

    const saved = lsLoad();
    const sameQuery = saved
      && saved.sessionId
      && String(saved.deviceId) === String(deviceId)
      && saved.from === from
      && saved.to   === to;

    if (sameQuery) {
      LOG.session('Validating saved session...', { sessionId: saved.sessionId });
      const testUrl = `${BASE_URL}/api/replay/session/${saved.sessionId}/chunk?offset=0&limit=1`;

      try {
        const testRes = await fetch(testUrl);
        if (testRes.ok) {
          LOG.session('Saved session alive — reusing', saved);
          sessionIdRef.current  = saved.sessionId;
          totalCountRef.current = saved.totalCount;
          setTotalCount(saved.totalCount);
          setIsLongRangeMode(true);
          fetchOverview(saved.sessionId);
          await fetchChunk(0, 'append');
          return true;
        }
        LOG.warn(`Saved session expired (${testRes.status}) — creating new`);
        lsClear();
      } catch (e) {
        LOG.warn('Session validation failed — creating new', e.message);
        lsClear();
      }
    }

    if (isLongRange(from, to)) {
      return initLongRange(deviceId, from, to);
    }
    return initOldApi(deviceId, from, to);
  }, [reset, initLongRange, initOldApi, fetchOverview, fetchChunk]);

  const getStoredSession = useCallback(() => lsLoad(), []);

  return {
    positions,
    overviewPositions,
    totalCount,
    isBuffering,
    loadingSession,
    loadingOverview,
    error,
    isLongRangeMode,
    init,
    sliderSeek,
    checkAndPrefetch,
    reset,
    getStoredSession,
  };
};

export default useReplaySession;
