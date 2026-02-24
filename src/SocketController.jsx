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

// Kitni positions ek saath aayi to initial bulk dump samjha jaye
const INITIAL_DUMP_THRESHOLD = 100;

// Live updates ko group karne ka debounce time
const LIVE_UPDATE_DEBOUNCE = 500;

const SocketController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const authenticated = useSelector((state) => !!state.session.user);
  const devices = useSelector((state) => state.devices.items);
  const includeLogs = useSelector((state) => state.session.includeLogs);

  const socketRef = useRef();
  const batchTimeout = useRef(null);

  // KEY CHANGE: Array ki jagah Map use karo
  // Map mein same deviceId ka naya update purana overwrite karta hai
  // Iska matlab: 1 second mein 10 updates aaye ek device ke → sirf 1 process hoga
  const updateBuffer = useRef(new Map()); // deviceId → latest position

  // Track karo ki initial bulk dump ho gaya ya nahi
  const initialLoadDone = useRef(false);

  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const soundEvents = useAttributePreference('soundEvents', '');
  const soundAlarms = useAttributePreference('soundAlarms', 'sos');

  const features = useFeatures();

  const flushUpdateBuffer = () => {
    if (updateBuffer.current.size === 0) return;
    const positions = Array.from(updateBuffer.current.values());
    updateBuffer.current.clear();
    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
      batchTimeout.current = null;
    }
    dispatch(sessionActions.updatePositions(positions));
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
      initialLoadDone.current = false; // Reset — reconnect pe fresh load

      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
        batchTimeout.current = null;
      }
      updateBuffer.current.clear(); // Stale data discard karo

      if (event.code !== logoutCode) {
        try {
          const devicesResponse = await fetch('/api/devices');
          if (devicesResponse.ok) {
            dispatch(devicesActions.update(await devicesResponse.json()));
          }
          const positionsResponse = await fetch('/api/positions');
          if (positionsResponse.ok) {
            // Reconnect pe fresh full data — yahi single source of truth hai
            dispatch(sessionActions.updatePositions(await positionsResponse.json()));
            initialLoadDone.current = true;
          }
          if (devicesResponse.status === 401 || positionsResponse.status === 401) {
            navigate('/login');
          }
        } catch (error) {
          // ignore
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
        if (!initialLoadDone.current) {
          // ── PATH 1: INITIAL BULK DUMP ──────────────────────────────────
          // Server login ke baad saari positions ek saath bhejta hai
          // Yeh poora array seedha dispatch karo — no batching, no waiting
          // Kyunki data already complete hai
          if (data.positions.length >= INITIAL_DUMP_THRESHOLD) {
            // Ek baar mein saari positions dispatch
            if (batchTimeout.current) {
              clearTimeout(batchTimeout.current);
              batchTimeout.current = null;
            }
            updateBuffer.current.clear();
            dispatch(sessionActions.updatePositions(data.positions));
            initialLoadDone.current = true;
          } else {
            // Chhote chhote pieces mein aa raha hai — collect karke dispatch
            data.positions.forEach((p) => updateBuffer.current.set(p.deviceId, p));
            if (batchTimeout.current) clearTimeout(batchTimeout.current);
            batchTimeout.current = setTimeout(() => {
              const positions = Array.from(updateBuffer.current.values());
              updateBuffer.current.clear();
              dispatch(sessionActions.updatePositions(positions));
              initialLoadDone.current = true;
              batchTimeout.current = null;
            }, 300);
          }
        } else {
          // ── PATH 2: LIVE UPDATES ───────────────────────────────────────
          // Yahan sirf woh devices aate hain jinki position change hui
          // Map use karo: same deviceId ka naya update purana overwrite karega
          // Example: Device A ne 500ms mein 5 updates bheje
          //   Array: 5 entries → 5x processing (BURA)
          //   Map:   1 entry (sirf latest) → 1x processing (ACCHA) ✅
          data.positions.forEach((p) => updateBuffer.current.set(p.deviceId, p));

          if (batchTimeout.current) clearTimeout(batchTimeout.current);
          batchTimeout.current = setTimeout(flushUpdateBuffer, LIVE_UPDATE_DEBOUNCE);
        }
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
        if (socket) socket.close(logoutCode);
        if (batchTimeout.current) clearTimeout(batchTimeout.current);
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
