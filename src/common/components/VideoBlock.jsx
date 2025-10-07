import React, { useRef, useState } from 'react';
import { Fullscreen, PlayArrow } from '@mui/icons-material';
import PauseIcon from '@mui/icons-material/Pause';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import LaunchIcon from '@mui/icons-material/Launch';
import { Tooltip } from '@mui/material';

const VideoBlock = ({ src, className, title, showLaunch }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const navigate = useNavigate();

  const handlePlayPause = () => {
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
            onClick={handlePlayPause}
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
                width: '70px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
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
                top: '12px',
                right: '12px',
                color: 'white',
                fontSize: '18px',
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
              height: '10%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '12px 16px',
              gap: '12px',
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
                padding: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              {isPlaying ? (
                <Tooltip title="Pause">
                  <PauseIcon sx={{ fontSize: 18 }} />
                </Tooltip>
              ) : (
                <Tooltip title="Play">
                  <PlayArrow sx={{ fontSize: 18 }} />
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
                padding: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              <Tooltip title="Full screen">
                <Fullscreen sx={{ fontSize: 18 }} />
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
};

VideoBlock.defaultProps = {
  className: '',
  title: '',
  showLaunch: false,
};

export default VideoBlock;
