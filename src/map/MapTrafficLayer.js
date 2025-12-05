import { useEffect, useMemo, useId } from 'react';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import useMapOverlays from './overlay/useMapOverlays';

const MapTrafficLayer = () => {
  const id = useId();
  const selectedMapOverlay = useAttributePreference('selectedMapOverlay');
  const mapOverlays = useMapOverlays();
  const enabled = selectedMapOverlay === 'traffic';

  const trafficOverlay = useMemo(() => {
    if (!enabled) {
      return null;
    }
    const priorityIds = ['tomTomFlow', 'hereFlow', 'googleTraffic'];
    const available = mapOverlays.filter((overlay) => overlay.available && !overlay.isSpecial);
    for (const overlayId of priorityIds) {
      const found = available.find((overlay) => overlay.id === overlayId);
      if (found) {
        return found;
      }
    }
    return null;
  }, [enabled, mapOverlays]);

  useEffect(() => {
    if (!trafficOverlay) {
      if (map.getLayer(`${id}-traffic`)) {
        map.removeLayer(`${id}-traffic`);
      }
      if (map.getSource(`${id}-traffic`)) {
        map.removeSource(`${id}-traffic`);
      }
      return;
    }

    if (!map.getSource(`${id}-traffic`)) {
      map.addSource(`${id}-traffic`, trafficOverlay.source);
    }

    if (!map.getLayer(`${id}-traffic`)) {
      map.addLayer({
        id: `${id}-traffic`,
        type: 'raster',
        source: `${id}-traffic`,
        layout: {
          visibility: 'visible',
        },
      });
    } else {
      map.setLayoutProperty(`${id}-traffic`, 'visibility', 'visible');
    }

    return () => {
      if (map.getLayer(`${id}-traffic`)) {
        map.removeLayer(`${id}-traffic`);
      }
      if (map.getSource(`${id}-traffic`)) {
        map.removeSource(`${id}-traffic`);
      }
    };
  }, [id, trafficOverlay]);

  useEffect(() => {
    const onStyleData = () => {
      if (trafficOverlay && map.getSource(`${id}-traffic`)) {
        if (!map.getLayer(`${id}-traffic`)) {
          map.addLayer({
            id: `${id}-traffic`,
            type: 'raster',
            source: `${id}-traffic`,
            layout: {
              visibility: 'visible',
            },
          });
        }
      }
    };

    map.on('styledata', onStyleData);
    return () => {
      map.off('styledata', onStyleData);
    };
  }, [id, trafficOverlay]);

  return null;
};

export default MapTrafficLayer;

