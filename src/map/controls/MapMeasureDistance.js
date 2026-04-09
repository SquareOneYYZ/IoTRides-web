import { useEffect, useMemo } from 'react';
import { map } from '../core/MapView';
import './mapControls.css';

const MEASURE_SOURCE = 'measure-source';
const MEASURE_POINTS_LAYER = 'measure-points';
const MEASURE_LINE_LAYER = 'measure-line';

const calculateDistance = (coords) => {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i += 1) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
};

const formatDistance = (meters) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

class MeasureControl {
  constructor() {
    this.active = false;
    this.points = [];
  }

  onAdd() {
    // Main measure button
    this.button = document.createElement('button');
    this.button.className = 'maplibregl-ctrl-icon maplibre-ctrl-measure maplibre-ctrl-measure-off';
    this.button.type = 'button';
    this.button.title = 'Measure Distance';
    this.button.onclick = () => this.toggleMeasure();

    // Distance row — shown inside ctrl-group when active
    this.distanceRow = document.createElement('div');
    this.distanceRow.className = 'maplibre-ctrl-measure-row';
    this.distanceRow.style.display = 'none';

    this.label = document.createElement('span');
    this.label.className = 'maplibre-ctrl-measure-label';
    this.label.textContent = '—';

    this.closeBtn = document.createElement('button');
    this.closeBtn.className = 'maplibre-ctrl-measure-close';
    this.closeBtn.type = 'button';
    this.closeBtn.title = 'Stop measuring (Esc or double-click)';
    this.closeBtn.innerHTML = '&#x2715;';
    this.closeBtn.onclick = () => this.deactivate();

    this.distanceRow.appendChild(this.label);
    this.distanceRow.appendChild(this.closeBtn);

    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl-group maplibregl-ctrl';
    this.container.appendChild(this.button);
    this.container.appendChild(this.distanceRow);

    this.onMapClick = (e) => this.handleMapClick(e);
    this.onMapDblClick = () => this.deactivate();
    this.onMouseMove = () => { if (this.points.length > 0) this.updateLabel(); };
    this.onKeyDown = (e) => { if (e.key === 'Escape') this.deactivate(); };

    return this.container;
  }

  onRemove() {
    this.deactivate();
    this.container.parentNode.removeChild(this.container);
  }

  toggleMeasure() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  activate() {
    this.active = true;
    this.points = [];
    this.button.className = 'maplibregl-ctrl-icon maplibre-ctrl-measure maplibre-ctrl-measure-on';
    this.button.title = 'Measuring… (Esc or double-click to stop)';
    this.distanceRow.style.display = 'flex';
    this.label.textContent = 'Click map';
    map.getCanvas().style.cursor = 'crosshair';

    if (!map.getSource(MEASURE_SOURCE)) {
      map.addSource(MEASURE_SOURCE, {
        type: 'geojson',
        data: this.getGeoJSON(),
      });
      map.addLayer({
        id: MEASURE_LINE_LAYER,
        type: 'line',
        source: MEASURE_SOURCE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#1976d2',
          'line-width': 2.5,
          'line-dasharray': [2, 1],
        },
        filter: ['==', '$type', 'LineString'],
      });
      map.addLayer({
        id: MEASURE_POINTS_LAYER,
        type: 'circle',
        source: MEASURE_SOURCE,
        paint: {
          'circle-radius': 5,
          'circle-color': '#fff',
          'circle-stroke-color': '#1976d2',
          'circle-stroke-width': 2,
        },
        filter: ['==', '$type', 'Point'],
      });
    }

    map.on('click', this.onMapClick);
    map.on('dblclick', this.onMapDblClick);
    map.on('mousemove', this.onMouseMove);
    document.addEventListener('keydown', this.onKeyDown);
  }

  deactivate() {
    this.active = false;
    this.points = [];
    this.button.className = 'maplibregl-ctrl-icon maplibre-ctrl-measure maplibre-ctrl-measure-off';
    this.button.title = 'Measure Distance';
    this.distanceRow.style.display = 'none';
    map.getCanvas().style.cursor = '';

    map.off('click', this.onMapClick);
    map.off('dblclick', this.onMapDblClick);
    map.off('mousemove', this.onMouseMove);
    document.removeEventListener('keydown', this.onKeyDown);

    if (map.getLayer(MEASURE_POINTS_LAYER)) map.removeLayer(MEASURE_POINTS_LAYER);
    if (map.getLayer(MEASURE_LINE_LAYER)) map.removeLayer(MEASURE_LINE_LAYER);
    if (map.getSource(MEASURE_SOURCE)) map.removeSource(MEASURE_SOURCE);
  }

  handleMapClick(e) {
    this.points.push([e.lngLat.lng, e.lngLat.lat]);
    this.updateSource();
    this.updateLabel();
  }

  updateSource() {
    const source = map.getSource(MEASURE_SOURCE);
    if (source) source.setData(this.getGeoJSON());
  }

  getGeoJSON() {
    const features = this.points.map((coord) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coord },
    }));
    if (this.points.length > 1) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: this.points },
      });
    }
    return { type: 'FeatureCollection', features };
  }

  updateLabel() {
    const dist = calculateDistance(this.points);
    this.label.textContent = dist > 0 ? formatDistance(dist) : 'Click next point';
  }
}

const MapMeasureDistance = () => {
  const control = useMemo(() => new MeasureControl(), []);

  useEffect(() => {
    map.addControl(control, 'top-right');
    return () => map.removeControl(control);
  }, [control]);

  return null;
};

export default MapMeasureDistance;
