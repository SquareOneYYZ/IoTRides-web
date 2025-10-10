import {
  useId, useCallback, useEffect, useMemo, useRef,
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

const MapPositions = ({
  positions,
  onClick,
  showStatus,
  selectedPosition,
  titleField,
  customIcon,
}) => {
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

  const createFeature = useCallback(
    (devices, position, selectedPositionId) => {
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
        tollName: 'Event Location',
        category: mapIconKey(device.category),
        color: showStatus
          ? position.attributes.color || getStatusColor(device.status)
          : 'neutral',
        rotation: position.course,
        direction: showDirection,
      };
    },
    [directionType, showStatus],
  );

  const onMouseEnter = useCallback(() => {
    map.getCanvas().style.cursor = 'pointer';
  }, []);

  const onMouseLeave = useCallback(() => {
    map.getCanvas().style.cursor = '';
  }, []);

  const onMapClick = useCallback(
    (event) => {
      if (!event.defaultPrevented && onClick) {
        onClick(event.lngLat.lat, event.lngLat.lng);
      }
    },
    [onClick],
  );

  const onMarkerClick = useCallback(
    (event) => {
      event.preventDefault();
      const feature = event.features[0];
      if (onClick) {
        onClick(feature.properties.id, feature.properties.deviceId);
      }
    },
    [onClick],
  );

  const onClusterClick = useCatchCallback(
    async (event) => {
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
    },
    [clusters, id],
  );

  const { baseFeatures, selectedFeatures } = useMemo(() => {
    const availableDevices = devices || {};
    const base = [];
    const selectedArr = [];
    if (Array.isArray(positions) && positions.length) {
      for (let i = 0; i < positions.length; i += 1) {
        const position = positions[i];
        if (!availableDevices.hasOwnProperty(position.deviceId));
        const isSelectedDevice = position.deviceId === selectedDeviceId;
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [position.longitude, position.latitude],
          },
          properties: createFeature(
            availableDevices,
            position,
            selectedPosition && selectedPosition.id,
          ),
        };
        if (isSelectedDevice) {
          selectedArr.push(feature);
        } else {
          base.push(feature);
        }
      }
    }
    return {
      baseFeatures: base,
      selectedFeatures: selectedArr,
    };
  }, [positions, devices, selectedDeviceId, selectedPosition, createFeature]);

  const lastUpdateRef = useRef(0);
  const scheduledTimeoutRef = useRef(null);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      if (scheduledTimeoutRef.current) {
        clearTimeout(scheduledTimeoutRef.current);
        scheduledTimeoutRef.current = null;
      }
    };
  }, []);

  const scheduleSetData = useCallback(() => {
    const now = Date.now();
    const minIntervalMs = 250;
    const elapsed = now - lastUpdateRef.current;

    const run = () => {
      if (isUnmountedRef.current) return;
      try {
        const baseSource = map.getSource(id);
        const selectedSource = map.getSource(selected);
        if (baseSource) {
          requestAnimationFrame(() => {
            baseSource.setData({
              type: 'FeatureCollection',
              features: baseFeatures,
            });
          });
        }
        if (selectedSource) {
          requestAnimationFrame(() => {
            selectedSource.setData({
              type: 'FeatureCollection',
              features: selectedFeatures,
            });
          });
        }
      } catch (e) {
        console.log(e);
      } finally {
        lastUpdateRef.current = Date.now();
        scheduledTimeoutRef.current = null;
      }
    };

    if (elapsed >= minIntervalMs) {
      run();
    } else if (!scheduledTimeoutRef.current) {
      scheduledTimeoutRef.current = setTimeout(run, minIntervalMs - elapsed);
    }
  }, [id, selected, baseFeatures, selectedFeatures]);

  useEffect(() => {
    scheduleSetData();
  }, [scheduleSetData]);

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
          'icon-image': customIcon || '{category}-{color}',
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
        filter: ['all', ['!has', 'point_count'], ['==', 'direction', true]],
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
  }, [
    mapCluster,
    clusters,
    onMarkerClick,
    onClusterClick,
    onMapClick,
    onMouseEnter,
    onMouseLeave,
    id,
    selected,
    iconScale,
    titleField,
  ]);

  return null;
};

export default MapPositions;
