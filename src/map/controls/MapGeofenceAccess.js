import { useEffect, useMemo } from 'react';
import { map } from '../core/MapView';
import './mapControls.css';

class GeofenceAccessControl {
  constructor(onGeofenceClick) {
    this.onGeofenceClick = onGeofenceClick;
  }

  onAdd() {
    this.button = document.createElement('button');
    this.button.className = 'maplibregl-ctrl-icon maplibre-ctrl-geofence';
    this.button.type = 'button';
    this.button.title = 'Geofence Tools';
    this.button.onclick = () => this.onGeofenceClick && this.onGeofenceClick();

    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl-group maplibregl-ctrl';
    this.container.appendChild(this.button);

    return this.container;
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container);
  }
}

const MapGeofenceAccess = ({ onClick }) => {
  const control = useMemo(() => new GeofenceAccessControl(onClick), [onClick]);

  useEffect(() => {
    map.addControl(control, 'top-right');
    return () => map.removeControl(control);
  }, [control]);

  return null;
};

export default MapGeofenceAccess;
