// eslint-disable-next-line import/no-unresolved
import mapboxglRtlTextUrl from '@mapbox/mapbox-gl-rtl-text/mapbox-gl-rtl-text.min?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { googleProtocol } from 'maplibre-google-maps';
import React, {
  useRef, useLayoutEffect, useEffect, useState,
} from 'react';
import { SwitcherControl } from '../switcher/switcher';
import { useAttributePreference, usePreference } from '../../common/util/preferences';
import usePersistedState, { savePersistedState } from '../../common/util/usePersistedState';
import { mapImages } from './preloadImages';
import useMapStyles from './useMapStyles';
import { FullScreenControl } from '../controls/MapFullScreen';
import ContextMenu from './ContextMenu';

const element = document.createElement('div');
element.style.width = '100%';
element.style.height = '100%';
element.style.boxSizing = 'initial';

maplibregl.setRTLTextPlugin(mapboxglRtlTextUrl);
maplibregl.addProtocol('google', googleProtocol);

export const map = new maplibregl.Map({
  container: element,
});

// Disable right-click drag rotation — rotation moves to middle-click
map.dragRotate.disable();

let ready = false;
const readyListeners = new Set();

const addReadyListener = (listener) => {
  readyListeners.add(listener);
  listener(ready);
};

const removeReadyListener = (listener) => {
  readyListeners.delete(listener);
};

const updateReadyValue = (value) => {
  ready = value;
  readyListeners.forEach((listener) => listener(value));
};

const initMap = async () => {
  if (ready) return;
  if (!map.hasImage('background')) {
    Object.entries(mapImages).forEach(([key, value]) => {
      map.addImage(key, value, {
        pixelRatio: window.devicePixelRatio,
      });
    });
  }
};

map.addControl(new FullScreenControl(), 'top-right');

const switcher = new SwitcherControl(
  () => updateReadyValue(false),
  (styleId) => savePersistedState('selectedMapStyle', styleId),
  () => {
    map.once('styledata', () => {
      const waiting = () => {
        if (!map.loaded()) {
          setTimeout(waiting, 33);
        } else {
          initMap();
          updateReadyValue(true);
        }
      };
      waiting();
    });
  },
);

map.addControl(switcher, 'top-right');

const MapView = ({ children }) => {
  const containerEl = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    lngLat: null,
  });

  const mapStyles = useMapStyles();
  const activeMapStyles = useAttributePreference('activeMapStyles', 'locationIqStreets,locationIqDark,openFreeMap');
  const [defaultMapStyle] = usePersistedState('selectedMapStyle', usePreference('map', 'locationIqStreets'));
  const mapboxAccessToken = useAttributePreference('mapboxAccessToken');
  const maxZoom = useAttributePreference('web.maxZoom');

  useEffect(() => {
    if (maxZoom) {
      map.setMaxZoom(maxZoom);
    }
  }, [maxZoom]);

  useEffect(() => {
    maplibregl.accessToken = mapboxAccessToken;
  }, [mapboxAccessToken]);

  useEffect(() => {
    const filteredStyles = mapStyles.filter((s) => s.available && activeMapStyles.includes(s.id));
    const styles = filteredStyles.length ? filteredStyles : mapStyles.filter((s) => s.id === 'osm');
    switcher.updateStyles(styles, defaultMapStyle);
  }, [mapStyles, defaultMapStyle]);

  useEffect(() => {
    const listener = (r) => setMapReady(r);
    addReadyListener(listener);
    return () => {
      removeReadyListener(listener);
    };
  }, []);

  // Right-click context menu
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      const rect = containerEl.current?.getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: (rect?.left ?? 0) + e.point.x,
        y: (rect?.top ?? 0) + e.point.y,
        lngLat: e.lngLat,
      });
    };

    map.on('contextmenu', handleContextMenu);
    return () => map.off('contextmenu', handleContextMenu);
  }, []);

  // Middle-click rotation (replaces right-click drag rotation)
  useEffect(() => {
    let isMiddleDown = false;
    let lastX = 0;

    const onMouseDown = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        isMiddleDown = true;
        lastX = e.clientX;
      }
    };

    const onMouseMove = (e) => {
      if (!isMiddleDown) return;
      const delta = e.clientX - lastX;
      lastX = e.clientX;
      map.rotateTo(map.getBearing() + delta * 0.5, { duration: 0 });
    };

    const onMouseUp = (e) => {
      if (e.button === 1) {
        isMiddleDown = false;
      }
    };

    const canvas = map.getCanvas();
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleContextMenuClose = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleGeofence = (lngLat) => {
    // TODO: navigate to geofence creation page with coords pre-filled
    // Example: navigate(`/geofences/new?lat=${lngLat.lat}&lng=${lngLat.lng}`);
    // eslint-disable-next-line no-console
    console.log('Create Geofence Here →', lngLat);
  };

  const handleNearestVehicle = (lngLat) => {
    // TODO: find nearest device from your devices store and select/highlight it
    // eslint-disable-next-line no-console
    console.log('Find Nearest Vehicle →', lngLat);
  };

  const handleMeasure = (lngLat) => {
    // TODO: activate your measure tool with lngLat as the start point
    // eslint-disable-next-line no-console
    console.log('Measure From Here →', lngLat);
  };

  useLayoutEffect(() => {
    const currentEl = containerEl.current;
    currentEl.appendChild(element);
    map.resize();

    // Suppress the native browser context menu on the map element
    const suppressNativeMenu = (e) => e.preventDefault();
    element.addEventListener('contextmenu', suppressNativeMenu);

    // Suppress native middle-click scroll/autoscroll on the map canvas
    const suppressMiddleScroll = (e) => {
      if (e.button === 1) e.preventDefault();
    };
    element.addEventListener('mousedown', suppressMiddleScroll);

    return () => {
      element.removeEventListener('contextmenu', suppressNativeMenu);
      element.removeEventListener('mousedown', suppressMiddleScroll);
      currentEl.removeChild(element);
    };
  }, [containerEl]);

  return (
    <>
      <div style={{ width: '100%', height: '100%' }} ref={containerEl}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type.handlesMapReady) {
            return React.cloneElement(child, { mapReady });
          }
          return mapReady ? child : null;
        })}
      </div>

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        lngLat={contextMenu.lngLat}
        onClose={handleContextMenuClose}
        onGeofence={handleGeofence}
        onNearestVehicle={handleNearestVehicle}
        onMeasure={handleMeasure}
      />
    </>
  );
};

export default MapView;