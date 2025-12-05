import { useEffect, useId, useState, useCallback } from 'react';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

const fetchTollRoadsFromOSM = async (bounds) => {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  const query = `
    [out:json][timeout:25];
    (
      way["toll"~"yes|true|1"](${minLat},${minLon},${maxLat},${maxLon});
      relation["toll"~"yes|true|1"](${minLat},${minLon},${maxLat},${maxLon});
    );
    out geom;
  `;

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    const features = [];

    data.elements?.forEach((element) => {
      if (element.type === 'way' && element.geometry) {
        const coordinates = element.geometry.map((point) => [point.lon, point.lat]);
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: {
            id: element.id,
            toll: element.tags?.toll || 'yes',
          },
        });
      }
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  } catch (error) {
    console.error('Error fetching toll roads from OSM:', error);
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }
};

const MapTollLayer = ({ positions }) => {
  const id = useId();
  const selectedMapOverlay = useAttributePreference('selectedMapOverlay');
  const enabled = selectedMapOverlay === 'tollRoads';
  const [osmTollData, setOsmTollData] = useState(null);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    map.addLayer({
      source: id,
      id: `${id}-toll-line`,
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#ffc107',
        'line-width': 3,
        'line-opacity': 0.9,
        'line-dasharray': [2, 2],
      },
    });

    return () => {
      if (map.getLayer(`${id}-toll-line`)) {
        map.removeLayer(`${id}-toll-line`);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, []);

  const loadTollRoadsFromOSM = useCallback(async () => {
    if (!enabled || !map.loaded()) {
      return;
    }

    const bounds = map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    const data = await fetchTollRoadsFromOSM(bbox);
    setOsmTollData(data);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setOsmTollData(null);
      return;
    }

    if (!map.loaded()) {
      const onLoad = () => {
        loadTollRoadsFromOSM();
        map.off('load', onLoad);
      };
      map.on('load', onLoad);
      return () => {
        map.off('load', onLoad);
      };
    } else {
      loadTollRoadsFromOSM();
    }

    const onMoveEnd = () => {
      if (enabled) {
        loadTollRoadsFromOSM();
      }
    };

    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);

    return () => {
      map.off('moveend', onMoveEnd);
      map.off('zoomend', onMoveEnd);
    };
  }, [enabled, loadTollRoadsFromOSM]);

  useEffect(() => {
    if (!map.getSource(id)) {
      return;
    }

    if (!enabled) {
      map.getSource(id).setData({
        type: 'FeatureCollection',
        features: [],
      });
      return;
    }

    const features = [];

    // Add toll roads from position attributes
    if (positions?.length) {
      for (let i = 0; i < positions.length - 1; i += 1) {
        const current = positions[i];
        const next = positions[i + 1];
        const hasToll =
          (current.attributes && (current.attributes.tollName || current.attributes.tollRef)) ||
          (next.attributes && (next.attributes.tollName || next.attributes.tollRef));

        if (hasToll) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [current.longitude, current.latitude],
                [next.longitude, next.latitude],
              ],
            },
            properties: {
              source: 'position',
            },
          });
        }
      }
    }

    // Add toll roads from OSM
    if (osmTollData?.features) {
      features.push(...osmTollData.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          source: 'osm',
        },
      })));
    }

    map.getSource(id).setData({
      type: 'FeatureCollection',
      features,
    });
  }, [id, enabled, positions, osmTollData]);

  useEffect(() => {
    if (map.getLayer(`${id}-toll-line`)) {
      map.setLayoutProperty(`${id}-toll-line`, 'visibility', enabled ? 'visible' : 'none');
    }
  }, [id, enabled]);

  return null;
};

export default MapTollLayer;



