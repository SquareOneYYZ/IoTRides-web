import React, { useRef, useState } from 'react';
import { Fullscreen, PlayArrow } from '@mui/icons-material';
import PauseIcon from '@mui/icons-material/Pause';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const VideoBlock = ({ src, className, title, navigateTo }) => {
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

    // ✅ If a navigation path is provided, navigate there
    if (navigateTo) {
      navigate(navigateTo);
      return;
    }

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
          <button
            type="button"
            aria-label="Play Video"
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
              backgroundColor: '#000000b1',
              cursor: 'pointer',
              zIndex: 5,
              border: 'none',
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
              <PlayArrow sx={{ fontSize: 48, color: 'white', opacity: 0.85 }} />
            </div>
          </button>
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
            {/* ▶️ Play/Pause */}
            <button
              type="button"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={handlePlayPause}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
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
                <PauseIcon sx={{ fontSize: 25 }} />
              ) : (
                <PlayArrow sx={{ fontSize: 25 }} />
              )}
            </button>

            <div style={{ flex: 1 }} />

            {/* ⛶ Fullscreen */}
            <button
              type="button"
              aria-label="Fullscreen"
              onClick={handleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
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
              <Fullscreen />
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
  navigateTo: PropTypes.string, // ✅ new prop
};

VideoBlock.defaultProps = {
  className: '',
  title: '',
  navigateTo: null,
};

export default VideoBlock;
