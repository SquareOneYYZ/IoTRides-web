import {
  useId, useCallback, useEffect, useRef,
} from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/styles';
import { map } from './core/MapView';
import { formatTime, getStatusColor } from '../common/util/formatter';
import { mapIconKey } from './core/preloadImages';
import { useAttributePreference } from '../common/util/preferences';
import { useCatchCallback } from '../reactHelper';
import { findFonts } from './core/mapUtil';

const MapPositions = ({ positions, onClick, showStatus, selectedPosition, titleField }) => {
  const id = useId();
  const clusters = `${id}-clusters`;
  const selected = `${id}-selected`;

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const mapCluster = useAttributePreference('mapCluster', true);
  const directionType = useAttributePreference('mapDirection', 'selected');

  const baseAnimationDuration = useAttributePreference('mapAnimationDuration', 2500);
  const enableSmoothing = useAttributePreference('mapEnableSmoothing', true);
  const useAdaptiveTiming = useAttributePreference('mapAdaptiveTiming', true);

  const animationStateRef = useRef({});
  const animationFrameRef = useRef(null);
  const devicesRef = useRef(devices);
  const selectedDeviceIdRef = useRef(selectedDeviceId);
  const selectedPositionRef = useRef(selectedPosition);
  const lastUpdateTimeRef = useRef({});

  useEffect(() => {
    devicesRef.current = devices;
    selectedDeviceIdRef.current = selectedDeviceId;
    selectedPositionRef.current = selectedPosition;
  }, [devices, selectedDeviceId, selectedPosition]);

  const createFeature = useCallback((devices, position, selectedPositionId) => {
    const device = devices[position.deviceId];
    let showDirection;
    switch (directionType) {
      case 'none':
        showDirection = false;
        break;
      case 'all':
        showDirection = position.course > 0;
        break;
      default:
        showDirection = selectedPositionId === position.id && position.course > 0;
        break;
    }
    return {
      id: position.id,
      deviceId: position.deviceId,
      name: device.name,
      fixTime: formatTime(position.fixTime, 'seconds'),
      category: mapIconKey(device.category),
      color: showStatus ? position.attributes.color || getStatusColor(device.status) : 'neutral',
      rotation: position.course,
      direction: showDirection,
    };
  }, [directionType, showStatus]);

  const lerp = (start, end, t) => start + (end - start) * t;

  const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

  const interpolateCoordinates = (startLng, startLat, endLng, endLat, progress) => [
    lerp(startLng, endLng, progress),
    lerp(startLat, endLat, progress),
  ];

  const interpolateRotation = (startRotation, endRotation, progress) => {
    let diff = endRotation - startRotation;

    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    let result = startRotation + diff * progress;
    if (result < 0) result += 360;
    if (result >= 360) result -= 360;

    return result;
  };
  const calculateAnimationDuration = useCallback((deviceId, now) => {
    if (!useAdaptiveTiming) {
      return baseAnimationDuration;
    }

    const lastUpdate = lastUpdateTimeRef.current[deviceId];
    if (!lastUpdate) {
      return baseAnimationDuration;
    }
    const timeBetweenUpdates = now - lastUpdate;
    const adaptiveDuration = Math.min(timeBetweenUpdates * 0.8, 5000);
    return Math.max(1000, Math.min(adaptiveDuration, 5000));
  }, [baseAnimationDuration, useAdaptiveTiming]);

  const updateMapData = useCallback(() => {
    const state = animationStateRef.current;
    const currentDevices = devicesRef.current;
    const currentSelectedDeviceId = selectedDeviceIdRef.current;
    const currentSelectedPosition = selectedPositionRef.current;

    [id, selected].forEach((source) => {
      const sourceObj = map.getSource(source);
      if (!sourceObj) return;

      const features = Object.values(state)
        .filter((deviceState) => currentDevices.hasOwnProperty(deviceState.properties.deviceId))
        .filter((deviceState) => {
          const isSelected = deviceState.properties.deviceId === currentSelectedDeviceId;
          return source === id ? !isSelected : isSelected;
        })
        .map((deviceState) => {
          const position = deviceState.properties;
          const { current } = deviceState;

          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [current.longitude, current.latitude],
            },
            properties: {
              ...createFeature(currentDevices, position, currentSelectedPosition && currentSelectedPosition.id),
              rotation: current.rotation,
            },
          };
        });

      sourceObj.setData({
        type: 'FeatureCollection',
        features,
      });
    });
  }, [id, selected, createFeature]);

  const animate = useCallback(() => {
    const now = Date.now();
    const state = animationStateRef.current;
    let needsUpdate = false;

    Object.keys(state).forEach((deviceId) => {
      const deviceState = state[deviceId];

      if (deviceState.target) {
        const elapsed = now - deviceState.startTime;
        const duration = deviceState.duration || baseAnimationDuration;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutQuad(progress);

        const [lng, lat] = interpolateCoordinates(
          deviceState.start.longitude,
          deviceState.start.latitude,
          deviceState.target.longitude,
          deviceState.target.latitude,
          easedProgress,
        );

        const rotation = interpolateRotation(
          deviceState.start.rotation,
          deviceState.target.rotation,
          easedProgress,
        );

        deviceState.current = {
          longitude: lng,
          latitude: lat,
          rotation,
        };

        if (progress >= 1) {
          deviceState.current = { ...deviceState.target };
          deviceState.target = null;
          deviceState.start = null;
        }

        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      updateMapData();
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [baseAnimationDuration, updateMapData]);

  const updateAnimationState = useCallback((newPositions) => {
    const now = Date.now();
    const state = animationStateRef.current;

    newPositions.forEach((position) => {
      const { deviceId } = position;
      const currentState = state[deviceId];
      lastUpdateTimeRef.current[deviceId] = now;

      if (!currentState) {
        state[deviceId] = {
          current: {
            longitude: position.longitude,
            latitude: position.latitude,
            rotation: position.course || 0,
          },
          target: null,
          startTime: now,
          properties: position,
        };
      } else {
        const hasChanged = Math.abs(currentState.current.longitude - position.longitude) > 0.000001
          || Math.abs(currentState.current.latitude - position.latitude) > 0.000001;

        if (hasChanged && enableSmoothing) {
          const duration = calculateAnimationDuration(deviceId, now);
          state[deviceId] = {
            ...currentState,
            start: { ...currentState.current },
            target: {
              longitude: position.longitude,
              latitude: position.latitude,
              rotation: position.course || 0,
            },
            startTime: now,
            duration,
            properties: position,
          };
        } else if (!enableSmoothing) {
          state[deviceId] = {
            current: {
              longitude: position.longitude,
              latitude: position.latitude,
              rotation: position.course || 0,
            },
            target: null,
            startTime: now,
            properties: position,
          };
        } else {
          state[deviceId].properties = position;
        }
      }
    });

    const activeDeviceIds = new Set(newPositions.map((p) => p.deviceId));
    Object.keys(state).forEach((deviceId) => {
      if (!activeDeviceIds.has(Number(deviceId))) {
        delete state[deviceId];
        delete lastUpdateTimeRef.current[deviceId];
      }
    });
  }, [enableSmoothing, calculateAnimationDuration]);

  const onMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onMouseLeave = () => map.getCanvas().style.cursor = '';

  const onMapClick = useCallback((event) => {
    if (!event.defaultPrevented && onClick) {
      onClick(event.lngLat.lat, event.lngLat.lng);
    }
  }, [onClick]);

  const onMarkerClick = useCallback((event) => {
    event.preventDefault();
    const feature = event.features[0];
    if (onClick) {
      onClick(feature.properties.id, feature.properties.deviceId);
    }
  }, [onClick]);

  const onClusterClick = useCatchCallback(async (event) => {
    event.preventDefault();
    const features = map.queryRenderedFeatures(event.point, {
      layers: [clusters],
    });
    const clusterId = features[0].properties.cluster_id;
    const zoom = await map.getSource(id).getClusterExpansionZoom(clusterId);
    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom,
    });
  }, [clusters]);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: mapCluster,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    map.addSource(selected, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    [id, selected].forEach((source) => {
      map.addLayer({
        id: source,
        type: 'symbol',
        source,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{category}-{color}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'text-field': `{${titleField || 'name'}}`,
          'text-allow-overlap': true,
          'text-anchor': 'bottom',
          'text-offset': [0, -2 * iconScale],
          'text-font': findFonts(map),
          'text-size': 12,
        },
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
        },
      });
      map.addLayer({
        id: `direction-${source}`,
        type: 'symbol',
        source,
        filter: [
          'all',
          ['!has', 'point_count'],
          ['==', 'direction', true],
        ],
        layout: {
          'icon-image': 'direction',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
        },
      });

      map.on('mouseenter', source, onMouseEnter);
      map.on('mouseleave', source, onMouseLeave);
      map.on('click', source, onMarkerClick);
    });
    map.addLayer({
      id: clusters,
      type: 'symbol',
      source: id,
      filter: ['has', 'point_count'],
      layout: {
        'icon-image': 'background',
        'icon-size': iconScale,
        'text-field': '{point_count_abbreviated}',
        'text-font': findFonts(map),
        'text-size': 14,
      },
    });

    map.on('mouseenter', clusters, onMouseEnter);
    map.on('mouseleave', clusters, onMouseLeave);
    map.on('click', clusters, onClusterClick);
    map.on('click', onMapClick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      map.off('mouseenter', clusters, onMouseEnter);
      map.off('mouseleave', clusters, onMouseLeave);
      map.off('click', clusters, onClusterClick);
      map.off('click', onMapClick);

      if (map.getLayer(clusters)) {
        map.removeLayer(clusters);
      }

      [id, selected].forEach((source) => {
        map.off('mouseenter', source, onMouseEnter);
        map.off('mouseleave', source, onMouseLeave);
        map.off('click', source, onMarkerClick);

        if (map.getLayer(source)) {
          map.removeLayer(source);
        }
        if (map.getLayer(`direction-${source}`)) {
          map.removeLayer(`direction-${source}`);
        }
        if (map.getSource(source)) {
          map.removeSource(source);
        }
      });
    };
  }, [mapCluster, clusters, onMarkerClick, onClusterClick, iconScale, titleField, id, selected, onMapClick]);

  useEffect(() => {
    if (enableSmoothing) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate, enableSmoothing]);

  useEffect(() => {
    const filteredPositions = positions.filter((it) => devices.hasOwnProperty(it.deviceId));
    updateAnimationState(filteredPositions);

    if (!enableSmoothing) {
      updateMapData();
    }
  }, [positions, devices, enableSmoothing, updateAnimationState, updateMapData]);

  return null;
};

export default MapPositions;
