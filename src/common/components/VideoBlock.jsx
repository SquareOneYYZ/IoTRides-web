import React, {
  useRef, useState, useEffect, useCallback,
} from 'react';
import { Fullscreen, PlayArrow, ZoomOutMap } from '@mui/icons-material';
import PauseIcon from '@mui/icons-material/Pause';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import LaunchIcon from '@mui/icons-material/Launch';
import { Tooltip } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useCatchCallback } from '../../reactHelper';

const COMMAND_COOLDOWN_MS = 15000;

const VideoBlock = ({
  src,
  className,
  title,
  showLaunch,
  showFocusIcon,
  onFocus,
  deviceId,
  channelId,
}) => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isStarted, setIsStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastCommandTime, setLastCommandTime] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      });
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const controlScale = Math.max(0.6, Math.min(1, size.width / 600));
  const iconSize = 30 * controlScale;
  const paddingY = 20 * controlScale;
  const paddingX = 14 * controlScale;
  const sendLiveStreamCommand = useCatchCallback(async () => {
    const currentTime = Date.now();

    if (currentTime - lastCommandTime < COMMAND_COOLDOWN_MS) {
      const remainingTime = Math.ceil((COMMAND_COOLDOWN_MS - (currentTime - lastCommandTime)) / 1000);
      setIsStarted(true);
      setIsPlaying(true);
      return;
    }
    const payload = {
      deviceId,
      type: 'liveStream',
      attributes: {
        channels: [channelId],
        noQueue: false,
      },
    };

    try {
      const response = await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setLastCommandTime(currentTime);
      } else {
        throw Error(await response.text());
      }
    } catch (error) {
      console.error('Failed to send livestream command:', error);
    }
  }, [deviceId, channelId, lastCommandTime, dispatch]);

  const handlePlayPause = () => {
    const newIsPlaying = !isPlaying;
    if (!isStarted && newIsPlaying) {
      sendLiveStreamCommand();
    }
    setIsStarted(true);
    setIsPlaying(newIsPlaying);
  };

  const handleFullscreen = async () => {
    const element = containerRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (element.requestFullscreen) {
        await element.requestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleMouseMove = () => {
    if (isStarted) {
      setShowControls(true);
      if (controlsTimeout) clearTimeout(controlsTimeout);
      const timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 2000);
      setControlsTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && isStarted) setShowControls(false);
  };

  const handleLaunch = () => navigate('/livestream');

  const handleFocusClick = (e) => {
    e.stopPropagation();
    if (onFocus) onFocus(channelId);
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {!isStarted && (
        <div
          aria-label={title || 'Video player'}
          role="button"
          tabIndex={0}
          onClick={handlePlayPause}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePlayPause();
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            zIndex: 5,
          }}
        >
          <PlayArrow sx={{ fontSize: iconSize * 1.5, color: 'white' }} />
        </div>
      )}

      {showLaunch && (
        <Tooltip title="Open Livestream">
          <LaunchIcon
            onClick={handleLaunch}
            style={{
              position: 'absolute',
              top: `${12 * controlScale}px`,
              right: `${12 * controlScale}px`,
              color: 'white',
              fontSize: `${25 * controlScale}px`,
              zIndex: 15,
              cursor: 'pointer',
              opacity: 0.85,
            }}
          />
        </Tooltip>
      )}

      {!showLaunch && showFocusIcon && (
        <Tooltip title="Focus this camera">
          <ZoomOutMap
            onClick={handleFocusClick}
            style={{
              position: 'absolute',
              top: `${12 * controlScale}px`,
              right: `${12 * controlScale}px`,
              color: 'white',
              fontSize: `${25 * controlScale}px`,
              zIndex: 15,
              cursor: 'pointer',
              opacity: 0.85,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '4px',
              padding: '4px',
            }}
          />
        </Tooltip>
      )}

      <iframe
        src={src}
        title={title}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: isStarted ? 'block' : 'none',
        }}
        allow="autoplay; fullscreen"
      />

      {(isStarted || showControls) && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: `${10 * controlScale}%`,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: `${paddingY}px ${paddingX}px`,
            gap: `${12 * controlScale}px`,
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={handlePlayPause}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            {isPlaying ? <PauseIcon sx={{ fontSize: iconSize }} /> : <PlayArrow sx={{ fontSize: iconSize }} />}
          </button>

          <div style={{ flex: 1 }} />

          <button
            type="button"
            onClick={handleFullscreen}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <Fullscreen sx={{ fontSize: iconSize }} />
          </button>
        </div>
      )}
    </div>
  );
};

VideoBlock.propTypes = {
  src: PropTypes.string.isRequired,
  className: PropTypes.string,
  title: PropTypes.string,
  showLaunch: PropTypes.bool,
  showFocusIcon: PropTypes.bool,
  onFocus: PropTypes.func,
  deviceId: PropTypes.number.isRequired,
  channelId: PropTypes.number.isRequired,
};

VideoBlock.defaultProps = {
  className: '',
  title: '',
  showLaunch: false,
  showFocusIcon: false,
  onFocus: null,
};

export default VideoBlock;
