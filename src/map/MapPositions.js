import { useId, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/styles';
import { map } from './core/MapView';
import { formatTime, getStatusColor } from '../common/util/formatter';
import { mapIconKey } from './core/preloadImages';
import { useAttributePreference } from '../common/util/preferences';
import { useCatchCallback } from '../reactHelper';
import { findFonts } from './core/mapUtil';
import { useDispatch } from 'react-redux';
import { devicesActions } from '../store/devices';



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
  const dispatch = useDispatch();

  const createFeature = (devices, position, selectedPositionId) => {
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
  };

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
    const currentZoom = map.getZoom();

    // Get all the leaves (individual points) within this cluster
    const clusterSource = map.getSource(id);
    const leaves = await clusterSource.getClusterLeaves(clusterId, Infinity);

    // Extract device information from the cluster
    const clusterDevices = leaves.map(leaf => {
      const properties = leaf.properties;
      return {
        id: properties.id,
        deviceId: properties.deviceId,
        name: properties.name,
        fixTime: properties.fixTime,
        category: properties.category,
        color: properties.color,
        coordinates: leaf.geometry.coordinates
      };
    });

    // Only console log if zoom > 15
    if (currentZoom > 15) {
      console.log('🔍 Cluster clicked at high zoom! Devices in this cluster:', clusterDevices);
      console.log(`📊 Total devices in cluster: ${clusterDevices.length}`);

      // Log individual device details
      clusterDevices.forEach((device, index) => {
        console.log(`📱 Device ${index + 1}:`, {
          name: device.name,
          deviceId: device.deviceId,
          coordinates: device.coordinates,
          lastUpdate: device.fixTime
        });
      });
    } else {
      // Continue with the original zoom functionality only if zoom <= 15
      const zoom = await clusterSource.getClusterExpansionZoom(clusterId);
      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom,
      });
    }
  }, [clusters, devices]);

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
      interactive: true,
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
  }, [mapCluster, clusters, onMarkerClick, onClusterClick]);

  useEffect(() => {
    [id, selected].forEach((source) => {
      map.getSource(source)?.setData({
        type: 'FeatureCollection',
        features: positions.filter((it) => devices.hasOwnProperty(it.deviceId))
          .filter((it) => (source === id ? it.deviceId !== selectedDeviceId : it.deviceId === selectedDeviceId))
          .map((position) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [position.longitude, position.latitude],
            },
            properties: createFeature(devices, position, selectedPosition && selectedPosition.id),
          })),
      });
    });
  }, [mapCluster, clusters, onMarkerClick, onClusterClick, devices, positions, selectedPosition]);

  function setupZoomClusterHandler({
    map,
    clusters,
    positions,
    devices,
    selectedDeviceId,
    selectedPosition,
    dispatch,
    id,
    createFeature,
    devicesActions
  }) {
    const wasAbove15Ref = { current: false };

    const handleZoomChange = async () => {
      try {
        const zoom = map.getZoom();

        if (zoom > 15 && !wasAbove15Ref.current) {
          const clusterFeatures = map.queryRenderedFeatures(
            [[0, 0], [map.getCanvas().width, map.getCanvas().height]],
            { layers: [clusters] }
          );

          const deviceIdsToHide = new Set();
          const allHiddenDevices = [];

          for (const clusterFeature of clusterFeatures) {
            const clusterId = clusterFeature.properties.cluster_id;
            const clusterSource = map.getSource(id);
            const leaves = await clusterSource.getClusterLeaves(clusterId, Infinity);

            const clusterDevices = leaves.map(leaf => {
              const properties = leaf.properties;
              return {
                id: properties.id,
                deviceId: properties.deviceId,
                name: properties.name,
                fixTime: properties.fixTime,
                category: properties.category,
                color: properties.color,
                coordinates: leaf.geometry.coordinates,
                clusterId: clusterId
              };
            });

            allHiddenDevices.push(...clusterDevices);

            leaves.forEach(leaf => {
              deviceIdsToHide.add(leaf.properties.deviceId);
            });
          }

          if (map.getLayer(clusters)) {
            map.setLayoutProperty(clusters, 'visibility', 'none');
          }

          const source = map.getSource(id);
          if (source) {
            const filteredFeatures = positions
              .filter((it) => devices.hasOwnProperty(it.deviceId))
              .filter((it) => it.deviceId !== selectedDeviceId)
              .filter((it) => !deviceIdsToHide.has(it.deviceId))
              .map((position) => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [position.longitude, position.latitude],
                },
                properties: createFeature(devices, position, selectedPosition && selectedPosition.id),
              }));

            source.setData({
              type: 'FeatureCollection',
              features: filteredFeatures
            });
          }
          // console.log('✅ Dispatching hiddenDevices:', allHiddenDevices.length, allHiddenDevices);

          dispatch(devicesActions.setHiddenDevices(allHiddenDevices));
          // console.log(allHiddenDevices)
          wasAbove15Ref.current = true;

        } else if (zoom <= 15 && wasAbove15Ref.current) {
          if (map.getLayer(clusters)) {
            map.setLayoutProperty(clusters, 'visibility', 'visible');
          }

          const source = map.getSource(id);
          if (source) {
            source.setData({
              type: 'FeatureCollection',
              features: positions.filter((it) => devices.hasOwnProperty(it.deviceId))
                .filter((it) => it.deviceId !== selectedDeviceId)
                .map((position) => ({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [position.longitude, position.latitude],
                  },
                  properties: createFeature(devices, position, selectedPosition && selectedPosition.id),
                })),
            });
          }

          wasAbove15Ref.current = false;
        }
      } catch (error) {
        console.error('❌ Error handling zoom change:', error);
      }
    };

    const listener = () => handleZoomChange();

    if (!map.isStyleLoaded()) {
      map.once('styledata', listener);
    } else {
      listener();
    }

    map.on('zoom', listener);

    return () => {
      map.off('zoom', listener);
    };
  }

  useEffect(() => {
    if (!map) return;

    const cleanup = setupZoomClusterHandler({
      map,
      clusters,
      positions,
      devices,
      selectedDeviceId,
      selectedPosition,
      dispatch,
      id,
      createFeature,
      devicesActions
    });

    return cleanup;
  }, [map, clusters, positions, devices, selectedDeviceId, selectedPosition]);

  return null;
};

export default MapPositions;