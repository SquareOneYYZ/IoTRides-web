import { useId, useCallback, useEffect } from 'react';
import simplify from 'simplify-js';
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

  const onMarkerClick = useCallback(
    (event) => {
      event.preventDefault();
      const feature = event.features[0];
      if (onClick) {
        onClick(feature.properties.id, feature.properties.index);
      }
    },
    [onClick]
  );

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      paint: {
        'text-color': ['get', 'color'],
      },
      layout: {
        'text-font': findFonts(map),
        'text-field': '▲', // arrow symbol
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

      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [onMarkerClick]);

  useEffect(() => {
    if (!positions.length) {
      return () => {};
    }

    const maxSpeed = positions.reduce(
      (a, b) => Math.max(a, b.speed),
      -Infinity
    );
    const minSpeed = positions.reduce((a, b) => Math.min(a, b.speed), Infinity);

    const simplified = simplify(
      positions.map((p) => ({
        x: p.longitude,
        y: p.latitude,
        ...p,
      })),
      0.0005,
      true
    );

    let step = 1;
    if (positions.length > 50000) step = 20;
    else if (positions.length > 20000) step = 10;
    else if (positions.length > 5000) step = 5;
    else step = 2;

    const filteredPositions = simplified.filter(
      (p, i) => i === 0 || i === simplified.length - 1 || i % step === 0
    );

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
      features: filteredPositions.map((position, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [position.x, position.y],
        },
        properties: {
          index,
          id: position.id,
          rotation: position.course,
          color: getSpeedColor(position.speed, minSpeed, maxSpeed),
        },
      })),
    });

    return () => map.removeControl(control);
  }, [positions, onMarkerClick]);

  return null;
};

export default MapRoutePoints;
