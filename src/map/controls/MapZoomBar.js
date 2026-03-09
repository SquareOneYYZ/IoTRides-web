import { useEffect, useMemo } from 'react';
import { map } from '../core/MapView';
import './mapControls.css';

class ZoomBarControl {
  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl-group maplibregl-ctrl maplibre-ctrl-zoombar';

    // Zoom In
    this.zoomInBtn = document.createElement('button');
    this.zoomInBtn.className = 'maplibregl-ctrl-icon maplibre-ctrl-zoom-in';
    this.zoomInBtn.type = 'button';
    this.zoomInBtn.title = 'Zoom In';
    this.zoomInBtn.onclick = () => map.zoomIn();

    // Zoom slider track
    this.sliderWrapper = document.createElement('div');
    this.sliderWrapper.className = 'maplibre-ctrl-zoom-slider-wrapper';

    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.className = 'maplibre-ctrl-zoom-slider';
    this.slider.min = map.getMinZoom();
    this.slider.max = map.getMaxZoom();
    this.slider.step = 0.5;
    this.slider.value = map.getZoom();
    this.slider.title = 'Zoom Level';
    this.slider.oninput = (e) => map.zoomTo(parseFloat(e.target.value));

    this.sliderWrapper.appendChild(this.slider);

    // Zoom Out
    this.zoomOutBtn = document.createElement('button');
    this.zoomOutBtn.className = 'maplibregl-ctrl-icon maplibre-ctrl-zoom-out';
    this.zoomOutBtn.type = 'button';
    this.zoomOutBtn.title = 'Zoom Out';
    this.zoomOutBtn.onclick = () => map.zoomOut();

    this.container.appendChild(this.zoomInBtn);
    this.container.appendChild(this.sliderWrapper);
    this.container.appendChild(this.zoomOutBtn);

    // Sync slider when map zoom changes
    this.onZoom = () => {
      this.slider.value = map.getZoom();
    };
    map.on('zoom', this.onZoom);

    return this.container;
  }

  onRemove() {
    map.off('zoom', this.onZoom);
    this.container.parentNode.removeChild(this.container);
  }
}

const MapZoomBar = () => {
  const control = useMemo(() => new ZoomBarControl(), []);

  useEffect(() => {
    map.addControl(control, 'top-right');
    return () => map.removeControl(control);
  }, [control]);

  return null;
};

export default MapZoomBar;
