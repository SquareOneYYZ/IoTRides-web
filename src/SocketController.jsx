import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Snackbar } from '@mui/material';
import { devicesActions, sessionActions } from './store';
import { useEffectAsync } from './reactHelper';
import { useTranslation } from './common/components/LocalizationProvider';
import { snackBarDurationLongMs } from './common/util/duration';
import alarm from './resources/alarm.mp3';
import { eventsActions } from './store/events';
import useFeatures from './common/util/useFeatures';
import { useAttributePreference } from './common/util/preferences';

const logoutCode = 4000;

// If server sends this many positions at once, it's the initial dump
// Dispatch immediately instead of waiting for debounce timer
const INITIAL_DUMP_THRESHOLD = 500;

// Debounce time for small live updates (ms)
const LIVE_UPDATE_DEBOUNCE = 300;

const SocketController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const authenticated = useSelector((state) => !!state.session.user);
  const devices = useSelector((state) => state.devices.items);
  const includeLogs = useSelector((state) => state.session.includeLogs);

  const socketRef = useRef();
  const positionBuffer = useRef([]);
  const batchTimeout = useRef(null);

  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const soundEvents = useAttributePreference('soundEvents', '');
  const soundAlarms = useAttributePreference('soundAlarms', 'sos');

  const features = useFeatures();

  const flushPositionBuffer = () => {
    if (positionBuffer.current.length > 0) {
      dispatch(sessionActions.updatePositions(positionBuffer.current));
      positionBuffer.current = [];
    }
    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
      batchTimeout.current = null;
    }
  };

  const connectSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/socket`);
    socketRef.current = socket;

    socket.onopen = () => {
      dispatch(sessionActions.updateSocket(true));
    };

    socket.onclose = async (event) => {
      dispatch(sessionActions.updateSocket(false));

      // Clear the timer and discard stale buffered positions
      // Do NOT dispatch them — they're outdated, fetch below gets fresh data
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
        batchTimeout.current = null;
      }
      positionBuffer.current = []; // discard stale buffer, don't dispatch

      if (event.code !== logoutCode) {
        try {
          const devicesResponse = await fetch('/api/devices');
          if (devicesResponse.ok) {
            dispatch(devicesActions.update(await devicesResponse.json()));
          }
          const positionsResponse = await fetch('/api/positions');
          if (positionsResponse.ok) {
            // This is the single source of truth on reconnect
            dispatch(sessionActions.updatePositions(await positionsResponse.json()));
          }
          if (devicesResponse.status === 401 || positionsResponse.status === 401) {
            navigate('/login');
          }
        } catch (error) {
          // ignore errors
        }
        setTimeout(() => connectSocket(), 60000);
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.devices) {
        dispatch(devicesActions.update(data.devices));
      }

      if (data.positions) {
        positionBuffer.current.push(...data.positions);

        // Cancel any pending debounce timer
        if (batchTimeout.current) {
          clearTimeout(batchTimeout.current);
          batchTimeout.current = null;
        }

        // Large batch = initial server dump (all devices at once)
        // Dispatch immediately — no point waiting, the data is already here
        if (positionBuffer.current.length >= INITIAL_DUMP_THRESHOLD) {
          flushPositionBuffer();
          return;
        }

        // Small batch = live update from a few devices
        // Debounce to group rapid consecutive updates together
        batchTimeout.current = setTimeout(() => {
          flushPositionBuffer();
        }, LIVE_UPDATE_DEBOUNCE);
      }

      if (data.events) {
        if (!features.disableEvents) {
          dispatch(eventsActions.add(data.events));
        }
        setEvents(data.events);
      }

      if (data.logs) {
        dispatch(sessionActions.updateLogs(data.logs));
      }
    };
  };

  useEffect(() => {
    socketRef.current?.send(JSON.stringify({ logs: includeLogs }));
  }, [socketRef, includeLogs]);

  useEffectAsync(async () => {
    if (authenticated) {
      const response = await fetch('/api/devices');
      if (response.ok) {
        dispatch(devicesActions.refresh(await response.json()));
      } else {
        throw Error(await response.text());
      }
      connectSocket();
      return () => {
        const socket = socketRef.current;
        if (socket) {
          socket.close(logoutCode);
        }
        if (batchTimeout.current) {
          clearTimeout(batchTimeout.current);
        }
      };
    }
    return null;
  }, [authenticated]);

  useEffect(() => {
    setNotifications(events.map((event) => ({
      id: event.id,
      message: event.attributes.message,
      show: true,
    })));
  }, [events, devices, t]);

  useEffect(() => {
    events.forEach((event) => {
      if (soundEvents.includes(event.type) || (event.type === 'alarm' && soundAlarms.includes(event.attributes.alarm))) {
        new Audio(alarm).play();
      }
    });
  }, [events, soundEvents, soundAlarms]);

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={notification.show}
          message={notification.message}
          autoHideDuration={snackBarDurationLongMs}
          onClose={() => setEvents(events.filter((e) => e.id !== notification.id))}
        />
      ))}
    </>
  );
};

export default connect()(SocketController);
