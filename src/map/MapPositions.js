import React, {
  useId, useCallback, useEffect, useRef, useState,
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
import usePositionWorker from '../main/usePositionWorker';
import MapLoadingIndicator from './MapLoadingIndicator';

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
  const hasInitiallyLoaded = useRef(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const positionsRef = useRef(positions);
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const { processPositions, clearCache, isLoading, progress } = usePositionWorker();

  const [mapBounds, setMapBounds] = useState(null);

  useEffect(() => {
    const updateBounds = () => {
      const bounds = map.getBounds();
      setMapBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };
    updateBounds();
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, []);

  const getPrecision = useCallback(() => {
    const zoom = map.getZoom();
    if (zoom >= 14) return 6;
    if (zoom >= 10) return 5;
    return 4;
  }, []);

  const createSelectedFeatures = useCallback((currentPositions) => {
    if (!selectedDeviceId) return [];
    const selectedPos = currentPositions.find((p) => p.deviceId === selectedDeviceId);
    if (!selectedPos || !devices[selectedDeviceId]) return [];

    const device = devices[selectedDeviceId];

    let showDirection;
    switch (directionType) {
      case 'none':
        showDirection = false;
        break;
      case 'all':
        showDirection = selectedPos.course > 0;
        break;
      default:
        showDirection = selectedPosition?.id === selectedPos.id && selectedPos.course > 0;
        break;
    }

    return [{
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [selectedPos.longitude, selectedPos.latitude],
      },
      properties: {
        id: selectedPos.id,
        deviceId: selectedPos.deviceId,
        name: device.name || '',
        fixTime: formatTime(selectedPos.fixTime, 'seconds'),
        category: mapIconKey(device.category),
        color: showStatus
          ? selectedPos.attributes?.color || getStatusColor(device.status)
          : 'neutral',
        rotation: selectedPos.course,
        direction: showDirection,
      },
    }];
  }, [selectedDeviceId, devices, directionType, selectedPosition, showStatus]);

  const onMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
  const onMouseLeave = () => { map.getCanvas().style.cursor = ''; };

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
    const features = map.queryRenderedFeatures(event.point, { layers: [clusters] });
    const clusterId = features[0].properties.cluster_id;
    const zoom = await map.getSource(id).getClusterExpansionZoom(clusterId);
    map.easeTo({ center: features[0].geometry.coordinates, zoom });
  }, [clusters]);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: mapCluster,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addSource(selected, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
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

      if (map.getLayer(clusters)) map.removeLayer(clusters);

      [id, selected].forEach((source) => {
        map.off('mouseenter', source, onMouseEnter);
        map.off('mouseleave', source, onMouseLeave);
        map.off('click', source, onMarkerClick);
        if (map.getLayer(source)) map.removeLayer(source);
        if (map.getLayer(`direction-${source}`)) map.removeLayer(`direction-${source}`);
        if (map.getSource(source)) map.removeSource(source);
      });
    };
  }, [mapCluster, clusters, onMarkerClick, onClusterClick]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        hasInitiallyLoaded.current = false;
        clearCache();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [clearCache]);

  useEffect(() => {
    if (!positions?.length) return;

    const isInitialLoad = !hasInitiallyLoaded.current;
    if (isInitialLoad) setShowLoadingIndicator(true);

    processPositions(
      {
        positions,
        devices,
        selectedDeviceId,
        selectedPositionId: selectedPosition?.id,
        bounds: mapBounds,
        precision: getPrecision(),
      },
      (features) => {
        if (map.getSource(id)) {
          map.getSource(id).setData({
            type: 'FeatureCollection',
            features,
          });
        }
        if (map.getSource(selected)) {
          map.getSource(selected).setData({
            type: 'FeatureCollection',
            features: createSelectedFeatures(positionsRef.current),
          });
        }
      },
      !isInitialLoad,
    );
  }, [positions, devices, selectedPosition, selectedDeviceId, mapBounds]);

  useEffect(() => {
    if (!isLoading && progress === 100 && showLoadingIndicator) {
      hasInitiallyLoaded.current = true;
      setShowLoadingIndicator(false);
    }
  }, [isLoading, progress, showLoadingIndicator]);

  if (showLoadingIndicator && isLoading && progress < 100) {
    return React.createElement(MapLoadingIndicator, {
      isLoading,
      progress,
      positionCount: positions?.length || 0,
    });
  }

  return null;
};

export default MapPositions;
