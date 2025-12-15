import {
  useId, useCallback, useEffect, useMemo,
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

  const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
  const onMouseLeave = () => (map.getCanvas().style.cursor = '');

  const { simplifiedPositions } = useMemo(() => {
    if (!positions.length) return { simplifiedPositions: [] };

    const simplified = positions.filter(
      (p, i) => i === 0 || i === positions.length - 1 || i % 4 === 0,
    );

    return { simplifiedPositions: simplified };
  }, [positions]);

  const onMarkerClick = useCallback(
    (event) => {
      event.preventDefault();
      const feature = event.features[0];

      if (feature) {
        if (onClick) {
          onClick(feature.properties.id, feature.properties.index);
        }

        const maxSpeed = Math.max(...positions.map((pt) => pt.speed));
        const minSpeed = Math.min(...positions.map((pt) => pt.speed));

        map.getSource(id)?.setData({
          type: 'FeatureCollection',
          features: positions.map((p, index) => ({
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
      }
    },
    [onClick, id, positions],
  );

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
    map.on('click', id, onMarkerClick);

    return () => {
      map.off('mouseenter', id, onMouseEnter);
      map.off('mouseleave', id, onMouseLeave);
      map.off('click', id, onMarkerClick);

      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, [onMarkerClick]);

  useEffect(() => {
    if (!positions.length) {
      return () => {};
    }

    const maxSpeed = positions.reduce(
      (a, b) => Math.max(a, b.speed),
      -Infinity,
    );
    const minSpeed = positions.reduce((a, b) => Math.min(a, b.speed), Infinity);

    const control = new SpeedLegendControl(
      positions,
      speedUnit,
      t,
      maxSpeed,
      minSpeed,
    );
    map.addControl(control, 'bottom-left');

    const showSimplifiedPoints = () => {
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

    showSimplifiedPoints();

    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [id] });
      if (!features.length) {
        showSimplifiedPoints();
      }
    });

    return () => {
      map.removeControl(control);
      map.off('click');
    };
  }, [positions, simplifiedPositions, speedUnit, t, id]);

  return null;
};

export default MapRoutePoints;
