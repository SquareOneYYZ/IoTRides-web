const featureCache = new Map();

const lastPositions = new Map();

const allPositions = new Map();

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
  const changed = [];
  positions.forEach((position) => {
    const last = lastPositions.get(position.deviceId);
    const currentLat = position.latitude.toFixed(precision);
    const currentLng = position.longitude.toFixed(precision);
    const currentCourse = position.course || 0;

    if (
      !last
      || last.lat !== currentLat
      || last.lng !== currentLng
      || last.course !== currentCourse
    ) {
      changed.push(position);
      lastPositions.set(position.deviceId, {
        lat: currentLat,
        lng: currentLng,
        course: currentCourse,
      });
    }
  });
  return changed;
};

const invalidateCacheForChanged = (changedPositions) => {
  changedPositions.forEach((position) => {
    const prefix = `${position.deviceId}-`;
    Array.from(featureCache.keys())
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => featureCache.delete(key));
  });
};

const buildFeature = (position, device, selectedPositionId, precision) => ({
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
    direction: selectedPositionId === position.id && (position.course || 0) > 0,
  },
});

const buildAllFeatures = (devices, selectedDeviceId, selectedPositionId, precision) => {
  const features = [];

  allPositions.forEach((position) => {
    if (!devices[position.deviceId]) return;
    if (position.deviceId === selectedDeviceId) return;

    const cacheKey = [
      position.deviceId,
      position.latitude.toFixed(precision),
      position.longitude.toFixed(precision),
      position.course || 0,
      selectedPositionId || 'none',
    ].join('-');

    if (!featureCache.has(cacheKey)) {
      featureCache.set(
        cacheKey,
        buildFeature(position, devices[position.deviceId], selectedPositionId, precision),
      );
    }

    features.push(featureCache.get(cacheKey));
  });

  return features;
};

const evictStaleCache = (devices, selectedDeviceId, selectedPositionId, precision) => {
  if (featureCache.size <= 3000) return;

  const activeKeys = new Set();
  allPositions.forEach((p) => {
    if (!devices[p.deviceId] || p.deviceId === selectedDeviceId) return;
    activeKeys.add([
      p.deviceId,
      p.latitude.toFixed(precision),
      p.longitude.toFixed(precision),
      p.course || 0,
      selectedPositionId || 'none',
    ].join('-'));
  });

  Array.from(featureCache.keys())
    .filter((key) => !activeKeys.has(key))
    .forEach((key) => featureCache.delete(key));
};

const CHUNK_SIZE = 500;
const CHUNK_DELAY = 16;

let processingController = null;

const processInitialLoad = (positions, devices, selectedDeviceId, selectedPositionId, bounds, precision) => {
  if (processingController) {
    clearTimeout(processingController.timeoutId);
    processingController = null;
  }

  positions.forEach((p) => allPositions.set(p.deviceId, p));

  getChangedPositions(positions, precision);

  const inViewport = [];
  const outViewport = [];

  if (bounds) {
    positions.forEach((p) => {
      if (isInBounds(p, bounds, 0.5)) inViewport.push(p);
      else outViewport.push(p);
    });
  } else {
    inViewport.push(...positions);
  }

  const sortedPositions = [...inViewport, ...outViewport];

  if (sortedPositions.length <= 500) {
    const features = buildAllFeatures(devices, selectedDeviceId, selectedPositionId, precision);
    postMessage({
      type: 'FEATURES_READY',
      payload: {
        features,
        isInitialLoad: true,
        stats: { total: positions.length, cached: featureCache.size },
      },
    });
    return;
  }

  let processedCount = 0;

  const processChunk = () => {
    const chunk = sortedPositions.slice(processedCount, processedCount + CHUNK_SIZE);

    if (chunk.length === 0) {
      processingController = null;
      postMessage({
        type: 'PROCESSING_COMPLETE',
        payload: {
          stats: { total: positions.length, cached: featureCache.size },
        },
      });
      return;
    }

    const chunkFeatures = chunk
      .filter((p) => devices[p.deviceId] && p.deviceId !== selectedDeviceId)
      .map((position) => {
        const cacheKey = [
          position.deviceId,
          position.latitude.toFixed(precision),
          position.longitude.toFixed(precision),
          position.course || 0,
          selectedPositionId || 'none',
        ].join('-');

        if (!featureCache.has(cacheKey)) {
          featureCache.set(
            cacheKey,
            buildFeature(
              position,
              devices[position.deviceId],
              selectedPositionId,
              precision,
            ),
          );
        }
        return featureCache.get(cacheKey);
      });

    processedCount += chunk.length;
    const progress = Math.round((processedCount / sortedPositions.length) * 100);

    postMessage({
      type: 'FEATURES_CHUNK',
      payload: {
        features: chunkFeatures,
        progress,
        isFirstChunk: processedCount === chunk.length,
        stats: {
          total: positions.length,
          processed: processedCount,
          cached: featureCache.size,
        },
      },
    });

    processingController = { timeoutId: setTimeout(processChunk, CHUNK_DELAY) };
  };

  processChunk();
};

const processLiveUpdate = (incomingPositions, devices, selectedDeviceId, selectedPositionId, precision) => {
  const incomingIds = new Set(incomingPositions.map((p) => p.deviceId));

  Array.from(allPositions.keys()).forEach((deviceId) => {
    if (!incomingIds.has(deviceId)) {
      allPositions.delete(deviceId);
      lastPositions.delete(deviceId);
      const prefix = `${deviceId}-`;
      Array.from(featureCache.keys())
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => featureCache.delete(key));
    }
  });

  incomingPositions.forEach((p) => allPositions.set(p.deviceId, p));

  const actuallyChanged = getChangedPositions(incomingPositions, precision);

  if (actuallyChanged.length > 0) {
    invalidateCacheForChanged(actuallyChanged);
  }

  const features = buildAllFeatures(devices, selectedDeviceId, selectedPositionId, precision);

  evictStaleCache(devices, selectedDeviceId, selectedPositionId, precision);

  postMessage({
    type: 'FEATURES_READY',
    payload: {
      features,
      isInitialLoad: false,
      stats: {
        total: allPositions.size,
        changed: actuallyChanged.length,
        cached: featureCache.size,
      },
    },
  });
};

onmessage = (e) => {
  const { type, payload } = e.data;

  if (type === 'PROCESS_POSITIONS') {
    const {
      positions,
      devices,
      selectedDeviceId,
      selectedPositionId,
      bounds,
      precision,
      isInitialLoad = false,
    } = payload;

    if (isInitialLoad) {
      processInitialLoad(positions, devices, selectedDeviceId, selectedPositionId, bounds, precision);
    } else {
      processLiveUpdate(positions, devices, selectedDeviceId, selectedPositionId, precision);
    }
  }

  if (type === 'CLEAR_CACHE') {
    featureCache.clear();
    lastPositions.clear();
    allPositions.clear();
  }
};
