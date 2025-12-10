import React, { useEffect, useRef, useState } from 'react';
import {
  IconButton, Box, CircularProgress,
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ImageIcon from '@mui/icons-material/Image';

const MediaBlock = ({ media, onLaunch, isSelected, onSelect }) => {
  const ref = useRef(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  useEffect(() => {
    if (media.mediaType === 'video' && media.url) {
      setThumbnailLoading(true);
      setThumbnailError(false);

      const video = document.createElement('video');
      video.src = media.url;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      const timeoutId = setTimeout(() => {
        setThumbnailError(true);
        setThumbnailLoading(false);
        video.remove();
      }, 10000); // 10 second timeout

      const handleLoadedData = () => {
        // Seek to 1 second or 10% of duration, whichever is smaller
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      const handleSeeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnail(thumbnailDataUrl);
          setThumbnailLoading(false);
          clearTimeout(timeoutId);
          video.remove();
        } catch (error) {
          console.error('Error generating thumbnail:', error);
          setThumbnailError(true);
          setThumbnailLoading(false);
          clearTimeout(timeoutId);
          video.remove();
        }
      };

      const handleError = (e) => {
        console.error('Video loading error:', e);
        setThumbnailError(true);
        setThumbnailLoading(false);
        clearTimeout(timeoutId);
        video.remove();
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);

      // Cleanup
      return () => {
        clearTimeout(timeoutId);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
        video.remove();
      };
    }

    // Return undefined for the else case
    return undefined;
  }, [media.url, media.mediaType]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      ref.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const renderMediaContent = () => {
    if (media.mediaType === 'image' && media.url) {
      return (
        <img
          src={media.url}
          alt={media.fileName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      );
    }

    if (media.mediaType === 'video') {
      if (thumbnailLoading) {
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CircularProgress size={40} sx={{ color: '#888' }} />
          </Box>
        );
      }

      if (thumbnail && !thumbnailError) {
        return (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={thumbnail}
              alt={media.fileName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <PlayCircleOutlineIcon
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 60,
                color: 'rgba(255, 255, 255, 0.95)',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.7))',
              }}
            />
          </Box>
        );
      }

      // Fallback for thumbnail error or unsupported format
      return <PlayCircleOutlineIcon sx={{ fontSize: 60, color: '#555' }} />;
    }

    return <ImageIcon sx={{ fontSize: 60, color: '#555' }} />;
  };

  return (
    <Box
      ref={ref}
      onClick={() => onLaunch(media)}
      sx={{
        backgroundColor: '#1e1e1e',
        borderRadius: 2,
        position: 'relative',
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        border: isSelected ? '3px solid #1976d2' : 'none',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 4,
        },
      }}
    >
      {renderMediaContent()}

      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 1,
          fontSize: '12px',
        }}
      >
        {new Date(media.eventTime).toLocaleString()}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 0.5,
        }}
      >
        <IconButton
          size="small"
          sx={{
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
        >
          <FullscreenIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          sx={{
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            onLaunch(media);
          }}
        >
          <LaunchIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default MediaBlock;
