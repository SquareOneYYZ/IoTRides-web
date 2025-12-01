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
    for (let i = 0; i < positions.length; i += 1) {
      const { speed } = positions[i];
      if (speed > max) max = speed;
      if (speed < min) min = speed;
    }
  const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
  const onMouseLeave = () => (map.getCanvas().style.cursor = '');

  const { simplifiedPositions } = useMemo(() => {
    if (!positions.length) return { simplifiedPositions: [] };
    const simplified = positions.filter(
      (p, i) => i === 0 || i === positions.length - 1 || i % 4 === 0,
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
  }, [simplifiedPositions, minSpeed, maxSpeed, showOnHoverOnly, hoveredIndex, visibleIndices]);

  const onMarkerClick = useCallback(
    (event) => {
      event.preventDefault();
      const feature = event.features?.[0];
      onClick(feature.properties.id, feature.properties.index);
    },
    [onClick],
  );

  const onMarkerHover = useCallback(
    (event) => {
      const feature = event.features?.[0];
      if (feature && onHover) {
        onHover(feature.properties.id, feature.properties.index);
      }
    },
    [onHover],
  );

  const onMarkerLeaveHandler = useCallback(() => {
    if (onLeave) {
      onLeave();
    }
  }, [onLeave]);
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
      id: `${id}-hitzone`,
      type: 'circle',
      source: id,
      paint: {
        'circle-radius': 20, // Adjust this value to increase/decrease capture radius
        'circle-opacity': 0, // Invisible
      },
    });

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

    map.on('mouseenter', `${id}-hitzone`, onMouseEnter);
    map.on('mouseleave', `${id}-hitzone`, onMouseLeave);
    map.on('click', `${id}-hitzone`, onMarkerClick);

    if (showOnHoverOnly) {
      map.on('mousemove', `${id}-hitzone`, onMarkerHover);
      map.on('mouseleave', `${id}-hitzone`, onMarkerLeaveHandler);
    }

    return () => {
      map.off('mouseenter', `${id}-hitzone`, onMouseEnter);
      map.off('mouseleave', `${id}-hitzone`, onMouseLeave);
      map.off('click', `${id}-hitzone`, onMarkerClick);

      if (showOnHoverOnly) {
        map.off('mousemove', `${id}-hitzone`, onMarkerHover);
        map.off('mouseleave', `${id}-hitzone`, onMarkerLeaveHandler);
      }

      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getLayer(`${id}-hitzone`)) map.removeLayer(`${id}-hitzone`);
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

    return () => {
      map.removeControl(control);
    };
  }, [positions, speedUnit, t, maxSpeed, minSpeed]);
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
