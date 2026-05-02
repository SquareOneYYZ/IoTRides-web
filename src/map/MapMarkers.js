import {
  useId, useEffect, useMemo, useCallback, useRef,
} from 'react';
import { useTheme } from '@mui/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import { findFonts } from './core/mapUtil';

const MapMarkers = ({ markers, showTitles }) => {
  const id = useId();
  const layerInitialized = useRef(false);
  const lastZoomLevel = useRef(null);

  const throttleRef = useRef({ timeoutId: null, lastExecTime: 0 });

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  const features = useMemo(() => {
    if (!markers?.length) return [];
    return markers.map(({ latitude, longitude, image, title }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      properties: {
        image: image || 'default-neutral',
        title: title || '',
      },
    }));
  }, [markers]);

  const updateTextVisibility = useCallback(() => {
    const { lastExecTime } = throttleRef.current;
    const currentTime = Date.now();
    const delay = 100;

    const execute = () => {
      const zoom = map.getZoom();
      const roundedZoom = Math.round(zoom * 2) / 2;
      if (lastZoomLevel.current === roundedZoom) return;
      const shouldShowTitles = roundedZoom >= 14;
      if (map.getLayer(id)) {
        try {
          map.setLayoutProperty(id, 'text-field', shouldShowTitles ? '{title}' : '');
          lastZoomLevel.current = roundedZoom;
        } catch (error) {
          console.warn('Failed to update text visibility:', error);
        }
      }
    };

    if (currentTime - lastExecTime > delay) {
      execute();
      throttleRef.current.lastExecTime = currentTime;
    } else {
      clearTimeout(throttleRef.current.timeoutId);
      throttleRef.current.timeoutId = setTimeout(() => {
        execute();
        throttleRef.current.lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }, [id]);

  useEffect(() => {
    if (layerInitialized.current) return () => {};

    try {
      if (!map.getSource(id)) {
        map.addSource(id, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }
      if (!map.getLayer(id)) {
        map.addLayer({
          id,
          type: 'symbol',
          source: id,
          filter: ['!has', 'point_count'],
          layout: {
            'icon-image': ['get', 'image'],
            'icon-size': iconScale,
            'icon-allow-overlap': true,
            'text-field': showTitles ? ['get', 'title'] : '',
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
      }
      layerInitialized.current = true;
    } catch (error) {
      console.error('Failed to initialize map layer:', error);
    }

    return () => {
      clearTimeout(throttleRef.current.timeoutId);
      try {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
        layerInitialized.current = false;
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };
  }, [id]);

  useEffect(() => {
    map.on('zoom', updateTextVisibility);
    updateTextVisibility();
    return () => {
      map.off('zoom', updateTextVisibility);
    };
  }, [updateTextVisibility]);

  useEffect(() => {
    if (!layerInitialized.current || !map.getLayer(id)) return;
    try {
      map.setLayoutProperty(id, 'icon-size', iconScale);
      map.setLayoutProperty(id, 'text-offset', [0, -2 * iconScale]);
    } catch (error) {
      console.warn('Failed to update icon scale:', error);
    }
  }, [id, iconScale]);

  useEffect(() => {
    if (!layerInitialized.current || !map.getLayer(id)) return;
    try {
      const currentZoom = map.getZoom();
      const shouldShowTitles = showTitles && currentZoom >= 14;
      map.setLayoutProperty(id, 'text-field', shouldShowTitles ? ['get', 'title'] : '');
    } catch (error) {
      console.warn('Failed to update title visibility:', error);
    }
  }, [id, showTitles]);

  useEffect(() => {
    if (!layerInitialized.current) return;
    const source = map.getSource(id);
    if (source && features) {
      try {
        requestAnimationFrame(() => {
          source.setData({ type: 'FeatureCollection', features });
        });
      } catch (error) {
        console.warn('Failed to update map data:', error);
      }
    }
  }, [id, features]);

  return null;
};

export default MapMarkers;