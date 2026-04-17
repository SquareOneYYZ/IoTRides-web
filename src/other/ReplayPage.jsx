import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  IconButton, Paper, Slider, Toolbar, Typography, Box, Chip,
  Tooltip, CircularProgress,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import { formatTime } from '../common/util/formatter';
import ReportFilter from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import MapScale from '../map/MapScale';
import useChunkedReplay from '../reports/components/useChunkedReplay';

const SPEED_OPTIONS = [1, 1.5, 2, 5, 10];

// ─── Logger (same colour scheme as hook) ──────────────────────────────────
const LOG = {
  play:   (msg, data) => console.log(`%c[PLAY]    ${msg}`, 'color:#10b981;font-weight:bold', data ?? ''),
  slider: (msg, data) => console.log(`%c[SLIDER]  ${msg}`, 'color:#f97316;font-weight:bold', data ?? ''),
  interp: (msg, data) => console.log(`%c[INTERP]  ${msg}`, 'color:#a78bfa;font-weight:bold', data ?? ''),
  map:    (msg, data) => console.log(`%c[MAP]     ${msg}`, 'color:#34d399;font-weight:bold', data ?? ''),
  warn:   (msg, data) => console.warn(`[WARN]    ${msg}`, data ?? ''),
  error:  (msg, data) => console.error(`[ERROR]   ${msg}`, data ?? ''),
};

const useStyles = makeStyles((theme) => ({
  root: { height: '100%' },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    maxWidth: '90vw',
    transition: 'width 0.3s ease',
    '&.expanded': { width: 600 },
    [theme.breakpoints.down('md')]: {
      width: 'calc(100% - 16px)',
      maxWidth: 'calc(100% - 16px)',
      margin: theme.spacing(1),
      left: 0,
      right: 0,
    },
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      maxWidth: '100%',
      margin: 0,
      left: 0,
      right: 0,
    },
  },
  title: { flexGrow: 1 },
  slider: { width: '100%' },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedControl: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  speedChips: {
    display: 'flex',
    gap: theme.spacing(0.75),
    flexWrap: 'wrap',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(2),
      margin: theme.spacing(1.5),
    },
  },
  bufferIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
}));

