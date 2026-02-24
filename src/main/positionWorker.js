// ─────────────────────────────────────────────────────────────────────────────
// WORKER STATE
// Yeh teen Maps worker ki internal state hain
// Main thread se alag — yahan data persist rehta hai between messages
// ─────────────────────────────────────────────────────────────────────────────

// featureCache: already bane GeoJSON features store karta hai
// Key: deviceId-lat-lng-course-selectedPositionId
// Value: GeoJSON Feature object
// Agar position same hai to cache se lo — zero computation
const featureCache = new Map();

// lastPositions: har device ki last known lat/lng/course
// Isse pata chalta hai ki kaunsa device actually move kiya
// Agar same position hai to featureCache invalidate karne ki zaroorat nahi
const lastPositions = new Map();

// allPositions: poori current state of all devices
// KEY INSIGHT: Live updates mein sirf changed devices aate hain
// Lekin map render ke liye SABKI positions chahiye
// Isliye worker apni khud ki full state maintain karta hai yahan
// SocketController sirf changes bhejta hai → worker yahan merge karta hai
const allPositions = new Map(); // deviceId → position object

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

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

// Kaunsi positions actually change hui hain check karo
// lastPositions update bhi karo
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

// Changed positions ke purane cache entries delete karo
const invalidateCacheForChanged = (changedPositions) => {
  changedPositions.forEach((position) => {
    const prefix = `${position.deviceId}-`;
    Array.from(featureCache.keys())
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => featureCache.delete(key));
  });
};

// Ek position ka GeoJSON feature banao
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

// allPositions se saare features banao
// Changed ones rebuild hoti hain, baaki cache se aati hain (instant)
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

// Smart cache eviction — sirf stale entries hatao
// Purani approach: blindly pehle 1200 delete karo → markers gayab
// Nayi approach: sirf woh entries hatao jo active nahi hain
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

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL LOAD — PROGRESSIVE CHUNKS
// ─────────────────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 500; // 500 positions per chunk
const CHUNK_DELAY = 16; // 1 frame (~60fps) between chunks

let processingController = null;

const processInitialLoad = (positions, devices, selectedDeviceId, selectedPositionId, bounds, precision) => {
  // Pehle se chal raha processing cancel karo
  if (processingController) {
    clearTimeout(processingController.timeoutId);
    processingController = null;
  }

  // allPositions initialize karo initial data se
  positions.forEach((p) => allPositions.set(p.deviceId, p));

  // lastPositions warm karo taaki pehla live update sahi se detect ho
  getChangedPositions(positions, precision);

  // Viewport aur non-viewport alag karo — visible markers pehle load hon
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

  // Visible pehle, baaki baad mein
  const sortedPositions = [...inViewport, ...outViewport];

  // Chhota dataset — chunking ki zaroorat nahi, seedha process karo
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

  // Bada dataset — chunks mein process karo taaki UI block na ho
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

    // Is chunk ke features banao
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

// ─────────────────────────────────────────────────────────────────────────────
// LIVE UPDATE — FAST PATH
// ─────────────────────────────────────────────────────────────────────────────

const processLiveUpdate = (changedPositions, devices, selectedDeviceId, selectedPositionId, precision) => {
  // Step 1: allPositions map mein naye positions merge karo
  changedPositions.forEach((p) => allPositions.set(p.deviceId, p));

  // Step 2: Actually kya change hua check karo (precision ke saath)
  const actuallyChanged = getChangedPositions(changedPositions, precision);

  // Kuch change hi nahi hua — koi kaam nahi
  if (actuallyChanged.length === 0) return;

  // Step 3: Sirf changed devices ke cache entries invalidate karo
  invalidateCacheForChanged(actuallyChanged);

  // Step 4: Poori current state se features banao
  // Changed devices: rebuild (fast — simple object creation)
  // Unchanged devices: cache se lo (instant — Map.get)
  const features = buildAllFeatures(devices, selectedDeviceId, selectedPositionId, precision);

  // Step 5: Cache cleanup agar bahut bada ho gaya
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

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

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
      // Pehli baar — poori positions aati hain, progressive chunks use karo
      processInitialLoad(positions, devices, selectedDeviceId, selectedPositionId, bounds, precision);
    } else {
      // Live update — sirf changed positions aati hain
      processLiveUpdate(positions, devices, selectedDeviceId, selectedPositionId, precision);
    }
  }

  if (type === 'CLEAR_CACHE') {
    featureCache.clear();
    lastPositions.clear();
    allPositions.clear();
  }
};
