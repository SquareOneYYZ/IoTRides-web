import {
  useId, useCallback, useMemo, useEffect,
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
  const sourceMain = `${id}-main`;
  const sourceSelected = `${id}-selected`;
  const layerClusters = `${id}-clusters`;

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const mapCluster = useAttributePreference('mapCluster', true);
  const directionType = useAttributePreference('mapDirection', 'selected');

  const createFeature = useCallback(
    (position) => {
      const device = devices[position.deviceId];
      if (!device) return null;

      let showDirection = false;
      if (directionType === 'all') {
        showDirection = position.course > 0;
      } else if (directionType === 'selected') {
        showDirection = selectedPosition?.id === position.id && position.course > 0;
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
    [devices, showStatus, directionType, selectedPosition],
  );
  const featureCollections = useMemo(() => {
    const featuresMain = [];
    const featuresSelected = [];

    positions.forEach((pos) => {
      if (!devices[pos.deviceId]) return;

      const props = createFeature(pos);
      if (!props) return;

      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [pos.longitude, pos.latitude],
        },
        properties: props,
      };

      if (pos.deviceId === selectedDeviceId) {
        featuresSelected.push(feature);
      } else {
        featuresMain.push(feature);
      }
    });

    return {
      [sourceMain]: {
        type: 'FeatureCollection',
        features: featuresMain,
      },
      [sourceSelected]: {
        type: 'FeatureCollection',
        features: featuresSelected,
      },
    };
  }, [
    positions,
    devices,
    createFeature,
    selectedDeviceId,
    sourceMain,
    sourceSelected,
  ]);

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
        layers: [layerClusters],
      });

      const clusterId = features[0]?.properties?.cluster_id;
      if (!clusterId) return;

      const zoom = await map
        .getSource(sourceMain)
        .getClusterExpansionZoom(clusterId);
      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom,
      });
    },
    [layerClusters, sourceMain],
  );

  useEffect(() => {
    // Sources
    map.addSource(sourceMain, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: mapCluster,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addSource(sourceSelected, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    [sourceMain, sourceSelected].forEach((src) => {
      map.addLayer({
        id: src,
        type: 'symbol',
        source: src,
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
        id: `direction-${src}`,
        type: 'symbol',
        source: src,
        filter: ['all', ['!has', 'point_count'], ['==', 'direction', true]],
        layout: {
          'icon-image': 'direction',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
        },
      });

      map.on('click', src, onMarkerClick);
      map.on(
        'mouseenter',
        src,
        () => (map.getCanvas().style.cursor = 'pointer'),
      );
      map.on('mouseleave', src, () => (map.getCanvas().style.cursor = ''));
    });

    map.addLayer({
      id: layerClusters,
      type: 'symbol',
      source: sourceMain,
      filter: ['has', 'point_count'],
      layout: {
        'icon-image': 'background',
        'icon-size': iconScale,
        'text-field': '{point_count_abbreviated}',
        'text-font': findFonts(map),
        'text-size': 14,
      },
    });

    map.on('click', layerClusters, onClusterClick);
    map.on('click', onMapClick);

    return () => {
      map.off('click', onMapClick);
      map.off('click', layerClusters, onClusterClick);

      [sourceMain, sourceSelected].forEach((src) => {
        map.off('click', src, onMarkerClick);
        if (map.getLayer(src)) map.removeLayer(src);
        if (map.getLayer(`direction-${src}`)) map.removeLayer(`direction-${src}`);
        if (map.getSource(src)) map.removeSource(src);
      });

      if (map.getLayer(layerClusters)) map.removeLayer(layerClusters);
    };
  }, [
    mapCluster,
    onClusterClick,
    onMarkerClick,
    onMapClick,
    sourceMain,
    sourceSelected,
    layerClusters,
    iconScale,
    customIcon,
    titleField,
  ]);

  useEffect(() => {
    map.getSource(sourceMain)?.setData(featureCollections[sourceMain]);
    map.getSource(sourceSelected)?.setData(featureCollections[sourceSelected]);
  }, [featureCollections, sourceMain, sourceSelected]);

  return null;
};

export default MapPositions;
