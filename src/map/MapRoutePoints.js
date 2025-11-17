import {
  useId, useCallback, useEffect, useMemo, useRef,
} from 'react';
import { map } from './core/MapView';
import getSpeedColor from '../common/util/colors';
import { findFonts } from './core/mapUtil';
import { SpeedLegendControl } from './legend/MapSpeedLegend';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAttributePreference } from '../common/util/preferences';

const MapRoutePoints = ({ positions, onClick }) => {
  const id = useId();
  const t = useTranslation();
  const speedUnit = useAttributePreference('speedUnit');

  const clickHandlerRef = useRef(null);

  const { minSpeed, maxSpeed } = useMemo(() => {
    if (!positions.length) return { minSpeed: 0, maxSpeed: 0 };

    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < positions.length; i += 1) {
      const s = positions[i].speed;
      if (s < min) min = s;
      if (s > max) max = s;
    }
    return { minSpeed: min, maxSpeed: max };
  }, [positions]);

  const simplifiedPositions = useMemo(() => {
    if (!positions.length) return [];
    return positions.filter(
      (p, i) => i === 0 || i === positions.length - 1 || i % 4 === 0,
    );
  }, [positions]);

  const onMouseEnter = useCallback(() => {
    map.getCanvas().style.cursor = 'pointer';
  }, []);

  const onMouseLeave = useCallback(() => {
    map.getCanvas().style.cursor = '';
  }, []);

  const onMarkerClick = useCallback(
    (event) => {
      event.preventDefault();
      const feature = event.features?.[0];
      if (!feature) return;

      if (onClick) {
        onClick(feature.properties.id, feature.properties.index);
      }

      const features = positions.map((p, index) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        properties: {
          index,
          id: p.id,
          rotation: p.course,
          color: getSpeedColor(p.speed, minSpeed, maxSpeed),
          border: p.isReturn ? '#000000' : 'transparent',
        },
      }));

      map.getSource(id)?.setData({
        type: 'FeatureCollection',
        features,
      });
    },
    [positions, onClick, id, minSpeed, maxSpeed],
  );

  clickHandlerRef.current = onMarkerClick;

  useEffect(() => {
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
    map.on('click', id, (e) => clickHandlerRef.current?.(e));

    map.once('remove', () => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
      map.off('mouseenter', id, onMouseEnter);
      map.off('mouseleave', id, onMouseLeave);
      map.off('click', id, clickHandlerRef.current);
    });
  }, [id, onMouseEnter, onMouseLeave]);

  useEffect(() => {
    if (!positions.length) return;

    const control = new SpeedLegendControl(
      positions,
      speedUnit,
      t,
      maxSpeed,
      minSpeed,
    );
    map.addControl(control, 'bottom-left');

    const draw = () => {
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
    };

    draw();

    const outsideClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [id] });
      if (!features.length) draw();
    };

    map.on('click', outsideClick);

    map.once('remove', () => {
      map.removeControl(control);
      map.off('click', outsideClick);
    });
  }, [positions, simplifiedPositions, speedUnit, t, id, minSpeed, maxSpeed]);

  return null;
};

export default MapRoutePoints;