const ReplayPage = () => {
  const t = useTranslation();
  const classes = useStyles();
  const navigate = useNavigate();
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const {
    positions,
    totalCount,
    isBuffering,
    loadingSession,
    error,
    initSession,
    checkAndPrefetch,
    seekTo,
  } = useChunkedReplay();

  const [index, setIndex]               = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [showCard, setShowCard]         = useState(false);
  const [from, setFrom]                 = useState();
  const [to, setTo]                     = useState();
  const [expanded, setExpanded]         = useState(true);
  const [playing, setPlaying]           = useState(false);
  const [smoothPosition, setSmoothPosition] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [speed, setSpeed]               = useState(1);
  const [titleExpanded, setTitleExpanded] = useState(false);

  // CRITICAL: use refs so the interval callback always sees latest values
  // without needing to re-register the interval on every state change.
  const indexRef        = useRef(0);
  const playingRef      = useRef(false);
  const positionsRef    = useRef([]);
  const speedRef        = useRef(1);
  const timerRef        = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) return device.name;
    }
    return null;
  });

  // ─── Log whenever positions array changes ───────────────────────────────
  useEffect(() => {
    if (positions.length > 0) {
      LOG.map('positions array updated', {
        length: positions.length,
        totalCount,
        firstPos: positions[0],
        lastPos: positions[positions.length - 1],
      });
    }
  }, [positions.length]);

  // ─── Log smoothPosition updates (fires ~60fps during playback) ──────────
  // Uncomment below if you want to verify interpolation is working:
  // useEffect(() => {
  //   if (smoothPosition) LOG.interp('smoothPosition updated', smoothPosition);
  // }, [smoothPosition]);

  // ─── Playback interval ──────────────────────────────────────────────────
  // BUG FIX: The previous implementation re-created the interval on every
  // render because it captured positions/index as state directly.
  // We now use refs so the interval is created ONCE when playing starts.
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        LOG.play('Playback stopped — interval cleared');
      }
      return;
    }

    LOG.play('Playback started', { speed, index, positionsLoaded: positions.length, totalCount });

    timerRef.current = setInterval(() => {
      setAnimationProgress((progress) => {
        const newProgress = progress + 0.02 * speedRef.current;
        if (newProgress >= 1) {
          const currentIdx = indexRef.current;
          const pos = positionsRef.current;
          const nextIndex = currentIdx + 1;

          // Check for end of all known data
          if (nextIndex >= pos.length) {
            LOG.play('Reached end of loaded positions', { nextIndex, loaded: pos.length, totalCount });
            // Check buffer / pre-fetch
            const shouldPause = checkAndPrefetch(nextIndex, () => {
              LOG.play('Auto-resuming after buffer refill');
              setPlaying(true);
            });
            if (shouldPause) {
              LOG.play('Paused — waiting for next chunk');
              setPlaying(false);
              return 0;
            }
            // Truly at the end
            setPlaying(false);
            return 0;
          }

          checkAndPrefetch(nextIndex, () => {
            LOG.play('Auto-resuming after buffer refill');
            setPlaying(true);
          });

          LOG.play(`Tick → index ${currentIdx} → ${nextIndex}`, {
            fixTime: pos[nextIndex]?.fixTime,
            lat: pos[nextIndex]?.latitude,
            lng: pos[nextIndex]?.longitude,
          });

          setIndex(nextIndex);
          indexRef.current = nextIndex;
          return 0;
        }
        return newProgress;
      });
    }, 16);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // Only re-run when playing actually toggles — refs handle the rest
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Smooth interpolation ───────────────────────────────────────────────
  useEffect(() => {
    if (positions.length === 0) return;

    const clampedIndex = Math.min(index, positions.length - 1);

    if (clampedIndex < positions.length - 1) {
      const currentPos = positions[clampedIndex];
      const nextPos    = positions[clampedIndex + 1];
      if (currentPos && nextPos) {
        const interpolated = {
          ...currentPos,
          latitude:  currentPos.latitude  + (nextPos.latitude  - currentPos.latitude)  * animationProgress,
          longitude: currentPos.longitude + (nextPos.longitude - currentPos.longitude) * animationProgress,
          speed:     currentPos.speed     + (nextPos.speed     - currentPos.speed)     * animationProgress,
          course:    currentPos.course    + (nextPos.course    - currentPos.course)    * animationProgress,
        };
        setSmoothPosition(interpolated);
      }
    } else {
      setSmoothPosition(positions[clampedIndex]);
    }
  }, [positions, index, animationProgress]);

  // ─── Callbacks ──────────────────────────────────────────────────────────
  const onPointClick = useCallback((_, idx) => {
    LOG.slider(`Route point clicked`, { idx });
    setIndex(idx);
    indexRef.current = idx;
    setAnimationProgress(0);
    setPlaying(false);
  }, []);

  const onMarkerClick = useCallback((positionId) => {
    setShowCard(!!positionId);
  }, []);

  const handleSliderChange = useCallback(async (_, newIndex) => {
    LOG.slider(`Slider moved`, { newIndex, currentlyLoaded: positions.length, totalCount });
    setPlaying(false);
    setAnimationProgress(0);

    if (newIndex >= positions.length) {
      LOG.slider('Seeking beyond loaded range — fetching chunk on demand');
      await seekTo(newIndex);
    }

    setIndex(newIndex);
    indexRef.current = newIndex;
  }, [positions.length, seekTo, totalCount]);

  // ─── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCatch(async ({ deviceId, from: f, to: t2 }) => {
    console.log('%c[ReplayPage] handleSubmit called', 'color:#0ea5e9;font-weight:bold', { deviceId, from: f, to: t2 });
    setSelectedDeviceId(deviceId);
    setFrom(f);
    setTo(t2);
    setIndex(0);
    indexRef.current = 0;
    setPlaying(false);
    setSmoothPosition(null);

    const ok = await initSession(deviceId, f, t2);
    console.log('%c[ReplayPage] initSession result:', 'color:#0ea5e9;font-weight:bold', ok ? 'SUCCESS' : 'FAILED');
    if (ok) setExpanded(false);
  });

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  const handlePlayPause = () => {
    const next = !playing;
    LOG.play(`User clicked ${next ? 'Play' : 'Pause'}`, {
      index,
      positionsLoaded: positions.length,
      totalCount,
      isBuffering,
    });
    setPlaying(next);
  };

  // ─── Derived ────────────────────────────────────────────────────────────
  const displayIndex  = Math.min(index, Math.max(0, positions.length - 1));
  const currentPos    = positions[displayIndex];
  const knownTotal    = totalCount > 0 ? totalCount : positions.length;
  const atEnd         = displayIndex >= knownTotal - 1;

  return (
    <div className={classes.root}>
      <MapView>
        <MapGeofence />
        <MapRoutePath positions={positions} onClick={onPointClick} expandPointsOnClick />
        <MapRoutePoints positions={positions} onClick={onPointClick} useGlobalExpansion />
        {smoothPosition && (
          <MapPositions
            positions={[smoothPosition]}
            onClick={onMarkerClick}
            titleField="fixTime"
          />
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={positions} />

      <div className={`${classes.sidebar} ${titleExpanded ? 'expanded' : ''}`}>
        <Paper elevation={3} square>
          <Toolbar sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 'unset', paddingTop: 1, paddingBottom: 1 }}>
            <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
            <Tooltip title={`${t('reportReplay')}${deviceName ? ` - ${deviceName}` : ''}`} arrow placement="bottom">
              <Typography
                variant="subtitle1"
                onClick={() => setTitleExpanded((prev) => !prev)}
                noWrap={!titleExpanded}
                sx={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: titleExpanded ? 'unset' : 'ellipsis',
                  whiteSpace: titleExpanded ? 'normal' : 'nowrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flexGrow: 1,
                }}
              >
                {t('reportReplay')}
                {deviceName ? ` - ${deviceName}` : ''}
              </Typography>
            </Tooltip>
            {!expanded && (
              <>
                <IconButton onClick={handleDownload}><DownloadIcon /></IconButton>
                <IconButton edge="end" onClick={() => setExpanded(true)}><TuneIcon /></IconButton>
              </>
            )}
          </Toolbar>
        </Paper>

        <Paper className={classes.content} square>
          {!expanded ? (
            <>
              {isBuffering && (
                <Box className={classes.bufferIndicator}>
                  <CircularProgress size={14} />
                  <Typography variant="caption">Buffering…</Typography>
                </Box>
              )}
              {error && (
                <Typography variant="caption" color="error" align="center" sx={{ mb: 1 }}>
                  {error}
                </Typography>
              )}

              <Box className={classes.speedControl}>
                <Box className={classes.speedChips}>
                  {SPEED_OPTIONS.map((opt) => (
                    <Chip
                      key={opt}
                      label={`${opt}x`}
                      onClick={() => { LOG.play(`Speed changed to ${opt}x`); setSpeed(opt); speedRef.current = opt; }}
                      color={speed === opt ? 'primary' : 'default'}
                      variant={speed === opt ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ minWidth: 48 }}
                    />
                  ))}
                </Box>
              </Box>

              <Slider
                className={classes.slider}
                max={knownTotal > 1 ? knownTotal - 1 : 0}
                step={1}
                marks={positions.length < 500 ? positions.map((_, i) => ({ value: i })) : false}
                value={displayIndex}
                onChange={handleSliderChange}
                disabled={loadingSession || positions.length === 0}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -10, marginBottom: 8 }}>
                <Typography variant="caption" color="text.secondary">
                  {positions[0] ? formatTime(positions[0].fixTime, 'seconds') : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {`${positions.length}${totalCount > positions.length ? `/${totalCount}` : ''} pts`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {positions[positions.length - 1] ? formatTime(positions[positions.length - 1].fixTime, 'seconds') : ''}
                </Typography>
              </div>

              <div className={classes.controls}>
                <span>{`${displayIndex + 1}/${knownTotal}`}</span>
                <IconButton
                  onClick={() => {
                    const ni = Math.max(0, index - 1);
                    LOG.slider('Step back', { from: index, to: ni });
                    setIndex(ni);
                    indexRef.current = ni;
                    setAnimationProgress(0);
                    setPlaying(false);
                  }}
                  disabled={playing || isBuffering || displayIndex <= 0}
                >
                  <FastRewindIcon />
                </IconButton>
                <IconButton
                  onClick={handlePlayPause}
                  disabled={isBuffering || atEnd || positions.length === 0}
                >
                  {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton
                  onClick={() => {
                    const ni = Math.min(positions.length - 1, index + 1);
                    LOG.slider('Step forward', { from: index, to: ni });
                    setIndex(ni);
                    indexRef.current = ni;
                    setAnimationProgress(0);
                    setPlaying(false);
                  }}
                  disabled={playing || isBuffering || displayIndex >= positions.length - 1}
                >
                  <FastForwardIcon />
                </IconButton>
                <span>
                  {currentPos ? formatTime(currentPos.fixTime, 'seconds') : '—'}
                </span>
              </div>
            </>
          ) : (
            <ReportFilter
              handleSubmit={handleSubmit}
              fullScreen
              showOnly
              loading={loadingSession}
            />
          )}
        </Paper>
      </div>

      {showCard && currentPos && (
        <StatusCard
          deviceId={selectedDeviceId}
          position={currentPos}
          onClose={() => setShowCard(false)}
          disableActions
        />
      )}
    </div>
  );
};

export default ReplayPage;