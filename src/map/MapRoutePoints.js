import {
  useId, useCallback, useEffect, useMemo,
} from 'react';
import { map } from './core/MapView';
import getSpeedColor from '../common/util/colors';
import { findFonts } from './core/mapUtil';
import { SpeedLegendControl } from './legend/MapSpeedLegend';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAttributePreference } from '../common/util/preferences';

const MapRoutePoints = ({
  positions,
  onClick,
  showOnHoverOnly = false,
  onHover,
  onLeave,
  hoveredIndex,
}) => {
  const id = useId();
  const t = useTranslation();
  const speedUnit = useAttributePreference('speedUnit');

  const onMouseEnter = useCallback(() => {
    map.getCanvas().style.cursor = 'pointer';
  }, []);

  const onMouseLeave = useCallback(() => {
    map.getCanvas().style.cursor = '';
  }, []);

  const { simplifiedPositions, maxSpeed, minSpeed } = useMemo(() => {
    if (!positions?.length) {
      return { simplifiedPositions: [], maxSpeed: 0, minSpeed: 0 };
    }

    let max = -Infinity;
    let min = Infinity;
    for (let i = 0; i < positions.length; i++) {
      const speed = positions[i].speed;
      if (speed > max) max = speed;
      if (speed < min) min = speed;
    }

    const simplified = positions.filter(
      (p, i) => i === 0 || i === positions.length - 1 || i % 4 === 0
    );

    return {
      simplifiedPositions: simplified,
      maxSpeed: max,
      minSpeed: min,
    };
  }, [positions]);

  const visibleIndices = useMemo(() => {
  if (hoveredIndex == null) return new Set();
  const set = new Set([
    Math.max(hoveredIndex - 1, 0),
    hoveredIndex,
    Math.min(hoveredIndex + 1, simplifiedPositions.length - 1),
  ]);
  return set;
}, [hoveredIndex, simplifiedPositions.length]);

  const features = useMemo(() => {
    if (!simplifiedPositions.length) return [];

    return simplifiedPositions.map((p, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.longitude, p.latitude],
      },
      properties: {
        index,
        id: p.id,
        rotation: p.course,
        color: getSpeedColor(p.speed, minSpeed, maxSpeed),
        border: p.isReturn ? '#000000' : 'transparent',
        opacity:
  showOnHoverOnly && !visibleIndices.has(index)
    ? 0
    : 1,

      },
    }));
  }, [simplifiedPositions, minSpeed, maxSpeed, showOnHoverOnly, hoveredIndex]);

  const onMarkerClick = useCallback(
    (event) => {
      event.preventDefault();
      const feature = event.features?.[0];
        onClick(feature.properties.id, feature.properties.index);
    },
    [onClick]
  );

  const onMarkerHover = useCallback(
    (event) => {
      const feature = event.features?.[0];
      if (feature && onHover) {
        onHover(feature.properties.id, feature.properties.index);
      }
    },
    [onHover]
  );

  const onMarkerLeaveHandler = useCallback(() => {
    if (onLeave) {
      onLeave();
    }
  }, [onLeave]);

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
        'text-opacity': showOnHoverOnly ? ['get', 'opacity'] : 1,
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

    if (showOnHoverOnly) {
      map.on('mousemove', id, onMarkerHover);
      map.on('mouseleave', id, onMarkerLeaveHandler);
    }

    return () => {
      map.off('mouseenter', id, onMouseEnter);
      map.off('mouseleave', id, onMouseLeave);
      map.off('click', id, onMarkerClick);

      if (showOnHoverOnly) {
        map.off('mousemove', id, onMarkerHover);
        map.off('mouseleave', id, onMarkerLeaveHandler);
      }

      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, [
    id,
    showOnHoverOnly,
    onMouseEnter,
    onMouseLeave,
    onMarkerClick,
    onMarkerHover,
    onMarkerLeaveHandler,
  ]);

  useEffect(() => {
    const source = map.getSource(id);
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [id, features]);

  useEffect(() => {
    if (!positions?.length) {
      return undefined;
    }

    const control = new SpeedLegendControl(
      positions,
      speedUnit,
      t,
      maxSpeed,
      minSpeed
    );
    map.addControl(control, 'bottom-left');

    return () => {
      map.removeControl(control);
    };
  }, [positions, speedUnit, t, maxSpeed, minSpeed]);

  return null;
};

export default MapRoutePoints;