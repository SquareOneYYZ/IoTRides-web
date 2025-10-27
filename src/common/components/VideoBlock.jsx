import React, { useRef, useState, useEffect } from 'react';
import { Fullscreen, PlayArrow, ZoomOutMap } from '@mui/icons-material';
import PauseIcon from '@mui/icons-material/Pause';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import LaunchIcon from '@mui/icons-material/Launch';
import { Tooltip } from '@mui/material';

const VideoBlock = ({
  src,
  className,
  title,
  showLaunch,
  showFocusIcon,
  onFocus,
  playing,
  index,
  onSendCommand,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const navigate = useNavigate();

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

  const handlePlayPause = () => {
    if (!isPlaying && onSendCommand) {
      const payload = {
        attributes: {
          channel: `ch_${index + 1}`,
        },
      };
      onSendCommand(payload);
    }
    if (!isStarted) setIsStarted(true);
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleFullscreen = async () => {
    const element = containerRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
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

  const handleLaunch = () => {
    navigate('/livestream');
  };

  const handleFocusClick = (e) => {
    e.stopPropagation();
    if (onFocus) onFocus();
  };

  useEffect(() => {
    if (!videoRef.current) return;

    if (playing) {
      videoRef.current.src = src;
      videoRef.current.play().catch((err) => console.warn('Play error', err));
    } else {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, [playing, src]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
            <div
              style={{
                width: `${70 * controlScale}px`,
                height: `${70 * controlScale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={48 * controlScale}
                height={48 * controlScale}
                viewBox="0 0 24 24"
                fill="white"
                opacity="0.85"
              >
                <path d="M12 2a7 7 0 0 0-7 7c0 3.07 1.99 5.64 4.74 6.57l-.74 2.43h-2a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2h-2l-.74-2.43A7 7 0 0 0 19 9a7 7 0 0 0-7-7zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c.7 0 1.39.1 2.05.29l.58 1.71h-5.26l.58-1.71c.66-.19 1.35-.29 2.05-.29z" />
              </svg>
            </div>
          </div>
        )}

        {showLaunch && (
          <Tooltip title="Open Livestream">
            <LaunchIcon
              onClick={handleLaunch}
              aria-label="Open Livestream"
              role="button"
              tabIndex={0}
              style={{
                position: 'absolute',
                top: `${12 * controlScale}px`,
                right: `${12 * controlScale}px`,
                color: 'white',
                fontSize: `${25 * controlScale}px`,
                zIndex: 15,
                cursor: 'pointer',
                opacity: 0.85,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.85)}
            />
          </Tooltip>
        )}

        {!showLaunch && showFocusIcon && (
          <Tooltip title="Focus this camera">
            <ZoomOutMap
              onClick={handleFocusClick}
              aria-label="Focus camera"
              role="button"
              tabIndex={0}
              style={{
                position: 'absolute',
                top: `${12 * controlScale}px`,
                right: `${12 * controlScale}px`,
                color: 'white',
                fontSize: `${25 * controlScale}px`,
                zIndex: 15,
                cursor: 'pointer',
                opacity: 0.85,
                transition: 'all 0.2s ease',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '4px',
                padding: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = 1;
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = 0.85;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          </Tooltip>
        )}

        <video
          ref={videoRef}
          src={src}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            visibility: isStarted ? 'visible' : 'hidden',
          }}
          onEnded={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
          onClick={handlePlayPause}
          controls={false}
          aria-label={title || 'Video player'}
        >
          <track
            kind="captions"
            src="captions.vtt"
            srcLang="en"
            label="English"
          />
        </video>

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
              pointerEvents: 'auto',
              zIndex: 10,
            }}
            onMouseEnter={() => setShowControls(true)}
          >
            <button
              type="button"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={handlePlayPause}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: `${1 * controlScale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isPlaying ? (
                <Tooltip title="Pause">
                  <PauseIcon sx={{ fontSize: iconSize }} />
                </Tooltip>
              ) : (
                <Tooltip title="Play">
                  <PlayArrow sx={{ fontSize: iconSize }} />
                </Tooltip>
              )}
            </button>

            <div style={{ flex: 1 }} />

            <button
              type="button"
              aria-label="Fullscreen"
              onClick={handleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: `${1 * controlScale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Tooltip title="Full screen">
                <Fullscreen sx={{ fontSize: iconSize }} />
              </Tooltip>
            </button>
          </div>
        )}
      </div>
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
};

VideoBlock.defaultProps = {
  className: '',
  title: '',
  showLaunch: false,
  showFocusIcon: false,
  onFocus: null,
};

export default VideoBlock;
