import { useEffect } from 'react';
import './mapControls.css';

export class FullScreenControl {
  onAdd(mapInstance) {
    this.map = mapInstance;
    this.isFullScreen = false;

    this.button = document.createElement('button');
    this.button.className = 'maplibregl-ctrl-icon maplibre-ctrl-fullscreen maplibre-ctrl-fullscreen-off';
    this.button.type = 'button';
    this.button.title = 'Full Screen';
    this.button.onclick = () => this.toggleFullScreen();

    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl-group maplibregl-ctrl';
    this.container.appendChild(this.button);

    this.fullscreenChangeHandler = () => this.onFullScreenChange();
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);

    return this.container;
  }

  onRemove() {
    document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
    this.container.parentNode.removeChild(this.container);
  }

  toggleFullScreen() {
    const mapContainer = this.map.getContainer();
    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().catch((err) => {
      });
    } else {
      document.exitFullscreen();
    }
  }

  onFullScreenChange() {
    this.isFullScreen = !!document.fullscreenElement;
    this.button.className = `maplibregl-ctrl-icon maplibre-ctrl-fullscreen maplibre-ctrl-fullscreen-${this.isFullScreen ? 'on' : 'off'}`;
    this.button.title = this.isFullScreen ? 'Exit Full Screen' : 'Full Screen';
  }
}

// React component — no-op since control is added at module level in MapView.jsx
const MapFullScreen = () => {
  useEffect(() => () => {}, []);
  return null;
};

export default MapFullScreen;
