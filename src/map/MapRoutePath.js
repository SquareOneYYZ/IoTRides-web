import { useTheme } from '@mui/styles';
import { useId, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { map } from './core/MapView';
import getSpeedColor from '../common/util/colors';
import { useAttributePreference } from '../common/util/preferences';

const MapRoutePath = ({ positions }) => {
  const id = useId();
  const theme = useTheme();

  const mapLineWidth = useAttributePreference('mapLineWidth', 2);
  const mapLineOpacity = useAttributePreference('mapLineOpacity', 1);

  const reportColor = useSelector((state) => {
    if (!positions?.length) return null;

    const p = positions[0];
    const attributes = state.devices.items[p.deviceId]?.attributes;
    return attributes?.['web.reportColor'] || null;
  });

  const { minSpeed, maxSpeed } = useMemo(() => {
    if (!positions?.length) return { minSpeed: 0, maxSpeed: 0 };

    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < positions.length; i += 1) {
      const s = positions[i].speed;
      if (s < min) min = s;
      if (s > max) max = s;
    }
    return { minSpeed: min, maxSpeed: max };
  }, [positions]);

  const routeFeatures = useMemo(() => {
    if (!positions?.length) return [];

    const list = [];
    for (let i = 0; i < positions.length - 1; i += 1) {
      const p1 = positions[i];
      const p2 = positions[i + 1];

      list.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [p1.longitude, p1.latitude],
            [p2.longitude, p2.latitude],
          ],
        },
        properties: {
          color:
            reportColor
            || getSpeedColor(p2.speed, minSpeed, maxSpeed),

          width: mapLineWidth,
          opacity: mapLineOpacity,
        },
      });
    }
    return list;
  }, [positions, minSpeed, maxSpeed, reportColor, mapLineWidth, mapLineOpacity]);

  useEffect(() => {
    if (!map.getSource(id)) {
      map.addSource(id, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!map.getLayer(`${id}-line`)) {
      map.addLayer({
        source: id,
        id: `${id}-line`,
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': ['get', 'opacity'],
        },
      });
    }

    return () => {
      if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, [id]);

  useEffect(() => {
    const source = map.getSource(id);
    if (!source) return;

    requestAnimationFrame(() => {
      source.setData({
        type: 'FeatureCollection',
        features: routeFeatures,
      });
    });
  }, [routeFeatures, id]);

  return null;
};

export default MapRoutePath;
