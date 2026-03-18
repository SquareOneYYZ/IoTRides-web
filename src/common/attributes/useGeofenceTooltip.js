import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import { useSelector } from 'react-redux';

const useGeofenceTooltip = (map, layerId = 'geofences-fill') => {
  const devices = useSelector((state) => state.devices.items);

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    geofenceName: '',
    entries: null,
    exits: null,
    lastVehicle: null,
    loading: false,
  });

  const cache = useRef({});
  const hoveredId = useRef(null);

  const getTodayRange = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    return { from, to };
  };

  const fetchActivity = useCallback(async (geofenceId) => {
    if (cache.current[geofenceId]) {
      return cache.current[geofenceId];
    }

    const { from, to } = getTodayRange();

    const params = new URLSearchParams({
      from,
      to,
      geofenceId,
    });
    params.append('type', 'geofenceEnter');
    params.append('type', 'geofenceExit');

    const response = await fetch(`/api/reports/events?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const events = await response.json();

    const entries = events.filter((e) => e.type === 'geofenceEnter').length;
    const exits = events.filter((e) => e.type === 'geofenceExit').length;

    const sorted = [...events].sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
    const lastDeviceId = sorted[0]?.deviceId ?? null;

    const result = { entries, exits, lastDeviceId };
    cache.current[geofenceId] = result;
    return result;
  }, []);

  useEffect(() => {
    if (!map) return;

    const handleMouseMove = async (e) => {
      const feature = e.features?.[0];
      if (!feature) return;

      const { id: geofenceId, name: geofenceName } = feature.properties;

      const x = e.originalEvent.clientX;
      const y = e.originalEvent.clientY;

      if (hoveredId.current === geofenceId) {
        setTooltip((prev) => ({ ...prev, x, y }));
        return;
      }

      hoveredId.current = geofenceId;
      map.getCanvas().style.cursor = 'pointer';

      setTooltip({
        visible: true,
        x,
        y,
        geofenceName,
        entries: null,
        exits: null,
        lastVehicle: null,
        loading: true,
      });

      try {
        const { entries, exits, lastDeviceId } = await fetchActivity(geofenceId);

        if (hoveredId.current !== geofenceId) return;

        const lastVehicle = lastDeviceId
          ? (devices[lastDeviceId]?.name ?? `Device ${lastDeviceId}`)
          : null;

        setTooltip((prev) => ({
          ...prev,
          entries,
          exits,
          lastVehicle,
          loading: false,
        }));
      } catch {
        if (hoveredId.current !== geofenceId) return;
        setTooltip((prev) => ({ ...prev, loading: false, entries: 0, exits: 0 }));
      }
    };

    const handleMouseLeave = () => {
      hoveredId.current = null;
      map.getCanvas().style.cursor = '';
      setTooltip({
        visible: false, x: 0, y: 0, geofenceName: '', entries: null, exits: null, lastVehicle: null, loading: false,
      });
    };

    map.on('mousemove', layerId, handleMouseMove);
    map.on('mouseleave', layerId, handleMouseLeave);
  }, [map, layerId, fetchActivity, devices]);

  return tooltip;
};

export default useGeofenceTooltip;
