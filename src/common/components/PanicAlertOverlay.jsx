import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { prefixString } from '../util/stringUtils';
import { useTranslation } from './LocalizationProvider';

const PanicAlertOverlay = ({ panicEvent, onDismiss, eventsOpen }) => {
  const theme = useTheme();
  const devices = useSelector((state) => state.devices.items);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState(null);
  const t = useTranslation();
  const observerRef = useRef(null);

  const computePosition = () => {
    const button = document.querySelector('.maplibre-ctrl-notification');
    if (!button) return false;
    const rect = button.getBoundingClientRect();
    setPosition({
      top: rect.top + rect.height / 2,
      right: window.innerWidth - rect.left + 8,
    });
    return true;
  };

  useEffect(() => {
    if (computePosition()) return;

    observerRef.current = new MutationObserver(() => {
      if (computePosition()) {
        observerRef.current?.disconnect();
      }
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => computePosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (eventsOpen && visible) {
      setVisible(false);
      onDismiss?.();
    }
  }, [eventsOpen]);

  useEffect(() => {
    if (!panicEvent) return;
    computePosition();
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [panicEvent]);

  if (!visible || !panicEvent || !position) return null;

  const deviceName = devices[panicEvent.deviceId]?.name || 'Unknown';
  const eventType = panicEvent.attributes?.alarm || panicEvent.type || 'alert';
  const translatedEvent = t(prefixString('event', eventType));

  return (
    <>
      <style>{`
        @keyframes bubbleFadeIn {
          from { opacity: 0; transform: translateX(6px) translateY(-50%); }
          to   { opacity: 1; transform: translateX(0) translateY(-50%); }
        }
        .panic-bubble {
          position: fixed;
          top: ${position.top}px;
          right: ${position.right}px;
          transform: translateY(-50%);
          z-index: 9999;
          background: ${theme.palette.background.paper};
          color: ${theme.palette.text.primary};
          font-size: 13px;
          font-weight: 600;
          font-family: ${theme.typography.fontFamily};
          padding: 10px;
          border-radius: 20px;
          box-shadow: ${theme.shadows[4]};
          white-space: nowrap;
          pointer-events: none;
          animation: bubbleFadeIn 0.2s ease;
        }
        .panic-bubble::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -7px;
          transform: translateY(-50%);
          border-width: 6px 0 6px 8px;
          border-style: solid;
          border-color: transparent transparent transparent ${theme.palette.background.paper};
        }
      `}</style>
      <div className="panic-bubble">
        {deviceName} - {translatedEvent}
      </div>
    </>
  );
};

export default PanicAlertOverlay;