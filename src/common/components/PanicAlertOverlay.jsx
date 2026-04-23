import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import { keyframes } from '@mui/system';

const useStyles = makeStyles(() => ({
  borderFlash: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    pointerEvents: 'none',
    border: '6px solid red',
    animation: '$flashBorder 2.5s ease-out forwards',
  },
  '@keyframes flashBorder': {
    '0%': { opacity: 1 },
    '70%': { opacity: 1 },
    '100%': { opacity: 0 },
  },
}));

const PanicAlertOverlay = ({ panicEvent, onDismiss }) => {
  const classes = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!panicEvent) return;

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 2500);

    return () => clearTimeout(timer);
  }, [panicEvent]);

  if (!visible) return null;

  const deviceName = devices[panicEvent?.deviceId]?.name || 'Unknown Device';

  return (
    <div className={classes.borderFlash} title={`SOS Alert: ${deviceName}`} />
  );
};

export default PanicAlertOverlay;