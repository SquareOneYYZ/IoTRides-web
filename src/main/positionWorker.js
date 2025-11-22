const featureCache = new Map();
const lastPositions = new Map();

const isInBounds = (position, bounds, buffer) => {
  const latBuffer = (bounds.north - bounds.south) * buffer;
  const lngBuffer = (bounds.east - bounds.west) * buffer;

  return (
    position.latitude >= bounds.south - latBuffer
    && position.latitude <= bounds.north + latBuffer
    && position.longitude >= bounds.west - lngBuffer
    && position.longitude <= bounds.east + lngBuffer
  );
};

const getChangedPositions = (positions, precision) => {
  const currentIds = new Set();

  const result = positions.reduce((acc, position) => {
    const key = position.deviceId;
    currentIds.add(key);

    const last = lastPositions.get(key);
    const currentLat = position.latitude.toFixed(precision);
    const currentLng = position.longitude.toFixed(precision);

    if (!last || last.lat !== currentLat || last.lng !== currentLng) {
      acc.changed.push(position);
      lastPositions.set(key, { lat: currentLat, lng: currentLng });
    }

    return acc;
  }, { changed: [] });

  Array.from(lastPositions.keys())
    .filter((key) => !currentIds.has(key))
    .forEach((key) => lastPositions.delete(key));

  return result.changed;
};

const createFeatures = (positions, devices, selectedDeviceId, selectedPositionId, precision, changedPositions) => {
  changedPositions.forEach((position) => {
    const oldKey = `${position.deviceId}-`;
    Array.from(featureCache.keys())
      .filter((key) => key.startsWith(oldKey))
      .forEach((key) => featureCache.delete(key));
  });

  const features = positions.reduce((acc, position) => {
    if (!devices[position.deviceId]) {
      return acc;
    }
    if (position.deviceId === selectedDeviceId) {
      return acc;
    }

    const cacheKey = `${position.deviceId}-${position.latitude.toFixed(precision)}-${position.longitude.toFixed(precision)}-${selectedPositionId}-${position.course}`;

    if (!featureCache.has(cacheKey)) {
      const device = devices[position.deviceId];
      featureCache.set(cacheKey, {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [position.longitude, position.latitude],
        },
        properties: {
          id: position.id,
          deviceId: position.deviceId,
          name: device.name || '',
          category: device.category || 'default',
          color: device.status === 'online' ? 'green' : 'neutral',
          rotation: position.course || 0,
          direction: selectedPositionId === position.id && position.course > 0,
        },
      });
    }

    acc.push(featureCache.get(cacheKey));
    return acc;
  }, []);

  if (featureCache.size > 2500) {
    Array.from(featureCache.keys())
      .slice(0, 1200)
      .forEach((key) => featureCache.delete(key));
  }

  return features;
};

onmessage = (e) => {
  const { type, payload } = e.data;

  if (type === 'PROCESS_POSITIONS') {
    const { positions, devices, selectedDeviceId, selectedPositionId, bounds, precision } = payload;

    const visible = bounds
      ? positions.filter((p) => isInBounds(p, bounds, 0.1))
      : positions;

    const changed = getChangedPositions(visible, precision);

    const features = createFeatures(
      visible,
      devices,
      selectedDeviceId,
      selectedPositionId,
      precision,
      changed,
    );

    postMessage({
      type: 'FEATURES_READY',
      payload: {
        features,
        stats: {
          total: positions.length,
          visible: visible.length,
          changed: changed.length,
          cached: featureCache.size,
        },
      },
    });
  }

  if (type === 'CLEAR_CACHE') {
    featureCache.clear();
    lastPositions.clear();
  }
};
