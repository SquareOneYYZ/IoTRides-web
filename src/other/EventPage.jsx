import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  Typography,
  AppBar,
  Toolbar,
  Tooltip,
  IconButton,
  Paper,
  Slider,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffectAsync, useCatch } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import MapView from '../map/core/MapView';
import MapCamera from '../map/MapCamera';
import MapPositions from '../map/MapPositions';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import { formatNotificationTitle, formatTime } from '../common/util/formatter';
import MapScale from '../map/MapScale';
import MapRoutePath from '../map/MapRoutePath';
import MapMarkers from '../map/MapMarkers';
import MapRoutePoints from '../map/MapRoutePoints';

const REPLAY_INTERVAL = 500;
const REPLAY_TIME_WINDOW = 60 * 60 * 1000;

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    zIndex: 1,
  },
  mapContainer: {
    flexGrow: 1,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: 0,
    },
  },
  title: {
    flexGrow: 1,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      margin: theme.spacing(1),
    },
    [theme.breakpoints.up('md')]: {
      marginTop: theme.spacing(1),
    },
  },
}));

const findClosestPositionIndex = (positions, eventTime) => {
  if (!positions?.length) return 0;

  const eventTimestamp = new Date(eventTime).getTime();
  let closestIndex = 0;
  let minDiff = Math.abs(
    new Date(positions[0].fixTime).getTime() - eventTimestamp,
  );

  for (let i = 1; i < positions.length; i += 1) {
    const diff = Math.abs(
      new Date(positions[i].fixTime).getTime() - eventTimestamp,
    );
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
};

const EventPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const { id } = useParams();
  const timerRef = useRef();

  const [event, setEvent] = useState();
  const [position, setPosition] = useState();
  const [device, setDevice] = useState(null);
  const [showCard, setShowCard] = useState(false);

  const [replayMode, setReplayMode] = useState(false);
  const [replayPositions, setReplayPositions] = useState([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [eventPosition, setEventPosition] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const replayMarkers = useMemo(() => {
    const markers = [];

    if (replayPositions.length > 0) {
      markers.push({
        latitude: replayPositions[0].latitude,
        longitude: replayPositions[0].longitude,
        image: 'start-success',
      });
    }

    if (replayPositions.length > 1) {
      markers.push({
        latitude: replayPositions[replayPositions.length - 1].latitude,
        longitude: replayPositions[replayPositions.length - 1].longitude,
        image: 'finish-error',
      });
    }

    return markers;
  }, [replayPositions]);

  const formatType = useCallback(
    (event) => formatNotificationTitle(t, {
      type: event.type,
      attributes: {
        alarms: event.attributes.alarm,
      },
    }),
    [t],
  );

  const onMarkerClick = useCallback((positionId) => {
    setShowCard(true);
  }, []);

  const onPointClick = useCallback((_, index) => {
    setReplayIndex(index);
    setReplayPlaying(false);
    setShowCard(true);
  }, []);

  const onPointHover = useCallback((_, index) => {
    setHoveredIndex(index);
  }, []);

  const onPointLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  useEffect(() => {
    if (replayPlaying && replayPositions.length > 0) {
      timerRef.current = setInterval(() => {
        setReplayIndex((i) => {
          if (i >= replayPositions.length - 2) {
            setReplayPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, REPLAY_INTERVAL);
    }
    return () => clearInterval(timerRef.current);
  }, [replayPlaying, replayPositions.length]);

  useEffectAsync(async () => {
    if (id) {
      const response = await fetch(`/api/events/${id}`);
      if (response.ok) {
        setEvent(await response.json());
      } else {
        throw Error(await response.text());
      }
    }
  }, [id]);

  useEffectAsync(async () => {
    if (event?.positionId) {
      const response = await fetch(`/api/positions?id=${event.positionId}`);
      if (response.ok) {
        const positions = await response.json();
        setPosition(positions[0] || null);
      } else {
        throw Error(await response.text());
      }
    }
  }, [event]);

  useEffectAsync(async () => {
    if (event?.deviceId) {
      const response = await fetch(`/api/devices/${event.deviceId}`);
      if (response.ok) {
        setDevice(await response.json());
      }
    }
  }, [event]);

  const handleReplayStart = useCatch(async () => {
    if (!event) return;

    setReplayMode(true);

    const eventTime = new Date(event.eventTime);
    const query = new URLSearchParams({
      deviceId: event.deviceId,
      from: new Date(eventTime.getTime() - REPLAY_TIME_WINDOW).toISOString(),
      to: new Date(eventTime.getTime() + REPLAY_TIME_WINDOW).toISOString(),
    });

    const [positionsResponse, eventPosResponse] = await Promise.all([
      fetch(`/api/positions?${query.toString()}`),
      fetch(`/api/positions?id=${event.positionId}`),
    ]);

    if (positionsResponse.ok) {
      const positions = await positionsResponse.json();
      setReplayPositions(positions);
      setReplayIndex(findClosestPositionIndex(positions, event.eventTime));

      if (eventPosResponse.ok) {
        const eventPositions = await eventPosResponse.json();
        setEventPosition(eventPositions[0] || null);
      }
    }
  });

  const handleReplayStop = useCallback(() => {
    setReplayMode(false);
    setReplayPositions([]);
    setReplayIndex(0);
    setReplayPlaying(false);
    setEventPosition(null);
    setShowCard(false);
    setHoveredIndex(null);
    clearInterval(timerRef.current);
  }, []);

  if (replayMode) {
    return (
      <div style={{ height: '100%' }}>
        <MapView>
          <MapGeofence />
          <MapRoutePath
            positions={replayPositions}
            onHover={onPointHover}
            onLeave={onPointLeave}
          />
          <MapRoutePoints
            positions={replayPositions}
            onClick={onPointClick}
            showOnHoverOnly
            onHover={onPointHover}
            onLeave={onPointLeave}
            hoveredIndex={hoveredIndex}
          />
          {eventPosition && (
            <MapPositions
              positions={[eventPosition]}
              onClick={onMarkerClick}
              customIcon="event-error"
              titleField="tollName"
            />
          )}
          {replayIndex < replayPositions.length && (
            <MapPositions
              positions={[replayPositions[replayIndex]]}
              onClick={onMarkerClick}
            />
          )}
          <MapMarkers markers={replayMarkers} />
        </MapView>
        <MapScale />
        <MapCamera positions={replayPositions} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            zIndex: 3,
            left: 0,
            top: 0,
            margin: 12,
            width: '94vw',
            maxWidth: 400,
            minWidth: 280,
            boxSizing: 'border-box',
          }}
        >
          <Paper elevation={3} square>
            <Toolbar>
              <Typography variant="h6" style={{ flexGrow: 1 }}>
                {t('reportReplay')}
                {' '}
                -
                {device?.name || ''}
              </Typography>
              <IconButton edge="end" onClick={handleReplayStop}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </Paper>

          <Paper className={classes.content} square>
            <Typography variant="h6" align="center">
              {event && formatType(event)}
            </Typography>

            <Slider
              style={{ width: '100%', margin: '16px 0' }}
              min={0}
              max={replayPositions.length - 1}
              step={null}
              marks={replayPositions.map((_, index) => ({ value: index }))}
              value={replayIndex}
              onChange={(_, newValue) => {
                setReplayIndex(newValue);
                setReplayPlaying(false);
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: -15,
              }}
            >
              <Typography variant="caption">-1hr</Typography>
              <Typography variant="caption">+1hr</Typography>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{`${replayIndex + 1}/${replayPositions.length}`}</span>
              <IconButton
                onClick={() => setReplayIndex((i) => Math.max(0, i - 1))}
                disabled={replayPlaying || replayIndex <= 0}
              >
                <FastRewindIcon />
              </IconButton>

              <IconButton
                onClick={() => setReplayPlaying(!replayPlaying)}
                disabled={replayIndex >= replayPositions.length - 1}
              >
                {replayPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>

              <IconButton
                onClick={() => setReplayIndex((i) => Math.min(replayPositions.length - 1, i + 1))}
                disabled={
                  replayPlaying || replayIndex >= replayPositions.length - 1
                }
              >
                <FastForwardIcon />
              </IconButton>

              <span>
                {replayIndex < replayPositions.length
                  ? formatTime(replayPositions[replayIndex].fixTime, 'seconds')
                  : ''}
              </span>
            </div>
          </Paper>
        </div>

        {showCard && replayIndex < replayPositions.length && (
          <StatusCard
            deviceId={event.deviceId}
            position={replayPositions[replayIndex]}
            onClose={() => setShowCard(false)}
            disableActions
          />
        )}
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <AppBar color="inherit" position="static" className={classes.toolbar}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2 }}
            onClick={() => navigate('/')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">{event && formatType(event)}</Typography>
          {event && (
            <Tooltip title="Start replay">
              <IconButton onClick={handleReplayStart}>
                <ReplayIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>
      <div className={classes.mapContainer}>
        <MapView>
          <MapGeofence />
          {position && (
            <MapPositions
              positions={[position]}
              onClick={onMarkerClick}
              titleField="fixTime"
            />
          )}
        </MapView>
        <MapScale />
        {position && (
          <MapCamera
            latitude={position.latitude}
            longitude={position.longitude}
          />
        )}
        {position && showCard && (
          <StatusCard
            deviceId={position.deviceId}
            position={position}
            onClose={() => setShowCard(false)}
            disableActions
          />
        )}
      </div>
    </div>
  );
};

export default EventPage;
