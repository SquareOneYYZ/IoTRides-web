import { useId, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import { findFonts } from './core/mapUtil';

const MapMarkers = ({ markers, showTitles }) => {
  const id = useId();

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);
  const features = useMemo(() => {
    return markers.map(({ latitude, longitude, image, title }) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      properties: {
        image: image || 'default-neutral',
        title: title || '',
      },
    }));
  }, [markers]);

  useEffect(() => {
    if (!map.getSource(id)) {
      map.addSource(id, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }

    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      filter: ['!has', 'point_count'],
      layout: {
        'icon-image': '{image}',
        'icon-size': iconScale,
        'icon-allow-overlap': true,
        'text-field': showTitles ? '{title}' : '',
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

    return () => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, [id, iconScale]);

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
    const updateTextVisibility = () => {
      const zoom = map.getZoom();
      const shouldShowTitles = zoom >= 14;

      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'text-field', shouldShowTitles ? '{title}' : '');
      }
    };

    map.on('zoom', updateTextVisibility);
    updateTextVisibility(); s
    // console.log(`check1`)
    return () => {
      map.off('zoom', updateTextVisibility);
    };
  }, [id]);

  return null;
};

export default MapMarkers;
