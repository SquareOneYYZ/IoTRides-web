import maplibregl from 'maplibre-gl';
import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { usePreference } from '../../common/util/preferences';
import { map } from '../core/MapView';

const MapDefaultCamera = ({ mapReady }) => {
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);

  const defaultLatitude = usePreference('latitude');
  const defaultLongitude = usePreference('longitude');
  const defaultZoom = usePreference('zoom', 0);

  const [initialized, setInitialized] = useState(false);

  const markInitialized = useCallback(() => {
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    if (initialized) return;
    if (selectedDeviceId) {
      markInitialized();
      return;
    }

    const hasDefaults = defaultLatitude && defaultLongitude;
    if (hasDefaults) {
      map.jumpTo({
        center: [defaultLongitude, defaultLatitude],
        zoom: defaultZoom,
      });
      markInitialized();
      return;
    }

    const coords = Object.values(positions).map((p) => [p.longitude, p.latitude]);
    if (coords.length > 1) {
      const bounds = coords.reduce(
        (acc, c) => acc.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      );

      const canvas = map.getCanvas();

      map.fitBounds(bounds, {
        duration: 0,
        padding: Math.min(canvas.width, canvas.height) * 0.1,
      });

      markInitialized();
      return;
    }

    if (coords.length === 1) {
      map.jumpTo({
        center: coords[0],
        zoom: Math.max(map.getZoom(), 10),
      });
      markInitialized();
    }
  }, [
    initialized,
    mapReady,
    selectedDeviceId,
    defaultLatitude,
    defaultLongitude,
    defaultZoom,
    positions,
    markInitialized,
  ]);

  return null;
};

MapDefaultCamera.handlesMapReady = true;

export default MapDefaultCamera;
