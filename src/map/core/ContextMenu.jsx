import React, { useEffect, useRef } from 'react';

const menuItems = [
  {
    key: 'geofence',
    icon: '⬡',
    label: 'Create Geofence Here',
    sub: 'Draw a new geofence at this location',
  },
  {
    key: 'nearest',
    icon: '🚗',
    label: 'Find Nearest Vehicle',
    sub: 'Locate the closest tracked vehicle',
  },
  {
    key: 'measure',
    icon: '📏',
    label: 'Measure From Here',
    sub: 'Start a distance measurement',
  },
];

const actionMap = {
  geofence: 'onGeofence',
  nearest: 'onNearestVehicle',
  measure: 'onMeasure',
};

const ContextMenu = ({
  visible, x, y, lngLat, onClose, onGeofence, onNearestVehicle, onMeasure,
}) => {
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!visible) return undefined;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [visible, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!visible) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!visible) return null;

  // Clamp menu position so it never overflows the viewport
  const menuWidth = 230;
  const menuHeight = 175;
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
  const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

  const handlers = { onGeofence, onNearestVehicle, onMeasure };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        zIndex: 2000,
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: 10,
        padding: '6px',
        minWidth: menuWidth,
        boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
        fontFamily: 'inherit',
      }}
    >
      {/* Coordinates display */}
      {lngLat && (
        <div style={{
          fontSize: 11,
          color: '#999',
          padding: '3px 10px 7px',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: 4,
          letterSpacing: '0.02em',
        }}
        >
          {lngLat.lat.toFixed(5)},&nbsp;{lngLat.lng.toFixed(5)}
        </div>
      )}

      {/* Menu items */}
      {menuItems.map((item) => (
        <MenuItem
          key={item.key}
          icon={item.icon}
          label={item.label}
          sub={item.sub}
          onClick={() => {
            const handlerFn = handlers[actionMap[item.key]];
            if (handlerFn) handlerFn(lngLat);
            onClose();
          }}
        />
      ))}
    </div>
  );
};

const MenuItem = ({
  icon, label, sub, onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '8px 10px',
      border: 'none',
      borderRadius: 7,
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'inherit',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
  >
    <span style={{
      fontSize: 16,
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 7,
      background: '#f0f0f0',
      flexShrink: 0,
    }}
    >
      {icon}
    </span>
    <span>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{sub}</div>
    </span>
  </button>
);

export default ContextMenu;