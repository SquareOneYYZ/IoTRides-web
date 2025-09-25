import { useId, useEffect, useMemo } from 'react';
import { map } from './core/MapView';
import getSpeedColor from '../common/util/colors';
import { findFonts } from './core/mapUtil';
import { SpeedLegendControl } from './legend/MapSpeedLegend';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAttributePreference } from '../common/util/preferences';

const MapRoutePoints = ({ positions }) => {
  const id = useId();
  const t = useTranslation();
  const speedUnit = useAttributePreference('speedUnit');

  const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
  const onMouseLeave = () => (map.getCanvas().style.cursor = '');

  const { simplifiedPositions } = useMemo(() => {
    if (!positions.length) return { simplifiedPositions: [] };

    const simplified = positions.filter(
      (p, i) => i === 0 || i === positions.length - 1 || i % 4 === 0
    );

    return { simplifiedPositions: simplified };
  }, [positions]);

  useEffect(() => {
    if (!positions.length) return;

    map.addSource(id, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      paint: {
        'text-color': ['get', 'color'],
        'text-halo-color': ['get', 'border'],
        'text-halo-width': 1.2,
      },
      layout: {
        'text-font': findFonts(map),
        'text-field': '▲',
        'text-allow-overlap': true,
        'text-rotate': ['get', 'rotation'],
      },
    });

    map.on('mouseenter', id, onMouseEnter);
    map.on('mouseleave', id, onMouseLeave);

    // 🔹 Console on hover
    map.on('mousemove', id, (e) => {
      if (e.features?.length) {
        const feature = e.features[0];
        console.log('Hovered point:', feature.properties);
      }
    });

    return () => {
      map.off('mouseenter', id, onMouseEnter);
      map.off('mouseleave', id, onMouseLeave);
      map.off('mousemove', id, () => {});
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, [id, positions]);

  useEffect(() => {
    if (!positions.length) return;

    const maxSpeed = positions.reduce(
      (a, b) => Math.max(a, b.speed),
      -Infinity
    );
    const minSpeed = positions.reduce((a, b) => Math.min(a, b.speed), Infinity);

    const control = new SpeedLegendControl(
      positions,
      speedUnit,
      t,
      maxSpeed,
      minSpeed
    );
    map.addControl(control, 'bottom-left');

    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: simplifiedPositions.map((p, index) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        properties: {
          index,
          id: p.id,
          rotation: p.course,
          color: getSpeedColor(p.speed, minSpeed, maxSpeed),
          border: p.isReturn ? '#000000' : 'transparent',
        },
      })),
    });

    return () => {
      map.removeControl(control);
    };
  }, [positions, simplifiedPositions, speedUnit, t, id]);

  return null;
};

export default MapRoutePoints;
